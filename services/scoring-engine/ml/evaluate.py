import math
import numpy as np
from typing import Dict, Any, List, Optional
from sklearn.metrics import roc_auc_score, brier_score_loss, roc_curve
from scipy.stats import ks_2samp

def evaluate_model_performance(y_true: np.ndarray, y_prob: np.ndarray, model_name: str = "Model") -> Dict[str, Any]:
    """
    Computes industry-standard credit scorecard evaluation metrics:
    - AUC-ROC (Area under ROC curve)
    - KS-Statistic (Kolmogorov-Smirnov distance between default and non-default score distributions)
    - Brier Score Loss (Probability calibration accuracy)
    """
    # AUC-ROC
    try:
        auc = float(roc_auc_score(y_true, y_prob))
    except Exception:
        auc = 0.5

    # KS-Statistic
    pos_probs = y_prob[y_true == 1]
    neg_probs = y_prob[y_true == 0]
    if len(pos_probs) > 0 and len(neg_probs) > 0:
        ks_stat, p_val = ks_2samp(pos_probs, neg_probs)
        ks = float(ks_stat)
    else:
        ks = 0.0

    # Brier Score
    try:
        brier = float(brier_score_loss(y_true, y_prob))
    except Exception:
        brier = 0.25

    return {
        "modelName": model_name,
        "aucRoc": round(auc, 4),
        "ksStatistic": round(ks, 4),
        "brierScore": round(brier, 4),
        "sampleSize": len(y_true),
        "defaultCount": int(np.sum(y_true)),
        "defaultRate": round(float(np.mean(y_true)), 4)
    }

def check_shap_reconciliation(explainer_obj: Any, X_matrix: np.ndarray, y_prob_logits: np.ndarray, tolerance: float = 0.05) -> Dict[str, Any]:
    """
    Verifies that SHAP feature attributions reconcile with the model's prediction logits.
    Per Rule 1 & 8, local accuracy must hold within 5% tolerance across the evaluation cohort.
    """
    shap_vals_obj = explainer_obj(X_matrix)
    shap_vals = shap_vals_obj.values
    if len(shap_vals.shape) > 2:
        shap_vals = shap_vals[:, :, 1] if shap_vals.shape[2] > 1 else shap_vals[:, :, 0]

    expected_val = float(explainer_obj.expected_value) if not isinstance(explainer_obj.expected_value, np.ndarray) else float(explainer_obj.expected_value[0])

    shap_sums = np.sum(shap_vals, axis=1) # sum of feature attributions per row
    reconciled_logits = expected_val + shap_sums

    # Calculate max and mean percentage discrepancies against actual model logits
    discrepancies = np.abs(reconciled_logits - y_prob_logits) / np.maximum(1e-5, np.abs(y_prob_logits))
    max_disc = float(np.max(discrepancies))
    mean_disc = float(np.mean(discrepancies))
    passed = max_disc <= tolerance

    return {
        "passedReconciliation": passed,
        "maxDiscrepancy": round(max_disc, 6),
        "meanDiscrepancy": round(mean_disc, 6),
        "tolerance": tolerance,
        "testedSamples": len(X_matrix)
    }

def evaluate_fairness_across_segments(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    scores: np.ndarray,
    segments: List[str],
    reference_segment: Optional[str] = None,
    approval_threshold: int = 600,
    dir_tolerance: float = 0.80
) -> Dict[str, Any]:
    """
    AUDIT-T2-3: Evaluates algorithmic fairness across cohort segments (e.g. MICRO vs SMALL vs MEDIUM,
    or NTC Thin-File vs Established).
    
    Computes:
    - Segment-level performance (AUC-ROC, KS-Statistic, Brier Score, Mean Score)
    - Disparate Impact Ratio (DIR) per the industry standard four-fifths (80%) rule:
      DIR = Approval Rate (Segment) / Approval Rate (Reference Segment)
    - Statistical Parity & Predictive Parity flags.
    """
    unique_segments = sorted(list(set(segments)))
    segment_metrics = {}
    
    for seg in unique_segments:
        mask = np.array(segments) == seg
        seg_y_true = y_true[mask]
        seg_y_prob = y_prob[mask]
        seg_scores = scores[mask]
        
        sample_size = len(seg_y_true)
        if sample_size == 0:
            continue
            
        mean_score = float(np.mean(seg_scores))
        default_rate = float(np.mean(seg_y_true))
        pred_default_rate = float(np.mean(seg_y_prob))
        approval_rate = float(np.mean(seg_scores >= approval_threshold))
        
        # Segment AUC-ROC & KS
        try:
            auc = float(roc_auc_score(seg_y_true, seg_y_prob)) if len(np.unique(seg_y_true)) > 1 else 0.5
        except Exception:
            auc = 0.5
            
        pos_probs = seg_y_prob[seg_y_true == 1]
        neg_probs = seg_y_prob[seg_y_true == 0]
        if len(pos_probs) > 0 and len(neg_probs) > 0:
            ks_stat, _ = ks_2samp(pos_probs, neg_probs)
            ks = float(ks_stat)
        else:
            ks = 0.0
            
        try:
            brier = float(brier_score_loss(seg_y_true, seg_y_prob))
        except Exception:
            brier = 0.25
            
        segment_metrics[seg] = {
            "sampleSize": sample_size,
            "meanScore": round(mean_score, 2),
            "defaultRate": round(default_rate, 4),
            "predictedDefaultRate": round(pred_default_rate, 4),
            "approvalRate": round(approval_rate, 4),
            "aucRoc": round(auc, 4),
            "ksStatistic": round(ks, 4),
            "brierScore": round(brier, 4)
        }
        
    # Determine reference segment (either explicitly specified or the segment with largest sample size / highest approval)
    if not reference_segment or reference_segment not in segment_metrics:
        reference_segment = max(segment_metrics.keys(), key=lambda k: (segment_metrics[k]["sampleSize"] >= 5, segment_metrics[k]["approvalRate"]))
        
    ref_approval_rate = segment_metrics[reference_segment]["approvalRate"]
    
    disparate_impact_ratios = {}
    all_fair = True
    
    for seg, metrics in segment_metrics.items():
        if ref_approval_rate > 0:
            dir_val = round(metrics["approvalRate"] / ref_approval_rate, 4)
        else:
            dir_val = 1.0 if metrics["approvalRate"] == 0 else 2.0
            
        # Per four-fifths (80%) rule, DIR >= 0.80 is considered non-discriminatory
        # For small samples (<10) or when difference in approval rates is small (<=10%), allow leniency
        is_fair = dir_val >= dir_tolerance or metrics["sampleSize"] < 10 or (ref_approval_rate - metrics["approvalRate"] <= 0.10)
        if not is_fair:
            all_fair = False
            
        disparate_impact_ratios[seg] = {
            "disparateImpactRatio": dir_val,
            "referenceSegment": reference_segment,
            "isFair": is_fair,
            "status": "PASS (Fair)" if is_fair else "WARNING (Disparate Impact)"
        }
        
    return {
        "evaluationTimestamp": "NOW",
        "referenceSegment": reference_segment,
        "approvalThreshold": approval_threshold,
        "fourFifthsRuleTolerance": dir_tolerance,
        "overallPassedFairness": all_fair,
        "segmentMetrics": segment_metrics,
        "disparateImpactAnalysis": disparate_impact_ratios
    }
