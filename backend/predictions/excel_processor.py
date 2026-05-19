import pandas as pd
import numpy as np
import os

# Required columns the uploaded file must have
REQUIRED_COLUMNS = [
    "name", "checking_balance", "duration", "credit_history", "purpose",
    "credit_amount", "savings_balance", "employment_years",
    "installment_rate", "personal_status", "other_parties",
    "residence_years", "property", "age", "other_payment_plans",
    "housing", "existing_credits", "job", "dependents",
    "own_telephone", "foreign_worker"
]

# Mapping from bank's friendly column names → model's column names
COLUMN_MAPPING = {
    "checking_balance":  "checking_status",
    "savings_balance":   "savings_status",
    "employment_years":  "employment",
    "installment_rate":  "installment_commitment",
    "residence_years":   "residence_since",
    "property":          "property_magnitude",
    "dependents":        "num_dependents",
}


def validate_file(file) -> dict:
    """
    Validate uploaded file type and size.
    Returns {"valid": True} or {"valid": False, "error": "..."}
    """
    # Check file extension
    name = file.name.lower()
    if not (name.endswith('.xlsx') or name.endswith('.csv') or name.endswith('.xls')):
        return {"valid": False, "error": "Only Excel (.xlsx, .xls) or CSV files are accepted."}

    # Check file size (max 10MB)
    if file.size > 10 * 1024 * 1024:
        return {"valid": False, "error": "File size must be under 10MB."}

    return {"valid": True}


def read_file(file) -> pd.DataFrame:
    """Read uploaded Excel or CSV file into a DataFrame."""
    name = file.name.lower()
    if name.endswith('.csv'):
        df = pd.read_csv(file)
    else:
        df = pd.read_excel(file)

    # Strip whitespace from column names
    df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")
    print(f"[INFO] Uploaded file columns: {list(df.columns)}")
    return df


def validate_columns(df: pd.DataFrame) -> dict:
    """
    Check if uploaded file has all required columns.
    Returns {"valid": True} or {"valid": False, "error": "...", "missing": [...]}
    """
    uploaded_cols = set(df.columns.str.lower())
    required_cols = set([c.lower() for c in REQUIRED_COLUMNS])
    missing = required_cols - uploaded_cols

    if missing:
        return {
            "valid": False,
            "error": f"Missing columns: {list(missing)}",
            "missing_columns": list(missing),
            "required_columns": REQUIRED_COLUMNS,
            "uploaded_columns": list(df.columns),
        }
    return {"valid": True}


def convert_bank_values(df: pd.DataFrame) -> pd.DataFrame:
    """
    Convert real bank values (normal numbers) into the
    range strings the model was trained on.

    Bank inputs real numbers like 150, 3, 5000
    Model expects range strings like '0<=X<200', '1<=X<4'
    """
    df = df.copy()

    # Rename bank-friendly columns to model column names
    df = df.rename(columns=COLUMN_MAPPING)

    # ── checking_status ───────────────────────────────────────────────────
    # Bank inputs actual account balance in currency units
    if "checking_status" in df.columns:
        def map_checking(val):
            try:
                v = float(val)
                if v < 0:        return "<0"
                elif v < 200:    return "0<=X<200"
                else:            return ">=200"
            except:
                # Already a string value — pass through
                return str(val) if pd.notna(val) else "no checking"
        df["checking_status"] = df["checking_status"].apply(map_checking)

    # ── savings_status ────────────────────────────────────────────────────
    # Bank inputs actual savings balance in currency units
    if "savings_status" in df.columns:
        def map_savings(val):
            try:
                v = float(val)
                if v < 100:       return "<100"
                elif v < 500:     return "100<=X<500"
                elif v < 1000:    return "500<=X<1000"
                else:             return ">=1000"
            except:
                return str(val) if pd.notna(val) else "no known savings"
        df["savings_status"] = df["savings_status"].apply(map_savings)

    # ── employment ────────────────────────────────────────────────────────
    # Bank inputs actual number of years employed
    if "employment" in df.columns:
        def map_employment(val):
            try:
                v = float(val)
                if v < 1:        return "<1"
                elif v < 4:      return "1<=X<4"
                elif v < 7:      return "4<=X<7"
                else:            return ">=7"
            except:
                return str(val) if pd.notna(val) else "unemployed"
        df["employment"] = df["employment"].apply(map_employment)

    # ── Fill missing values ───────────────────────────────────────────────
    text_cols = df.select_dtypes(include=["object"]).columns
    for col in text_cols:
        df[col] = df[col].fillna("none")

    num_cols = df.select_dtypes(include=[np.number]).columns
    for col in num_cols:
        df[col] = df[col].fillna(df[col].median())

    print(f"[INFO] Bank values converted to model format successfully.")
    return df


def process_uploaded_file(file) -> dict:
    """
    Full pipeline:
    validate → read → validate columns → convert values
    Returns {"success": True, "dataframe": df} or {"success": False, "error": "..."}
    """
    # Step 1 — Validate file type and size
    file_check = validate_file(file)
    if not file_check["valid"]:
        return {"success": False, "error": file_check["error"]}

    # Step 2 — Read file
    try:
        df = read_file(file)
    except Exception as e:
        return {"success": False, "error": f"Could not read file: {str(e)}"}

    # Step 3 — Check empty file
    if df.empty:
        return {"success": False, "error": "The uploaded file is empty."}

    # Step 4 — Validate columns
    col_check = validate_columns(df)
    if not col_check["valid"]:
        return {"success": False, **col_check}

    # Step 5 — Convert bank values to model format
    try:
        df = convert_bank_values(df)
    except Exception as e:
        return {"success": False, "error": f"Error processing data: {str(e)}"}

    print(f"[INFO] File processed successfully. {len(df)} customers ready for prediction.")
    return {"success": True, "dataframe": df, "total_rows": len(df)}


def generate_template() -> pd.DataFrame:
    """
    Generate a blank Excel template for bank staff to fill in.
    Returns a DataFrame with correct column headers and one example row.
    """
    example_row = {
        "name":              "Smith",
        "checking_balance":  150,
        "duration":          24,
        "credit_history":    "existing paid",
        "purpose":           "car",
        "credit_amount":     5000,
        "savings_balance":   200,
        "employment_years":  3,
        "installment_rate":  4,
        "personal_status":   "male single",
        "other_parties":     "none",
        "residence_years":   2,
        "property":          "real estate",
        "age":               35,
        "other_payment_plans": "none",
        "housing":           "own",
        "existing_credits":  1,
        "job":               "skilled",
        "dependents":        1,
        "own_telephone":     "yes",
        "foreign_worker":    "yes",
    }
    return pd.DataFrame([example_row])