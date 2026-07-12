import json
import asyncio
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from models.scorer import HealthScorer
from core.config import settings
from core.policy_engine import policy_engine
import structlog

logger = structlog.get_logger()
router = APIRouter()
scorer = HealthScorer()

def _run_what_if_sync(base_payload: Dict[str, Any], overrides: Dict[str, float]) -> Dict[str, Any]:
    # Step 1: Compute baseline score
    base_feat_set = scorer.extract_all_features(base_payload)
    base_result = scorer.compute_score_from_features(
        base_feat_set.feature_values,
        base_feat_set.sub_scores,
        msme_id=base_feat_set.msme_id,
        is_ntc_thin_file=base_feat_set.is_ntc_thin_file,
        missing_count=len(base_feat_set.missing_features),
        data_quality_score=base_feat_set.data_quality_score
    )
    
    # Step 2: Apply overrides to feature vector
    modified_features = base_feat_set.feature_values.copy()
    for fname, val in overrides.items():
        if fname in modified_features:
            modified_features[fname] = float(val)
            
    # Step 3: Calculate simulated sub-scores and run model inference on modified feature vector
    sim_sub_scores = scorer.calculate_subscores_from_features(modified_features)
    sim_result = scorer.compute_score_from_features(
        modified_features,
        sim_sub_scores,
        msme_id=base_feat_set.msme_id,
        is_ntc_thin_file=base_feat_set.is_ntc_thin_file,
        missing_count=len(base_feat_set.missing_features),
        data_quality_score=base_feat_set.data_quality_score
    )
    
    return {
        "msmeId": base_result["msmeId"],
        "baseline": {
            "healthScore": base_result["healthScore"],
            "riskBand": base_result["riskBand"],
            "defaultProbability12m": base_result["defaultProbability12m"],
            "ocenEligibility": base_result["ocenEligibility"],
            "topReasonCodes": base_result["topReasonCodes"],
            "subScores": base_result["subScores"]
        },
        "simulated": {
            "healthScore": sim_result["healthScore"],
            "riskBand": sim_result["riskBand"],
            "defaultProbability12m": sim_result["defaultProbability12m"],
            "ocenEligibility": sim_result["ocenEligibility"],
            "topReasonCodes": sim_result["topReasonCodes"],
            "subScores": sim_result["subScores"]
        },
        "scoreDelta": sim_result["healthScore"] - base_result["healthScore"],
        "appliedOverrides": overrides,
        "simulationCoefficients": policy_engine.get_scoring_weights().get("simulationCoefficients", {})
    }

@router.post("/", summary="Run What-If Simulation by Dynamically Modifying Features")
async def simulate_what_if(payload: Dict[str, Any]):
    """
    Allows Bank Officers and Credit Analysts to run interactive What-If simulations.
    Accepts a base MSME payload and a dictionary of feature overrides (e.g. improving GST compliance
    or increasing UPI transaction velocity) and returns the before/after score comparison and SHAP shifts.
    
    Guarantees zero hardcoding per Rule 1: every simulation triggers a real model prediction.
    Runs non-blocking via `asyncio.to_thread` worker thread pool.
    """
    base_payload = payload.get("basePayload", {})
    overrides: Dict[str, float] = payload.get("featureOverrides", {})
    
    if not base_payload:
        raise HTTPException(status_code=400, detail="basePayload is required for simulation.")
        
    result = await asyncio.to_thread(_run_what_if_sync, base_payload, overrides)
    result["simulationTimestamp"] = json.dumps(payload.get("timestamp", "NOW"))
    return result
