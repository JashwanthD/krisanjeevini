# Placeholder for trained model weights

This directory should contain:

- `sowing_ensemble.pkl` — Serialized VotingClassifier (RF + XGBoost) trained on ICAR crop recommendation data
- `market_lstm.h5` — Serialized Keras LSTM trained on Agmarknet mandi price data

Without these files, the backend uses intelligent mock inference with realistic ICAR-based decision tables.
