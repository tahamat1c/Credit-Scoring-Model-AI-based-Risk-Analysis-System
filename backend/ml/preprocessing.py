import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib
import os

# ─── German Credit Dataset Configuration ─────────────────────────────────────
TARGET_COLUMN = "class"

DROP_COLUMNS = []

CATEGORICAL_COLS = [
    "checking_status", "credit_history", "purpose", "savings_status",
    "employment", "personal_status", "other_parties", "property_magnitude",
    "other_payment_plans", "housing", "job", "own_telephone", "foreign_worker"
]

NUMERIC_COLS = [
    "duration", "credit_amount", "installment_commitment",
    "residence_since", "age", "existing_credits", "num_dependents"
]
# ─────────────────────────────────────────────────────────────────────────────

DATASET_PATH  = os.path.join(os.path.dirname(__file__), "dataset", "training_dataset.csv")
SCALER_PATH   = os.path.join(os.path.dirname(__file__), "saved_models", "scaler.pkl")
ENCODERS_PATH = os.path.join(os.path.dirname(__file__), "saved_models", "encoders.pkl")
FEATURES_PATH = os.path.join(os.path.dirname(__file__), "saved_models", "feature_names.pkl")

os.makedirs(os.path.join(os.path.dirname(__file__), "saved_models"), exist_ok=True)


def load_raw_data():
    df = pd.read_csv(DATASET_PATH)
    print(f"[INFO] Loaded dataset: {df.shape[0]} rows, {df.shape[1]} columns")
    print(f"[INFO] Columns: {list(df.columns)}")
    print(f"[INFO] Target distribution:\n{df[TARGET_COLUMN].value_counts()}\n")
    return df


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    # Drop Kaggle auto-index column
    df = df.drop(columns=[c for c in DROP_COLUMNS if c in df.columns])

    # Drop rows with missing target
    df = df.dropna(subset=[TARGET_COLUMN])

    # 'Saving acc' and 'Checking acc' use NA to mean "no account"
    for col in ["Saving acc", "Checking acc"]:
        if col in df.columns:
            df[col] = df[col].fillna("none")

    # Fill remaining numeric NAs with median
    for col in NUMERIC_COLS:
        if col in df.columns:
            df[col] = df[col].fillna(df[col].median())

    print(f"[INFO] After cleaning: {df.shape[0]} rows, {df.shape[1]} columns")
    return df


def encode_features(df: pd.DataFrame, fit: bool = True) -> tuple:
    df = df.copy()
    y_raw = df[TARGET_COLUMN]
    X = df.drop(columns=[TARGET_COLUMN])

    if fit:
        encoders = {}
        for col in CATEGORICAL_COLS:
            if col in X.columns:
                le = LabelEncoder()
                X[col] = le.fit_transform(X[col].astype(str))
                encoders[col] = le
                print(f"[INFO] Encoded '{col}': {list(le.classes_)}")

        target_encoder = LabelEncoder()
        y = target_encoder.fit_transform(y_raw.astype(str))
        encoders["__target__"] = target_encoder
        print(f"[INFO] Target classes: {list(target_encoder.classes_)}")

        joblib.dump(encoders, ENCODERS_PATH)
        print(f"[INFO] Encoders saved → {ENCODERS_PATH}")
    else:
        encoders = joblib.load(ENCODERS_PATH)
        for col in CATEGORICAL_COLS:
            if col in X.columns and col in encoders:
                le = encoders[col]
                X[col] = X[col].astype(str).apply(
                    lambda v: le.transform([v])[0] if v in le.classes_ else -1
                )
        target_encoder = encoders.get("__target__")
        y = target_encoder.transform(y_raw.astype(str)) if target_encoder else y_raw.values

    return X, y, encoders


def scale_features(X: pd.DataFrame, fit: bool = True) -> np.ndarray:
    if fit:
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        joblib.dump(scaler, SCALER_PATH)
        joblib.dump(list(X.columns), FEATURES_PATH)
        print(f"[INFO] Scaler saved → {SCALER_PATH}")
        print(f"[INFO] Feature names: {list(X.columns)}")
    else:
        scaler = joblib.load(SCALER_PATH)
        feature_names = joblib.load(FEATURES_PATH)
        X = X.reindex(columns=feature_names, fill_value=0)
        X_scaled = scaler.transform(X)
    return X_scaled


def preprocess_for_training():
    df = load_raw_data()
    df = clean_data(df)
    X, y, _ = encode_features(df, fit=True)
    X_scaled = scale_features(X, fit=True)
    print(f"\n[INFO] Final shape — X: {X_scaled.shape}, y: {y.shape}")
    return X_scaled, y


def preprocess_uploaded_file(df: pd.DataFrame) -> np.ndarray:
    """Preprocess a user-uploaded file for inference (no target column needed)."""
    df = df.copy()
    df = df.drop(columns=['name', 'email', 'contact_number'], errors='ignore')

    if TARGET_COLUMN in df.columns:
        df = df.drop(columns=[TARGET_COLUMN])
    df = df.drop(columns=[c for c in DROP_COLUMNS if c in df.columns])

    for col in ["Saving acc", "Checking acc"]:
        if col in df.columns:
            df[col] = df[col].fillna("none")
    for col in NUMERIC_COLS:
        if col in df.columns:
            df[col] = df[col].fillna(df[col].median())

    encoders = joblib.load(ENCODERS_PATH)
    for col in CATEGORICAL_COLS:
        if col in df.columns and col in encoders:
            le = encoders[col]
            df[col] = df[col].astype(str).apply(
                lambda v: le.transform([v])[0] if v in le.classes_ else -1
            )

    scaler = joblib.load(SCALER_PATH)
    feature_names = joblib.load(FEATURES_PATH)
    df = df.reindex(columns=feature_names, fill_value=0)
    return scaler.transform(df)


if __name__ == "__main__":
    X, y = preprocess_for_training()
    print(f"\n✅ Preprocessing complete!")
    print(f"   X shape: {X.shape}, y shape: {y.shape}")
    unique, counts = np.unique(y, return_counts=True)
    print(f"   Class distribution: {dict(zip(unique, counts))}")