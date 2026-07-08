import os
import yaml
from typing import Dict, Any, Tuple, Optional
from core.config import settings
import structlog

logger = structlog.get_logger()

class RiskPolicyEngine:
    """
    External Risk Policy Engine (AUDIT-T3-1).
    Loads credit risk cutoffs, loan limits, and interest rates from an external YAML/JSON rules layer.
    Supports dynamic hot-reloading by checking file modification timestamps without restarting the service.
    """
    def __init__(self, policy_path: Optional[str] = None):
        self.policy_path = policy_path or settings.RISK_POLICY_PATH
        self._policy_cache: Optional[Dict[str, Any]] = None
        self._last_mtime: float = 0.0
        self._load_policy()

    def _load_policy(self, force_reload: bool = False) -> Dict[str, Any]:
        try:
            if not os.path.exists(self.policy_path):
                logger.warning("Risk policy file not found, using heuristic defaults", path=self.policy_path)
                return self._get_default_policy()

            current_mtime = os.path.getmtime(self.policy_path)
            if not force_reload and self._policy_cache is not None and current_mtime == self._last_mtime:
                return self._policy_cache

            with open(self.policy_path, "r", encoding="utf-8") as f:
                loaded_policy = yaml.safe_load(f)
                if not loaded_policy or "riskBands" not in loaded_policy:
                    logger.error("Invalid risk policy format, using heuristic defaults", path=self.policy_path)
                    return self._get_default_policy()

                self._policy_cache = loaded_policy
                self._last_mtime = current_mtime
                logger.info("Successfully loaded/hot-reloaded risk policy rules", path=self.policy_path, version=loaded_policy.get("version"))
                return self._policy_cache
        except Exception as e:
            logger.error("Error loading risk policy file, using existing cache or defaults", error=str(e))
            return self._policy_cache or self._get_default_policy()

    def _get_default_policy(self) -> Dict[str, Any]:
        return {
            "version": "default-fallback",
            "lastUpdated": "2026-07-08",
            "riskBands": [
                {
                    "name": "PRIME_LOW_RISK",
                    "minScore": 750,
                    "maxScore": 1000,
                    "ocenEligibility": {"isEligible": True, "maxLoanAmountInr": 5000000.0, "recommendedInterestRatePa": 10.5},
                    "ntcThinFileRules": {"isEligible": True, "maxLoanAmountInr": 5000000.0, "recommendedInterestRatePa": 10.5}
                },
                {
                    "name": "STANDARD_MODERATE_RISK",
                    "minScore": 650,
                    "maxScore": 749,
                    "ocenEligibility": {"isEligible": True, "maxLoanAmountInr": 2500000.0, "recommendedInterestRatePa": 12.5},
                    "ntcThinFileRules": {"isEligible": True, "maxLoanAmountInr": 2500000.0, "recommendedInterestRatePa": 12.5}
                },
                {
                    "name": "SUBPRIME_HIGH_RISK",
                    "minScore": 550,
                    "maxScore": 649,
                    "ocenEligibility": {"isEligible": True, "maxLoanAmountInr": 1000000.0, "recommendedInterestRatePa": 15.0},
                    "ntcThinFileRules": {"isEligible": True, "maxLoanAmountInr": 1000000.0, "recommendedInterestRatePa": 15.0}
                },
                {
                    "name": "HIGH_RISK_REJECT",
                    "minScore": 0,
                    "maxScore": 549,
                    "ocenEligibility": {"isEligible": False, "maxLoanAmountInr": 0.0, "recommendedInterestRatePa": 0.0},
                    "ntcThinFileRules": {"isEligible": False, "maxLoanAmountInr": 0.0, "recommendedInterestRatePa": 0.0}
                }
            ]
        }

    def get_policy(self) -> Dict[str, Any]:
        """Returns the currently active risk policy dictionary."""
        return self._load_policy()

    def get_risk_tier(self, score: int, is_ntc: bool) -> Tuple[str, bool, float, float]:
        """
        Evaluates the MSME financial health score against the external rules layer.
        Returns: (risk_band_name, is_eligible, max_loan_amount_inr, recommended_interest_rate_pa)
        """
        policy = self._load_policy()
        bands = policy.get("riskBands", [])

        for band in bands:
            min_score = band.get("minScore", 0)
            max_score = band.get("maxScore", 1000)
            if min_score <= score <= max_score:
                name = band.get("name", "UNKNOWN_RISK")
                if is_ntc and "ntcThinFileRules" in band:
                    rules = band["ntcThinFileRules"]
                else:
                    rules = band.get("ocenEligibility", {})
                
                is_eligible = bool(rules.get("isEligible", False))
                max_loan = float(rules.get("maxLoanAmountInr", 0.0))
                int_rate = float(rules.get("recommendedInterestRatePa", 0.0))
                return name, is_eligible, max_loan, int_rate

        # Fallback if score is outside defined bands
        return "HIGH_RISK_REJECT", False, 0.0, 0.0

policy_engine = RiskPolicyEngine()
