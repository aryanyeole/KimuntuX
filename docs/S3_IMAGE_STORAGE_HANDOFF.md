# S3 Image Storage — Handoff Document

## Overview

Campaign content-piece images are currently stored as base64 data URLs inside
the campaign JSON column in Postgres. This works but has three problems that
become significant at scale:

1. **DB bloat.** A single PNG image from Gemini is typically 50–200 KB after
   base64 encoding. A campaign with 5 platforms × 3 image variants = 15 images
   can add 3–5 MB to a single Postgres row. At 1,000 campaigns that is 3–5 GB
   of image data living in the database.

2. **No CDN.** Base64 data URLs are served inline from the API response. Every
   image fetch hits FastAPI → Postgres → network. An S3 + CloudFront setup
   serves images from the edge with sub-100 ms latency worldwide.

3. **Cost.** Postgres RDS storage is ~10× more expensive per GB than S3 standard
   storage. Images do not need to be in the database.

**What this service does:** `ImageStorageService.store_image()` is a single
insertion point that today returns the base64 URL unchanged (no behaviour
change) and tomorrow, once AWS credentials are set, uploads the image to S3
and returns the CDN URL instead. The campaign JSON then stores a short HTTPS
URL instead of a multi-megabyte base64 blob.

---

## Prerequisites

- An AWS account.
- Python package `boto3>=1.34` installed in the backend virtualenv.
- The four env vars below set in `backend/.env`.

---

## Step 1 — Create the S3 Bucket

1. Go to **S3 → Create bucket**.
2. Set **Bucket name** (e.g. `kimux-campaign-images-prod`). Note it — this becomes
   `AWS_S3_BUCKET`.
3. Set **AWS Region** (e.g. `us-east-1`). Note it — this becomes `AWS_S3_REGION`.
4. Under **Block Public Access settings**: **uncheck** "Block all public access".
   Acknowledge the warning. Images must be publicly readable so the browser can
   render them without auth headers.
5. Leave versioning off. Leave encryption at the default (SSE-S3).
6. Create the bucket.

### Bucket Policy (required for public read)

After creation go to **Permissions → Bucket policy** and paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    }
  ]
}
```

Replace `YOUR_BUCKET_NAME` with your actual bucket name.

> **Why ACL + bucket policy?** `ImageStorageService._upload_to_s3` uses
> `ACL="public-read"` at upload time. For that to take effect, the bucket must
> also have "ACLs enabled" (not blocked). The bucket policy above is the belt
> for belt-and-suspenders: even if the per-object ACL is dropped in a future
> boto3 update, the policy still allows public reads.

---

## Step 2 — Create an IAM User

1. Go to **IAM → Users → Create user**.
2. Name it `kimux-image-uploader` (or similar). No console access needed.
3. Attach a policy. Use the inline JSON below or create a custom policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    }
  ]
}
```

4. After creating the user go to **Security credentials → Create access key**.
   Select **Application running outside AWS**. Download the CSV — you will not
   see the secret again.

---

## Step 3 — Add Env Vars

Add to `backend/.env`:

```
AWS_S3_BUCKET=kimux-campaign-images-prod
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

These are read by `backend/app/core/config.py` via pydantic-settings at startup.

---

## Step 4 — Install boto3

```bash
cd backend
pip install "boto3>=1.34"
```

Add to `requirements.txt`:

```
boto3>=1.34
```

---

## Step 5 — Activate the Service

Two locations to uncomment.

### `backend/app/services/image_storage_service.py`

**In `store_image`:** Delete the pass-through `return image_data` line (the
block right after the `if not settings.aws_s3_bucket:` check) and uncomment
the S3 block below it:

```python
# BEFORE (delete this):
if not settings.aws_s3_bucket:
    logger.debug(...)
    return image_data

# AFTER (uncomment everything in the TODO block):
# if image_data.startswith("https://"):
#     return image_data
# key = f"campaigns/{campaign_id}/{piece_id}/{platform.lower()}.png"
# try:
#     image_bytes = self._base64_to_bytes(image_data)
#     url = self._upload_to_s3(image_bytes, key)
#     ...
#     return url
# except Exception as exc:
#     ...
#     return image_data
```

The `except` branch retains the base64 fallback on upload failure — images
still render, they just stay large in Postgres. This prevents a broken S3
credential from blocking campaign generation entirely.

**In `_upload_to_s3`:** Delete the `raise NotImplementedError(...)` line and
uncomment the full method body above it.

---

## Step 6 — Wire `store_image` into the Generate-Image Endpoint

`POST /campaigns/generate-image` is in `backend/app/routers/campaigns.py`.
Currently it returns the raw base64 from `ImageGeneratorService.generate_image`.

The caller needs a `campaign_id` and `piece_id` to build the S3 key. Extend
the request body to carry them:

```python
# In campaigns.py — extend ImageGenerateRequest:
class ImageGenerateRequest(BaseModel):
    prompt: str
    platform: str
    campaign_id: str | None = None   # add
    piece_id: str | None = None      # add
