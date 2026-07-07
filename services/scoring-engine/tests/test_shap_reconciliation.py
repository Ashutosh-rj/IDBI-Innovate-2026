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
