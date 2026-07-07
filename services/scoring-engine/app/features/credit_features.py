import math
import numpy as np
from typing import Dict, Any, List
from .base import FeatureExtractor

class CreditFeatureExtractor(FeatureExtractor):
    """
    Extracts banking footprint, liquidity buffers, and thin-file status from Account Aggregator FI statements.
    Accounts for 15% of the overall Financial Health Score.
    """
    def extract(self, raw_payload: Dict[str, Any]) -> Dict[str, float]:
        aa_stmt = raw_payload.get("aaStatement", {})
        if not aa_stmt:
            return {
                "aa_current_balance": math.nan,
                "aa_od_limit_utilization": math.nan,
                "aa_avg_monthly_credit": math.nan,
                "aa_bounce_flag": math.nan,
                "ntc_thin_file_flag": 1.0, # Default to NTC if no AA statement
            }

        acc = aa_stmt.get("account", {})
        summary = acc.get("summary", {})
        txns_dict = acc.get("transactions", {})
        txns: List[Dict[str, Any]] = txns_dict.get("transaction", [])

        try:
            curr_bal = float(summary.get("currentBalance", 0.0))
        except Exception:
            curr_bal = 0.0

        try:
            od_limit = float(summary.get("currentODLimit", 0.0))
            drawing_limit = float(summary.get("drawingLimit", 0.0))
            if od_limit > 0:
                od_util = (od_limit - drawing_limit) / od_limit
            else:
                od_util = 0.0
        except Exception:
            od_util = 0.0

        # Calculate average monthly credit from transactions
        credits = [float(t.get("amount", 0.0)) for t in txns if t.get("type") == "CREDIT"]
        avg_monthly_credit = float(np.sum(credits) / 24.0) if credits else 0.0

        # Check for bounce or return narrations
        bounce = 0.0
        for t in txns:
            narr = str(t.get("narration", "")).upper()
            if "BOUNCE" in narr or "RETURN" in narr or "DISHONOUR" in narr:
                bounce = 1.0
                break

        # NTC Thin-File determination
        scenario = raw_payload.get("scenario", "")
        ntc_flag = 1.0 if (scenario == "NTC_THIN_FILE" or len(txns) < 10) else 0.0

        return {
            "aa_current_balance": round(curr_bal, 2),
            "aa_od_limit_utilization": round(od_util, 4),
            "aa_avg_monthly_credit": round(avg_monthly_credit, 2),
            "aa_bounce_flag": round(bounce, 1),
            "ntc_thin_file_flag": round(ntc_flag, 1),
        }
