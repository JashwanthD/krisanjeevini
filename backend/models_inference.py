"""
KRI-SANJEEVINI AI — ML Inference Pipeline
Provides mock/real inference for Sowing Analytics (Module A) and Market Forecasting (Module C).
"""

import os
import math
import random
import numpy as np
from typing import Dict, List, Tuple, Optional

# ─── MODULE A: SOWING PREDICTOR ────────────────────────────────────────────────

# ICAR-based crop knowledge base: maps crop to optimal parameter ranges
# Format: { crop_name: { param: (min, max), ... }, sowing_window: "description" }
CROP_KNOWLEDGE_BASE = {
    "rice": {
        "N": (60, 120), "P": (35, 65), "K": (35, 55),
        "temperature": (20, 35), "humidity": (70, 95), "rainfall": (150, 300), "ph": (5.0, 7.0),
        "sowing_window": "June Week 1 – July Week 2",
        "sowing_weeks": [("June", 1), ("June", 2), ("June", 3), ("June", 4), ("July", 1), ("July", 2)],
    },
    "wheat": {
        "N": (80, 130), "P": (40, 70), "K": (30, 50),
        "temperature": (10, 25), "humidity": (50, 75), "rainfall": (50, 120), "ph": (6.0, 7.5),
        "sowing_window": "October Week 3 – November Week 4",
        "sowing_weeks": [("October", 3), ("October", 4), ("November", 1), ("November", 2), ("November", 3), ("November", 4)],
    },
    "maize": {
        "N": (60, 110), "P": (30, 55), "K": (25, 50),
        "temperature": (18, 32), "humidity": (55, 85), "rainfall": (60, 150), "ph": (5.5, 7.5),
        "sowing_window": "June Week 2 – July Week 3",
        "sowing_weeks": [("June", 2), ("June", 3), ("June", 4), ("July", 1), ("July", 2), ("July", 3)],
    },
    "cotton": {
        "N": (100, 140), "P": (40, 70), "K": (15, 35),
        "temperature": (22, 36), "humidity": (60, 80), "rainfall": (50, 120), "ph": (6.0, 8.0),
        "sowing_window": "April Week 2 – May Week 4",
        "sowing_weeks": [("April", 2), ("April", 3), ("April", 4), ("May", 1), ("May", 2), ("May", 3), ("May", 4)],
    },
    "sugarcane": {
        "N": (80, 130), "P": (20, 55), "K": (20, 45),
        "temperature": (25, 38), "humidity": (70, 92), "rainfall": (100, 250), "ph": (5.5, 8.0),
        "sowing_window": "January Week 2 – March Week 2",
        "sowing_weeks": [("January", 2), ("January", 3), ("January", 4), ("February", 1), ("February", 2), ("February", 3), ("February", 4), ("March", 1), ("March", 2)],
    },
    "jute": {
        "N": (60, 100), "P": (35, 60), "K": (35, 55),
        "temperature": (24, 37), "humidity": (70, 90), "rainfall": (150, 250), "ph": (5.5, 7.0),
        "sowing_window": "March Week 3 – May Week 2",
        "sowing_weeks": [("March", 3), ("March", 4), ("April", 1), ("April", 2), ("April", 3), ("April", 4), ("May", 1), ("May", 2)],
    },
    "coffee": {
        "N": (90, 130), "P": (15, 40), "K": (25, 45),
        "temperature": (15, 28), "humidity": (55, 80), "rainfall": (120, 200), "ph": (5.0, 6.5),
        "sowing_window": "May Week 3 – June Week 4",
        "sowing_weeks": [("May", 3), ("May", 4), ("June", 1), ("June", 2), ("June", 3), ("June", 4)],
    },
    "chickpea": {
        "N": (20, 60), "P": (50, 80), "K": (15, 40),
        "temperature": (15, 28), "humidity": (14, 65), "rainfall": (40, 100), "ph": (6.0, 8.0),
        "sowing_window": "October Week 1 – November Week 2",
        "sowing_weeks": [("October", 1), ("October", 2), ("October", 3), ("October", 4), ("November", 1), ("November", 2)],
    },
    "lentil": {
        "N": (10, 50), "P": (55, 85), "K": (15, 35),
        "temperature": (15, 27), "humidity": (30, 65), "rainfall": (35, 90), "ph": (6.0, 8.0),
        "sowing_window": "October Week 2 – November Week 3",
        "sowing_weeks": [("October", 2), ("October", 3), ("October", 4), ("November", 1), ("November", 2), ("November", 3)],
    },
    "pigeonpeas": {
        "N": (10, 40), "P": (50, 80), "K": (15, 40),
        "temperature": (20, 35), "humidity": (30, 70), "rainfall": (60, 150), "ph": (5.5, 7.5),
        "sowing_window": "June Week 1 – July Week 2",
        "sowing_weeks": [("June", 1), ("June", 2), ("June", 3), ("June", 4), ("July", 1), ("July", 2)],
    },
    "mungbean": {
        "N": (15, 45), "P": (40, 70), "K": (15, 35),
        "temperature": (25, 35), "humidity": (50, 80), "rainfall": (40, 100), "ph": (6.0, 7.5),
        "sowing_window": "March Week 1 – April Week 2",
        "sowing_weeks": [("March", 1), ("March", 2), ("March", 3), ("March", 4), ("April", 1), ("April", 2)],
    },
    "blackgram": {
        "N": (20, 50), "P": (55, 80), "K": (15, 35),
        "temperature": (25, 35), "humidity": (55, 80), "rainfall": (50, 110), "ph": (6.0, 7.5),
        "sowing_window": "June Week 3 – July Week 4",
        "sowing_weeks": [("June", 3), ("June", 4), ("July", 1), ("July", 2), ("July", 3), ("July", 4)],
    },
    "banana": {
        "N": (80, 130), "P": (60, 90), "K": (40, 60),
        "temperature": (25, 35), "humidity": (75, 95), "rainfall": (100, 200), "ph": (5.5, 7.0),
        "sowing_window": "June Week 1 – August Week 2",
        "sowing_weeks": [("June", 1), ("June", 2), ("June", 3), ("June", 4), ("July", 1), ("July", 2), ("July", 3), ("July", 4), ("August", 1), ("August", 2)],
    },
    "coconut": {
        "N": (10, 40), "P": (5, 25), "K": (25, 50),
        "temperature": (25, 35), "humidity": (80, 95), "rainfall": (150, 300), "ph": (5.0, 7.0),
        "sowing_window": "June Week 1 – September Week 2",
        "sowing_weeks": [("June", 1), ("June", 2), ("June", 3), ("June", 4), ("July", 1), ("July", 2), ("July", 3), ("July", 4), ("August", 1), ("August", 2), ("August", 3), ("August", 4), ("September", 1), ("September", 2)],
    },
    "pomegranate": {
        "N": (10, 35), "P": (5, 25), "K": (30, 55),
        "temperature": (20, 35), "humidity": (50, 75), "rainfall": (40, 100), "ph": (6.5, 8.0),
        "sowing_window": "July Week 1 – August Week 4",
        "sowing_weeks": [("July", 1), ("July", 2), ("July", 3), ("July", 4), ("August", 1), ("August", 2), ("August", 3), ("August", 4)],
    },
    "mango": {
        "N": (15, 40), "P": (15, 35), "K": (25, 50),
        "temperature": (24, 36), "humidity": (45, 75), "rainfall": (50, 130), "ph": (5.5, 7.5),
        "sowing_window": "July Week 1 – August Week 4",
        "sowing_weeks": [("July", 1), ("July", 2), ("July", 3), ("July", 4), ("August", 1), ("August", 2), ("August", 3), ("August", 4)],
    },
    "papaya": {
        "N": (40, 80), "P": (50, 75), "K": (40, 60),
        "temperature": (25, 38), "humidity": (80, 95), "rainfall": (120, 220), "ph": (6.0, 7.0),
        "sowing_window": "June Week 2 – September Week 2",
        "sowing_weeks": [("June", 2), ("June", 3), ("June", 4), ("July", 1), ("July", 2), ("July", 3), ("July", 4), ("August", 1), ("August", 2), ("August", 3), ("August", 4), ("September", 1), ("September", 2)],
    },
    "orange": {
        "N": (15, 35), "P": (15, 30), "K": (5, 20),
        "temperature": (15, 30), "humidity": (80, 95), "rainfall": (100, 200), "ph": (6.0, 7.5),
        "sowing_window": "July Week 1 – August Week 4",
        "sowing_weeks": [("July", 1), ("July", 2), ("July", 3), ("July", 4), ("August", 1), ("August", 2), ("August", 3), ("August", 4)],
    },
    "grapes": {
        "N": (15, 40), "P": (100, 145), "K": (190, 210),
        "temperature": (22, 35), "humidity": (75, 90), "rainfall": (30, 80), "ph": (5.5, 7.0),
        "sowing_window": "January Week 2 – March Week 2",
        "sowing_weeks": [("January", 2), ("January", 3), ("January", 4), ("February", 1), ("February", 2), ("February", 3), ("February", 4), ("March", 1), ("March", 2)],
    },
    "watermelon": {
        "N": (80, 110), "P": (10, 25), "K": (45, 60),
        "temperature": (24, 35), "humidity": (80, 95), "rainfall": (40, 70), "ph": (6.0, 7.0),
        "sowing_window": "February Week 1 – April Week 2",
        "sowing_weeks": [("February", 1), ("February", 2), ("February", 3), ("February", 4), ("March", 1), ("March", 2), ("March", 3), ("March", 4), ("April", 1), ("April", 2)],
    },
    "apple": {
        "N": (15, 35), "P": (120, 145), "K": (195, 210),
        "temperature": (10, 25), "humidity": (80, 95), "rainfall": (100, 170), "ph": (5.5, 6.5),
        "sowing_window": "December Week 1 – March Week 2",
        "sowing_weeks": [("December", 1), ("December", 2), ("December", 3), ("December", 4), ("January", 1), ("January", 2), ("January", 3), ("January", 4), ("February", 1), ("February", 2), ("February", 3), ("February", 4), ("March", 1), ("March", 2)],
    },
}


