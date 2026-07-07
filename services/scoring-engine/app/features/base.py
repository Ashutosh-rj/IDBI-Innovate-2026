from abc import ABC, abstractmethod
from typing import Dict, Any, List
from pydantic import BaseModel, Field

class FeatureSet(BaseModel):
    """
    Standardized container for extracted ML features and sub-scores.
    Enforces clean typing and NaN/None handling for NTC thin-files.
    """
    msme_id: str
    feature_values: Dict[str, float] = Field(default_factory=dict)
    sub_scores: Dict[str, float] = Field(default_factory=dict)
    missing_features: List[str] = Field(default_factory=list)
    is_ntc_thin_file: bool = False
    data_quality_score: float = 1.0

class FeatureExtractor(ABC):
    """
    Abstract Base Class for all feature extraction modules.
    Each extractor transforms raw ingested payloads (GST, UPI, AA, EPFO)
    into numerical feature vectors suitable for XGBoost/LightGBM.
    """
    @abstractmethod
    def extract(self, raw_payload: Dict[str, Any]) -> Dict[str, float]:
        """
        Extracts a dictionary of feature names to float values.
        Missing data or inapplicable features should be mapped to float('nan').
        """
        pass
