import time
import asyncio
import json
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
import structlog
from core.config import settings
from api.routes import score, health_card, simulate, monitoring

logger = structlog.get_logger()

from contextlib import asynccontextmanager
from core.redis_pool import redis_pool

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting MSME ML Scoring Engine...", version=settings.VERSION, mode=settings.ADAPTER_MODE)
    if settings.REDIS_PASSWORD in ["msme_redis_secret", "password", "admin", "secret"] or not settings.REDIS_PASSWORD:
        if settings.ENVIRONMENT.lower() == "production":
            logger.error("FATAL: Default or missing REDIS_PASSWORD detected in production environment!")
            raise RuntimeError("CRITICAL SECURITY ERROR: Default REDIS_PASSWORD forbidden in production environment per AUDIT-T0-3.")
        else:
            logger.warning("SECURITY WARNING: Using default or insecure REDIS_PASSWORD. Do not use in production!")
    
    await redis_pool.init_pool()
    consumer_task = asyncio.create_task(run_kafka_consumer_loop())
    
    yield
    
    logger.info("Shutting down MSME ML Scoring Engine...")
    consumer_task.cancel()
    await redis_pool.close_pool()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-grade AI/ML Credit Scoring Engine with XGBoost, LightGBM, TreeSHAP, and OCEN 4.0 Loan Eligibility",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware for React frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to gateway and frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter()
api_router.include_router(score.router, prefix="/score", tags=["Scoring Engine"])
api_router.include_router(health_card.router, prefix="/health-card", tags=["Health Card & OCEN"])
api_router.include_router(simulate.router, prefix="/simulate", tags=["What-If Simulation"])
api_router.include_router(monitoring.router, prefix="/monitoring", tags=["Drift & Calibration Monitoring"])

app.include_router(api_router, prefix=settings.API_V1_STR)

async def run_kafka_consumer_loop():
    """
    Background asynchronous loop consuming raw alternate data events from Kafka,
    computing scores, publishing to score-computed-events, and routing poisoned payloads
    to a Dead Letter Queue (.DLQ) per AUDIT-T0-3.
    """
    if not settings.KAFKA_BOOTSTRAP_SERVERS:
        logger.info("Kafka bootstrap servers not configured, skipping consumer loop.")
        return

    try:
        from confluent_kafka import Consumer, Producer
    except ImportError:
        logger.warning("confluent_kafka not installed, skipping Kafka consumer loop.")
        return

    conf = {
        'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
        'group.id': settings.KAFKA_CONSUMER_GROUP_ID,
        'auto.offset.reset': 'earliest',
        'enable.auto.commit': False
    }
    dlq_topic = f"{settings.KAFKA_TOPIC_RAW_ALT_DATA}.DLQ"

    consumer = None
    producer = None
    try:
        consumer = Consumer(conf)
        producer = Producer({'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS})
        consumer.subscribe([settings.KAFKA_TOPIC_RAW_ALT_DATA])
        logger.info("Subscribed to Kafka topic", topic=settings.KAFKA_TOPIC_RAW_ALT_DATA, dlq_topic=dlq_topic)
    except Exception as e:
        logger.warning("Failed to connect to Kafka at startup, consumer loop disabled", error=str(e))
        return

    while True:
        try:
            msg = await asyncio.get_event_loop().run_in_executor(None, consumer.poll, 1.0)
            if msg is None:
                await asyncio.sleep(0.1)
                continue
            if msg.error():
                logger.error("Kafka consumer error", error=str(msg.error()))
                continue

            payload_str = msg.value().decode('utf-8')
            retry_count = 0
            max_retries = 3
            success = False

            while retry_count < max_retries and not success:
                try:
                    payload = json.loads(payload_str)
                    from api.routes.score import scorer
                    result = scorer.compute_score(payload)
                    producer.produce(
                        settings.KAFKA_TOPIC_SCORE_COMPUTED,
                        key=msg.key(),
                        value=json.dumps(result).encode('utf-8')
                    )
                    producer.flush(timeout=1.0)
                    consumer.commit(msg, asynchronous=False)
                    success = True
                except Exception as ex:
                    retry_count += 1
                    logger.warning(f"Error processing Kafka event (attempt {retry_count}/{max_retries})", error=str(ex))
                    if retry_count < max_retries:
                        await asyncio.sleep(2.0 ** retry_count)

            if not success:
                logger.error("Message processing exhausted retries. Forwarding to Dead Letter Queue (.DLQ)", dlq_topic=dlq_topic)
                try:
                    producer.produce(
                        dlq_topic,
                        key=msg.key(),
                        value=msg.value()
                    )
                    producer.flush(timeout=1.0)
                    consumer.commit(msg, asynchronous=False)
                except Exception as dlq_err:
                    logger.error("Failed to forward message to DLQ", error=str(dlq_err))
        except asyncio.CancelledError:
            logger.info("Kafka consumer loop cancelled.")
            break
        except Exception as loop_err:
            logger.error("Unexpected error in Kafka consumer loop", error=str(loop_err))
            await asyncio.sleep(5.0)

    if consumer:
        consumer.close()

@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "UP",
        "service": "msme-scoring-engine",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "adapterMode": settings.ADAPTER_MODE
    }

START_TIME = time.time()

try:
    from prometheus_fastapi_instrumentator import Instrumentator
    HAS_PROMETHEUS = True
except ImportError:
    HAS_PROMETHEUS = False

if HAS_PROMETHEUS:
    Instrumentator().instrument(app).expose(app, endpoint="/metrics", tags=["Monitoring"])
else:
    @app.get("/metrics", response_class=PlainTextResponse, tags=["Monitoring"])
    async def get_metrics():
        uptime = time.time() - START_TIME
        return (
            "# HELP msme_scoring_engine_uptime_seconds Total uptime of the scoring engine in seconds\n"
            "# TYPE msme_scoring_engine_uptime_seconds gauge\n"
            f"msme_scoring_engine_uptime_seconds {uptime:.2f}\n"
            "# HELP msme_scoring_engine_health_status Status of the scoring engine (1=UP, 0=DOWN)\n"
            "# TYPE msme_scoring_engine_health_status gauge\n"
            "msme_scoring_engine_health_status 1.0\n"
        )
