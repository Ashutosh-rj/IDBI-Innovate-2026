import math
from typing import Dict, Any, List
from .base import FeatureExtractor

class PayrollFeatureExtractor(FeatureExtractor):
    """
    Extracts employment stability and EPFO compliance features from employer contribution records.
    Accounts for 15% of the overall Financial Health Score.
    """
    def extract(self, raw_payload: Dict[str, Any]) -> Dict[str, float]:
        epfo = raw_payload.get("epfoRecord", {})
        if not epfo:
            return {
                "epfo_covered_flag": math.nan,
                "epfo_active_members": math.nan,
                "epfo_contribution_regularity": math.nan,
                "epfo_default_months": math.nan,
                "epfo_member_growth_rate": math.nan,
                "epfo_avg_monthly_wage": math.nan,
                "epfo_total_penalties": math.nan,
            }

        covered = 1.0 if epfo.get("coveredUnderAct", False) else 0.0
        stats = epfo.get("aggregateStats", {})
        monthly: List[Dict[str, Any]] = epfo.get("monthlySummaries", [])

        active_members = float(monthly[-1].get("activeMembers", 0)) if monthly else 0.0
        regularity = float(stats.get("contributionRegularity", 0.0))
        default_months = float(stats.get("totalDefaultedMonths", 0.0))
        growth_rate = float(stats.get("memberGrowthRate", 0.0))
        penalties = float(stats.get("totalPenaltiesPaid", 0.0))

        if monthly and active_members > 0:
            latest_wages = float(monthly[-1].get("totalBasicWages", 0.0))
            avg_wage = latest_wages / max(1.0, active_members)
        else:
            avg_wage = 0.0

        return {
            "epfo_covered_flag": round(covered, 1),
            "epfo_active_members": round(active_members, 1),
            "epfo_contribution_regularity": round(regularity, 4),
            "epfo_default_months": round(default_months, 1),
            "epfo_member_growth_rate": round(growth_rate, 4),
            "epfo_avg_monthly_wage": round(avg_wage, 2),
            "epfo_total_penalties": round(penalties, 2),
        }