class SowingPredictor:
    """
    Predictive sowing analytics engine.
    Attempts to load a serialized VotingClassifier (RF + XGBoost) from disk.
    Falls back to a hardcoded ICAR decision table for mock inference.
    """

    def __init__(self, model_path: Optional[str] = None):
        self.model = None
        self.use_mock = True

        if model_path and os.path.exists(model_path):
            try:
                import joblib
                self.model = joblib.load(model_path)
                self.use_mock = False
                print(f"[SowingPredictor] Loaded model from {model_path}")
            except Exception as e:
                print(f"[SowingPredictor] Failed to load model: {e}. Using mock inference.")
        else:
            print("[SowingPredictor] No model file found. Using ICAR decision table mock inference.")

    def _score_crop(self, crop: str, params: Dict[str, float]) -> float:
        """
        Score how well the input parameters match a crop's optimal range.
        Returns a value between 0 and 1.
        """
        kb = CROP_KNOWLEDGE_BASE[crop]
        scores = []
        for param_name in ["N", "P", "K", "temperature", "humidity", "rainfall", "ph"]:
            val = params.get(param_name, 0)
            lo, hi = kb[param_name]
            mid = (lo + hi) / 2
            span = (hi - lo) / 2
            if span == 0:
                scores.append(1.0 if val == mid else 0.0)
                continue
            # Gaussian-like scoring centered on optimal range
            if lo <= val <= hi:
                scores.append(1.0)
            else:
                dist = min(abs(val - lo), abs(val - hi))
                scores.append(max(0, 1.0 - (dist / span) * 0.5))
        return sum(scores) / len(scores)

    def predict(self, params: Dict[str, float]) -> Dict:
        """
        Predict the optimal crop and sowing window for given soil/climate parameters.
        """
        if not self.use_mock and self.model is not None:
            try:
                features = np.array([[
                    params["N"], params["P"], params["K"],
                    params["temperature"], params["humidity"],
                    params["rainfall"], params["ph"]
                ]])
                prediction = self.model.predict(features)[0]
                # Map numeric predictions to crop names if needed
                crop_name = str(prediction).lower()
                if crop_name in CROP_KNOWLEDGE_BASE:
                    kb = CROP_KNOWLEDGE_BASE[crop_name]
                    return {
                        "crop": crop_name,
                        "confidence": 0.92,
                        "sowing_window": kb["sowing_window"],
                        "sowing_weeks": [{"month": m, "week": w} for m, w in kb["sowing_weeks"]],
                    }
            except Exception as e:
                print(f"[SowingPredictor] Model inference failed: {e}. Falling back to mock.")

        # Mock inference: score all crops and pick the best
        scores = {}
        for crop in CROP_KNOWLEDGE_BASE:
            scores[crop] = self._score_crop(crop, params)

        sorted_crops = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        best_crop, best_score = sorted_crops[0]
        kb = CROP_KNOWLEDGE_BASE[best_crop]

        return {
            "crop": best_crop,
            "confidence": round(min(best_score * 1.05, 0.98), 2),  # Realistic cap
            "sowing_window": kb["sowing_window"],
            "sowing_weeks": [{"month": m, "week": w} for m, w in kb["sowing_weeks"]],
        }


