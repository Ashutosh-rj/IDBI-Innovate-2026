from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import numpy as np
from ml.monitoring import evaluate_drift, evaluate_production_calibration

router = APIRouter()

class DriftEvaluationRequest(BaseModel):
    expectedScores: List[float] = Field(..., description="Baseline/reference score distribution")
    actualScores: List[float] = Field(..., description="Target/monitoring score distribution")
    expectedFeatures: Optional[List[List[float]]] = Field(None, description="Baseline feature matrix (rows x cols)")
    actualFeatures: Optional[List[List[float]]] = Field(None, description="Target feature matrix (rows x cols)")
    featureNames: Optional[List[str]] = Field(None, description="Names of feature columns")
    updatePrometheus: bool = Field(True, description="Whether to update Prometheus monitoring gauges")
    jobLabel: str = Field("scoring-engine", description="Prometheus job label")

class CalibrationEvaluationRequest(BaseModel):
    yTrue: List[float] = Field(..., description="Observed ground-truth default labels (0 or 1)")
    yProbPred: List[float] = Field(..., description="Predicted default probabilities (0.0 to 1.0)")
    updatePrometheus: bool = Field(True, description="Whether to update Prometheus monitoring gauges")
    jobLabel: str = Field("scoring-engine", description="Prometheus job label")

@router.post("/evaluate-drift", summary="Calculate PSI and CSI drift metrics")
async def trigger_drift_evaluation(req: DriftEvaluationRequest) -> Dict[str, Any]:
    """
    AUDIT-T2-4: Computes Population Stability Index (PSI) and Characteristic Stability Index (CSI).
    Updates Prometheus gauges (model_feature_drift_psi, model_feature_drift_csi) for Grafana scraping.
    """
    if len(req.expectedScores) == 0 or len(req.actualScores) == 0:
        raise HTTPException(status_code=400, detail="Expected and actual score arrays must not be empty.")
        
    exp_scores = np.array(req.expectedScores)
    act_scores = np.array(req.actualScores)
    
    exp_feats = np.array(req.expectedFeatures) if req.expectedFeatures else None
    act_feats = np.array(req.actualFeatures) if req.actualFeatures else None
    
    result = evaluate_drift(
        expected_scores=exp_scores,
        actual_scores=act_scores,
        expected_features=exp_feats,
        actual_features=act_feats,
        feature_names=req.featureNames,
        update_prometheus=req.updatePrometheus,
        job_label=req.jobLabel
    )
    return result

@router.post("/evaluate-calibration", summary="Calculate production calibration metrics")
async def trigger_calibration_evaluation(req: CalibrationEvaluationRequest) -> Dict[str, Any]:
    """
    AUDIT-T2-5: Computes production calibration monitoring metrics (Brier score loss and E/A ratio).
    Updates Prometheus gauges (model_calibration_brier_score, model_calibration_ea_ratio) for Grafana scraping.
    """
    if len(req.yTrue) == 0 or len(req.yProbPred) == 0:
        raise HTTPException(status_code=400, detail="Ground-truth labels and predicted probabilities must not be empty.")
        
    if len(req.yTrue) != len(req.yProbPred):
        raise HTTPException(status_code=400, detail="yTrue and yProbPred must have the same length.")
        
    result = evaluate_production_calibration(
        y_true=np.array(req.yTrue),
        y_prob_pred=np.array(req.yProbPred),
        update_prometheus=req.updatePrometheus,
        job_label=req.jobLabel
    )
    return result
