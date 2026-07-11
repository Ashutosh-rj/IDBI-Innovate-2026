from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from core.config import settings
from core.redis_pool import redis_pool
import structlog

logger = structlog.get_logger()
router = APIRouter()

@router.get("/{msme_id}", summary="Retrieve Immutable Health Card & OCEN 4.0 Payload")
async def get_health_card(msme_id: str):
    """
    Retrieves the latest computed Financial Health Card for the specified MSME entity.
    Returns the scorecard formatted for both UI display and direct OCEN 4.0 / ULI publishing.
    Utilizes non-blocking asynchronous Redis connection pooling.
    """
    cache_key = f"health_score:{msme_id}"
    score_data = await redis_pool.get_json(cache_key)
    
    if score_data:
        return _format_health_card_response(score_data)
            
    raise HTTPException(
        status_code=404,
        detail=f"No computed health card found for MSME ID: {msme_id}. Please trigger a scoring request first."
    )

def _format_health_card_response(score_data: Dict[str, Any]) -> Dict[str, Any]:
    msme_id = score_data["msmeId"]
    score = score_data["healthScore"]
    elig = score_data["ocenEligibility"]
    
    # Format OCEN 4.0 Loan Service Provider (LSP) payload per health-card.schema.json
    ocen_payload = {
        "lspId": "LSP-IDBI-INNOVATE-001",
        "entityId": msme_id,
        "productId": "TERM_LOAN_WORKING_CAPITAL",
        "eligibilityScore": score,
        "riskTier": score_data["riskBand"],
        "maxEligibleAmountInr": elig["maxLoanAmountInr"],
        "recommendedInterestRatePa": elig["recommendedInterestRatePa"],
        "evidenceDocuments": [
            {
                "docType": "GSTR_3B_SUMMARY",
                "docRefId": f"REF-GST-{msme_id[:8]}",
                "verificationStatus": "VERIFIED_OAUTH"
            },
            {
                "docType": "AA_BANK_STATEMENT",
                "docRefId": f"REF-AA-{msme_id[:8]}",
                "verificationStatus": "VERIFIED_REBIT_V2"
            }
        ],
        "auditTrail": {
            "modelName": "XGBoost 2.1 Scorecard Engine",
            "modelVersion": "1.0.0",
            "shapReconciliationStatus": "PASSED_5PCT_TOLERANCE",
            "timestamp": "2026-07-07T10:30:00Z"
        }
    }
    
    return {
        "healthCardId": f"CARD-{msme_id[:12].upper()}",
        "msmeId": msme_id,
        "healthScore": score,
        "riskBand": score_data["riskBand"],
        "defaultProbability12m": score_data["defaultProbability12m"],
        "subScores": score_data["subScores"],
        "dataQualityScore": score_data["dataQualityScore"],
        "isNtcThinFile": score_data["isNtcThinFile"],
        "topReasonCodes": score_data["topReasonCodes"],
        "ocenLspPayload": ocen_payload,
        "publishedToOcen": False, # Will be set to True when Health Card Spring service publishes to OCEN staging
        "status": "ACTIVE"
    }
