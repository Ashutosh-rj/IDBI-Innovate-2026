import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from models.scorer import HealthScorer
from core.config import settings
from core.redis_pool import redis_pool
from core.policy_engine import policy_engine
import structlog

logger = structlog.get_logger()
router = APIRouter()

# Global thread-safe scorer instance
scorer = HealthScorer()

class ScoringRequest(BaseModel):
    profile: Dict[str, Any]
    gstFilings: List[Dict[str, Any]] = Field(default_factory=list)
    upiSummary: Dict[str, Any] = Field(default_factory=dict)
    aaStatement: Dict[str, Any] = Field(default_factory=dict)
    epfoRecord: Dict[str, Any] = Field(default_factory=dict)
    scenario: Optional[str] = "HEALTHY_ESTABLISHED"
    forceRecalculate: bool = False

@router.post("/", summary="Compute MSME Financial Health Score & SHAP Reason Codes")
async def compute_health_score(request: ScoringRequest, background_tasks: BackgroundTasks):
    """
    Ingests multi-dimensional alternate data streams (GST, UPI, Account Aggregator, EPFO)
    and computes the 300-900 Financial Health Score, Risk Band, and exact TreeSHAP reason codes.
    Guarantees SLA P95 latency < 3 seconds via non-blocking async Redis sub-score caching
    and worker thread execution (`asyncio.to_thread`) for CPU-bound TreeSHAP explainability.
    """
    msme_id = request.profile.get("msmeId")
    if not msme_id:
        raise HTTPException(status_code=400, detail="msmeId is required in profile payload.")
        
    cache_key = f"health_score:{msme_id}"
    subscore_key = f"health_score:{msme_id}:subscores"
    
    # Step 1: Check asynchronous Redis cache unless forced recalculation
    if not request.forceRecalculate:
        cached_res = await redis_pool.get_json(cache_key)
        if cached_res:
            logger.info("Serving score from non-blocking async Redis cache", msme_id=msme_id)
            cached_res["cached"] = True
            if "simulationCoefficients" not in cached_res:
                cached_res["simulationCoefficients"] = policy_engine.get_scoring_weights().get("simulationCoefficients", {})
            return cached_res
            
    # Step 2: Offload CPU-bound feature extraction, LightGBM inference & TreeSHAP to worker thread
    try:
        raw_payload = request.model_dump()
        score_result = await asyncio.to_thread(scorer.compute_score, raw_payload)
        score_result["cached"] = False
        score_result["simulationCoefficients"] = policy_engine.get_scoring_weights().get("simulationCoefficients", {})
        
        # Step 3: Cache result asynchronously via background task to prevent blocking the HTTP response
        background_tasks.add_task(
            _async_cache_results,
            cache_key,
            subscore_key,
            score_result,
            settings.REDIS_CACHE_TTL_SECONDS
        )
            
        logger.info("Successfully computed health score asynchronously", msme_id=msme_id, score=score_result["healthScore"], riskBand=score_result["riskBand"])
        return score_result
    except Exception as e:
        logger.error("Error computing health score", msme_id=msme_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Scoring engine failure: {str(e)}")

async def _async_cache_results(cache_key: str, subscore_key: str, data: Dict[str, Any], ttl: int):
    """Background task to store main score and granular sub-score structures in Redis asynchronously."""
    await redis_pool.set_json(cache_key, data, ttl_seconds=ttl)
    subscore_data = {
        "msmeId": data.get("msmeId"),
        "healthScore": data.get("healthScore"),
        "subScores": data.get("subScores"),
        "riskBand": data.get("riskBand")
    }
    await redis_pool.set_json(subscore_key, subscore_data, ttl_seconds=ttl)
