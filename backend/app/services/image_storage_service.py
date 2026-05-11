from __future__ import annotations

import base64
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class ImageStorageService:
    """
    Stores campaign content-piece images either as base64 data URLs (current
    behaviour) or as objects in S3 (activated when AWS_S3_BUCKET is set).

    Current state: S3 upload is fully written but commented out. The service
    runs in pass-through mode — it returns the base64 data URL unchanged and
    never touches S3. This keeps the generation pipeline working today while
    giving the next developer a single, clearly marked activation point.

    Activation checklist (in order):
      1. Create an S3 bucket and note its name + region (see S3_IMAGE_STORAGE_HANDOFF.md).
      2. Create an IAM user with ``s3:PutObject`` + ``s3:GetObject`` on the bucket.
      3. Add AWS_S3_BUCKET, AWS_S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
         to backend/.env.
      4. ``pip install boto3`` and add ``boto3>=1.34`` to requirements.txt.
      5. Uncomment the S3 block inside ``store_image`` and delete the
         pass-through return above it.
      6. Uncomment ``_upload_to_s3`` method body and delete its NotImplementedError.

    S3 key convention: ``campaigns/{campaign_id}/{piece_id}/{platform}.png``
    Public URL format:  ``https://{bucket}.s3.{region}.amazonaws.com/{key}``
    """

    async def store_image(
        self,
        image_data: str,
        campaign_id: str,
        piece_id: str,
        platform: str,
    ) -> str:
        """
        Persist an image and return the URL that should be saved to
        ``content_pieces[n]["media"]["image_url"]`` in the campaign record.

        Args:
            image_data: Either a ``data:image/png;base64,...`` data URL (from
                        Gemini image generation or a frontend FileReader upload)
                        or an existing HTTPS URL (passed through unchanged).
            campaign_id: UUID string of the owning campaign. Used as the first
                         segment of the S3 key so images can be bulk-deleted
                         when a campaign is deleted.
            piece_id:   Identifier of the content piece (e.g. ``"piece_0"``).
                        Combined with ``platform`` to make the key unique within
                        a campaign.
            platform:   KimuX platform label (``"Instagram"``, ``"X"``, etc.).
                        Lower-cased and used as the filename stem in the S3 key.

        Returns:
            A URL string. In pass-through mode this is ``image_data`` unchanged.
            After S3 activation this is the public S3 HTTPS URL.

        Pass-through mode (no AWS_S3_BUCKET set):
            Returns ``image_data`` as-is. Base64 data URLs are stored directly
            in the campaign JSON. This is the current behaviour — it works but
            inflates DB row sizes and is not CDN-friendly.
        """
        # ── Pass-through: no bucket configured ───────────────────────────────
        if not settings.aws_s3_bucket:
            logger.debug(
                "ImageStorageService: no S3 bucket configured — returning data URL unchanged "
                "(campaign=%s piece=%s)",
                campaign_id,
                piece_id,
            )
            return image_data

        # ── TODO: ACTIVATE FOR HANDOFF ────────────────────────────────────────
        # Uncomment this block and delete the pass-through return above once
        # AWS credentials are set. No other changes needed.
        #
        # # Already a real URL (e.g. re-using a previously uploaded image) — skip upload.
        # if image_data.startswith("https://"):
        #     return image_data
        #
        # key = f"campaigns/{campaign_id}/{piece_id}/{platform.lower()}.png"
        # try:
        #     image_bytes = self._base64_to_bytes(image_data)
        #     url = self._upload_to_s3(image_bytes, key)
        #     logger.info(
        #         "ImageStorageService: uploaded image — campaign=%s piece=%s url=%s",
        #         campaign_id,
        #         piece_id,
        #         url,
        #     )
        #     return url
        # except Exception as exc:
        #     logger.error(
        #         "ImageStorageService: S3 upload failed — campaign=%s piece=%s error=%s "
        #         "— falling back to data URL",
        #         campaign_id,
        #         piece_id,
        #         exc,
        #     )
        #     return image_data
        # ── End of block ──────────────────────────────────────────────────────

    def _upload_to_s3(self, image_bytes: bytes, key: str) -> str:
        """
        Upload raw image bytes to S3 and return the public HTTPS URL.

        Uses boto3's resource API. Credentials are read from environment variables
        (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY) via the standard boto3
        credential chain — no explicit credential passing needed as long as the
        env vars are set.

        ACL: ``public-read`` — the bucket must allow ACLs (Block Public Access
        must be disabled for the ``public-read`` ACL to take effect). See
        S3_IMAGE_STORAGE_HANDOFF.md for the required bucket policy.

        Args:
            image_bytes: Raw PNG bytes.
            key:         S3 object key, e.g. ``campaigns/abc123/piece_0/instagram.png``.

        Returns:
            Public HTTPS URL: ``https://{bucket}.s3.{region}.amazonaws.com/{key}``

        Raises:
            RuntimeError: Wraps any boto3 / AWS error so the caller can handle
                          it uniformly.

        TODO: ACTIVATE FOR HANDOFF — uncomment the body below, delete the
        NotImplementedError line. Install boto3 first (see class docstring).
        """
        # TODO: ACTIVATE FOR HANDOFF
        # ── Uncomment this entire body to enable S3 uploads ──────────────────
        #
        # import boto3
        # from botocore.exceptions import BotoCoreError, ClientError
        #
        # bucket = settings.aws_s3_bucket
        # region = settings.aws_s3_region
        #
        # try:
        #     s3 = boto3.client(
        #         "s3",
        #         region_name=region,
        #         aws_access_key_id=settings.aws_access_key_id,
        #         aws_secret_access_key=settings.aws_secret_access_key,
        #     )
        #     s3.put_object(
        #         Bucket=bucket,
        #         Key=key,
        #         Body=image_bytes,
        #         ContentType="image/png",
        #         ACL="public-read",
        #     )
        # except (BotoCoreError, ClientError) as exc:
        #     raise RuntimeError(f"S3 upload failed for key={key!r}: {exc}") from exc
        #
        # return f"https://{bucket}.s3.{region}.amazonaws.com/{key}"
        # ── End of body ───────────────────────────────────────────────────────

        raise NotImplementedError(
            "_upload_to_s3 is not yet activated. "
            "Set AWS_S3_BUCKET in .env and uncomment the method body."
        )

    def _base64_to_bytes(self, data_url: str) -> bytes:
        """
        Strip the ``data:image/...;base64,`` prefix from a data URL and decode
        the remainder to raw bytes.

        Handles both prefixed data URLs (``data:image/png;base64,<data>``) and
        bare base64 strings (no prefix). Raises ``ValueError`` for strings that
        are neither.

        Args:
            data_url: A data URL from Gemini image generation or a browser
                      FileReader ``readAsDataURL`` call.

        Returns:
            Raw image bytes, suitable for passing to ``s3.put_object(Body=...)``.

        Raises:
            ValueError: If the string is not a valid base64 data URL or bare
                        base64 payload.
        """
        if data_url.startswith("data:"):
            # Format: "data:<mime>;base64,<payload>"
            try:
                _, encoded = data_url.split(",", 1)
            except ValueError as exc:
                raise ValueError(
                    f"Malformed data URL — no comma separator: {data_url[:80]!r}"
                ) from exc
        else:
            encoded = data_url

        try:
            return base64.b64decode(encoded)
        except Exception as exc:
            raise ValueError(f"Failed to base64-decode image data: {exc}") from exc
