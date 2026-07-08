import pytest
import asyncio
import numpy as np
from fastapi.testclient import TestClient
from app.main import app
from ml.monitoring import calculate_psi, calculate_csi, evaluate_drift, evaluate_production_calibration
from app.api.routes.monitoring import (
    trigger_drift_evaluation,
    trigger_calibration_evaluation,
    DriftEvaluationRequest,
    CalibrationEvaluationRequest
)

def test_psi_stable_distribution():
    """
    AUDIT-T2-4: Verify PSI computation on identical or stable distributions.
    Should yield PSI < 0.10 and report STABLE status.
    """
    np.random.seed(42)
    expected = np.random.normal(700, 50, size=500)
    actual = np.random.normal(702, 49, size=200)
    
    psi_val = calculate_psi(expected, actual)
    assert psi_val < 0.10, f"Expected stable PSI < 0.10, got {psi_val}"
    
    res = evaluate_drift(expected, actual, update_prometheus=False)
    assert res["driftStatus"] == "STABLE"
    assert res["driftStatusCode"] == 0

def test_psi_severe_drift():
    """
    AUDIT-T2-4: Verify PSI computation on severely shifted distributions.
    Should yield PSI >= 0.25 and trigger SEVERE_DRIFT_ALERT.
    """
    np.random.seed(42)
    expected = np.random.normal(750, 40, size=500)
    actual = np.random.normal(550, 60, size=200)
    
    psi_val = calculate_psi(expected, actual)
    assert psi_val >= 0.25, f"Expected severe drift PSI >= 0.25, got {psi_val}"
    
    res = evaluate_drift(expected, actual, update_prometheus=False)
    assert res["driftStatus"] == "SEVERE_DRIFT_ALERT"
    assert res["driftStatusCode"] == 2

def test_csi_feature_drift():
    """
    AUDIT-T2-4: Verify CSI feature-level drift calculation.
    """
    np.random.seed(42)
    # Feature 0: stable, Feature 1: drifted
    exp_features = np.column_stack([
        np.random.normal(100, 10, 300),
        np.random.normal(0.8, 0.1, 300)
    ])
    act_features = np.column_stack([
        np.random.normal(101, 10, 150), # stable
        np.random.normal(0.2, 0.1, 150) # severely drifted
    ])
    
    feature_names = ["gst_filing_regularity", "aa_od_limit_utilization"]
    csi_res = calculate_csi(exp_features, act_features, feature_names)
    
    assert "gst_filing_regularity" in csi_res
    assert "aa_od_limit_utilization" in csi_res
    assert csi_res["gst_filing_regularity"] < 0.10
    assert csi_res["aa_od_limit_utilization"] >= 0.25

def test_calibration_well_calibrated():
    """
    AUDIT-T2-5: Verify production calibration monitoring for accurate model predictions.
    """
    np.random.seed(42)
    # 1000 samples where actual default probability perfectly matches model prediction
    y_prob = np.random.uniform(0.05, 0.15, size=1000)
    y_true = np.random.binomial(1, y_prob)
    
    res = evaluate_production_calibration(y_true, y_prob, update_prometheus=False)
    assert res["brierScore"] <= 0.15
    assert 0.80 <= res["eaRatio"] <= 1.25
    assert res["isCalibrated"] is True
    assert res["status"] == "WELL_CALIBRATED"

def test_calibration_miscalibrated_under_predicting():
    """
    AUDIT-T2-5: Verify calibration monitoring flags severe risk under-prediction.
    """
    # Actual defaults = 30%, but predicted probability = 10%
    y_true = np.array([1.0]*30 + [0.0]*70)
    y_prob = np.array([0.10]*100)
    
    res = evaluate_production_calibration(y_true, y_prob, update_prometheus=False)
    assert res["eaRatio"] < 0.80
    assert res["isCalibrated"] is False
    assert res["status"] == "UNDER_PREDICTING_RISK"

def test_monitoring_api_endpoints_and_prometheus_metrics():
    """
    AUDIT-T2-4 & T2-5: Test FastAPI monitoring routes and verify Prometheus metrics scraping.
    """
    client = TestClient(app)
    
    # Test Drift Evaluation Endpoint
    drift_payload = {
        "expectedScores": [700.0, 710.0, 720.0, 730.0, 740.0, 750.0, 760.0, 770.0, 780.0, 790.0],
        "actualScores": [600.0, 610.0, 620.0, 630.0, 640.0, 650.0, 660.0, 670.0, 680.0, 690.0],
        "expectedFeatures": [[1.0, 0.2], [0.9, 0.3], [0.8, 0.4]],
        "actualFeatures": [[0.5, 0.8], [0.4, 0.9], [0.3, 0.95]],
        "featureNames": ["gst_filing_regularity", "aa_od_limit_utilization"],
        "updatePrometheus": True,
        "jobLabel": "scoring-engine"
    }
    
    resp_drift = client.post("/api/v1/monitoring/evaluate-drift", json=drift_payload)
    assert resp_drift.status_code == 200, resp_drift.text
    data_drift = resp_drift.json()
    assert "psi" in data_drift
    assert "csi" in data_drift
    assert "gst_filing_regularity" in data_drift["csi"]
    
    # Test Calibration Evaluation Endpoint
    calib_payload = {
        "yTrue": [1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0],
        "yProbPred": [0.8, 0.1, 0.9, 0.2, 0.15, 0.05, 0.85, 0.1, 0.12, 0.08],
        "updatePrometheus": True,
        "jobLabel": "scoring-engine"
    }
    
    resp_calib = client.post("/api/v1/monitoring/evaluate-calibration", json=calib_payload)
    assert resp_calib.status_code == 200, resp_calib.text
    data_calib = resp_calib.json()
    assert "brierScore" in data_calib
    assert "eaRatio" in data_calib
    assert "isCalibrated" in data_calib
    
    # Verify Prometheus /metrics endpoint exposes the gauges
    resp_metrics = client.get("/metrics")
    assert resp_metrics.status_code == 200, resp_metrics.text
    metrics_text = resp_metrics.text
    assert "model_feature_drift_psi" in metrics_text
    assert "model_feature_drift_csi" in metrics_text
    assert "model_calibration_brier_score" in metrics_text
    assert "model_calibration_ea_ratio" in metrics_text
