import os
import json
import pytest
import jsonschema
from models.scorer import HealthScorer

@pytest.fixture(scope="module")
def schemas():
    """Loads all v1 JSON contract schemas from contracts/v1 directory."""
    candidates = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../contracts/v1")),
        "/app/contracts/v1",
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../../contracts/v1"))
    ]
    base_dir = None
    for cand in candidates:
        if os.path.exists(cand) and os.path.isdir(cand):
            base_dir = cand
            break
    if not base_dir:
        raise FileNotFoundError(f"Could not locate contracts/v1 directory in candidates: {candidates}")
        
    loaded = {}
    for filename in os.listdir(base_dir):
        if filename.endswith(".schema.json"):
            with open(os.path.join(base_dir, filename), "r", encoding="utf-8") as f:
                loaded[filename] = json.load(f)
    return loaded

@pytest.fixture
def valid_ingestion_payload():
    return {
        "profile": {
            "msmeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "udyamNumber": "UDYAM-MH-12-0000001",
            "businessName": "Contract Test Enterprises Pvt Ltd",
            "category": "SMALL",
            "sector": "MANUFACTURING",
            "gstin": "27AABCU9603R1ZM",
            "pan": "AABCU9603R",
            "registrationDate": "2020-04-01",
            "linkedAccounts": [
                {
                    "accountType": "BANK_CURRENT",
                    "linkedAccRef": "ACC-REF-9988",
                    "fipId": "HDFC-BANK-FIP",
                    "maskedAccNumber": "XXXXXX1234"
                }
            ],
            "numberOfEmployees": 35,
            "epfoEstablishmentCode": "MHBAN0000123000"
        },
        "gstFilings": [
            {
                "filingId": f"f0000000-0000-0000-0000-0000000000{i:02d}",
                "msmeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "gstin": "27AABCU9603R1ZM",
                "retPeriod": f"{(i%12)+1:02d}2025",
                "filingPeriod": f"{(i%12)+1:02d}2025",
                "filingStatus": "ON_TIME",
                "dueDate": f"2025-{(i%12)+1:02d}-20",
                "supDetails": {"osupDet": {"txval": 850000.0}},
                "itcElg": {"itcNet": {"iamt": 120000.0, "camt": 0.0, "samt": 0.0, "csamt": 0.0}},
                "lateFeeAmount": 0.0
            } for i in range(12)
        ],
        "upiSummary": {
            "monthlySummaries": [
                {
                    "month": "2025-04",
                    "creditCount": 320,
                    "debitCount": 110,
                    "totalCredits": 850000.0,
                    "totalDebits": 620000.0,
                    "below500Count": 180,
                    "uniquePayerCount": 85,
                    "peakDayVolume": 45,
                    "lowDayVolume": 8
                } for _ in range(12)
            ]
        },
        "aaStatement": {
            "account": {
                "summary": {
                    "currentBalance": 180000.0,
                    "currentODLimit": 500000.0,
                    "drawingLimit": 450000.0
                },
                "transactions": {
                    "transaction": [
                        {"type": "CREDIT", "amount": 150000.0, "narration": "NEFT SETTLEMENT INFLOW"},
                        {"type": "DEBIT", "amount": 45000.0, "narration": "VENDOR PAYMENT OUTFLOW"}
                    ]
                }
            }
        },
        "epfoRecord": {
            "coveredUnderAct": True,
            "aggregateStats": {
                "contributionRegularity": 1.0,
                "totalDefaultedMonths": 0,
                "memberGrowthRate": 0.05
            },
            "monthlySummaries": [
                {"activeMembers": 35, "totalBasicWages": 700000.0}
            ]
        },
        "scenario": "HEALTHY_ESTABLISHED"
    }

