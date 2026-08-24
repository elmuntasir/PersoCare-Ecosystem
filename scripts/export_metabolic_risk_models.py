#!/usr/bin/env python3
"""
Export Metabolic Risk V3 XGBoost models to ONNX and build manifest.json.

Run inside the Colab notebook environment after training, or adapt paths locally.
Requires: xgboost, onnx, onnxmltools, pandas, numpy, sklearn
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import onnx
import pandas as pd
import xgboost as xgb
from onnxmltools.convert import convert_xgboost
from onnxmltools.convert.common.data_types import FloatTensorType

# ── Configure these from your notebook ────────────────────────

OUTPUT_ROOT = Path("public/models/metabolic_risk")
LABELS = [
    "HighBodyFat_BMI",
    "Low_HDL",
    "Diabetes",
    "NAFLD",
    "Hypertension",
    "InsulinResistance",
    "MetSyn",
]

TIER_FEATURES = {
    "T0": ["Gender", "Age", "BMI", "Waist", "Height", "WHtR"],
    "T1": [
        "Gender", "Age", "BMI", "Waist", "Height", "WHtR",
        "Triglycerides", "HDL", "LDL", "VAI", "LAP",
    ],
    "T2": [
        "Gender", "Age", "BMI", "Waist", "Height", "WHtR",
        "Triglycerides", "HDL", "LDL", "VAI", "LAP",
        "Glucose", "HbA1c", "Insulin", "HOMA_IR", "TyG",
    ],
    "T3": [
        "Gender", "Age", "BMI", "Waist", "Height", "WHtR",
        "Triglycerides", "HDL", "LDL", "VAI", "LAP",
        "Glucose", "HbA1c", "Insulin", "HOMA_IR", "TyG",
        "Systolic_BP", "Diastolic_BP", "ALT", "AST",
    ],
    "T4": [
        "Gender", "Age", "BMI", "Waist", "Height", "WHtR",
        "Triglycerides", "HDL", "LDL", "VAI", "LAP",
        "Glucose", "HbA1c", "Insulin", "HOMA_IR", "TyG",
        "Systolic_BP", "Diastolic_BP", "ALT", "AST", "Liver_Fat",
    ],
}

WINSORIZE_COLS = ["BMI", "WHtR", "VAI", "LAP", "HOMA_IR", "TyG"]

# Replace with objects from your notebook after preprocessing:
# df_train, df_train_p, tier_features_for_label, threshold_df
# ALL_FEATURES = list of all feature column names


def export_models(
    df_train: pd.DataFrame,
    df_train_p: pd.DataFrame,
    tier_features_for_label,
    threshold_df: pd.DataFrame,
    all_features: list[str],
    output_root: Path = OUTPUT_ROOT,
) -> None:
    tuned_thresholds = threshold_df.set_index("Label")["Tuned_Threshold"].to_dict()
    # Strip Label_ prefix if present
    tuned_thresholds = {
        k.replace("Label_", ""): float(v) for k, v in tuned_thresholds.items()
    }

    medians = df_train[all_features].median().to_dict()
    winsor_bounds = {
        col: (
            float(df_train[col].quantile(0.01)),
            float(df_train[col].quantile(0.99)),
        )
        for col in WINSORIZE_COLS
        if col in df_train.columns
    }
    scaler_mean = df_train_p[all_features].mean().to_dict()
    scaler_std = df_train_p[all_features].std().to_dict()

    manifest: dict = {
        "labels": LABELS,
        "thresholds": tuned_thresholds,
        "preprocessing": {
            "medians": {k: float(v) for k, v in medians.items()},
            "winsor_bounds": winsor_bounds,
            "scaler_mean": {k: float(v) for k, v in scaler_mean.items()},
            "scaler_std": {k: float(v) for k, v in scaler_std.items()},
        },
        "tiers": {},
    }

    tier_name_map = {
        "T0_TapeMeasureOnly": "T0",
        "T1_BasicLipids": "T1",
        "T2_ExtendedMetabolic": "T2",
        "T3_ClinicalPanel": "T3",
        "T4_EnhancedInstrument": "T4",
    }

    for tier_nb, tier_short in tier_name_map.items():
        tier_dir = output_root / tier_short
        tier_dir.mkdir(parents=True, exist_ok=True)

        label_features: dict[str, list[str]] = {}
        tier_thresholds: dict[str, float] = {}

        for label in LABELS:
            feats = tier_features_for_label(f"Label_{label}", tier_nb)
            label_features[label] = feats

            valid = df_train_p[f"Label_{label}"].notna()
            x_train = df_train_p.loc[valid, feats]
            y_train = df_train_p.loc[valid, f"Label_{label}"].astype(int)

            model = xgb.XGBClassifier(
                n_estimators=200,
                max_depth=4,
                learning_rate=0.05,
                eval_metric="logloss",
                random_state=42,
                n_jobs=-1,
            )
            model.fit(x_train, y_train)

            initial_type = [("input", FloatTensorType([1, len(feats)]))]
            onnx_model = convert_xgboost(model, initial_types=initial_type)
            out_path = tier_dir / f"{label}.onnx"
            onnx.save_model(onnx_model, str(out_path))
            print(f"Exported {tier_short}/{label}.onnx ({len(feats)} features)")

            tier_thresholds[label] = tuned_thresholds.get(label, 0.5)

        manifest["tiers"][tier_short] = {
            "features": TIER_FEATURES[tier_short],
            "labelFeatures": label_features,
            "thresholds": tier_thresholds,
        }

    output_root.mkdir(parents=True, exist_ok=True)
    manifest_path = output_root / "manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"Wrote {manifest_path}")


if __name__ == "__main__":
    print(
        "Import this module in Colab and call export_models(...) "
        "with your trained dataframe and tier_features_for_label."
    )
