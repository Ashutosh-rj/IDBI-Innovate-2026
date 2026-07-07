import time
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
import structlog
from core.config import settings
from api.routes import score, health_card, simulate

logger = structlog.get_logger()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-grade AI/ML Credit Scoring Engine with XGBoost, LightGBM, TreeSHAP, and OCEN 4.0 Loan Eligibility",
    docs_url="/docs",
    redoc_url="/redoc",
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

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting MSME ML Scoring Engine...", version=settings.VERSION, mode=settings.ADAPTER_MODE)

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down MSME ML Scoring Engine...")

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
