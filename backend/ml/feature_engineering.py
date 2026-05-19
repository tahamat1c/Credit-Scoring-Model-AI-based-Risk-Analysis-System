import pandas as pd
import numpy as np


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Create derived features from German Credit dataset columns:
    Age, gender, Job, Housing, Saving acc, Checking acc,
    Credit amount, Duration, Purpose
    Call this BEFORE preprocessing/encoding.
    """
    df = df.copy()

    # ── Monthly repayment estimate ─────────────────────────────────────────
    # Duration is in months, so credit_amount / duration = monthly burden
    if "Credit amount" in df.columns and "Duration" in df.columns:
        df["monthly_repayment"] = df["Credit amount"] / df["Duration"].replace(0, np.nan)
        df["monthly_repayment"] = df["monthly_repayment"].fillna(0)

    # ── Credit amount bracket ──────────────────────────────────────────────
    if "Credit amount" in df.columns:
        df["credit_bracket"] = pd.cut(
            df["Credit amount"],
            bins=[0, 2000, 5000, 10000, float("inf")],
            labels=[0, 1, 2, 3]
        ).astype(float).fillna(0)

    # ── Duration risk flag (longer = higher risk) ──────────────────────────
    if "Duration" in df.columns:
        df["long_duration"] = (df["Duration"] > 24).astype(int)

    # ── Age risk flag (younger applicants statistically riskier) ──────────
    if "Age" in df.columns:
        df["young_applicant"] = (df["Age"] < 25).astype(int)

    # ── Saving account risk score ──────────────────────────────────────────
    # none=0, little=1, moderate=2, quite rich=3, rich=4
    saving_map = {"none": 0, "little": 1, "moderate": 2, "quite rich": 3, "rich": 4}
    if "Saving acc" in df.columns:
        df["saving_score"] = df["Saving acc"].fillna("none").map(saving_map).fillna(0)

    # ── Checking account risk score ────────────────────────────────────────
    checking_map = {"none": 0, "little": 1, "moderate": 2, "rich": 3}
    if "Checking acc" in df.columns:
        df["checking_score"] = df["Checking acc"].fillna("none").map(checking_map).fillna(0)

    print(f"[INFO] Feature engineering complete. Total columns: {len(df.columns)}")
    return df


def get_feature_descriptions() -> dict:
    """Human-readable descriptions for explainability module."""
    return {
        "Age":              "Applicant age",
        "gender":           "Applicant gender",
        "Job":              "Job skill level (0=unskilled, 3=highly skilled)",
        "Housing":          "Housing situation (own / free / rent)",
        "Saving acc":       "Savings account balance level",
        "Checking acc":     "Checking account balance level",
        "Credit amount":    "Total credit amount requested",
        "Duration":         "Loan duration in months",
        "Purpose":          "Purpose of the loan",
        "monthly_repayment":"Estimated monthly repayment",
        "credit_bracket":   "Credit amount tier (0=lowest, 3=highest)",
        "long_duration":    "Loan duration exceeds 24 months",
        "young_applicant":  "Applicant is under 25 years old",
        "saving_score":     "Savings account strength score",
        "checking_score":   "Checking account strength score",
    }