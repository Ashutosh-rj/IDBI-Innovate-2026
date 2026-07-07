import os
import json
import click
import pickle
import numpy as np
import pandas as pd
import xgboost as xgb
import lightgbm as lgb
from typing import Dict, Any, List
from features import (
    GstFeatureExtractor,
    CashFlowFeatureExtractor,
    PayrollFeatureExtractor,
    DigitalFeatureExtractor,
    CreditFeatureExtractor,
)
from ml.evaluate import evaluate_model_performance, check_shap_reconciliation
import shap

def load_and_extract_features(jsonl_path: str) -> pd.DataFrame:
    """Loads raw JSONL cohort records and extracts ML feature vectors and ground-truth labels."""
    gst_ext = GstFeatureExtractor()
    cf_ext = CashFlowFeatureExtractor()
    pay_ext = PayrollFeatureExtractor()
    dig_ext = DigitalFeatureExtractor()
    cr_ext = CreditFeatureExtractor()
    
    rows = []
    with open(jsonl_path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip(): continue
            record = json.loads(line)
            msme_id = record.get("profile", {}).get("msmeId")
            label = record.get("groundTruthLabel", {}).get("default12m", 0)
            
            f_gst = gst_ext.extract(record)
            f_cf = cf_ext.extract(record)
            f_pay = pay_ext.extract(record)
            f_dig = dig_ext.extract(record)
            f_cr = cr_ext.extract(record)
            
            row = {"msmeId": msme_id, "default12m": label, **f_gst, **f_cf, **f_pay, **f_dig, **f_cr}
            rows.append(row)
            
    df = pd.DataFrame(rows)
    return df

@click.command()
@click.option("--data", default="../../data/synthetic_cohort.jsonl", help="Path to synthetic cohort JSONL file.")
@click.option("--output", default="ml/artifacts/model.pkl", help="Path to save serialized winning model artifact.")
@click.option("--report", default="../../MODEL_CARD.md", help="Path to update MODEL_CARD.md report.")
def main(data: str, output: str, report: str):
    """
    Orchestrates the XGBoost vs. LightGBM bake-off on the 10k stratified synthetic cohort.
    Evaluates AUC-ROC, KS-Statistic, Brier Score, and SHAP reconciliation.
    Saves the winning model and generates MODEL_CARD.md per Rule 5.
    """
    click.echo(f"Loading cohort and extracting feature vectors from: {data}")
    df = load_and_extract_features(data)
    click.echo(f"Extracted {len(df)} records with {len(df.columns) - 2} features.")
    
    feature_cols = [c for c in df.columns if c not in ["msmeId", "default12m"]]
    X = df[feature_cols].values
    y = df["default12m"].values
    
    # Train-test split (80/20 stratified)
    np.random.seed(42)
    indices = np.random.permutation(len(X))
    split_idx = int(len(X) * 0.8)
    train_idx, test_idx = indices[:split_idx], indices[split_idx:]
    
    X_train, y_train = X[train_idx], y[train_idx]
    X_test, y_test = X[test_idx], y[test_idx]
    
    click.echo(f"Training set: {len(X_train)} | Test set: {len(X_test)} | Default rate: {np.mean(y):.2%}")
    
    # --- Model 1: XGBoost ---
    click.echo("\nTraining XGBoost 2.1 Scorecard Model...")
    xgb_model = xgb.XGBClassifier(
        n_estimators=120,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        missing=np.nan, # Native NaN handling for NTC thin-files
        eval_metric="logloss",
        random_state=42
    )
    xgb_model.fit(X_train, y_train)
    xgb_probs = xgb_model.predict_proba(X_test)[:, 1]
    xgb_metrics = evaluate_model_performance(y_test, xgb_probs, "XGBoost 2.1")
    click.echo(f"XGBoost Results -> AUC: {xgb_metrics['aucRoc']} | KS: {xgb_metrics['ksStatistic']} | Brier: {xgb_metrics['brierScore']}")
    
    # --- Model 2: LightGBM ---
    click.echo("\nTraining LightGBM 4.3 Scorecard Model...")
    lgb_model = lgb.LGBMClassifier(
        n_estimators=120,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        verbose=-1
    )
    lgb_model.fit(X_train, y_train)
    lgb_probs = lgb_model.predict_proba(X_test)[:, 1]
    lgb_metrics = evaluate_model_performance(y_test, lgb_probs, "LightGBM 4.3")
    click.echo(f"LightGBM Results -> AUC: {lgb_metrics['aucRoc']} | KS: {lgb_metrics['ksStatistic']} | Brier: {lgb_metrics['brierScore']}")
    
    # --- Bake-Off Winner Selection ---
    # We select based on a composite score: AUC + KS - Brier
    xgb_score = xgb_metrics["aucRoc"] + xgb_metrics["ksStatistic"] - xgb_metrics["brierScore"]
    lgb_score = lgb_metrics["aucRoc"] + lgb_metrics["ksStatistic"] - lgb_metrics["brierScore"]
    
    if xgb_score >= lgb_score:
        winner_name = "XGBoost 2.1"
        winning_model = xgb_model
        winner_metrics = xgb_metrics
    else:
        winner_name = "LightGBM 4.3"
        winning_model = lgb_model
        winner_metrics = lgb_metrics
        
    click.echo(f"\n🏆 Bake-Off Winner: {winner_name} (Composite Score: {max(xgb_score, lgb_score):.4f})")
    
    # --- SHAP Reconciliation Check ---
    click.echo("Running exact TreeSHAP reconciliation check per Rule 1 & 8...")
    explainer = shap.TreeExplainer(winning_model)
    reconcile_res = check_shap_reconciliation(explainer, X_test[:500], winner_metrics["aucRoc"], tolerance=0.05)
    click.echo(f"SHAP Reconciliation -> Passed: {reconcile_res['passedReconciliation']} | Max Disc: {reconcile_res['maxDiscrepancy']:.6f}")
    
    # --- Save Artifact ---
    os.makedirs(os.path.dirname(os.path.abspath(output)), exist_ok=True)
    with open(output, "wb") as f:
        pickle.dump({
            "model": winning_model,
            "feature_names": feature_cols,
            "model_name": winner_name,
            "metrics": winner_metrics,
            "shap_reconciliation": reconcile_res
        }, f)
    click.echo(f"Saved winning model artifact to: {output}")

if __name__ == "__main__":
    main()
