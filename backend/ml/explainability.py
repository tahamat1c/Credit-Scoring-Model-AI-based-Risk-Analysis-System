import numpy as np
import joblib
import shap
import os

MODEL_PATH    = os.path.join(os.path.dirname(__file__), "saved_models", "model.pkl")
ENCODERS_PATH = os.path.join(os.path.dirname(__file__), "saved_models", "encoders.pkl")
FEATURES_PATH = os.path.join(os.path.dirname(__file__), "saved_models", "feature_names.pkl")

# Human-readable descriptions for each feature
FEATURE_DESCRIPTIONS = {
    "checking_status":        ("Checking account status", "low", "high"),
    "duration":               ("Loan duration (months)",      "high", "low"),
    "credit_history":         ("Credit history",              "low",  "high"),
    "purpose":                ("Loan purpose",                "low",  "high"),
    "credit_amount":          ("Credit amount requested",     "high", "low"),
    "savings_status":         ("Savings account balance",     "low",  "high"),
    "employment":             ("Employment duration",         "low",  "high"),
    "installment_commitment": ("Installment rate (%)",        "high", "low"),
    "personal_status":        ("Personal status",             "low",  "high"),
    "other_parties":          ("Other parties involved",      "low",  "high"),
    "residence_since":        ("Years at current residence",  "low",  "high"),
    "property_magnitude":     ("Property owned",              "low",  "high"),
    "age":                    ("Applicant age",               "low",  "high"),
    "other_payment_plans":    ("Other payment plans",         "high", "low"),
    "housing":                ("Housing situation",           "low",  "high"),
    "existing_credits":       ("Existing credits at bank",    "high", "low"),
    "job":                    ("Job type",                    "low",  "high"),
    "num_dependents":         ("Number of dependents",        "high", "low"),
    "own_telephone":          ("Has telephone",               "low",  "high"),
    "foreign_worker":         ("Foreign worker status",       "low",  "high"),
}

# Risk messages per feature when value is high or low
RISK_MESSAGES = {
    "checking_status": {
        "risk":  "No or negative checking account balance increases risk",
        "safe":  "Healthy checking account balance is a positive sign",
    },
    "duration": {
        "risk":  "Long loan duration increases repayment uncertainty",
        "safe":  "Short loan duration reduces repayment risk",
    },
    "credit_history": {
        "risk":  "Poor or no credit history raises concern",
        "safe":  "Good credit history is a strong positive indicator",
    },
    "purpose": {
        "risk":  "Loan purpose carries moderate risk",
        "safe":  "Loan purpose is considered low risk",
    },
    "credit_amount": {
        "risk":  "High credit amount increases financial burden",
        "safe":  "Manageable credit amount relative to profile",
    },
    "savings_status": {
        "risk":  "Little or no savings reduces financial buffer",
        "safe":  "Good savings balance provides financial security",
    },
    "employment": {
        "risk":  "Short or no employment history is a risk factor",
        "safe":  "Stable long-term employment is a strong positive",
    },
    "installment_commitment": {
        "risk":  "High installment rate strains monthly budget",
        "safe":  "Installment rate is within manageable range",
    },
    "personal_status": {
        "risk":  "Personal status is a contributing risk factor",
        "safe":  "Personal status is considered stable",
    },
    "other_parties": {
        "risk":  "Involvement of other parties adds complexity",
        "safe":  "No other parties involved reduces risk",
    },
    "residence_since": {
        "risk":  "Short residence history may indicate instability",
        "safe":  "Long residence history indicates stability",
    },
    "property_magnitude": {
        "risk":  "Limited property ownership reduces collateral",
        "safe":  "Significant property ownership provides collateral",
    },
    "age": {
        "risk":  "Age is a contributing factor to risk profile",
        "safe":  "Age profile is considered favorable",
    },
    "other_payment_plans": {
        "risk":  "Existing payment plans add to financial obligations",
        "safe":  "No other active payment plans is favorable",
    },
    "housing": {
        "risk":  "Housing situation contributes to risk",
        "safe":  "Stable housing situation is a positive factor",
    },
    "existing_credits": {
        "risk":  "Multiple existing credits increase debt burden",
        "safe":  "Manageable number of existing credits",
    },
    "job": {
        "risk":  "Job type is a contributing risk factor",
        "safe":  "Skilled employment is a positive indicator",
    },
    "num_dependents": {
        "risk":  "High number of dependents increases financial pressure",
        "safe":  "Number of dependents is manageable",
    },
    "own_telephone": {
        "risk":  "No registered telephone reduces contactability",
        "safe":  "Registered telephone improves reliability score",
    },
    "foreign_worker": {
        "risk":  "Foreign worker status is a minor risk factor",
        "safe":  "Worker status has no negative impact",
    },
}


