import math
from datetime import datetime, date
from typing import Dict, Any
from .base import FeatureExtractor

class DigitalFeatureExtractor(FeatureExtractor):
    """
    Extracts business formalization, vintage, and registry features from Udyam and profile metadata.
    Accounts for 15% of the overall Financial Health Score.
    """
    def extract(self, raw_payload: Dict[str, Any]) -> Dict[str, float]:
        profile = raw_payload.get("profile", {})
        if not profile:
            return {
                "udyam_vintage_months": math.nan,
                "msme_category_ordinal": math.nan,
                "is_manufacturing_flag": math.nan,
                "linked_account_count": math.nan,
                "pan_gstin_match_flag": math.nan,
                "investment_in_plant_machinery": math.nan,
            }

        reg_date_str = profile.get("registrationDate")
        if reg_date_str:
            try:
                reg_date = date.fromisoformat(reg_date_str[:10])
                vintage_months = max(1.0, float((date.today() - reg_date).days / 30.44))
            except Exception:
                vintage_months = 12.0
        else:
            vintage_months = 12.0

        cat = profile.get("category", "MICRO")
        cat_map = {"MICRO": 1.0, "SMALL": 2.0, "MEDIUM": 3.0}
        cat_ord = cat_map.get(cat, 1.0)

        sector = profile.get("sector", "SERVICES")
        is_mfg = 1.0 if sector == "MANUFACTURING" else 0.0

        linked_accs = profile.get("linkedAccounts", [])
        acc_count = float(len(linked_accs))

        pan = profile.get("pan", "")
        gstin = profile.get("gstin", "")
        pan_match = 1.0 if (pan and gstin and pan in gstin) else 0.0

        inv = float(profile.get("investmentInPlantMachinery", 1000000.0))

        return {
            "udyam_vintage_months": round(vintage_months, 1),
            "msme_category_ordinal": round(cat_ord, 1),
            "is_manufacturing_flag": round(is_mfg, 1),
            "linked_account_count": round(acc_count, 1),
            "pan_gstin_match_flag": round(pan_match, 1),
            "investment_in_plant_machinery": round(inv, 2),
        }