# ─── MODULE C: MARKET PRICE FORECASTER ─────────────────────────────────────────

# Base prices per quintal for Karnataka mandis (₹)
COMMODITY_BASE_PRICES = {
    "rice": 2200,
    "wheat": 2300,
    "maize": 1900,
    "cotton": 6500,
    "sugarcane": 3100,
    "tur": 6800,
    "jowar": 2900,
    "ragi": 3700,
    "groundnut": 5800,
    "soybean": 4300,
}

# Seasonal multipliers by region (simplified)
REGION_MULTIPLIERS = {
    "bangalore_rural": 1.05,
    "belgaum": 0.98,
    "bellary": 0.95,
    "mysore": 1.02,
    "hubli": 0.97,
    "gulbarga": 0.93,
    "raichur": 0.91,
    "shimoga": 1.00,
    "davangere": 0.96,
    "tumkur": 0.99,
}


class MarketForecaster:
    """
    Market price forecasting engine using LSTM or mock time-series generation.
    Attempts to load a Keras LSTM model from disk.
    Falls back to synthetic price curve generation with realistic trends.
    """

    def __init__(self, model_path: Optional[str] = None):
        self.model = None
        self.use_mock = True

        if model_path and os.path.exists(model_path):
            try:
                import tensorflow as tf
                self.model = tf.keras.models.load_model(model_path)
                self.use_mock = False
                print(f"[MarketForecaster] Loaded LSTM from {model_path}")
            except Exception as e:
                print(f"[MarketForecaster] Failed to load LSTM: {e}. Using mock forecast.")
        else:
            print("[MarketForecaster] No LSTM model found. Using synthetic forecast.")

    def _generate_mock_series(
        self, base_price: float, region_mult: float, days: int = 30, seed: Optional[int] = None
    ) -> Tuple[List[float], str, float]:
        """
        Generate a realistic mock 30-day price series.
        Returns: (price_series, signal, price_delta_pct)
        """
        if seed is not None:
            random.seed(seed)
            np.random.seed(seed)

        adjusted_base = base_price * region_mult

        # Decide trend direction randomly
        trend_direction = random.choice(["up", "down", "flat"])
        if trend_direction == "up":
            daily_drift = random.uniform(0.001, 0.005)
        elif trend_direction == "down":
            daily_drift = random.uniform(-0.005, -0.001)
        else:
            daily_drift = random.uniform(-0.0005, 0.0005)

        prices = [adjusted_base]
        for i in range(1, days):
            noise = random.gauss(0, adjusted_base * 0.008)
            seasonal = math.sin(2 * math.pi * i / 14) * adjusted_base * 0.01
            new_price = prices[-1] * (1 + daily_drift) + noise + seasonal
            prices.append(round(max(new_price, adjusted_base * 0.7), 2))

        # Calculate delta
        delta = prices[-1] - prices[0]
        delta_pct = round((delta / prices[0]) * 100, 2)

        signal = "HOLD" if delta >= 0 else "SELL"

        return prices, signal, delta_pct

    def forecast(self, commodity: str, region: str, days: int = 30) -> Dict:
        """
        Generate a 30-day market price forecast.
        """
        base_price = COMMODITY_BASE_PRICES.get(commodity, 2500)
        region_mult = REGION_MULTIPLIERS.get(region, 1.0)

        if not self.use_mock and self.model is not None:
            try:
                # Real LSTM inference would go here
                # For now, use mock even if model loads
                pass
            except Exception as e:
                print(f"[MarketForecaster] LSTM inference failed: {e}")

        # Generate mock time series
        prices, signal, delta_pct = self._generate_mock_series(
            base_price, region_mult, days
        )

        return {
            "commodity": commodity,
            "region": region,
            "days": days,
            "prices": prices,
            "current_price": round(prices[0], 2),
            "predicted_price": round(prices[-1], 2),
            "price_change_pct": delta_pct,
            "signal": signal,
        }