def test_consumer_contract_ingestion_payloads(schemas, valid_ingestion_payload):
    """
    AUDIT-T3-5: Consumer-Driven Contract Test for Ingestion Service -> Scoring Engine boundary.
    Verifies that incoming alternate data payloads strictly satisfy v1 JSON schemas
    and can be ingested by the scoring feature extractors without errors or data loss.
    """
    # 1. Validate Profile against schema
    jsonschema.validate(instance=valid_ingestion_payload["profile"], schema=schemas["msme-profile.schema.json"])
    
    # 2. Validate GST Filings against schema
    for filing in valid_ingestion_payload["gstFilings"]:
        jsonschema.validate(instance=filing, schema=schemas["gst-filing.schema.json"])
        
    # 3. Validate UPI Summary against schema
    jsonschema.validate(instance=valid_ingestion_payload["upiSummary"], schema=schemas["upi-transactions.schema.json"])
    
    # 4. Validate AA Statement against schema
    jsonschema.validate(instance=valid_ingestion_payload["aaStatement"], schema=schemas["aa-fi-statement.schema.json"])
    
    # 5. Validate EPFO against schema
    jsonschema.validate(instance=valid_ingestion_payload["epfoRecord"], schema=schemas["epfo-contribution.schema.json"])
    
    # 6. Verify consumer ingestion (feature extraction)
    scorer = HealthScorer()
    feat_set = scorer.extract_all_features(valid_ingestion_payload)
    
    assert feat_set.msme_id == "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    assert feat_set.data_quality_score > 0.85
    assert len(feat_set.sub_scores) == 5
    assert all(0.0 <= val <= 100.0 for val in feat_set.sub_scores.values())

def test_consumer_contract_schema_violation_detection(schemas, valid_ingestion_payload):
    """
    AUDIT-T3-5: Verifies that schema violations (e.g. invalid GSTIN or missing required Udyam number)
    are caught by contract verification across the service boundary.
    """
    invalid_profile = valid_ingestion_payload["profile"].copy()
    del invalid_profile["udyamNumber"] # Remove required field
    
    with pytest.raises(jsonschema.exceptions.ValidationError):
        jsonschema.validate(instance=invalid_profile, schema=schemas["msme-profile.schema.json"])
        
    invalid_gstin_profile = valid_ingestion_payload["profile"].copy()
    invalid_gstin_profile["gstin"] = "INVALID_GSTIN_STRING"
    
    with pytest.raises(jsonschema.exceptions.ValidationError):
        jsonschema.validate(instance=invalid_gstin_profile, schema=schemas["msme-profile.schema.json"])

def test_provider_contract_score_result(schemas, valid_ingestion_payload):
    """
    AUDIT-T3-5: Provider Contract Test for Scoring Engine -> Health Card Service boundary.
    Verifies that the score computation output strictly satisfies score-result.schema.json
    and contains all fields expected by ScoreComputedConsumer.java in the Health Card service.
    """
    scorer = HealthScorer()
    result = scorer.compute_score(valid_ingestion_payload)
    
    # Validate against v1 contract schema
    jsonschema.validate(instance=result, schema=schemas["score-result.schema.json"])
    
    # Verify consumer-specific required fields for ScoreComputedConsumer.java
    assert "msmeId" in result
    assert "healthScore" in result
    assert "riskBand" in result
    assert "defaultProbability12m" in result
    assert "isNtcThinFile" in result
    assert "subScores" in result
    assert "dataQualityScore" in result
    assert "ocenEligibility" in result
    
    sub_scores = result["subScores"]
    expected_sub_keys = {"taxComplianceScore", "cashFlowVelocityScore", "payrollStabilityScore", "businessVintageScore", "liquidityBufferScore"}
    assert expected_sub_keys.issubset(set(sub_scores.keys()))

def test_provider_contract_fraud_rejection_payload(schemas, valid_ingestion_payload):
    """
    AUDIT-T3-5: Verifies that even when an MSME is rejected due to automated fraud flags,
    the output payload strictly satisfies the contract schema so downstream consumers don't crash.
    """
    fraud_payload = valid_ingestion_payload.copy()
    # Trigger GSTIN mismatch fraud flag (AUDIT-T3-2)
    fraud_payload["profile"]["gstin"] = "07AAAAA0000A1Z5" # Delhi GSTIN vs MH Udyam
    
    scorer = HealthScorer()
    result = scorer.compute_score(fraud_payload)
    
    # Validate against v1 contract schema
    jsonschema.validate(instance=result, schema=schemas["score-result.schema.json"])
    
    assert result["riskBand"] == "HIGH_RISK_REJECT"
    assert result["ocenEligibility"]["isEligible"] is False
    assert "fraudAnalysis" in result
    assert result["fraudAnalysis"]["isFraudDetected"] is True
