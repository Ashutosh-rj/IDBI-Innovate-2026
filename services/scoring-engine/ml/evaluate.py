import math
import numpy as np
from typing import Dict, Any, List
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
