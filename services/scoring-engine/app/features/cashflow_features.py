import math
import numpy as np
from typing import Dict, Any, List
from .base import FeatureExtractor

class CashFlowFeatureExtractor(FeatureExtractor):
    """
    Extracts cash-flow velocity, customer concentration, and seasonality features from UPI / Bank summaries.
    Accounts for 25% of the overall Financial Health Score.
    """
    def extract(self, raw_payload: Dict[str, Any]) -> Dict[str, float]:
        upi_summary = raw_payload.get("upiSummary", {})
        monthly_summaries: List[Dict[str, Any]] = upi_summary.get("monthlySummaries", [])
        
        if not monthly_summaries:
            return {
                "upi_monthly_volume_avg": math.nan,
                "upi_monthly_value_avg": math.nan,
                "upi_credit_debit_ratio": math.nan,
                "upi_avg_ticket_size": math.nan,
                "upi_below_500_ratio": math.nan,
                "upi_unique_payers_avg": math.nan,
                "upi_volume_cv": math.nan,
                "upi_peak_to_low_ratio": math.nan,
            }

        volumes = [float(m.get("creditCount", 0) + m.get("debitCount", 0)) for m in monthly_summaries]
        values = [float(m.get("totalCredits", 0.0) + m.get("totalDebits", 0.0)) for m in monthly_summaries]
        credits = [float(m.get("totalCredits", 0.0)) for m in monthly_summaries]
        debits = [float(m.get("totalDebits", 0.0)) for m in monthly_summaries]
        credit_counts = [float(m.get("creditCount", 0)) for m in monthly_summaries]
        below_500_counts = [float(m.get("below500Count", 0)) for m in monthly_summaries]
        unique_payers = [float(m.get("uniquePayerCount", 0)) for m in monthly_summaries]
        peak_days = [float(m.get("peakDayVolume", 1)) for m in monthly_summaries]
        low_days = [float(m.get("lowDayVolume", 1)) for m in monthly_summaries]

        avg_vol = float(np.mean(volumes))
        avg_val = float(np.mean(values))
        
        total_cr = float(np.sum(credits))
        total_db = float(np.sum(debits))
        cr_db_ratio = total_cr / max(1.0, total_db)

        total_cr_cnt = float(np.sum(credit_counts))
        avg_ticket = total_cr / max(1.0, total_cr_cnt)
        
        total_below_500 = float(np.sum(below_500_counts))
        below_500_ratio = total_below_500 / max(1.0, total_cr_cnt)

        avg_unique_payers = float(np.mean(unique_payers))

        vol_std = float(np.std(volumes)) if len(volumes) > 1 else 0.0
        vol_cv = (vol_std / max(1.0, avg_vol)) if avg_vol > 0 else 0.0

        peak_to_low = float(np.mean([p / max(1.0, l) for p, l in zip(peak_days, low_days)]))

        return {
            "upi_monthly_volume_avg": round(avg_vol, 2),
            "upi_monthly_value_avg": round(avg_val, 2),
            "upi_credit_debit_ratio": round(cr_db_ratio, 4),
            "upi_avg_ticket_size": round(avg_ticket, 2),
            "upi_below_500_ratio": round(below_500_ratio, 4),
            "upi_unique_payers_avg": round(avg_unique_payers, 2),
            "upi_volume_cv": round(vol_cv, 4),
            "upi_peak_to_low_ratio": round(peak_to_low, 4),
        }
