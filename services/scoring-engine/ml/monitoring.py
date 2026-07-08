import numpy as np
from typing import Dict, Any, List, Optional
from app.core.metrics import (
    PSI_GAUGE,
    CSI_GAUGE,
    DRIFT_STATUS_GAUGE,
    BRIER_GAUGE,
    EA_RATIO_GAUGE,
    CALIBRATION_STATUS_GAUGE
)

def calculate_psi(expected: np.ndarray, actual: np.ndarray, num_bins: int = 10) -> float:
    """
    AUDIT-T2-4: Calculates Population Stability Index (PSI) between baseline reference distribution (expected)
    and target monitoring distribution (actual).
    
    Formula:
        PSI = sum((Actual_i - Expected_i) * ln(Actual_i / Expected_i))
        
    Thresholds:
        - < 0.10: Stable / No significant shift
        - 0.10 to 0.25: Moderate shift / Warning
        - >= 0.25: Severe drift / Model retraining required
    """
    expected = np.array(expected, dtype=float)
    actual = np.array(actual, dtype=float)
    expected = expected[~np.isnan(expected)]
    actual = actual[~np.isnan(actual)]
    
    if len(expected) == 0 or len(actual) == 0:
        return 0.0
        
    # Check if distributions are trivial or identical
    if np.all(expected == expected[0]) and np.all(actual == actual[0]):
        return 0.0 if expected[0] == actual[0] else 1.0
        
    # Determine quantile bin edges from expected reference distribution
    quantiles = np.linspace(0, 100, num_bins + 1)
    bins = np.percentile(expected, quantiles)
    bins[0] = -np.inf
    bins[-1] = np.inf
    
    # Remove duplicate bin edges if distribution has point masses
    bins = np.unique(bins)
    if len(bins) < 2:
        return 0.0
        
    exp_counts, _ = np.histogram(expected, bins=bins)
    act_counts, _ = np.histogram(actual, bins=bins)
    
    # Use Laplace smoothing (1e-4) to prevent division by zero or log(0)
    exp_props = np.maximum(1e-4, exp_counts / len(expected))
    act_props = np.maximum(1e-4, act_counts / len(actual))
    
    # Re-normalize proportions to sum to 1.0
    exp_props /= np.sum(exp_props)
    act_props /= np.sum(act_props)
    
    psi_val = np.sum((act_props - exp_props) * np.log(act_props / exp_props))
    return round(float(psi_val), 4)

def calculate_csi(
    expected_matrix: np.ndarray,
    actual_matrix: np.ndarray,
    feature_names: List[str],
    num_bins: int = 10
) -> Dict[str, float]:
    """
    AUDIT-T2-4: Calculates Characteristic Stability Index (CSI) for every input feature.
    Identifies which specific variables are driving overall scorecard drift.
    """
    expected_matrix = np.array(expected_matrix, dtype=float)
    actual_matrix = np.array(actual_matrix, dtype=float)
    
    csi_results = {}
    for idx, fname in enumerate(feature_names):
        if idx < expected_matrix.shape[1] and idx < actual_matrix.shape[1]:
            csi_val = calculate_psi(expected_matrix[:, idx], actual_matrix[:, idx], num_bins=num_bins)
            csi_results[fname] = csi_val
    return csi_results

def evaluate_drift(
    expected_scores: np.ndarray,
    actual_scores: np.ndarray,
    expected_features: Optional[np.ndarray] = None,
    actual_features: Optional[np.ndarray] = None,
    feature_names: Optional[List[str]] = None,
    update_prometheus: bool = True,
    job_label: str = "scoring-engine"
) -> Dict[str, Any]:
    """
    AUDIT-T2-4: Full drift monitoring evaluation suite.
    Computes score PSI and feature CSI, determines drift alert status, and wires metrics to Prometheus.
    """
    psi_val = calculate_psi(expected_scores, actual_scores)
    
    # Determine drift status
    if psi_val < 0.10:
        status_code = 0
        status_text = "STABLE"
    elif psi_val < 0.25:
        status_code = 1
        status_text = "MODERATE_DRIFT_WARNING"
    else:
        status_code = 2
        status_text = "SEVERE_DRIFT_ALERT"
        
    csi_results = {}
    if expected_features is not None and actual_features is not None and feature_names is not None:
        csi_results = calculate_csi(expected_features, actual_features, feature_names)
        
    if update_prometheus:
        PSI_GAUGE.labels(job=job_label).set(psi_val)
        DRIFT_STATUS_GAUGE.labels(job=job_label).set(status_code)
        for fname, cval in csi_results.items():
            CSI_GAUGE.labels(job=job_label, feature=fname).set(cval)
            
    return {
        "psi": psi_val,
        "driftStatus": status_text,
        "driftStatusCode": status_code,
        "csi": csi_results,
        "sampleSizeExpected": len(expected_scores),
        "sampleSizeActual": len(actual_scores),
        "prometheusUpdated": update_prometheus
    }

def evaluate_production_calibration(
    y_true: np.ndarray,
    y_prob_pred: np.ndarray,
    update_prometheus: bool = True,
    job_label: str = "scoring-engine"
) -> Dict[str, Any]:
    """
    AUDIT-T2-5: Production calibration monitoring pipeline.
    Evaluates Brier score loss and Expected vs Actual (Observed) default rate ratio (E/A Ratio).
    Wires calibration health metrics to Prometheus/Grafana.
    """
    y_true = np.array(y_true, dtype=float)
    y_prob_pred = np.array(y_prob_pred, dtype=float)
    
    if len(y_true) == 0 or len(y_prob_pred) == 0:
        return {"brierScore": 0.0, "eaRatio": 1.0, "status": "NO_DATA"}
        
    # Brier Score Loss
    brier = float(np.mean((y_prob_pred - y_true) ** 2))
    
    # Expected vs Actual Default Rate
    expected_rate = float(np.mean(y_prob_pred))
    actual_rate = float(np.mean(y_true))
    
    ea_ratio = round(expected_rate / max(1e-4, actual_rate), 4)
    
    # Calibration status: well-calibrated if E/A ratio is between 0.80 and 1.25 and Brier <= 0.15
    is_calibrated = (0.80 <= ea_ratio <= 1.25) and (brier <= 0.15)
    status = "WELL_CALIBRATED" if is_calibrated else ("UNDER_PREDICTING_RISK" if ea_ratio < 0.80 else "OVER_PREDICTING_RISK")
    status_code = 0 if is_calibrated else 1
    
    if update_prometheus:
        BRIER_GAUGE.labels(job=job_label).set(round(brier, 4))
        EA_RATIO_GAUGE.labels(job=job_label).set(ea_ratio)
        CALIBRATION_STATUS_GAUGE.labels(job=job_label).set(status_code)
        
    return {
        "brierScore": round(brier, 4),
        "expectedDefaultRate": round(expected_rate, 4),
        "actualDefaultRate": round(actual_rate, 4),
        "eaRatio": ea_ratio,
        "isCalibrated": is_calibrated,
        "status": status,
        "statusCode": status_code,
        "sampleSize": len(y_true),
        "prometheusUpdated": update_prometheus
    }
