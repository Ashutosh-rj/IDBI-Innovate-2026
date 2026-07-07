from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
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
