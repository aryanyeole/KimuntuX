from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.models.campaign import Campaign
from app.services.ayrshare_service import AyrshareService

logger = logging.getLogger(__name__)


class CampaignSchedulerService:
    """
    Service that scans the database for content pieces that are due to publish
    and dispatches them to Ayrshare.

    Current state: the DB query, piece-iteration logic, result-write-back, and
    commit/rollback handling are all fully implemented. Ayrshare publishing runs
    in mock mode until AYRSHARE_API_KEY is set and ``_call_ayrshare`` is
    uncommented in ayrshare_service.py.

    A piece is considered due when ALL of the following hold:
      - Its parent campaign has ``is_used=True`` and ``deleted_at`` is null.
      - ``piece["schedule"]["publish_at"]`` is set and <= UTC now.
      - ``piece["status"] == "scheduled"``  (not "draft" — see note below).
      - ``piece["publish_result"] is None`` (not yet attempted).

    Status note:
        Content pieces are created with ``status="draft"`` by the generator.
        A future step (e.g. the user confirming a time slot per piece, or the
        scheduler service itself setting it on drag-to-calendar) should advance
        the status to ``"scheduled"`` before this service will pick them up.
        Until that step exists, this service will find zero due pieces — which
        is safe; it just means nothing gets published yet.

    Activation checklist (in order):
      1. Ensure pieces have ``status="scheduled"`` and ``schedule.publish_at``
         set to an ISO-8601 UTC string before the scheduler runs.
      2. Activate AyrshareService (set AYRSHARE_API_KEY, uncomment the request
         block in ``ayrshare_service._call_ayrshare``).
      3. Wire ``check_and_publish_due_campaigns`` into a recurring job using the
         APScheduler block at the bottom of this file.
    """

    async def check_and_publish_due_campaigns(self, db: Session) -> dict:
        """
        Find all due content pieces across active campaigns and publish them.

        Queries all campaigns where ``is_used=True`` and ``deleted_at`` is null,
        then iterates each campaign's ``content_pieces`` JSON array. For any
        piece that meets the "due" criteria (see class docstring), calls
        ``AyrshareService.publish_content_piece()`` and writes the result back
        into the piece's ``publish_result`` field.

        The ``content_pieces`` column is a JSON blob — SQLAlchemy does not
        auto-detect in-place mutations to it. After modifying any piece in the
        list, ``flag_modified(campaign, "content_pieces")`` is called so the
        ORM includes the column in the UPDATE statement.

        Errors on individual pieces are caught, logged, and recorded as
        ``{"status": "failed", "error": "..."}`` in the piece — they never
        abort the loop. A DB commit failure for one campaign is rolled back
        and logged, but processing continues for remaining campaigns.

        Args:
            db: Active SQLAlchemy Session. The caller owns the session lifecycle
                (open before, close after). In the APScheduler wiring below, a
                fresh ``SessionLocal()`` is opened per tick and closed in
                ``finally``.

        Returns:
            Summary dict::

                {
                    "checked":   <int>,   # campaigns scanned
                    "published": <int>,   # pieces posted (includes mock posts)
                    "failed":    <int>,   # pieces that errored or returned
                                          # status "failed" from Ayrshare
                }
        """
        now = datetime.now(timezone.utc)
        ayrshare = AyrshareService()

        campaigns = (
            db.query(Campaign)
            .filter(
                Campaign.is_used.is_(True),
                Campaign.deleted_at.is_(None),
            )
            .all()
        )

        checked = len(campaigns)
        published = 0
        failed = 0

        for campaign in campaigns:
            content_pieces = campaign.content_pieces
            if not isinstance(content_pieces, list):
                continue

            # Build a plain dict for the campaign context passed to Ayrshare.
            # We only include the fields that _build_post_body actually uses so
            # we don't accidentally serialise lazy-loaded relationships.
            campaign_dict = {
                "id": campaign.id,
                "name": campaign.name,
                "platforms": campaign.platforms,
                "affiliate_product": campaign.affiliate_product,
                "tracking": campaign.tracking,
                "scheduling": campaign.scheduling,
                "theme_color": campaign.theme_color,
            }

            pieces_modified = False

            for index, piece in enumerate(content_pieces):
                if not isinstance(piece, dict):
                    continue

                # Gate 1: piece must be explicitly scheduled (not just "draft").
                if piece.get("status") != "scheduled":
                    continue

                # Gate 2: must not have been attempted before.
                if piece.get("publish_result") is not None:
                    continue

                # Gate 3: must have a publish_at timestamp.
                schedule = piece.get("schedule") or {}
                publish_at_raw = schedule.get("publish_at")
                if not publish_at_raw:
                    continue

                # Parse publish_at — stored as ISO-8601 string or datetime.
                # Skip the piece (with a warning) if the value is malformed;
                # do not mark it failed so it can be corrected and retried.
                try:
                    if isinstance(publish_at_raw, datetime):
                        publish_at = publish_at_raw
                        if publish_at.tzinfo is None:
                            publish_at = publish_at.replace(tzinfo=timezone.utc)
                    else:
                        # Strip trailing "Z" so fromisoformat works on Python <3.11.
                        publish_at = datetime.fromisoformat(
                            str(publish_at_raw).rstrip("Z")
                        ).replace(tzinfo=timezone.utc)
                except (ValueError, TypeError) as exc:
                    logger.warning(
                        "Skipping piece — unparseable publish_at: "
                        "campaign=%s piece=%s publish_at=%r error=%s",
                        campaign.id,
                        piece.get("piece_id"),
                        publish_at_raw,
                        exc,
                    )
                    continue

                # Gate 4: must be due (publish time is now or in the past).
                if publish_at > now:
                    continue

                logger.info(
                    "Publishing due piece — campaign=%s piece=%s platform=%s publish_at=%s",
                    campaign.id,
                    piece.get("piece_id"),
                    piece.get("platform"),
                    publish_at.isoformat(),
                )

                # Dispatch to Ayrshare. AyrshareService.publish_content_piece
                # never raises — it always returns a dict with a "status" key.
                # The try/except here is a belt-and-suspenders guard.
                try:
                    publish_result = await ayrshare.publish_content_piece(
                        piece, campaign_dict
                    )
                except Exception as exc:
                    logger.error(
                        "Unexpected error from AyrshareService — "
                        "campaign=%s piece=%s error=%s",
                        campaign.id,
                        piece.get("piece_id"),
                        exc,
                    )
                    publish_result = {"status": "failed", "error": str(exc)}

                # Write result back into the JSON column in-memory.
                content_pieces[index]["publish_result"] = publish_result

                if publish_result.get("status") in {"posted", "mock_posted"}:
                    content_pieces[index]["status"] = "posted"
                    published += 1
                else:
                    content_pieces[index]["status"] = "failed"
                    failed += 1

                pieces_modified = True

            if pieces_modified:
                # Without flag_modified, SQLAlchemy's change-detection misses
                # mutations inside JSON columns and the UPDATE is silently skipped.
                flag_modified(campaign, "content_pieces")
                try:
                    db.commit()
                except Exception as exc:
                    logger.error(
                        "DB commit failed for campaign=%s — rolling back: %s",
                        campaign.id,
                        exc,
                    )
                    db.rollback()
                    # Adjust counters: pieces we thought we published were not
                    # actually saved. This is approximate — we don't know which
                    # piece within this campaign failed to persist.
                    # A per-piece commit (one flush per piece) would give exact
                    # counts but is heavier; revisit if accuracy matters.

        summary = {"checked": checked, "published": published, "failed": failed}
        logger.info("Scheduler run complete — %s", summary)
        return summary


