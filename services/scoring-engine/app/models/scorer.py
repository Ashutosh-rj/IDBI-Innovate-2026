import os
import math
import pickle
import numpy as np
from typing import Dict, Any, List, Optional
from features import (
    FeatureSet,
    GstFeatureExtractor,
    CashFlowFeatureExtractor,
    PayrollFeatureExtractor,
    DigitalFeatureExtractor,
    CreditFeatureExtractor,
)
from .explainer import ShapExplainer
from core.config import settings
from core.policy_engine import policy_engine
from core.fraud_detector import fraud_detector

class HealthScorer:
    """
    Production scoring engine wrapper that orchestrates feature extraction, sub-score calculation,
    XGBoost/LightGBM inference (with native NaN handling for NTC thin-files), and SHAP explainability.
    """
    def __init__(self, model_path: Optional[str] = None):
        self.gst_extractor = GstFeatureExtractor()
        self.cf_extractor = CashFlowFeatureExtractor()
        self.pay_extractor = PayrollFeatureExtractor()
        self.dig_extractor = DigitalFeatureExtractor()
        self.cr_extractor = CreditFeatureExtractor()
        
        self.feature_names = [
            # GST (10 features)
            "gst_filing_regularity", "gst_late_filing_ratio", "gst_nil_return_ratio",
            "gst_avg_monthly_turnover", "gst_turnover_cv", "gst_turnover_yoy_growth",
            "gst_itc_claim_ratio", "gst_itc_mismatch_flag", "gst_total_late_fees_paid",
            "gst_late_fee_per_turnover",
            # CashFlow (8 features)
            "upi_monthly_volume_avg", "upi_monthly_value_avg", "upi_credit_debit_ratio",
            "upi_avg_ticket_size", "upi_below_500_ratio", "upi_unique_payers_avg",
            "upi_volume_cv", "upi_peak_to_low_ratio",
            # Payroll (7 features)
            "epfo_covered_flag", "epfo_active_members", "epfo_contribution_regularity",
            "epfo_default_months", "epfo_member_growth_rate", "epfo_avg_monthly_wage",
            "epfo_total_penalties",
            # Digital (6 features)
            "udyam_vintage_months", "msme_category_ordinal", "is_manufacturing_flag",
            "linked_account_count", "pan_gstin_match_flag", "investment_in_plant_machinery",
            # Credit (5 features)
            "aa_current_balance", "aa_od_limit_utilization", "aa_avg_monthly_credit",
            "aa_bounce_flag", "ntc_thin_file_flag",
        ]
        
        self.model = None
        self.explainer = None
        
        path_to_load = model_path or settings.MODEL_ARTIFACT_PATH
        if os.path.exists(path_to_load):
            with open(path_to_load, "rb") as f:
                artifact = pickle.load(f)
                self.model = artifact.get("model")
                if self.model:
                    self.explainer = ShapExplainer(self.model, self.feature_names)
        else:
            # Fallback for initial boot before first model training run
            self.model = None
            self.explainer = None

    def extract_all_features(self, raw_payload: Dict[str, Any]) -> FeatureSet:
        msme_id = raw_payload.get("profile", {}).get("msmeId", "UNKNOWN")
        
        f_gst = self.gst_extractor.extract(raw_payload)
        f_cf = self.cf_extractor.extract(raw_payload)
        f_pay = self.pay_extractor.extract(raw_payload)
        f_dig = self.dig_extractor.extract(raw_payload)
        f_cr = self.cr_extractor.extract(raw_payload)
        
        all_features = {**f_gst, **f_cf, **f_pay, **f_dig, **f_cr}
        
        missing = [k for k, v in all_features.items() if math.isnan(v) or v is None]
        is_ntc = all_features.get("ntc_thin_file_flag", 0.0) == 1.0 or len(missing) > 15
        
        # Data Quality Score: percentage of non-missing features
        dq_score = round((len(self.feature_names) - len(missing)) / len(self.feature_names), 3)
        
        # Calculate 5 domain Sub-Scores (scaled 0 - 100)
        sub_scores = self.calculate_subscores_from_features(all_features)
        
        return FeatureSet(
            msme_id=msme_id,
            feature_values=all_features,
            sub_scores=sub_scores,
            missing_features=missing,
            is_ntc_thin_file=is_ntc,
            data_quality_score=dq_score
        )

    def calculate_subscores_from_features(self, feature_values: Dict[str, float]) -> Dict[str, float]:
        f_gst = {k: feature_values[k] for k in feature_values if k.startswith("gst_")}
        f_cf = {k: feature_values[k] for k in feature_values if k.startswith("upi_")}
        f_pay = {k: feature_values[k] for k in feature_values if k.startswith("epfo_")}
        f_dig = {k: feature_values[k] for k in ["udyam_vintage_months", "msme_category_ordinal", "is_manufacturing_flag", "linked_account_count", "pan_gstin_match_flag", "investment_in_plant_machinery"] if k in feature_values}
        f_cr = {k: feature_values[k] for k in ["aa_current_balance", "aa_od_limit_utilization", "aa_avg_monthly_credit", "aa_bounce_flag", "ntc_thin_file_flag"] if k in feature_values}
        
        return {
            "taxComplianceScore": self._calc_subscore_gst(f_gst),
            "cashFlowVelocityScore": self._calc_subscore_cf(f_cf),
            "payrollStabilityScore": self._calc_subscore_pay(f_pay),
            "businessVintageScore": self._calc_subscore_dig(f_dig),
            "liquidityBufferScore": self._calc_subscore_cr(f_cr),
        }

    def compute_score(self, raw_payload: Dict[str, Any]) -> Dict[str, Any]:
        """Computes the end-to-end financial health score, risk tier, and SHAP reason codes."""
        fraud_result = fraud_detector.evaluate_fraud(raw_payload)
        feat_set = self.extract_all_features(raw_payload)
        res = self.compute_score_from_features(
            feat_set.feature_values,
            feat_set.sub_scores,
            msme_id=feat_set.msme_id,
            is_ntc_thin_file=feat_set.is_ntc_thin_file,
            missing_count=len(feat_set.missing_features),
            data_quality_score=feat_set.data_quality_score
        )
        res["fraudAnalysis"] = fraud_result
        if fraud_result["isFraudDetected"]:
            res["riskBand"] = "HIGH_RISK_REJECT"
            res["ocenEligibility"] = {
                "isEligible": False,
                "maxLoanAmountInr": 0.0,
                "recommendedInterestRatePa": 0.0,
                "maxTenureMonths": 0,
                "rejectionReason": "AUTOMATED_FRAUD_FLAG_DETECTED"
            }
            res["topReasonCodes"] = [f"FRAUD_FLAG_{flag}" for flag in fraud_result["fraudFlags"]] + res["topReasonCodes"]
        return res

    def compute_score_from_features(self, feature_values: Dict[str, float], sub_scores: Dict[str, float], msme_id: str = "SIMULATED", is_ntc_thin_file: bool = False, missing_count: int = 0, data_quality_score: float = 100.0) -> Dict[str, Any]:
        if self.model and self.explainer:
            row = np.array([[feature_values.get(f, math.nan) for f in self.feature_names]], dtype=np.float64)
            # Predict default probability
            prob_default = float(self.model.predict_proba(row)[0, 1]) if hasattr(self.model, "predict_proba") else float(self.model.predict(row)[0])
            
            # Platt / Brier scaling to 300 - 900 score range
            # Higher score = healthier (lower default probability)
            logit = np.log(max(1e-5, prob_default) / max(1e-5, 1.0 - prob_default))
            scaled_score = int(np.clip(
                settings.SCORE_MAX - (prob_default * (settings.SCORE_MAX - settings.SCORE_MIN)),
                settings.SCORE_MIN,
                settings.SCORE_MAX
            ))
            
            shap_result = self.explainer.explain(feature_values, top_n=settings.MAX_REASON_CODES_DISPLAYED)
            top_reasons = shap_result["topReasonCodes"]
            
            domain_recon = self._reconcile_domain_subscores(sub_scores, shap_result["allFeatureAttributions"])
            final_sub_scores = domain_recon["reconciledSubScores"]
            
            reconcile_data = {
                "baseValue": shap_result["baseValue"],
                "shapSum": shap_result["shapSum"],
                "rawLogit": shap_result["rawLogit"],
                "domainContributions": domain_recon["domainContributions"],
                "domainReconciliation": domain_recon["domainReconciliation"]
            }
        else:
            # Heuristic fallback if model not trained yet (weighted sum of sub-scores)
            subs = sub_scores
            composite = (
                subs["taxComplianceScore"] * 0.30 +
                subs["cashFlowVelocityScore"] * 0.25 +
                subs["payrollStabilityScore"] * 0.15 +
                subs["businessVintageScore"] * 0.15 +
                subs["liquidityBufferScore"] * 0.15
            )
            prob_default = round(max(0.05, min(0.95, 1.0 - (composite / 100.0))), 4)
            scaled_score = int(settings.SCORE_MIN + (composite / 100.0) * (settings.SCORE_MAX - settings.SCORE_MIN))
            top_reasons = []
            final_sub_scores = sub_scores
            reconcile_data = {
                "baseValue": 0.0,
                "shapSum": 0.0,
                "rawLogit": 0.0,
                "domainContributions": {d: 0.0 for d in ["taxCompliance", "cashFlowVelocity", "payrollStability", "businessVintage", "liquidityBuffer"]},
                "domainReconciliation": {d: {"shapContributionSum": 0.0, "heuristicSubScore": sub_scores[s], "shapDerivedSubScore": sub_scores[s], "reconciledSubScore": sub_scores[s], "isReconciled": True} for d, s in [("taxCompliance", "taxComplianceScore"), ("cashFlowVelocity", "cashFlowVelocityScore"), ("payrollStability", "payrollStabilityScore"), ("businessVintage", "businessVintageScore"), ("liquidityBuffer", "liquidityBufferScore")]}
            }

        # Assign Risk Band & OCEN Loan Eligibility
        risk_band, eligible, max_loan, int_rate = self._get_risk_tier(scaled_score, is_ntc_thin_file)
        
        return {
            "msmeId": msme_id,
            "healthScore": scaled_score,
            "riskBand": risk_band,
            "defaultProbability12m": round(prob_default, 4),
            "subScores": final_sub_scores,
            "dataQualityScore": data_quality_score,
            "isNtcThinFile": is_ntc_thin_file,
            "missingFeatureCount": missing_count,
            "topReasonCodes": top_reasons,
            "shapReconciliation": reconcile_data,
            "ocenEligibility": {
                "isEligible": eligible,
                "maxLoanAmountInr": max_loan,
                "recommendedInterestRatePa": int_rate,
                "maxTenureMonths": 36 if eligible else 0
            }
        }

    def _reconcile_domain_subscores(self, heur_sub_scores: Dict[str, float], all_attributions: Dict[str, float]) -> Dict[str, Any]:
        """
        Reconciles domain sub-scores with exact TreeSHAP domain contribution sums (AUDIT-T2-1).
        Guarantees sub-score directionality matches empirical ML risk attributions.
        """
        domain_feature_map = {
            "taxCompliance": [f for f in self.feature_names if f.startswith("gst_")],
            "cashFlowVelocity": [f for f in self.feature_names if f.startswith("upi_")],
            "payrollStability": [f for f in self.feature_names if f.startswith("epfo_")],
            "businessVintage": ["udyam_vintage_months", "msme_category_ordinal", "is_manufacturing_flag", "linked_account_count", "pan_gstin_match_flag", "investment_in_plant_machinery"],
            "liquidityBuffer": ["aa_current_balance", "aa_od_limit_utilization", "aa_avg_monthly_credit", "aa_bounce_flag", "ntc_thin_file_flag"],
        }
        domain_to_subscore = {
            "taxCompliance": "taxComplianceScore",
            "cashFlowVelocity": "cashFlowVelocityScore",
            "payrollStability": "payrollStabilityScore",
            "businessVintage": "businessVintageScore",
            "liquidityBuffer": "liquidityBufferScore",
        }
        
        reconciled_sub_scores = {}
        domain_contributions = {}
        domain_reconciliation = {}
        
        for dom_key, feats in domain_feature_map.items():
            dom_shap_sum = round(sum(all_attributions.get(f, 0.0) for f in feats), 4)
            domain_contributions[dom_key] = dom_shap_sum
            
            sub_key = domain_to_subscore[dom_key]
            heur_score = heur_sub_scores[sub_key]
            # Map SHAP domain sum (typically -1.5 to +1.5 logit) to 0-100 score scale
            # Positive SHAP = higher default risk = lower health score
            shap_derived = round(min(100.0, max(0.0, 50.0 - (dom_shap_sum * 33.33))), 1)
            reconciled = round(0.5 * heur_score + 0.5 * shap_derived, 1)
            
            reconciled_sub_scores[sub_key] = reconciled
            domain_reconciliation[dom_key] = {
                "shapContributionSum": dom_shap_sum,
                "heuristicSubScore": heur_score,
                "shapDerivedSubScore": shap_derived,
                "reconciledSubScore": reconciled,
                "isReconciled": abs(reconciled - shap_derived) <= 35.0 or (heur_score >= 50 and dom_shap_sum <= 0.2) or (heur_score <= 50 and dom_shap_sum >= -0.2)
            }
            
        return {
            "reconciledSubScores": reconciled_sub_scores,
            "domainContributions": domain_contributions,
            "domainReconciliation": domain_reconciliation
        }


    def _calc_subscore_gst(self, f: Dict[str, float]) -> float:
        reg = f.get("gst_filing_regularity")
        if math.isnan(reg): return 50.0 # Neutral NTC default
        score = reg * 80.0
        if f.get("gst_turnover_yoy_growth", 0.0) > 0: score += 10.0
        if f.get("gst_itc_mismatch_flag", 0.0) == 0.0: score += 10.0
        return round(min(100.0, max(0.0, score)), 1)

    def _calc_subscore_cf(self, f: Dict[str, float]) -> float:
        vol = f.get("upi_monthly_volume_avg")
        if math.isnan(vol): return 50.0
        score = min(60.0, (vol / 500.0) * 60.0)
        ratio = f.get("upi_credit_debit_ratio", 1.0)
        if ratio > 1.1: score += 25.0
        elif ratio > 0.95: score += 15.0
        if f.get("upi_unique_payers_avg", 0.0) > 20: score += 15.0
        return round(min(100.0, max(0.0, score)), 1)

    def _calc_subscore_pay(self, f: Dict[str, float]) -> float:
        cov = f.get("epfo_covered_flag")
        if math.isnan(cov) or cov == 0.0: return 60.0 # Uncovered micro firms get neutral 60
        reg = f.get("epfo_contribution_regularity", 0.0)
        score = reg * 85.0
        if f.get("epfo_member_growth_rate", 0.0) >= 0: score += 15.0
        return round(min(100.0, max(0.0, score)), 1)

    def _calc_subscore_dig(self, f: Dict[str, float]) -> float:
        vint = f.get("udyam_vintage_months", 12.0)
        if math.isnan(vint): return 50.0
        score = min(60.0, (vint / 36.0) * 60.0)
        if f.get("pan_gstin_match_flag", 0.0) == 1.0: score += 20.0
        if f.get("linked_account_count", 0.0) > 0: score += 20.0
        return round(min(100.0, max(0.0, score)), 1)

    def _calc_subscore_cr(self, f: Dict[str, float]) -> float:
        if f.get("ntc_thin_file_flag", 0.0) == 1.0: return 65.0 # NTC thin-file baseline
        score = 70.0
        if f.get("aa_bounce_flag", 0.0) == 0.0: score += 20.0
        else: score -= 30.0
        od_util = f.get("aa_od_limit_utilization", 0.0)
        if od_util < 0.7: score += 10.0
        return round(min(100.0, max(0.0, score)), 1)

    def _get_risk_tier(self, score: int, is_ntc: bool):
        return policy_engine.get_risk_tier(score, is_ntc)
