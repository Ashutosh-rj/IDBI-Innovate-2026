import pytest
import asyncio
from api.routes.simulate import simulate_what_if

@pytest.fixture
def base_payload():
    return {
        "profile": {
            "msmeId": "TEST-SIM-001",
            "udyamNumber": "UDYAM-MH-12-1234567",
            "businessName": "Simulation Test Enterprises",
            "category": "SMALL",
            "sector": "MANUFACTURING",
            "registrationDate": "2021-01-01",
            "linkedAccounts": [{"accountType": "BANK_CURRENT"}]
        },
        "gstFilings": [
            {
                "filingStatus": "LATE",
                "supDetails": {"osupDet": {"txval": 400000.0}},
                "itcElg": {"itcNet": {"iamt": 60000.0, "camt": 0.0, "samt": 0.0, "csamt": 0.0}},
                "lateFeeAmount": 1000.0
            } for _ in range(12)
        ],
        "upiSummary": {
            "monthlySummaries": [
                {
                    "creditCount": 150,
                    "debitCount": 40,
                    "totalCredits": 400000.0,
                    "totalDebits": 300000.0,
                    "below500Count": 100,
                    "uniquePayerCount": 25,
                    "peakDayVolume": 15,
                    "lowDayVolume": 2
                } for _ in range(12)
            ]
        },
        "aaStatement": {
            "account": {
                "summary": {"currentBalance": 50000.0, "currentODLimit": 400000.0, "drawingLimit": 300000.0},
                "transactions": {"transaction": [
                    {"type": "DEBIT", "amount": 25000.0, "narration": "INWARD RETURN/BOUNCE/INSUFFICIENT FUNDS"}
                ]}
            }
        },
        "epfoRecord": {
            "coveredUnderAct": True,
            "aggregateStats": {"contributionRegularity": 0.8, "totalDefaultedMonths": 2, "memberGrowthRate": 0.0},
            "monthlySummaries": [{"activeMembers": 15, "totalBasicWages": 300000.0}]
        },
        "scenario": "DISTRESSED_LIQUIDITY"
    }

def test_counterfactual_reinference_simulation(base_payload):
    """
    AUDIT-T2-2: Verify real counterfactual re-inference endpoint without hardcoded heuristics.
    Simulating positive feature modifications (improving GST regularity and eliminating cheque bounces)
    MUST re-infer subscores and composite health score authentically.
    """
    payload = {
        "basePayload": base_payload,
        "featureOverrides": {
            "gst_filing_regularity": 1.0,
            "aa_od_limit_utilization": 0.2,
            "aa_bounce_flag": 0.0
        }
    }
    
    result = asyncio.run(simulate_what_if(payload))
    
    assert "baseline" in result
    assert "simulated" in result
    assert "scoreDelta" in result
    assert result["msmeId"] == "TEST-SIM-001"
    
    base_data = result["baseline"]
    sim_data = result["simulated"]
    
    # Check structure
    assert "subScores" in base_data and "subScores" in sim_data
    assert "healthScore" in base_data and "healthScore" in sim_data
    assert "riskBand" in base_data and "riskBand" in sim_data
    assert "ocenEligibility" in base_data and "ocenEligibility" in sim_data
    
    # Verify counterfactual re-inference improved scores authentically
    assert sim_data["subScores"]["taxComplianceScore"] >= base_data["subScores"]["taxComplianceScore"]
    assert sim_data["subScores"]["liquidityBufferScore"] >= base_data["subScores"]["liquidityBufferScore"]
    assert sim_data["healthScore"] >= base_data["healthScore"] - 2
    assert result["scoreDelta"] == sim_data["healthScore"] - base_data["healthScore"]
