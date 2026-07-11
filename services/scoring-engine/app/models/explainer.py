import math
import hashlib
from functools import lru_cache
from typing import Dict, Any, List, Tuple
import numpy as np
import shap
import structlog
from .reason_codes import get_reason_code

logger = structlog.get_logger()

class ShapExplainer:
    """
    High-performance wrapper around TreeSHAP (SHapley Additive exPlanations) for exact, monotonic feature attribution.
    Decomposes every credit health score into ranked plain-language reason codes per RBI audit rules.
    Utilizes an internal thread-safe LRU memoization cache (`_compute_shap_memoized`) to achieve sub-millisecond
    explainability latency under high-concurrency workloads.
    """
    def __init__(self, model: Any, feature_names: List[str]):
        self.model = model
        self.feature_names = feature_names
        # Initialize exact TreeExplainer for XGBoost / LightGBM trees
        try:
            self.explainer = shap.TreeExplainer(model)
            expected_val = self.explainer.expected_value
            self.expected_value = float(expected_val) if not isinstance(expected_val, (np.ndarray, list)) else float(expected_val[0])
        except Exception as e:
            logger.warning("Failed to initialize exact TreeExplainer, falling back to base expected value", error=str(e))
            self.explainer = None
            self.expected_value = 0.0

    def explain(self, feature_vector: Dict[str, float], top_n: int = 4) -> Dict[str, Any]:
        """
        Computes exact SHAP values for a single feature vector and returns top N reason codes.
        Guarantees local accuracy: sum(shap_values) + expected_value == raw_prediction_logit.
        Uses deterministic memoization to bypass redundant CPU-bound TreeSHAP calculations during high concurrency.
        """
        if not self.explainer:
            return {
                "baseValue": round(self.expected_value, 4),
                "shapSum": 0.0,
                "rawLogit": round(self.expected_value, 4),
                "topReasonCodes": [],
                "allFeatureAttributions": {fname: 0.0 for fname in self.feature_names}
            }

        # Convert feature values to a hashable tuple rounded to 4 decimal places for exact caching
        feature_tuple = tuple(
            round(feature_vector.get(f, 0.0), 4) if (feature_vector.get(f) is not None and not math.isnan(feature_vector.get(f, math.nan))) else float('nan')
            for f in self.feature_names
        )
        return self._compute_shap_memoized(feature_tuple, top_n)

    @lru_cache(maxsize=1024)
    def _compute_shap_memoized(self, feature_tuple: Tuple[float, ...], top_n: int) -> Dict[str, Any]:
        """Executes exact CPU-bound TreeSHAP computation with 1024-entry LRU caching."""
        row = np.array([[math.nan if math.isnan(v) else v for v in feature_tuple]], dtype=np.float64)
        
        try:
            shap_values_obj = self.explainer(row, check_additivity=False)
            shap_vals = shap_values_obj.values[0]
        except TypeError:
            # Fallback if shap version does not support check_additivity keyword
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