```

Then in the handler:

```python
from app.services.image_storage_service import ImageStorageService

@router.post("/generate-image", response_model=ImageGenerateResponse)
async def generate_image(
    payload: ImageGenerateRequest,
    current_user: User = Depends(get_current_user),
) -> ImageGenerateResponse:
    service = ImageGeneratorService()
    raw_url = await service.generate_image(payload.prompt, payload.platform)

    # Store (pass-through today, S3 when bucket is configured).
    storage = ImageStorageService()
    image_url = await storage.store_image(
        image_data=raw_url,
        campaign_id=payload.campaign_id or "unknown",
        piece_id=payload.piece_id or "unknown",
        platform=payload.platform,
    )
    return ImageGenerateResponse(image_url=image_url)
```

The frontend already reads `image_url` from the response and stores it in
`previewSelections[platform].imageUrl`, which flows into
`content_pieces[n].media.image_url` when "Send to Scheduler" is clicked. No
frontend changes needed.

---

## Step 7 — Handle Frontend FileReader Uploads

When a user uploads an image manually in `CampaignPlatformPreview.jsx`, the
browser reads it with `FileReader.readAsDataURL`, producing a base64 data URL
stored client-side. That data URL is included in the `content_pieces` payload
sent to `POST /campaigns` (the "Send to Scheduler" call in
`ContentGeneratorPage.js`).

Today this base64 URL ends up in the DB unchanged. After S3 activation you
have two options:

**Option A (recommended, lazy):** Leave the "Send to Scheduler" path alone.
In `campaign_service.create_campaign` (or the router handler), loop through
`content_pieces` and call `ImageStorageService().store_image()` on any
`media.image_url` that starts with `data:`. This converts all data URLs at
save time.

```python
storage = ImageStorageService()
for i, piece in enumerate(campaign_data.content_pieces or []):
    if piece.media and piece.media.image_url and piece.media.image_url.startswith("data:"):
        piece.media.image_url = await storage.store_image(
            image_data=piece.media.image_url,
            campaign_id=str(new_campaign.id),
            piece_id=piece.piece_id or f"piece_{i}",
            platform=piece.platform or "unknown",
        )
```

**Option B (eager):** Add a dedicated upload endpoint
`POST /campaigns/upload-image` that the frontend calls instead of
`generate-image` for user-uploaded files. The frontend would call it right
after `FileReader` completes and use the returned S3 URL going forward. More
real-time but requires a frontend change.

Option A is simpler and requires no frontend changes.

---

## S3 Key Structure

```
campaigns/{campaign_id}/{piece_id}/{platform}.png
```

Examples:
```
campaigns/a1b2c3d4-…/piece_0/instagram.png
campaigns/a1b2c3d4-…/piece_1/facebook.png
campaigns/a1b2c3d4-…/piece_0/x.png
```

This structure lets you bulk-delete all images for a campaign with a single
S3 `list_objects_v2` + `delete_objects` call keyed by the `campaigns/{id}/`
prefix — useful when a campaign is hard-deleted.

---

## Cost Estimate

Rough monthly numbers for **1,000 campaigns**, each with 5 platforms × 1 image
(assume 100 KB per image after compression):

| Cost component           | Calculation                                | $/month |
|--------------------------|--------------------------------------------|---------|
| Storage                  | 5,000 images × 100 KB = 500 MB × $0.023/GB | $0.01   |
| PUT requests (upload)    | 5,000 × $0.005/1,000                       | $0.03   |
| GET requests (rendering) | ~50,000 reads × $0.0004/1,000              | $0.02   |
| Data transfer out        | 50,000 × 100 KB = 5 GB × $0.09/GB         | $0.45   |
| **Total**                |                                            | **~$0.51** |

At 10,000 campaigns the cost is still under $6/month. With CloudFront in
front of the bucket, data-transfer charges drop significantly (CloudFront
origin fetch is free for S3 in the same region) and cache-hit reads cost
$0.0075/10,000 instead of S3 GET rates.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `NoCredentialsError` from boto3 | `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` not set or wrong | Check `.env`, restart server |
| `AccessDenied` on `PutObject` | IAM user missing `s3:PutObject` on the bucket | Check IAM policy Resource ARN matches bucket name exactly |
| `AccessDenied` on public GET | Bucket Block Public Access still on, or bucket policy missing | Re-check Step 1 |
| Images render as broken links | URL scheme wrong — `_upload_to_s3` returning HTTP not HTTPS | Verify the URL format in `_upload_to_s3`: must start with `https://` |
| `InvalidAccessKeyId` (HTTP 403) | Key deleted or rotated | Generate new access key in IAM console |
| `NoSuchBucket` | `AWS_S3_BUCKET` env var typo or wrong region | Double-check bucket name and `AWS_S3_REGION` match what's in the console |
| Large DB rows still growing | `store_image` not called for uploaded images | Implement Option A in Step 7 |
