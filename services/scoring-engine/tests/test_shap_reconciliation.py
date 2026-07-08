import pytest
import numpy as np
from models.scorer import HealthScorer
from models.explainer import ShapExplainer
from ml.evaluate import check_shap_reconciliation

def test_shap_local_accuracy_reconciliation():
    """
    Rule 1 & 8: Exact TreeSHAP attributions MUST reconcile with model prediction logits
    within a 5% tolerance threshold across random feature vectors.
    """
    scorer = HealthScorer()
    
    # If a trained model exists, test exact TreeSHAP reconciliation
    if scorer.model and scorer.explainer:
        np.random.seed(42)
        num_samples = 100
        num_features = len(scorer.feature_names)
        
        # Generate random feature matrix mimicking normalized feature space
        X_test = np.random.normal(0.0, 1.0, size=(num_samples, num_features))
        
        # Predict logits or probabilities
        if hasattr(scorer.model, "predict_proba"):
            probs = scorer.model.predict_proba(X_test)[:, 1]
            logits = np.log(np.maximum(1e-5, probs) / np.maximum(1e-5, 1.0 - probs))
        else:
            logits = scorer.model.predict(X_test)
            
        res = check_shap_reconciliation(scorer.explainer.explainer, X_test, logits, tolerance=0.05)
        assert res["passedReconciliation"] is True, f"SHAP reconciliation failed: max discrepancy = {res['maxDiscrepancy']}"
    else:
        # Fallback assertion when model is not yet trained: verify explainer module loads cleanly
        assert scorer.feature_names is not None
        assert len(scorer.feature_names) == 36

def test_shap_domain_subscore_reconciliation():
    """
    AUDIT-T2-1: Reconcile sub-scores with SHAP domain contribution sums.
    Verifies that domain contributions and reconciliation status are correctly returned for all 5 domains.
    """
    scorer = HealthScorer()
    payload = {
        "profile": {"msmeId": "TEST-SHAP-DOM-001", "udyamNumber": "UDYAM-MH-12-1234567", "businessName": "Domain SHAP Test", "category": "SMALL", "sector": "MANUFACTURING", "registrationDate": "2021-01-01", "linkedAccounts": [{"accountType": "BANK_CURRENT"}]},
        "gstFilings": [{"filingStatus": "ON_TIME", "supDetails": {"osupDet": {"txval": 400000.0}}, "itcElg": {"itcNet": {"iamt": 60000.0, "camt": 0.0, "samt": 0.0, "csamt": 0.0}}, "lateFeeAmount": 0.0} for _ in range(12)],
        "upiSummary": {"monthlySummaries": [{"creditCount": 200, "debitCount": 40, "totalCredits": 500000.0, "totalDebits": 300000.0, "below500Count": 180, "uniquePayerCount": 35, "peakDayVolume": 20, "lowDayVolume": 5} for _ in range(12)]},
        "aaStatement": {"account": {"summary": {"currentBalance": 120000.0, "currentODLimit": 400000.0, "drawingLimit": 300000.0}, "transactions": {"transaction": [{"type": "CREDIT", "amount": 20000.0, "narration": f"UPI/CR/{i}"} for i in range(12)]}}},
        "epfoRecord": {"coveredUnderAct": True, "aggregateStats": {"contributionRegularity": 1.0, "totalDefaultedMonths": 0, "memberGrowthRate": 0.05}, "monthlySummaries": [{"activeMembers": 20, "totalBasicWages": 400000.0}]},
        "scenario": "HEALTHY_ESTABLISHED"
    }
    
    result = scorer.compute_score(payload)
    recon = result["shapReconciliation"]
    
    assert "domainContributions" in recon
    assert "domainReconciliation" in recon
    
    expected_domains = ["taxCompliance", "cashFlowVelocity", "payrollStability", "businessVintage", "liquidityBuffer"]
    for dom in expected_domains:
        assert dom in recon["domainContributions"]
        assert dom in recon["domainReconciliation"]
        dom_recon = recon["domainReconciliation"][dom]
        assert "shapContributionSum" in dom_recon
        assert "heuristicSubScore" in dom_recon
        assert "shapDerivedSubScore" in dom_recon
        assert "reconciledSubScore" in dom_recon
        assert "isReconciled" in dom_recon
        assert dom_recon["isReconciled"] is True
        
    if scorer.model and scorer.explainer:
        total_dom_sum = sum(recon["domainContributions"].values())
        assert abs(total_dom_sum - recon["shapSum"]) < 1e-3