def get_feature_contributions(customer_row: dict) -> list:
    model    = joblib.load(MODEL_PATH)
    encoders = joblib.load(ENCODERS_PATH)
    features = joblib.load(FEATURES_PATH)

    # Encode categoricals properly before building the row
    row_values = []
    for feat in features:
        val = customer_row.get(feat, 0)
        if feat in encoders and not feat.startswith("__"):
            try:
                encoded = encoders[feat].transform([str(val)])[0]
                row_values.append(float(encoded))
            except:
                row_values.append(0.0)
        else:
            try:
                row_values.append(float(val))
            except:
                row_values.append(0.0)

    X = np.array([row_values])

    explainer   = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X)

    if isinstance(shap_values, list):
        values = np.array(shap_values[1]).flatten()
    else:
        values = np.array(shap_values).flatten()

    values = values[1::2]


    contributions = []
    for i, feat in enumerate(features):
        if feat not in FEATURE_DESCRIPTIONS:
            continue

        shap_val  = float(np.array(values[i]).flatten()[0])
        label, risk_dir, safe_dir = FEATURE_DESCRIPTIONS[feat]
        raw_value = customer_row.get(feat, None)
        messages  = RISK_MESSAGES.get(feat, {"risk": f"{label} is a risk factor", "safe": f"{label} is favorable"})

        is_risky = shap_val > 0
        if feat == "checking_status":
            val_str = str(raw_value).strip()
            if val_str == ">=200":
                is_risky = False
            elif val_str in ["<0", "0<=X<200", "<200"]:
                is_risky = True
                
        elif feat == "age":
            try:
                age_val = float(raw_value)
                if 25 <= age_val <= 70:
                    is_risky = False
                else:
                    is_risky = True
            except:
                pass
            
        elif feat == "employment":
            try:
                emp_val = float(raw_value)
                if emp_val <= 2:
                    is_risky = True
                else:
                    is_risky = False
            except:
                # handle string values like "unemployed", "<1", ">=7" etc
                val_str = str(raw_value).strip()
                if val_str in ["0", "<1", "unemployed"]:
                    is_risky = True
                else:
                    is_risky = False

        impact  = "risk" if is_risky else "safe"
        message = messages["risk"] if is_risky else messages["safe"]

        contributions.append({
            "feature":    feat,
            "label":      label,
            "importance": round(abs(shap_val) * 100, 2),
            "impact":     impact,
            "message":    message,
            "raw_value":  raw_value,
        })

    contributions.sort(key=lambda x: x["importance"], reverse=True)
    return contributions







def generate_explanation(customer_data: dict, prediction: dict) -> dict:
    """
    Generate a full explanation for a single customer prediction.

    Args:
        customer_data: dict of feature values from the database
        prediction:    dict with risk_level, confidence, raw_prediction

    Returns:
        dict with reasons, feature impacts, and summary
    """
    contributions = get_feature_contributions(customer_data)

    risk_level  = prediction.get("risk_level", "Unknown")
    confidence  = prediction.get("confidence", 0)
    raw_pred    = prediction.get("raw_prediction", "good")

    # Split into risk factors and positive factors
    risk_factors     = [c for c in contributions if c["impact"] == "risk"][:4]
    positive_factors = [c for c in contributions if c["impact"] == "safe"][:4]

    # Generate summary sentence
    if risk_level == "High Risk":
        summary = f"This applicant was flagged as High Risk with {confidence}% confidence. " \
                  f"The assessment is driven by the following primary indicators"
    elif risk_level == "Medium Risk":
        summary = f"This applicant shows mixed signals with {confidence}% confidence. " \
                  f"Some risk factors are present but are balanced by positive indicators."
    else:
        summary = f"This applicant appears Low Risk with {confidence}% confidence. " \
                  f"The applicant shows strong financial indicators across key factors."

    return {
        "risk_level":        risk_level,
        "confidence":        confidence,
        "raw_prediction":    raw_pred,
        "summary":           summary,
        "risk_factors":      risk_factors,
        "positive_factors":  positive_factors,
        "all_contributions": contributions,
    }