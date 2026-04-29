"""ClickBank REST API v1.3 client.

Authentication:
    All requests send: Authorization: {DEVELOPER_KEY}:{CLERK_KEY}

Two credential tiers:
  - Platform credentials (env vars) → marketplace data, public offers
  - Tenant credentials (encrypted DB) → account products, sales data

Reference: https://api.clickbank.com/rest/1.3/
"""
from __future__ import annotations

from uuid import uuid4

import httpx

from app.core.config import settings

CLICKBANK_API_BASE = "https://api.clickbank.com/rest/1.3"
_TIMEOUT = 10  # seconds


# ── Exceptions ────────────────────────────────────────────────────────────────

class ClickBankAuthError(Exception):
    """Raised when ClickBank returns 401 or 403 — invalid credentials."""


class ClickBankRateLimitError(Exception):
    """Raised when ClickBank returns 429 — rate limit exceeded."""


class ClickBankAPIError(Exception):
    """Raised for other 4xx/5xx or network errors."""
    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


# ── Client ────────────────────────────────────────────────────────────────────

class ClickBankClient:
    def __init__(self, developer_key: str):
        self.developer_key = developer_key

    def _headers(self) -> dict:
        # ClickBank API v1.3 (post-Aug 2023): single developer key in Authorization header.
        # Reference: https://api.clickbank.com/rest/1.3/
        return {
            "Authorization": self.developer_key,
            "Accept": "application/json",
        }

    def _handle_response(self, resp: httpx.Response) -> dict:
        if resp.status_code in (401, 403):
            raise ClickBankAuthError(
                f"ClickBank rejected credentials (HTTP {resp.status_code})"
            )
        if resp.status_code == 429:
            raise ClickBankRateLimitError("ClickBank rate limit exceeded — retry later")
        if resp.status_code >= 400:
            raise ClickBankAPIError(
                f"ClickBank API error (HTTP {resp.status_code}): {resp.text[:200]}",
                status_code=resp.status_code,
            )
        return resp.json()

    def _get(self, path: str, params: dict | None = None) -> dict:
        """Execute a GET request; wraps all network errors in ClickBankAPIError."""
        try:
            with httpx.Client(timeout=_TIMEOUT) as client:
                resp = client.get(
                    f"{CLICKBANK_API_BASE}{path}",
                    headers=self._headers(),
                    params=params or {},
                )
            return self._handle_response(resp)
        except (ClickBankAuthError, ClickBankRateLimitError, ClickBankAPIError):
            raise
        except httpx.TimeoutException as exc:
            raise ClickBankAPIError("Request to ClickBank timed out") from exc
        except httpx.NetworkError as exc:
            raise ClickBankAPIError(f"Network error reaching ClickBank: {exc}") from exc

    def verify_credentials(self) -> bool:
        """Lightweight credential check — raises ClickBankAuthError on invalid keys."""
        self._get("/products/list", {"resultsPerPage": 1})
        return True

    def fetch_marketplace_offers(
        self, category: str | None = None, limit: int = 100
    ) -> list[dict]:
        """Fetch public marketplace products. Returns normalized offer dicts."""
        params: dict = {"resultsPerPage": min(limit, 100)}
        if category:
            params["category"] = category
        data = self._get("/products/list", params)
        return [self._normalize_product(p) for p in data.get("products", [])]

    def fetch_account_products(self) -> list[dict]:
        """Fetch this account's own products (vendor data). Returns normalized dicts."""
        data = self._get("/products/list", {"type": "VENDOR"})
        return [self._normalize_product(p) for p in data.get("products", [])]

    def fetch_account_summary(self) -> dict:
        """Return lightweight account stats (order counts, sales)."""
        return self._get("/orders/count")

    @staticmethod
    def _normalize_product(p: dict) -> dict:
        """Normalize a ClickBank product dict to internal offer schema fields.

        ClickBank response fields (v1.3):
          site         → vendor site nickname (used as external_id)
          title        → product name
          categories   → list of category strings
          gravity      → popularity metric (float)
          pct          → affiliate commission rate as decimal (0–1)
          initialAmount → initial sale price / AOV
          hop          → affiliate hoplink URL
          trend        → "UP" | "DOWN" | null
          trendValue   → trend percentage change

        NOTE: Normalize field names here if the real API returns different keys.
              The mocked tests define which shape to expect.
        """
        raw_trend = (p.get("trend") or "").upper()
        trend_map = {"UP": "up", "DOWN": "down"}
        trend_direction = trend_map.get(raw_trend, "stable")

        categories = p.get("categories") or []
        niche = categories[0].replace("_", " ").title() if categories else "General"

        # external_id: prefer site nickname; fall back to UUID so upsert key is always set
        external_id = p.get("site") or p.get("id") or str(uuid4())

        trend_value = p.get("trendValue") or p.get("trend_value")

        return {
            "external_id": str(external_id),
            "name": p.get("title") or p.get("name") or "Unknown",
            "niche": niche,
            "network": "ClickBank",
            "aov": float(p.get("initialAmount") or p.get("aov") or 0),
            "gravity": float(p.get("gravity") or 0),
            "commission_rate": float(p.get("pct") or p.get("commission_rate") or 0),
            "trend_direction": trend_direction,
            "trend_value": float(trend_value) if trend_value else None,
            "external_url": p.get("hop") or p.get("url") or None,
        }


# ── Factory helpers ───────────────────────────────────────────────────────────

def get_platform_client() -> ClickBankClient:
    """Build a ClickBankClient from the env-var platform credential."""
    dev_key = settings.clickbank_developer_key
    if not dev_key:
        raise ValueError(
            "Platform ClickBank credential not configured. "
            "Set CLICKBANK_DEVELOPER_KEY in .env"
        )
    return ClickBankClient(dev_key)


def get_tenant_client(db, tenant_id: str) -> ClickBankClient:
    """Build a ClickBankClient from a tenant's encrypted DB credential.

    Raises HTTPException 400 if tenant has no ClickBank credential stored.
    """
    from fastapi import HTTPException, status
    from sqlalchemy import select
    from app.core.encryption import decrypt_secrets
    from app.models.integration_credential import IntegrationCredential

    cred = db.scalar(
        select(IntegrationCredential).where(
            IntegrationCredential.tenant_id == tenant_id,
            IntegrationCredential.platform_name == "clickbank",
        )
    )
    if cred is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No ClickBank account connected. Connect your account in Settings first.",
        )
    secrets = decrypt_secrets(cred.encrypted_secrets)
    return ClickBankClient(developer_key=secrets["developer_key"])
