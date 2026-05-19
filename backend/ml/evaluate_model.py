import joblib
import os
import numpy as np

METRICS_PATH  = os.path.join(os.path.dirname(__file__), "saved_models", "metrics.pkl")
FEATURES_PATH = os.path.join(os.path.dirname(__file__), "saved_models", "feature_names.pkl")


def print_metrics():
    """Print saved model metrics in a readable format."""
    if not os.path.exists(METRICS_PATH):
        print("❌ No metrics found. Run train_model.py first.")
        return

    metrics = joblib.load(METRICS_PATH)

    print("=" * 45)
    print("  Credit Risk Model — Evaluation Report")
    print("=" * 45)
    print(f"  Accuracy  : {metrics['accuracy']*100:.2f}%")
    print(f"  Precision : {metrics['precision']*100:.2f}%")
    print(f"  Recall    : {metrics['recall']*100:.2f}%")
    print(f"  F1-Score  : {metrics['f1_score']*100:.2f}%")
    print(f"  CV Acc    : {metrics['cv_mean']*100:.2f}% ± {metrics['cv_std']*100:.2f}%")
    print(f"\n  Classes   : {metrics['class_names']}")
    print("=" * 45)

    # Top 10 most important features
    feature_names = joblib.load(FEATURES_PATH)
    importances   = np.array(metrics["feature_importances"])
    indices       = np.argsort(importances)[::-1][:10]

    print("\nTop 10 Feature Importances:")
    print(f"  {'Feature':<30} {'Importance':>10}")
    print(f"  {'─'*30} {'─'*10}")
    for i in indices:
        name = feature_names[i] if i < len(feature_names) else f"feature_{i}"
        print(f"  {name:<30} {importances[i]:>10.4f}")

    return metrics


def get_metrics_dict() -> dict:
    """Return metrics as a dict (used by the Django API)."""
    if not os.path.exists(METRICS_PATH):
        return {}
    return joblib.load(METRICS_PATH)


if __name__ == "__main__":
    print_metrics()
