from prometheus_client import Gauge, Counter

# Drift Monitoring Gauges (AUDIT-T2-4)
PSI_GAUGE = Gauge(
    "model_feature_drift_psi",
    "Population Stability Index (PSI) for credit score distribution drift",
    ["job"]
)
CSI_GAUGE = Gauge(
    "model_feature_drift_csi",
    "Characteristic Stability Index (CSI) per input feature",
    ["job", "feature"]
)
DRIFT_STATUS_GAUGE = Gauge(
    "model_drift_alert_status",
    "Drift alert status (0=Stable <0.10, 1=Moderate 0.10-0.25, 2=Severe >=0.25)",
    ["job"]
)

# Calibration Monitoring Gauges (AUDIT-T2-5)
BRIER_GAUGE = Gauge(
    "model_calibration_brier_score",
    "Brier score loss for model calibration accuracy in production",
    ["job"]
)
EA_RATIO_GAUGE = Gauge(
    "model_calibration_ea_ratio",
    "Expected to Actual (Observed) default rate ratio in production",
    ["job"]
)
CALIBRATION_STATUS_GAUGE = Gauge(
    "model_calibration_alert_status",
    "Calibration alert status (0=Well Calibrated, 1=Miscalibrated Warning)",
    ["job"]
)

# Operational Scoring Metrics
SCORING_REQUESTS = Counter(
    "scoring_requests_total",
    "Total number of credit scoring requests processed",
    ["job", "status", "risk_band"]
)
INFERENCE_LATENCY = Gauge(
    "scoring_inference_latency_seconds",
    "Inference time in seconds for credit scorecard scoring",
    ["job", "model_type"]
)
