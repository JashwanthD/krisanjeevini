"""
KRI-SANJEEVINI AI — FastAPI Backend Engine
Serves sowing prediction and market forecast endpoints.
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

from .models_inference import SowingPredictor, MarketForecaster

# ─── PYDANTIC SCHEMAS ──────────────────────────────────────────────────────────

class SowingRequest(BaseModel):
    N: float = Field(..., ge=0, le=200, description="Nitrogen content in kg/ha")
    P: float = Field(..., ge=0, le=200, description="Phosphorus content in kg/ha")
    K: float = Field(..., ge=0, le=300, description="Potassium content in kg/ha")
    temperature: float = Field(..., ge=-5, le=55, description="Temperature in °C")
    humidity: float = Field(..., ge=0, le=100, description="Humidity in %")
    rainfall: float = Field(..., ge=0, le=500, description="Rainfall in mm")
    ph: float = Field(..., ge=0, le=14, description="Soil pH level")


class MarketRequest(BaseModel):
    commodity: str = Field(..., description="Crop commodity name")
    region: str = Field(..., description="Region/district identifier")
    days: Optional[int] = Field(30, ge=7, le=90, description="Forecast window in days")


# ─── APPLICATION LIFECYCLE ──────────────────────────────────────────────────────

ml_models = {}

WEIGHTS_DIR = os.path.join(os.path.dirname(__file__), "weights")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML models at startup, clean up on shutdown."""
    sowing_model_path = os.path.join(WEIGHTS_DIR, "sowing_ensemble.pkl")
    market_model_path = os.path.join(WEIGHTS_DIR, "market_lstm.h5")

    ml_models["sowing"] = SowingPredictor(model_path=sowing_model_path)
    ml_models["market"] = MarketForecaster(model_path=market_model_path)

    print("=" * 60)
    print("  KRI-SANJEEVINI AI Backend Ready")
    print(f"  Sowing model: {'LOADED' if not ml_models['sowing'].use_mock else 'MOCK'}")
    print(f"  Market model: {'LOADED' if not ml_models['market'].use_mock else 'MOCK'}")
    print("=" * 60)

    yield

    ml_models.clear()
    print("ML models unloaded.")


# ─── FASTAPI APP ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="KRI-SANJEEVINI AI",
    description="Smart Farming Assistant API – Sowing Analytics & Market Forecasting",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── ENDPOINTS ──────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "name": "KRI-SANJEEVINI AI",
        "version": "1.0.0",
        "status": "running",
        "modules": {
            "sowing": "active",
            "market": "active",
        },
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/api/sowing/predict")
async def predict_sowing(request: SowingRequest):
    """
    Predict the optimal crop and sowing window based on soil and climate parameters.
    """
    try:
        predictor: SowingPredictor = ml_models["sowing"]
        result = predictor.predict({
            "N": request.N,
            "P": request.P,
            "K": request.K,
            "temperature": request.temperature,
            "humidity": request.humidity,
            "rainfall": request.rainfall,
            "ph": request.ph,
        })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sowing prediction failed: {str(e)}")


@app.post("/api/market/forecast")
async def forecast_market(request: MarketRequest):
    """
    Generate a 30-day market price forecast for a given commodity and region.
    """
    try:
        forecaster: MarketForecaster = ml_models["market"]
        result = forecaster.forecast(
            commodity=request.commodity,
            region=request.region,
            days=request.days or 30,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Market forecast failed: {str(e)}")
