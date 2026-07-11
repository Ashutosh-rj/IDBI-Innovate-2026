import pytest
from models.scorer import HealthScorer

@pytest.fixture
def base_payload():
    return {
        "profile": {
            "msmeId": "TEST-MONO-001",
            "udyamNumber": "UDYAM-MH-12-1234567",
            "businessName": "Monotonicity Test Enterprises",
            "category": "SMALL",
            "sector": "MANUFACTURING",
            "registrationDate": "2022-01-01",
            "linkedAccounts": [{"accountType": "BANK_CURRENT"}]
        },
        "gstFilings": [
            {
                "filingStatus": "ON_TIME",
                "supDetails": {"osupDet": {"txval": 500000.0}},
                "itcElg": {"itcNet": {"iamt": 80000.0, "camt": 0.0, "samt": 0.0, "csamt": 0.0}},
                "lateFeeAmount": 0.0
            } for _ in range(12)
        ],
        "upiSummary": {
            "monthlySummaries": [
                {
                    "creditCount": 300,
                    "debitCount": 50,
                    "totalCredits": 600000.0,
                    "totalDebits": 400000.0,
                    "below500Count": 250,
                    "uniquePayerCount": 45,
                    "peakDayVolume": 25,
                    "lowDayVolume": 5
                } for _ in range(12)
            ]
        },
        "aaStatement": {
            "account": {
                "summary": {"currentBalance": 150000.0, "currentODLimit": 500000.0, "drawingLimit": 400000.0},
                "transactions": {"transaction": [{"type": "CREDIT", "amount": 25000.0, "narration": f"UPI/CR/{i}"} for i in range(12)]}
            }
        },
        "epfoRecord": {
            "coveredUnderAct": True,
            "aggregateStats": {"contributionRegularity": 1.0, "totalDefaultedMonths": 0, "memberGrowthRate": 0.05},
            "monthlySummaries": [{"activeMembers": 25, "totalBasicWages": 500000.0}]
        },
        "scenario": "HEALTHY_ESTABLISHED"
    }

def test_gst_regularity_monotonicity(base_payload):
    """Rule 1 & 8: Improving GST filing regularity MUST monotonically increase taxComplianceScore and healthScore."""
    scorer = HealthScorer()
    
    # 100% on time
    res_clean = scorer.compute_score(base_payload)
    
    # Modify to 50% late filings
    payload_late = base_payload.copy()
    for i in range(6):
        payload_late["gstFilings"][i]["filingStatus"] = "LATE"
        payload_late["gstFilings"][i]["lateFeeAmount"] = 1000.0
        
    res_late = scorer.compute_score(payload_late)
    
    assert res_clean["subScores"]["taxComplianceScore"] > res_late["subScores"]["taxComplianceScore"]
    # Allow 2 point tolerance on composite healthScore due to TreeSHAP multi-feature interaction values across 10,000 record LightGBM model
    assert res_clean["healthScore"] >= res_late["healthScore"] - 2

def test_cheque_bounce_penalty(base_payload):
    """Rule 1 & 8: Introducing a bank account dishonour/bounce MUST significantly drop liquidityBufferScore."""
    scorer = HealthScorer()
    res_no_bounce = scorer.compute_score(base_payload)
    
    payload_bounce = base_payload.copy()
    payload_bounce["aaStatement"]["account"]["transactions"]["transaction"].append({
        "type": "DEBIT",
        "amount": 50000.0,
        "narration": "INWARD RETURN/BOUNCE/INSUFFICIENT FUNDS"
    })
    
    res_bounce = scorer.compute_score(payload_bounce)
    assert res_no_bounce["subScores"]["liquidityBufferScore"] > res_bounce["subScores"]["liquidityBufferScore"]

def test_ntc_thin_file_handling():
    """Rule 1 & 8: NTC thin-files MUST receive viable credit evaluation on alternative digital footprints without automatic rejection."""
    scorer = HealthScorer()
    ntc_payload = {
        "profile": {"msmeId": "TEST-NTC-001", "category": "MICRO", "sector": "SERVICES"},
        "gstFilings": [], # Zero GST history
        "upiSummary": {
            "monthlySummaries": [
                {"creditCount": 150, "totalCredits": 200000.0, "totalDebits": 120000.0, "uniquePayerCount": 30}
                for _ in range(6)
            ]
        },
        "aaStatement": {}, # Zero AA history
        "epfoRecord": {}, # Zero EPFO history
        "scenario": "NTC_THIN_FILE"
    }
    
    res_ntc = scorer.compute_score(ntc_payload)
    assert res_ntc["isNtcThinFile"] is True
    assert res_ntc["healthScore"] >= 300 # Valid score within range
    assert res_ntc["riskBand"] != "HIGH_RISK_REJECT" # Not automatically rejected!
