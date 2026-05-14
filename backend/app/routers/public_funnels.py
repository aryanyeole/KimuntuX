"""public_funnels.py — public endpoints for funnel lead-capture form submissions.

This is the ONLY router in the codebase with no authentication. Form POSTs
come from anonymous website visitors, not KimuX users. The tenant is resolved
from the funnel itself, not from a JWT or X-Tenant-ID header.

FB5: wires the funnel contact form to the CRM lead pipeline.
"""
from __future__ import annotations

import re
from typing import Annotated

from fastapi import APIRouter, Depends, Form, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.activity import Activity, ActivityType
from app.models.funnel import Funnel, FunnelStatus
from app.models.lead import Lead, LeadClassification, LeadSource, LeadStage

router = APIRouter(prefix="/public/funnels", tags=["Public"])

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# ── Static HTML responses ─────────────────────────────────────────────────────

_THANK_YOU_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank you</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      background: #0f0f0f;
      color: #f0f0f0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 24px;
    }
    .card { max-width: 480px; width: 100%; }
    .check-wrap {
      width: 72px; height: 72px; border-radius: 50%;
      background: rgba(0, 200, 150, 0.12);
      border: 2px solid #00c896;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 28px;
    }
    .check-wrap svg { width: 32px; height: 32px; stroke: #00c896; stroke-width: 2.5; fill: none; }
    h1 { font-size: 2rem; font-weight: 700; color: #fff; margin-bottom: 12px; }
    p { font-size: 1rem; color: #9ca3af; line-height: 1.65; margin-bottom: 40px; }
    .footer { font-size: 0.75rem; color: #4b5563; }
    .footer a { color: inherit; text-decoration: none; }
    .footer a:hover { color: #9ca3af; }
  </style>
</head>
<body>
  <div class="card">
    <div class="check-wrap">
      <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </div>
    <h1>Thank you</h1>
    <p>Your message has been received.<br>We&#39;ll be in touch shortly.</p>
    <div class="footer">Powered by <a href="https://kimux.io">KimuX</a></div>
  </div>
</body>
</html>"""

_NOT_FOUND_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page not found</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      background: #0f0f0f;
      color: #6b7280;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 24px;
    }
    .card { max-width: 400px; }
    h1 { font-size: 5rem; font-weight: 800; color: #fff; margin-bottom: 8px; letter-spacing: -2px; }
    p { font-size: 1rem; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <h1>404</h1>
    <p>This page is no longer available.</p>
  </div>
</body>
</html>"""


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("/{funnel_id}/submit", response_class=HTMLResponse)
async def submit_funnel_form(
    funnel_id: str,
    name: Annotated[str, Form(max_length=200)],
    email: Annotated[str, Form(max_length=200)],
    message: Annotated[str | None, Form(max_length=5000)] = None,
    db: Session = Depends(get_db),
) -> HTMLResponse:
    """Public (no-auth) form submission endpoint.

    Looks up the funnel by ID, verifies it is in 'ready' status, creates a
    Lead in the funnel's tenant, and returns an HTML thank-you page.
    """
    # Validate email format (permissive — same pattern as WizardInput.contact_email)
    if not _EMAIL_RE.match(email.strip()):
        raise HTTPException(status_code=422, detail="Invalid email address")

    # Look up funnel without tenant scoping — this is a public endpoint
    funnel = db.scalar(select(Funnel).where(Funnel.id == funnel_id))
    if funnel is None or funnel.status != FunnelStatus.ready:
        return HTMLResponse(_NOT_FOUND_HTML, status_code=404)

    # Split name into first / last (same pattern as convert_contact_to_lead)
    parts = name.strip().split(" ", 1)
    first_name = parts[0]
    last_name = parts[1] if len(parts) > 1 else ""

    # Create lead in the funnel's owning tenant
    lead = Lead(
        tenant_id=funnel.tenant_id,
        first_name=first_name,
        last_name=last_name,
        email=email.lower().strip(),
        source=LeadSource.funnel,
        source_detail=funnel.title,
        stage=LeadStage.new,
        classification=LeadClassification.cold,
        notes=message or None,
    )
    db.add(lead)
    db.flush()

    # Log the form submission as a CRM activity
    activity = Activity(
        lead_id=lead.id,
        tenant_id=funnel.tenant_id,
        activity_type=ActivityType.form_submit,
        description=f"Submitted funnel contact form: {funnel.title}",
        meta={"funnel_id": funnel_id, "funnel_title": funnel.title},
        channel="funnel",
    )
    db.add(activity)
    db.commit()

    return HTMLResponse(_THANK_YOU_HTML, status_code=200)
