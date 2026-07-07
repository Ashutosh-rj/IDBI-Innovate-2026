import math
import numpy as np
from typing import Dict, Any, List
from .base import FeatureExtractor

class GstFeatureExtractor(FeatureExtractor):
    """
    Extracts tax compliance and turnover consistency features from GSTR-3B filing records.
    Accounts for 30% of the overall Financial Health Score.
    """
    def extract(self, raw_payload: Dict[str, Any]) -> Dict[str, float]:
        filings: List[Dict[str, Any]] = raw_payload.get("gstFilings", [])
        if not filings:
            # Return NaN for all features if no GST filings exist (e.g. unregistered NTC)
            return {
                "gst_filing_regularity": math.nan,
                "gst_late_filing_ratio": math.nan,
                "gst_nil_return_ratio": math.nan,
                "gst_avg_monthly_turnover": math.nan,
                "gst_turnover_cv": math.nan,
                "gst_turnover_yoy_growth": math.nan,
                "gst_itc_claim_ratio": math.nan,
                "gst_itc_mismatch_flag": math.nan,
                "gst_total_late_fees_paid": math.nan,
                "gst_late_fee_per_turnover": math.nan,
            }

        total_filings = len(filings)
        on_time = sum(1 for f in filings if f.get("filingStatus") == "ON_TIME")
        late_or_unfiled = sum(1 for f in filings if f.get("filingStatus") in ["LATE", "NOT_FILED"])
        nil_returns = sum(1 for f in filings if f.get("filingStatus") == "NIL_RETURN")

        turnovers = [float(f.get("supDetails", {}).get("osupDet", {}).get("txval", 0.0)) for f in filings]
        late_fees = [float(f.get("lateFeeAmount", 0.0)) for f in filings]

        avg_turnover = float(np.mean(turnovers)) if turnovers else 0.0
        turnover_std = float(np.std(turnovers)) if len(turnovers) > 1 else 0.0
        turnover_cv = (turnover_std / max(1.0, avg_turnover)) if avg_turnover > 0 else 0.0

        # YoY Growth: compare last 6 months vs previous 6 months (or earlier)
        if len(turnovers) >= 12:
            recent_mean = float(np.mean(turnovers[-6:]))
            older_mean = float(np.mean(turnovers[:6]))
            yoy_growth = (recent_mean - older_mean) / max(1.0, older_mean)
        elif len(turnovers) >= 4:
            half = len(turnovers) // 2
            recent_mean = float(np.mean(turnovers[half:]))
            older_mean = float(np.mean(turnovers[:half]))
            yoy_growth = (recent_mean - older_mean) / max(1.0, older_mean)
        else:
            yoy_growth = 0.0

        # ITC ratios
        itc_ratios = []
        for f in filings:
            txval = float(f.get("supDetails", {}).get("osupDet", {}).get("txval", 0.0))
            if txval > 0:
                est_tax = txval * 0.18 # approx 18% avg GST
                itc_net = float(f.get("itcElg", {}).get("itcNet", {}).get("iamt", 0.0)) + \
                          float(f.get("itcElg", {}).get("itcNet", {}).get("camt", 0.0)) + \
                          float(f.get("itcElg", {}).get("itcNet", {}).get("samt", 0.0))
                itc_ratios.append(min(1.5, itc_net / max(1.0, est_tax)))

        avg_itc_ratio = float(np.mean(itc_ratios)) if itc_ratios else 0.0
        itc_mismatch = 1.0 if avg_itc_ratio > 0.95 else 0.0

        total_late_fee = float(np.sum(late_fees))
        total_turnover = float(np.sum(turnovers))
        late_fee_per_turnover = total_late_fee / max(1.0, total_turnover)

        return {
            "gst_filing_regularity": round(on_time / total_filings, 4),
            "gst_late_filing_ratio": round(late_or_unfiled / total_filings, 4),
            "gst_nil_return_ratio": round(nil_returns / total_filings, 4),
            "gst_avg_monthly_turnover": round(avg_turnover, 2),
            "gst_turnover_cv": round(turnover_cv, 4),
            "gst_turnover_yoy_growth": round(yoy_growth, 4),
            "gst_itc_claim_ratio": round(avg_itc_ratio, 4),
            "gst_itc_mismatch_flag": round(itc_mismatch, 1),
            "gst_total_late_fees_paid": round(total_late_fee, 2),
            "gst_late_fee_per_turnover": round(late_fee_per_turnover, 6),
        }
