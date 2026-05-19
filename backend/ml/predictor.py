import numpy as np
import pandas as pd
import joblib
import os

MODEL_PATH    = os.path.join(os.path.dirname(__file__), "saved_models", "model.pkl")
ENCODERS_PATH = os.path.join(os.path.dirname(__file__), "saved_models", "encoders.pkl")

# Cache in memory so we don't reload from disk on every request
_model    = None
_encoders = None


def _load_model():
    global _model, _encoders
    if _model is None:
        _model    = joblib.load(MODEL_PATH)
        _encoders = joblib.load(ENCODERS_PATH)
        print("[INFO] Model and encoders loaded into memory.")
    return _model, _encoders


def get_risk_label(prediction: str, confidence: float) -> str:
        if prediction == "good":
            if confidence >= 75:
                return "Low Risk"
            else:
                return "Medium Risk"
        else:  # bad
            if confidence >= 75:
                return "High Risk"
            else:
                return "Medium Risk"

    
    
    
    # if prediction == "good" and confidence >= 75:
    #     return "Low Risk"
    # elif prediction == "bad" and confidence >= 65:
    #     return "High Risk"
    # else:
    #     return "Medium Risk"


def get_risk_color(risk_label: str) -> str:
    """Return a color code for each risk tier (used by frontend)."""
    return {
        "Low Risk":    "green",
        "Medium Risk": "yellow",
        "High Risk":   "red",
    }.get(risk_label, "gray")


def predict_from_dataframe(X_scaled: np.ndarray) -> list:
    """
    Run prediction on a preprocessed (scaled) numpy array.
    Returns a list of dicts with 3-tier risk label and confidence.
    """
    model, encoders = _load_model()
    target_encoder  = encoders["__target__"]

    predictions   = model.predict(X_scaled)
    probabilities = model.predict_proba(X_scaled)

    results = []
    for i, (pred, proba) in enumerate(zip(predictions, probabilities)):
        raw_label  = target_encoder.inverse_transform([pred])[0]   # "good" or "bad"
        confidence = round(float(np.max(proba)) * 100, 2)
        risk_label = get_risk_label(raw_label, confidence)

        class_probs = {
            target_encoder.inverse_transform([j])[0]: round(float(p) * 100, 2)
            for j, p in enumerate(proba)
        }

        results.append({
            "row_index":     i,
            "raw_prediction": raw_label,           # "good" / "bad"
            "risk_level":    risk_label,            # "Low Risk" / "Medium Risk" / "High Risk"
            "risk_color":    get_risk_color(risk_label),
            "confidence":    confidence,
            "probabilities": class_probs,
        })

    return results


def predict_single(feature_dict: dict) -> dict:
    """
    Predict risk for a single customer given a dict of feature values.
    Used for quick manual testing.

    Example:
        predict_single({
            "income": 35000,
            "debt": 15000,
            "loan_amount": 10000,
            "num_late_payments": 2,
            "employment_years": 3
        })
    """
    from preprocessing import preprocess_uploaded_file

    df     = pd.DataFrame([feature_dict])
    scaled = preprocess_uploaded_file(df)
    result = predict_from_dataframe(scaled)
    return result[0]


# ── Manual test ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("Running manual prediction test...\n")

    # Sample row matching German Credit dataset columns
    sample_customer = {
        "Age":           35,
        "gender":        "male",
        "Job":           2,
        "Housing":       "own",
        "Saving acc":    "little",
        "Checking acc":  "little",
        "Credit amount": 5000,
        "Duration":      24,
        "Purpose":       "car",
    }

    result = predict_single(sample_customer)
    print(f"Customer data: {sample_customer}")
    print(f"\n→ Raw Prediction : {result['raw_prediction']}")
    print(f"→ Risk Level     : {result['risk_level']}")
    print(f"→ Risk Color     : {result['risk_color']}")
    print(f"→ Confidence     : {result['confidence']}%")
    print(f"→ Probabilities  : {result['probabilities']}")