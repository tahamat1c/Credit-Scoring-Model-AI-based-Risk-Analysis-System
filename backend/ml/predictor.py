import numpy as np
import pandas as pd
import joblib
import os

MODEL_PATH    = os.path.join(os.path.dirname(__file__), "saved_models", "model.pkl")
ENCODERS_PATH = os.path.join(os.path.dirname(__file__), "saved_models", "encoders.pkl")

_model = None
_encoders = None


def _load_model():
    global _model, _encoders
    if _model is None:
        _model = joblib.load(MODEL_PATH)
        _encoders = joblib.load(ENCODERS_PATH)
        print("[INFO] Model and encoders loaded into memory.")
    return _model, _encoders


# ─────────────────────────────────────────────
# Risk logic (Probability of Default based)
# ─────────────────────────────────────────────

def get_risk_label(prob_bad: float) -> str:
    """
    prob_bad: probability of default (0–1)
    """
    if prob_bad >= 0.65:
        return "High Risk"
    elif prob_bad >= 0.35:
        return "Medium Risk"
    else:
        return "Low Risk"


def get_risk_color(risk_label: str) -> str:
    return {
        "Low Risk": "green",
        "Medium Risk": "yellow",
        "High Risk": "red",
    }.get(risk_label, "gray")


# ─────────────────────────────────────────────
# Batch prediction
# ─────────────────────────────────────────────

def predict_from_dataframe(X_scaled: np.ndarray) -> list:
    model, encoders = _load_model()
    target_encoder = encoders["__target__"]

    probabilities = model.predict_proba(X_scaled)
    classes = target_encoder.classes_

    results = []

    # find index of "bad" class once (faster + cleaner)
    bad_index = list(classes).index("bad")

    for i, proba in enumerate(probabilities):

        # Probability of default (core risk metric)
        prob_bad = float(proba[bad_index])

        # Risk label based ONLY on PD
        risk_label = get_risk_label(prob_bad)

        # Class probability dictionary (for UI transparency)
        class_probs = {
            classes[j]: round(float(proba[j]) * 100, 2)
            for j in range(len(classes))
        }

        results.append({
            "row_index": i,

            # TRUE model prediction (no fake logic)
            "prediction": target_encoder.inverse_transform([np.argmax(proba)])[0],

            # Core risk outputs
            "risk_level": risk_label,
            "risk_color": get_risk_color(risk_label),

            # Most important metric (credit risk standard)
            "prob_default": round(prob_bad * 100, 2),

            # Optional transparency
            "probabilities": class_probs,
        })

    return results


# ─────────────────────────────────────────────
# Single prediction
# ─────────────────────────────────────────────

def predict_single(feature_dict: dict) -> dict:
    from preprocessing import preprocess_uploaded_file

    df = pd.DataFrame([feature_dict])
    scaled = preprocess_uploaded_file(df)

    return predict_from_dataframe(scaled)[0]