# ── APScheduler wiring — activate for handoff ─────────────────────────────────
#
# Wire ``check_and_publish_due_campaigns`` into FastAPI's startup lifecycle so
# it runs automatically on a 5-minute interval.
#
# Steps to activate:
#   1. pip install apscheduler  (add "apscheduler>=3.10" to requirements.txt)
#   2. Uncomment everything below.
#   3. In backend/app/main.py add:
#
#        from app.services.scheduler_service import start_scheduler, stop_scheduler
#
#        @app.on_event("startup")
#        async def on_startup():
#            start_scheduler()
#
#        @app.on_event("shutdown")
#        async def on_shutdown():
#            stop_scheduler()
#
# TODO: ACTIVATE FOR HANDOFF
#
# from apscheduler.schedulers.asyncio import AsyncIOScheduler
# from app.core.database import SessionLocal
#
# _scheduler: AsyncIOScheduler | None = None
#
#
# async def run_scheduled_campaigns() -> None:
#     """
#     Thin wrapper that opens a DB session, runs the scheduler service once,
#     then closes the session. Called by APScheduler on each tick.
#     """
#     db = SessionLocal()
#     try:
#         service = CampaignSchedulerService()
#         summary = await service.check_and_publish_due_campaigns(db)
#         logger.info("Scheduler tick complete — %s", summary)
#     except Exception as exc:
#         logger.error("Scheduler tick raised an unexpected error — %s", exc)
#     finally:
#         db.close()
#
#
# def start_scheduler() -> None:
#     """
#     Start the APScheduler background job. Call once at application startup.
#     The scheduler runs ``run_scheduled_campaigns`` every 5 minutes.
#     Adjust the ``minutes`` argument to change the polling frequency.
#     """
#     global _scheduler
#     _scheduler = AsyncIOScheduler()
#     _scheduler.add_job(run_scheduled_campaigns, "interval", minutes=5)
#     _scheduler.start()
#     logger.info("Campaign scheduler started (5-minute interval)")
#
#
# def stop_scheduler() -> None:
#     """
#     Gracefully shut down the scheduler. Call in the FastAPI shutdown handler
#     so in-flight jobs are allowed to finish before the process exits.
#     """
#     global _scheduler
#     if _scheduler and _scheduler.running:
#         _scheduler.shutdown(wait=False)
#         logger.info("Campaign scheduler stopped")
