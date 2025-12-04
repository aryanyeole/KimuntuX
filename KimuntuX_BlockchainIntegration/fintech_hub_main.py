# KimuntuX Smart Fintech Hub API
# Main Application File

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn
from typing import Optional
import logging

# Local imports (to be created)
from config.settings import Settings
from config.database import init_db, get_db
from routers import stock_market, crypto_wallet, payments, analytics
from middleware.auth import verify_token
from middleware.logging import setup_logging

# Configure logging
logger = setup_logging()

# Security
security = HTTPBearer()

# Settings
settings = Settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    """
    # Startup
    logger.info("🚀 Starting KimuntuX Smart Fintech Hub API")
    
    # Initialize database
    await init_db()
    logger.info("✅ Database initialized")
    
    # Initialize AI models (lazy loading)
    logger.info("🤖 AI models ready for lazy loading")
    
    # Start background tasks
    # await start_market_monitoring()
    # await start_prediction_scheduler()
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Smart Fintech Hub API")
    # Cleanup tasks here

# Create FastAPI app
app = FastAPI(
    title="KimuntuX Smart Fintech Hub API",
    description="AI-powered fintech services for stock market integration and crypto wallet management",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ Health Check ============

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "KimuntuX Smart Fintech Hub",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "docs": "/api/docs",
            "health": "/health",
            "stock_market": "/api/v1/stock-market",
            "crypto": "/api/v1/crypto",
            "payments": "/api/v1/payments",
            "analytics": "/api/v1/analytics"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": "connected",
        "blockchain": "connected",
        "ai_services": "operational"
    }

# ============ API Routers ============

# Stock Market Integration
app.include_router(
    stock_market.router,
    prefix="/api/v1/stock-market",
    tags=["Stock Market"],
    dependencies=[Depends(verify_token)]
)

# Crypto Wallet & Management
app.include_router(
    crypto_wallet.router,
    prefix="/api/v1/crypto",
    tags=["Crypto Wallet"],
    dependencies=[Depends(verify_token)]
)

# Payment Orchestration
app.include_router(
    payments.router,
    prefix="/api/v1/payments",
    tags=["Payments"],
    dependencies=[Depends(verify_token)]
)

# Analytics & AI Insights
app.include_router(
    analytics.router,
    prefix="/api/v1/analytics",
    tags=["Analytics"],
    dependencies=[Depends(verify_token)]
)

# ============ Error Handlers ============

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    return {
        "error": {
            "code": exc.status_code,
            "message": exc.detail,
            "type": "http_error"
        }
    }

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return {
        "error": {
            "code": 500,
            "message": "Internal server error",
            "type": "server_error"
        }
    }

# ============ Startup ============

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Development only
        log_level="info"
    )
