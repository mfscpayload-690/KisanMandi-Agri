import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from backend.app.database import engine, Base
from backend.app.routers import prices, mandis, trends, buyers, alerts, stats, sync
from backend.app.services.ingestion import start_background_file_watcher, IngestionManager

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("farmer_market_api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for database initialization and background workers."""
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized successfully.")
    
    # Run initial sync for any uningested AgMarkNet report files
    try:
        mgr = IngestionManager()
        mgr.sync_new_reports()
    except Exception as exc:
        logger.error(f"Error during startup sync: {exc}")

    # Launch background thread watcher for incoming AgMarkNet files
    start_background_file_watcher(interval_seconds=5)
    
    yield
    logger.info("Application shutdown completed.")

app = FastAPI(
    title="Farmer Market Price Discovery API",
    description="Real-time and historical agricultural market price discovery platform for farmers and APMC traders.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration for local frontend development and mobile network testing
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"  # Allow mobile devices connecting over local Wi-Fi IP
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Response time measurement middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    try:
        response = await call_next(request)
        process_time = round((time.time() - start_time) * 1000, 2)
        response.headers["X-Process-Time-Ms"] = str(process_time)
        if process_time > 500:
            logger.warning(f"Slow request: {request.method} {request.url.path} took {process_time}ms")
        return response
    except Exception as exc:
        process_time = round((time.time() - start_time) * 1000, 2)
        logger.error(f"Unhandled exception for {request.method} {request.url.path}: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An internal server error occurred.", "path": request.url.path}
        )

# Custom validation error handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation error on {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": exc.errors(),
            "message": "Invalid request parameters provided."
        }
    )

# Include API Routers
app.include_router(prices.router)
app.include_router(mandis.router)
app.include_router(trends.router)
app.include_router(buyers.router)
app.include_router(alerts.router)
app.include_router(stats.router)
app.include_router(sync.router)

@app.get("/", tags=["Health & Info"])
def root_info():
    return {
        "app": "Farmer Market Price Discovery API",
        "version": "1.0.0",
        "status": "online",
        "documentation": "/docs",
        "healthcheck": "/health"
    }

@app.get("/health", tags=["Health & Info"])
def healthcheck():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "database": "sqlite_connected"
    }
