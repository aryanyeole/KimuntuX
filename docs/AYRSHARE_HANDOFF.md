# Ayrshare Publishing Pipeline — Handoff Guide

This document explains everything a developer needs to know to activate the
Ayrshare social-media publishing pipeline in KimuX. The infrastructure is fully
built and runs in mock mode. Activation requires setting one environment
variable, uncommenting two blocks of code, and fixing one frontend status field.
Estimated time to activate: **30–60 minutes**.

---

## 1. Overview

### What Ayrshare is

[Ayrshare](https://www.ayrshare.com) is a social-media publishing API that acts
as a single integration point for Instagram, Facebook, LinkedIn, X (Twitter),
YouTube, TikTok, and email. Instead of maintaining separate OAuth flows and API
clients for each platform, KimuX sends one POST request to Ayrshare and
Ayrshare handles the platform-specific delivery.

### Why KimuX uses it

The alternative — direct platform APIs — requires maintaining OAuth 2.0 tokens
for every connected account, handling token refresh, respecting per-platform
rate limits, and keeping up with breaking API changes on each platform
independently. That is a significant ongoing maintenance burden. Ayrshare
abstracts all of it behind a single Bearer token auth model.

### What the fully activated pipeline does end to end

1. A user generates a campaign in the **Content Generator** (`/crm/content-gen`),
   selects creative variants in the preview, and clicks **Send to Scheduler**.
   This saves the campaign to the database with `is_used=false`.

2. In the **Content Scheduler** (`/crm/content-scheduler`), the user drags the
   campaign card to a time slot on the calendar. This sets:
   - `campaign.is_used = true`
   - `campaign.scheduling.campaign_window.start_at` to the chosen datetime
   - `campaign.content_pieces[0].schedule.publish_at` to the same datetime

3. A background job (`CampaignSchedulerService`) runs every 5 minutes. It scans
   all active campaigns for content pieces whose `publish_at` has passed and
   whose `status == "scheduled"`. For each due piece, it calls
   `AyrshareService.publish_content_piece()`, which POSTs to Ayrshare.

4. Ayrshare delivers the post to the connected social platform and returns a
   post ID and URL. The scheduler writes these back into
   `piece["publish_result"]` and sets `piece["status"] = "posted"`.

---

## 2. Prerequisites

Complete these steps before touching any code.

### 2.1 Create an Ayrshare account

Go to [app.ayrshare.com](https://app.ayrshare.com) and create an account. The
**Business** plan or higher is required for API access. The free tier does not
include API publishing.

### 2.2 Connect social accounts

In the Ayrshare dashboard, navigate to **Social Accounts** and connect each
platform your campaigns will target:

| KimuX platform | Ayrshare identifier | Account type required |
|---|---|---|
| Instagram | `instagram` | Business or Creator account (personal accounts cannot be connected) |
| Facebook | `facebook` | Page (not personal profile) |
| LinkedIn | `linkedin` | Personal profile or Company page — see §6 for differences |
| X | `twitter` | Any account |
| YouTube | `youtube` | Channel with video upload permissions — text-only posts are not supported |
| TikTok | `tiktok` | Any account |
| Email | `email` | Requires additional SendGrid setup in Ayrshare — see §6 |

### 2.3 Get the API key

In the Ayrshare dashboard: **Settings → API Key → Copy**.

### 2.4 Add the key to the backend environment

Open `backend/.env` and add:

```
AYRSHARE_API_KEY=your_key_here
```

The key is read by `backend/app/core/config.py` as `settings.ayrshare_api_key`.
When it is `None` (key not set), `AyrshareService` runs in mock mode and returns
`{"status": "mock_posted", ...}` without calling Ayrshare.

### 2.5 Install APScheduler

APScheduler drives the 5-minute background polling loop.

```bash
cd backend
pip install "apscheduler>=3.10"
```

Then add it to `backend/requirements.txt`:

```
apscheduler>=3.10
```

APScheduler has no impact on the application when the scheduler wiring is not
yet activated — installing it early is safe.

---

## 3. Files to Activate

Three files need changes. Make them in the order shown.

### 3.1 `backend/app/services/ayrshare_service.py`

**What to change:** Uncomment the urllib request block inside `_call_ayrshare`
and delete the `raise NotImplementedError` line.

Open the file and find `_call_ayrshare`. The method body currently looks like
this (abbreviated):

```python
async def _call_ayrshare(self, body: dict) -> dict:
    # TODO: ACTIVATE FOR HANDOFF
    # ── Uncomment this entire block to enable real Ayrshare publishing ────
    #
    # api_key = settings.ayrshare_api_key
    # request_data = json.dumps(body).encode("utf-8")
    # ...
    # return await asyncio.to_thread(_make_request)
    # ── End of block ──────────────────────────────────────────────────────

    raise NotImplementedError(...)   # ← DELETE THIS LINE
```

**Action:** Remove the `#` prefix from every line in the commented block, then
delete the `raise NotImplementedError(...)` line. The result should be:

```python
async def _call_ayrshare(self, body: dict) -> dict:
    api_key = settings.ayrshare_api_key
    request_data = json.dumps(body).encode("utf-8")

    def _make_request() -> dict:
        req = urllib_request.Request(
            AYRSHARE_API_URL,
            data=request_data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            method="POST",
        )
        try:
            with urllib_request.urlopen(req, timeout=30) as response:
                response_body = response.read().decode("utf-8")
        except error.HTTPError as exc:
            error_body = exc.read().decode("utf-8", errors="ignore")
            raise RuntimeError(
                f"Ayrshare API HTTP {exc.code}: {error_body or exc.reason}"
            ) from exc
        except error.URLError as exc:
            raise RuntimeError(
                f"Ayrshare API request error: {exc.reason}"
            ) from exc
        try:
            return json.loads(response_body)
        except Exception as exc:
            raise RuntimeError(
                "Could not parse Ayrshare API response"
            ) from exc

    return await asyncio.to_thread(_make_request)
```

No other changes are needed in this file. `publish_content_piece` already routes
to `_call_ayrshare` when the API key is present.

---

### 3.2 `backend/app/services/scheduler_service.py`

**What to change:** Uncomment the APScheduler wiring block at the bottom of the
file.

The file ends with a large commented-out block that begins with:

```python
# TODO: ACTIVATE FOR HANDOFF
#
# from apscheduler.schedulers.asyncio import AsyncIOScheduler
# from app.core.database import SessionLocal
# ...
```

Remove the `#` prefix from every line in that block. After uncommenting, the
bottom of the file should define four items:

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.core.database import SessionLocal

_scheduler: AsyncIOScheduler | None = None

async def run_scheduled_campaigns() -> None: ...

def start_scheduler() -> None: ...

def stop_scheduler() -> None: ...
```

---

### 3.3 `backend/app/main.py`

**What to change:** Import the scheduler functions and call them from the
existing startup and shutdown lifecycle hooks.

**Step 1 — Add the import.**

Find the imports section near the top of `main.py` and add:

```python
from app.services.scheduler_service import start_scheduler, stop_scheduler
```

**Step 2 — Call `start_scheduler()` inside the existing `startup()` function.**

The file already has a startup handler at around line 130. Add one call at the
end of it:

```python
@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_sqlite_campaign_columns()
    _ensure_system_tenant()
    ready, health = _init_blockchain()
    app.state.blockchain_ready = ready
    app.state.blockchain_health = health

    if settings.anthropic_api_key:
        logger.info("Anthropic client ready for funnel generation")
    else:
        logger.warning(
            "ANTHROPIC_API_KEY not set — funnel generation will use "
            "static-template fallback"
        )

    # ── ADD THIS ──────────────────────────────────────────────────────────
    if settings.ayrshare_api_key:
        start_scheduler()
        logger.info("Ayrshare scheduler started")
    else:
        logger.warning(
            "AYRSHARE_API_KEY not set — campaign scheduler running in mock mode"
        )
    # ─────────────────────────────────────────────────────────────────────
```

**Step 3 — Add a shutdown handler.**

Immediately after the `startup()` function, add:

```python
@app.on_event("shutdown")
def shutdown() -> None:
    stop_scheduler()
```

This allows APScheduler to finish any in-flight job before the process exits,
preventing partial publishes.

---

## 4. The Status Gap

This is the one functional gap that must be fixed before real posts will go out.

### What the gap is

When a user drags a campaign card to a time slot in the Content Scheduler, the
frontend calls `updateCampaignRecord` with a payload built by
`mapSchedulerCardToCampaignPayload` (in
`src/services/contentSchedulerRepository.js`). That function correctly sets:

- `campaign.is_used = true`
- `campaign.scheduling.campaign_window.start_at = "<datetime>"`
- `campaign.content_pieces[0].schedule.publish_at = "<datetime>"`

But it does **not** set `campaign.content_pieces[0].status = "scheduled"`.

Content pieces are created with `status = "draft"` by the campaign generator and
that value is never changed by the scheduler UI. The
`CampaignSchedulerService.check_and_publish_due_campaigns` method only processes
pieces where `piece["status"] == "scheduled"`, so it finds zero due pieces and
nothing ever gets published.

### Option A — Fix in the frontend (recommended)

In `src/services/contentSchedulerRepository.js`, find
`mapSchedulerCardToCampaignPayload`. The function maps `content_pieces` starting
at line 184. The section that builds `piece[0]` currently looks like this:

```js
content_pieces: Array.isArray(campaign.content_pieces)
  ? campaign.content_pieces.map((piece, index) => index === 0 ? ({
      ...piece,
      schedule: {
        ...piece.schedule,
        publish_at: hasStartDateOverride
          ? (normalizedStartDate ? `${normalizedStartDate}T${nextSendTime}:00` : null)
          : (piece.schedule?.publish_at || null),
        recurrence: item.recurrence || piece.schedule?.recurrence || 'once',
        end_at: hasEndDateOverride
          ? (normalizedEndDate ? `${normalizedEndDate}T23:59:59` : null)
          : (piece.schedule?.end_at || null),
      },
    }) : piece)
  : campaign.content_pieces || [],
```

Add a `status` field to the piece object that mirrors `is_used`:

```js
content_pieces: Array.isArray(campaign.content_pieces)
  ? campaign.content_pieces.map((piece, index) => index === 0 ? ({
      ...piece,
      // Advance status when scheduling, revert to draft when unscheduling.
      status: used ? 'scheduled' : 'draft',
      schedule: {
        ...piece.schedule,
        publish_at: hasStartDateOverride
          ? (normalizedStartDate ? `${normalizedStartDate}T${nextSendTime}:00` : null)
          : (piece.schedule?.publish_at || null),
        recurrence: item.recurrence || piece.schedule?.recurrence || 'once',
        end_at: hasEndDateOverride
          ? (normalizedEndDate ? `${normalizedEndDate}T23:59:59` : null)
          : (piece.schedule?.end_at || null),
      },
    }) : piece)
  : campaign.content_pieces || [],
```

This is the recommended fix because it makes the data model truthful — a piece's
own `status` field accurately reflects whether it is queued for publishing —
and it keeps the scheduler service's logic simple and correct.

### Option B — Relax the scheduler service gate (not recommended)

In `backend/app/services/scheduler_service.py`, change the status gate from:

```python
if piece.get("status") != "scheduled":
    continue
```

to:

```python
if piece.get("status") not in {"scheduled", "draft"}:
    continue
```

This is not recommended. It means every piece in every active campaign that has
a `publish_at` in the past will be published, including pieces that were never
explicitly scheduled by the user — for example, campaigns where `publish_at` was
set programmatically or by accident. Option A keeps the intent explicit.

---

## 5. Testing Steps

Follow these steps in order after completing all activation steps above.

### 5.1 Confirm the scheduler is running

Start the backend:

```bash
cd backend
uvicorn app.main:app --reload
```

Look for this log line on startup:

```
INFO:app.services.scheduler_service:Campaign scheduler started (5-minute interval)
```

If you see a warning instead of this line, `AYRSHARE_API_KEY` is not being read
from `.env`. Check that the file is at `backend/.env` (not the repo root) and
that the variable name matches exactly.

### 5.2 Generate a test campaign

1. Go to `/crm/content-gen`.
2. Enter a prompt, select one platform (Instagram is the easiest to verify).
3. Select an affiliate offer or enter one manually.
4. Click **Generate** and wait for the preview to load.
5. Click **Send to Scheduler**. Confirm the success message appears.

### 5.3 Schedule the campaign near-future

1. Go to `/crm/content-scheduler`.
2. Find the campaign card in the **Unscheduled** library tab.
3. Drag it to a time slot **2–3 minutes from now** on the timeline.
4. In the confirmation modal, verify the time is correct and click **Confirm**.
5. The card should move to the **Scheduled** tab.

### 5.4 Watch the scheduler run

Monitor the uvicorn terminal. Within 5 minutes of the scheduled time, you should
see log lines like:

```
INFO:app.services.scheduler_service:Publishing due piece — campaign=<id> piece=<id> platform=instagram publish_at=...
INFO:app.services.scheduler_service:Scheduler run complete — {'checked': 1, 'published': 1, 'failed': 0}
```

If you see `'published': 0` and `'failed': 0` with `'checked': 1`, the status
gap (§4) has not been fixed — the piece is being found but skipped because its
status is still `"draft"`.

### 5.5 Verify the post on the platform

Log in to the social platform's native interface and confirm the post appeared.

### 5.6 Verify `publish_result` in the database

Query the campaigns table directly:

```sql
SELECT id, name, content_pieces
FROM campaigns
WHERE is_used = true
ORDER BY updated_at DESC
LIMIT 5;
```

Look at the `content_pieces` JSON for the piece you scheduled. It should look
like:

```json
{
  "piece_id": "...",
  "platform": "Instagram",
  "status": "posted",
  "publish_result": {
    "status": "posted",
    "platform": "instagram",
    "external_post_id": "abc123",
    "post_url": "https://www.instagram.com/p/abc123/",
    "raw_response": { ... }
  }
}
```

---

## 6. Platform Notes

### Instagram

Requires a **Business** or **Creator** account linked to a Facebook Page.
Personal Instagram accounts cannot be connected via Ayrshare (this is an
Instagram API restriction, not an Ayrshare limitation). If the account type is
wrong, Ayrshare returns a `270` error.

Image posts perform significantly better than text-only. If `piece.media.image_url`
is set, it will be included in the `mediaUrls` field sent to Ayrshare. Use the
**Upload Image** button in the Content Generator preview to attach one.

### LinkedIn

Ayrshare supports both **personal profiles** and **Company Pages**. The account
you connect in the Ayrshare dashboard determines which one is used. If the
campaign targets a company brand, connect a Page, not a personal profile.
LinkedIn API rate limits are aggressive — avoid posting the same content to
multiple LinkedIn accounts in quick succession.

### YouTube

YouTube requires a **video file URL** in `mediaUrls`. A text-only post will be
rejected by the YouTube API. The KimuX campaign generator generates
`video_prompt` text (a script for recording), but does not yet generate or host
video files. Until video upload is implemented (deferred to Phase 5 / AWS S3),
YouTube pieces will fail at the Ayrshare layer with a media error. Either skip
YouTube in campaigns or ensure a video URL is attached before scheduling.

### X (Twitter)

No special requirements. Text posts with or without images both work. Note that
Ayrshare's platform identifier for X remains `"twitter"` — the mapping in
`PLATFORM_MAP` in `ayrshare_service.py` handles this automatically.

### Email via Ayrshare

Ayrshare's email publishing feature routes through your own SendGrid account
connected in the Ayrshare dashboard — it is a separate SendGrid connection from
KimuX's platform SendGrid account (configured in `SENDGRID_API_KEY`). You must
connect a SendGrid account specifically in Ayrshare's **Social Accounts** panel.
This is an additional setup step not covered by KimuX's existing SendGrid
integration.

---

## 7. Rate Limits

Ayrshare enforces limits at both the API level and per connected platform.

| Plan | API calls/month | Posts/month |
|---|---|---|
| Business | 50,000 | Unlimited |
| Agency | 200,000 | Unlimited |

The 5-minute polling interval with typical campaign volumes is well within these
limits. Each scheduler tick makes at most one Ayrshare API call per due piece —
not per campaign or per tick.

Individual platforms impose their own posting rate limits independent of
Ayrshare:

- **Instagram**: ~25 posts per day per account via the API
- **Facebook**: ~100 posts per day per Page
- **LinkedIn**: ~150 posts per day per account (in practice, much lower before
  content is flagged as spam)
- **X**: 300 tweets per 3-hour window per account

When a platform rate limit is exceeded, Ayrshare returns an HTTP 400 with a
platform-specific error code in the response body. The scheduler service logs
this as `status: "failed"` on the piece without retrying. A future enhancement
would be to inspect the error code and reschedule rather than mark as failed.

---

## 8. Troubleshooting

### HTTP 401 — Unauthorized

```
Ayrshare API HTTP 401: ...
```

The API key is wrong, expired, or not being read from `.env`.

**Fix:**
1. Confirm `AYRSHARE_API_KEY` is set in `backend/.env` (not the project root `.env`).
2. Copy the key fresh from the Ayrshare dashboard — keys are shown once and can
   be regenerated.
3. Restart the backend after editing `.env`; `pydantic-settings` reads env vars
   at startup only.

### HTTP 400 with error code 190 — Invalid API key

Same root cause as 401 — regenerate the key in the Ayrshare dashboard.

### HTTP 400 with error code 270 — Platform not connected

```
Ayrshare API HTTP 400: {"status": "error", "code": 270, "message": "..."}
```

The social account for that platform is not connected in the Ayrshare dashboard,
or its OAuth token has expired (common after password changes or permission
revocations).

**Fix:** Go to **app.ayrshare.com → Social Accounts**, disconnect and reconnect
the affected platform.

### Scheduler runs but `published` count stays 0

The scheduler found campaigns but no pieces were published. Most likely cause:
the status gap (§4) has not been fixed and pieces still have `status = "draft"`.

**Debug steps:**
1. Confirm `AYRSHARE_API_KEY` is set — if absent, mock mode runs but
   `publish_content_piece` returns `mock_posted`, which *should* still increment
   the published counter.
2. Query the DB directly and inspect a piece's `status` and `schedule.publish_at`
   values (see §5.6).
3. Add a temporary `print(piece.get("status"), piece.get("schedule"))` log line
   inside the scheduler loop to see what the service is reading.

### Scheduler not starting at all

No `Campaign scheduler started` log line at startup.

**Check:**
- `AYRSHARE_API_KEY` must be set. The startup code only calls `start_scheduler()`
  when the key is present (see §3.3).
- Confirm `apscheduler` is installed: `pip show apscheduler`.
- Confirm the import was added to `main.py` (§3.3 step 1).

### `flag_modified` not imported error

```
ImportError: cannot import name 'flag_modified' from 'sqlalchemy.orm.attributes'
```

This import path changed in SQLAlchemy 2.x. If you hit this error, change the
import at the top of `scheduler_service.py`:

```python
# For SQLAlchemy 2.x:
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

# If the above fails, try:
from sqlalchemy import inspect as sa_inspect
# and replace flag_modified(campaign, "content_pieces") with:
sa_inspect(campaign).attrs.content_pieces.history  # forces dirty tracking
```

The project targets SQLAlchemy 2.x and the current import path is correct for
that version. This note is here in case the dependency is ever pinned to 1.x.

---

## Quick Reference

| Item | Location |
|---|---|
| Ayrshare service | `backend/app/services/ayrshare_service.py` |
| Scheduler service | `backend/app/services/scheduler_service.py` |
| Config key | `backend/app/core/config.py` → `ayrshare_api_key` |
| Env var | `backend/.env` → `AYRSHARE_API_KEY` |
| Frontend status gap fix | `src/services/contentSchedulerRepository.js` → `mapSchedulerCardToCampaignPayload` |
| FastAPI startup hook | `backend/app/main.py` → `startup()` function |
| Platform map | `backend/app/services/ayrshare_service.py` → `PLATFORM_MAP` |
