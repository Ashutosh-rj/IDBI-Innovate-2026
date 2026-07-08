import os
import time
import yaml
import tempfile
import pytest
from core.policy_engine import RiskPolicyEngine

def test_risk_policy_evaluation():
    """
    AUDIT-T3-1: Verify external risk band policy layer evaluates scores correctly.
    """
    engine = RiskPolicyEngine()
    
    # Check Prime
    band, eligible, max_loan, int_rate = engine.get_risk_tier(800, is_ntc=False)
    assert band == "PRIME_LOW_RISK"
    assert eligible is True
    assert max_loan == 5000000.0
    assert int_rate == 10.5
    
    # Check Standard
    band, eligible, max_loan, int_rate = engine.get_risk_tier(700, is_ntc=False)
    assert band == "STANDARD_MODERATE_RISK"
    assert eligible is True
    assert max_loan == 2500000.0
    assert int_rate == 12.5
    
    # Check Subprime
    band, eligible, max_loan, int_rate = engine.get_risk_tier(600, is_ntc=False)
    assert band == "SUBPRIME_HIGH_RISK"
    assert eligible is True
    assert max_loan == 1000000.0
    assert int_rate == 15.0
    
    # Check Reject
    band, eligible, max_loan, int_rate = engine.get_risk_tier(400, is_ntc=False)
    assert band == "HIGH_RISK_REJECT"
    assert eligible is False
    assert max_loan == 0.0
    assert int_rate == 0.0

def test_risk_policy_hot_reload():
    """
    AUDIT-T3-1: Verify hot-reloading of risk policy rules without restarting or re-initializing engine.
    """
    with tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False, encoding="utf-8") as tmp:
        tmp_path = tmp.name
        initial_policy = {
            "version": "v1",
            "riskBands": [
                {
                    "name": "PRIME_LOW_RISK",
                    "minScore": 750,
                    "maxScore": 1000,
                    "ocenEligibility": {"isEligible": True, "maxLoanAmountInr": 5000000.0, "recommendedInterestRatePa": 10.5}
                }
            ]
        }
        yaml.dump(initial_policy, tmp)
    
    try:
        engine = RiskPolicyEngine(policy_path=tmp_path)
        band, eligible, max_loan, int_rate = engine.get_risk_tier(800, is_ntc=False)
        assert band == "PRIME_LOW_RISK"
        assert int_rate == 10.5
        
        # Modify file on disk with new interest rate (e.g. RBI rate drop to 9.25%) and new cutoff (700)
        time.sleep(0.1) # ensure mtime advances
        updated_policy = {
            "version": "v2",
            "riskBands": [
                {
                    "name": "PRIME_LOW_RISK",
                    "minScore": 700,
                    "maxScore": 1000,
                    "ocenEligibility": {"isEligible": True, "maxLoanAmountInr": 7500000.0, "recommendedInterestRatePa": 9.25}
                }
            ]
        }
        with open(tmp_path, "w", encoding="utf-8") as f:
            yaml.dump(updated_policy, f)
            
        # Call get_risk_tier without re-initializing engine
        band, eligible, max_loan, int_rate = engine.get_risk_tier(720, is_ntc=False)
        assert band == "PRIME_LOW_RISK"
        assert max_loan == 7500000.0
        assert int_rate == 9.25
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

def test_risk_policy_fallback():
    """
    AUDIT-T3-1: Verify graceful fallback when policy file is missing or invalid YAML.
    """
    engine = RiskPolicyEngine(policy_path="/non/existent/path/policy.yaml")
    band, eligible, max_loan, int_rate = engine.get_risk_tier(800, is_ntc=False)
    assert band == "PRIME_LOW_RISK"
    assert int_rate == 10.5
