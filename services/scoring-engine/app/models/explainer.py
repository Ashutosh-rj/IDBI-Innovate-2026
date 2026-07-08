import math
import numpy as np
import shap
from typing import Dict, Any, List
from .reason_codes import get_reason_code

class ShapExplainer:
    """
    Wrapper around TreeSHAP (SHapley Additive exPlanations) for exact, monotonic feature attribution.
    Decomposes every credit health score into ranked plain-language reason codes per RBI audit rules.
    """
    def __init__(self, model: Any, feature_names: List[str]):
        self.model = model
        self.feature_names = feature_names
        # Initialize exact TreeExplainer for XGBoost / LightGBM trees
        self.explainer = shap.TreeExplainer(model)
        self.expected_value = float(self.explainer.expected_value) if not isinstance(self.explainer.expected_value, np.ndarray) else float(self.explainer.expected_value[0])

    def explain(self, feature_vector: Dict[str, float], top_n: int = 4) -> Dict[str, Any]:
        """
        Computes exact SHAP values for a single feature vector and returns top N reason codes.
        Guarantees local accuracy: sum(shap_values) + expected_value == raw_prediction_logit.
        """
        # Build ordered numpy array matching model training feature order
        row = np.array([[feature_vector.get(f, math.nan) for f in self.feature_names]], dtype=np.float64)
        
        shap_values_obj = self.explainer(row)
        shap_vals = shap_values_obj.values[0]
        
        # If binary classification returns 2D array, take positive class (index 1 or 0 depending on setup)
        if len(shap_vals.shape) > 1:
            shap_vals = shap_vals[:, 1] if shap_vals.shape[1] > 1 else shap_vals[:, 0]
            
        # Pair features with their SHAP contribution
        attributions = []
        all_attributions = {}
        for fname, sval in zip(self.feature_names, shap_vals):
            val = float(sval) if not math.isnan(sval) else 0.0
            all_attributions[fname] = round(val, 4)
            if abs(val) > 1e-6:
                attributions.append((fname, val))
                
        # Sort by absolute impact (highest magnitude first)
        attributions.sort(key=lambda x: abs(x[1]), reverse=True)
        
        # Generate plain-language reason codes for top N contributors
        top_reasons = []
        for fname, sval in attributions[:top_n]:
            top_reasons.append(get_reason_code(fname, sval))
            
        # Calculate reconciliation sum
        shap_sum = float(np.sum(shap_vals))
        raw_logit = self.expected_value + shap_sum
        
        return {
            "baseValue": round(self.expected_value, 4),
            "shapSum": round(shap_sum, 4),
            "rawLogit": round(raw_logit, 4),
            "topReasonCodes": top_reasons,
            "allFeatureAttributions": all_attributions
        }
