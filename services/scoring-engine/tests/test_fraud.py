import pytest
from models.scorer import HealthScorer

def test_no_fraud_clean_msme():
    """
    AUDIT-T3-2: Verify a clean, valid MSME payload passes fraud checks without rejection.
    """
    scorer = HealthScorer()
    payload = {
        "profile": {
            "msmeId": "clean-123",
            "pan": "AABCU9603R",
            "gstin": "27AABCU9603R1ZM",
            "registrationDate": "2021-04-15",
            "category": "SMALL",
            "sector": "MANUFACTURING",
            "linkedAccounts": [{"accountType": "BANK_CURRENT"}]
        },
        "gstFilings": [{"retPeriod": "2025-01"}, {"retPeriod": "2025-02"}, {"retPeriod": "2025-03"}],
        "aaStatement": {"account": {"summary": {"status": "ACTIVE"}}}
    }
    res = scorer.compute_score(payload)
    assert res["fraudAnalysis"]["isFraudDetected"] is False
    assert res["fraudAnalysis"]["riskLevel"] == "LOW_NORMAL"
    assert res["riskBand"] != "HIGH_RISK_REJECT"

def test_fraud_pan_gstin_mismatch():
    """
    AUDIT-T3-2: Verify PAN-GSTIN mismatch triggers fraud flag and forces loan rejection.
    """
    scorer = HealthScorer()
    payload = {
        "profile": {
            "msmeId": "fraud-pan-123",
            "pan": "XYZPK1234A", # Mismatched PAN
            "gstin": "27AABCU9603R1ZM", # Embedded PAN is AABCU9603R
            "registrationDate": "2021-04-15"
        },
        "gstFilings": [{"retPeriod": "2025-01"}, {"retPeriod": "2025-02"}, {"retPeriod": "2025-03"}]
    }
    res = scorer.compute_score(payload)
    assert res["fraudAnalysis"]["isFraudDetected"] is True
    assert "PAN_GSTIN_MISMATCH" in res["fraudAnalysis"]["fraudFlags"]
    assert res["riskBand"] == "HIGH_RISK_REJECT"
    assert res["ocenEligibility"]["isEligible"] is False
    assert res["ocenEligibility"]["maxLoanAmountInr"] == 0.0
    assert any("FRAUD_FLAG_PAN_GSTIN_MISMATCH" in code for code in res["topReasonCodes"])

def test_fraud_vintage_mismatch():
    """
    AUDIT-T3-2: Verify vintage claim mismatch (e.g., 10-year claim with 0 filings) triggers fraud flag.
    """
    scorer = HealthScorer()
    payload = {
        "profile": {
            "msmeId": "fraud-vin-123",
            "pan": "AABCU9603R",
            "gstin": "27AABCU9603R1ZM",
            "registrationDate": "2015-01-01" # > 10 years vintage
        },
        "gstFilings": [] # 0 filings
    }
    res = scorer.compute_score(payload)
    assert res["fraudAnalysis"]["isFraudDetected"] is True
    assert "VINTAGE_MISMATCH_HIGH_CLAIM_LOW_ACTIVITY" in res["fraudAnalysis"]["fraudFlags"]
    assert res["riskBand"] == "HIGH_RISK_REJECT"
    assert res["ocenEligibility"]["isEligible"] is False

def test_fraud_bank_account_frozen():
    """
    AUDIT-T3-2: Verify Account Aggregator frozen bank account triggers fraud flag and rejection.
    """
    scorer = HealthScorer()
    payload = {
        "profile": {
            "msmeId": "fraud-bank-123",
            "pan": "AABCU9603R",
            "gstin": "27AABCU9603R1ZM",
            "registrationDate": "2022-01-01"
        },
        "aaStatement": {"account": {"summary": {"status": "FROZEN"}}}
    }
    res = scorer.compute_score(payload)
    assert res["fraudAnalysis"]["isFraudDetected"] is True
    assert "BANK_ACCOUNT_STATUS_FROZEN" in res["fraudAnalysis"]["fraudFlags"]
    assert res["riskBand"] == "HIGH_RISK_REJECT"
    assert res["ocenEligibility"]["isEligible"] is False
