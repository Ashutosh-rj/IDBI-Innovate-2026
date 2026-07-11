import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "MSME Financial Health Score ML Engine"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment & Mode
    ENVIRONMENT: str = "development" # development, staging, production
    ADAPTER_MODE: str = "sandbox" # sandbox or production
    
    # Redis Cache Configuration
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", 6379))
    REDIS_PASSWORD: Optional[str] = os.getenv("REDIS_PASSWORD", None)
    REDIS_CACHE_TTL_SECONDS: int = 3600 # 1 hour sub-score cache
    
    # Kafka Configuration (KRaft Mode)
    KAFKA_BOOTSTRAP_SERVERS: str = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    KAFKA_TOPIC_RAW_ALT_DATA: str = "raw-alt-data-events"
    KAFKA_TOPIC_SCORE_COMPUTED: str = "score-computed-events"
    KAFKA_CONSUMER_GROUP_ID: str = "msme-scoring-engine-group"
    
    # ML Model Paths
    MODEL_ARTIFACT_PATH: str = os.getenv("MODEL_PATH", os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "ml", "artifacts", "model.pkl"
    ))
    MODEL_TYPE_DEFAULT: str = "xgboost" # xgboost or lightgbm
    RISK_POLICY_PATH: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "rules", "risk_policy.yaml"
    )
    
    # Scoring Thresholds & Slopes (Platt / Brier Scaling)
    SCORE_MIN: int = 300
    SCORE_MAX: int = 900
    PROBABILITY_CALIBRATION_SLOPE: float = -4.5
    PROBABILITY_CALIBRATION_INTERCEPT: float = 2.2
    
    # SLA & Timeout Settings
    SHAP_EXACT_TIMEOUT_MS: int = 2500
    MAX_REASON_CODES_DISPLAYED: int = 4
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
