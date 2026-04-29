from __future__ import annotations

import hashlib
import random
from copy import deepcopy

from app.schemas.campaign import CampaignResponse


class TestMetricsService:
    @staticmethod
    def _generate_fake_metrics(campaign_id: str) -> dict:
        seed = int(hashlib.md5(str(campaign_id).encode()).hexdigest()[:8], 16)
        rng = random.Random(seed)
        variance_rng = random.Random(seed ^ 0x5F3759DF)
        variance = variance_rng.uniform(0.95, 1.05)

        impressions = rng.randint(5000, 80000)
        ctr = rng.uniform(0.4, 3.2)
        clicks = int(impressions * ctr / 100)
        cvr = rng.uniform(0.5, 4.0)
        conversions = max(1, int(clicks * cvr / 100))
        avg_order = rng.uniform(30, 150)
        revenue = round(conversions * avg_order * variance, 2)
        spend = round(rng.uniform(50, 600) * variance, 2)
        roas = round(revenue / spend, 2) if spend > 0 else 0
        cpa = round(spend / conversions, 2) if conversions > 0 else 0
        leads = int(clicks * rng.uniform(0.03, 0.12))

        return {
            "impressions": int(impressions * variance),
            "clicks": int(clicks * variance),
            "conversions": conversions,
            "revenue": revenue,
            "spend": spend,
            "ctr": round(ctr * variance, 2),
            "cvr": round(cvr * variance, 2),
            "roas": roas,
            "cpa": cpa,
            "leads": leads,
            "last_synced_at": None,
        }

    @staticmethod
    def inject_metrics(campaigns: list, test_mode: bool) -> list:
        enriched_campaigns: list[dict] = []

        for campaign in campaigns:
            if isinstance(campaign, dict):
                campaign_payload = deepcopy(campaign)
            else:
                campaign_payload = CampaignResponse.model_validate(campaign).model_dump()

            if test_mode and campaign_payload.get("is_used"):
                metrics = deepcopy(campaign_payload.get("metrics") or {})
                actuals = deepcopy(metrics.get("actuals") or {})
                actuals.update(TestMetricsService._generate_fake_metrics(campaign_payload.get("id", "")))
                metrics["actuals"] = actuals
                campaign_payload["metrics"] = metrics

            enriched_campaigns.append(campaign_payload)

        return enriched_campaigns