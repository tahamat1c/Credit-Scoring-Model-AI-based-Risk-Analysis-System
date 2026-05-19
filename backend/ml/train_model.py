import numpy as np
import joblib
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, classification_report, confusion_matrix
)
from preprocessing import preprocess_for_training, ENCODERS_PATH

MODEL_PATH = os.path.join(os.path.dirname(__file__), "saved_models", "model.pkl")
METRICS_PATH = os.path.join(os.path.dirname(__file__), "saved_models", "metrics.pkl")

os.makedirs(os.path.join(os.path.dirname(__file__), "saved_models"), exist_ok=True)


def train():
    print("=" * 50)
    print("  Credit Risk Model — Training")
    print("=" * 50)

    # ── Step 1: Load preprocessed data ───────────────
    X, y = preprocess_for_training()

    # ── Step 2: Train / test split ────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\n[INFO] Train size: {X_train.shape[0]}, Test size: {X_test.shape[0]}")

    # ── Step 3: Train Random Forest ───────────────────
    model = RandomForestClassifier(
        n_estimators=200,       # number of trees
        max_depth=None,         # let trees grow fully
        min_samples_split=5,
        class_weight="balanced", # handles imbalanced classes
        random_state=42,
        n_jobs=-1               # use all CPU cores
    )
    print("\n[INFO] Training Random Forest...")
    model.fit(X_train, y_train)
    print("[INFO] Training complete.")

    # ── Step 4: Evaluate ──────────────────────────────
    y_pred = model.predict(X_test)

    acc       = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    recall    = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1        = f1_score(y_test, y_pred, average="weighted", zero_division=0)

    print(f"\n{'─'*40}")
    print(f"  Accuracy  : {acc:.4f}  ({acc*100:.2f}%)")
    print(f"  Precision : {precision:.4f}")
    print(f"  Recall    : {recall:.4f}")
    print(f"  F1-Score  : {f1:.4f}")
    print(f"{'─'*40}")

    # Per-class report
    encoders = joblib.load(ENCODERS_PATH)
    class_names = list(encoders["__target__"].classes_)
    print(f"\nClassification Report:\n")
    print(classification_report(y_test, y_pred, target_names=class_names, zero_division=0))

    print(f"Confusion Matrix:\n{confusion_matrix(y_test, y_pred)}")

    # 5-fold cross-validation on full dataset
    print("\n[INFO] Running 5-fold cross-validation...")
    cv_scores = cross_val_score(model, X, y, cv=5, scoring="accuracy", n_jobs=-1)
    print(f"  CV Accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    # ── Step 5: Feature importance ────────────────────
    feat_importances = model.feature_importances_
    print("\nTop feature importances saved.")

    # ── Step 6: Save model + metrics ─────────────────
    joblib.dump(model, MODEL_PATH)
    print(f"\n✅ Model saved → {MODEL_PATH}")

    metrics = {
        "accuracy":   round(acc, 4),
        "precision":  round(precision, 4),
        "recall":     round(recall, 4),
        "f1_score":   round(f1, 4),
        "cv_mean":    round(float(cv_scores.mean()), 4),
        "cv_std":     round(float(cv_scores.std()), 4),
        "class_names": class_names,
        "feature_importances": feat_importances.tolist(),
    }
    joblib.dump(metrics, METRICS_PATH)
    print(f"✅ Metrics saved → {METRICS_PATH}")

    return model, metrics


if __name__ == "__main__":
    model, metrics = train()
    print(f"\n🎯 Final Model Accuracy: {metrics['accuracy']*100:.2f}%")
