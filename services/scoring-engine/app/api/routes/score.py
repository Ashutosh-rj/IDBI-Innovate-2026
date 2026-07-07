import json
import redis
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from models.scorer import HealthScorer
from core.config import settings
import structlog

logger = structlog.get_logger()
router = APIRouter()

# Global scorer instance
scorer = HealthScorer()

try:
    redis_client = redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        password=settings.REDIS_PASSWORD,
        decode_responses=True,
        socket_timeout=2.0
    )
except Exception as e:
    logger.warning("Redis cache unavailable at startup. Falling back to in-memory execution.", error=str(e))
    redis_client = None

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
    Guarantees SLA P95 latency < 3 seconds via Redis sub-score caching.
    """
    msme_id = request.profile.get("msmeId")
    if not msme_id:
        raise HTTPException(status_code=400, detail="msmeId is required in profile payload.")
        
    cache_key = f"health_score:{msme_id}"
    
    # Check Redis cache unless forced recalculation
    if not request.forceRecalculate and redis_client:
        try:
            cached_res = redis_client.get(cache_key)
            if cached_res:
                logger.info("Serving score from Redis cache", msme_id=msme_id)
                res_dict = json.loads(cached_res)
                res_dict["cached"] = True
                return res_dict
        except Exception as e:
            logger.debug("Redis read failed", error=str(e))
            
    # Execute computation
    try:
        raw_payload = request.model_dump()
        score_result = scorer.compute_score(raw_payload)
        score_result["cached"] = False
        
        # Store in Redis asynchronously
        if redis_client:
            background_tasks.add_task(
                _cache_score_result,
                cache_key,
                score_result,
                settings.REDIS_CACHE_TTL_SECONDS
            )
            
        logger.info("Successfully computed health score", msme_id=msme_id, score=score_result["healthScore"], riskBand=score_result["riskBand"])
        return score_result
    except Exception as e:
        logger.error("Error computing health score", msme_id=msme_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Scoring engine failure: {str(e)}")

def _cache_score_result(key: str, data: Dict[str, Any], ttl: int):
    try:
        redis_client.setex(key, ttl, json.dumps(data))
    except Exception as e:
        logger.warning("Failed to cache score result in Redis", key=key, error=str(e))
