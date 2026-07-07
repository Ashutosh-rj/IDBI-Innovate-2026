import os
import yaml
import numpy as np
from enum import Enum
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from faker import Faker

class Scenario(str, Enum):
    HEALTHY_ESTABLISHED = "HEALTHY_ESTABLISHED"
    STRESSED_LIQUIDITY = "STRESSED_LIQUIDITY"
    SEASONAL_BUSINESS = "SEASONAL_BUSINESS"
    NTC_THIN_FILE = "NTC_THIN_FILE"
    HIGH_GROWTH = "HIGH_GROWTH"

class MsmeCategory(str, Enum):
    MICRO = "MICRO"
    SMALL = "SMALL"
    MEDIUM = "MEDIUM"

def load_config() -> Dict[str, Any]:
    """Loads the statistical distribution parameters from distributions.yaml."""
    config_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "config",
        "distributions.yaml"
    )
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

class BaseGenerator(ABC):
    """
    Abstract Base Class for all Statistically-Grounded Synthetic Data Generators.
    Enforces seeding and public distribution parameter sampling.
    """
    def __init__(self, seed: Optional[int] = None):
        self.config = load_config()
        self.seed = seed
        if seed is not None:
            self.rng = np.random.default_rng(seed)
            self.faker = Faker("en_IN")
            Faker.seed(seed)
        else:
            self.rng = np.random.default_rng()
            self.faker = Faker("en_IN")

    def reseed(self, seed: int):
        """Reseeds the random number generators for reproducible per-profile generation."""
        self.seed = seed
        self.rng = np.random.default_rng(seed)
        Faker.seed(seed)

    @abstractmethod
    def generate(self, msme_id: str, category: str, scenario: str, **kwargs) -> Any:
        """Generates schema-compliant synthetic data for the given MSME profile."""
        pass
