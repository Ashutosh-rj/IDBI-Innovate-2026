# IDBI Innovate 2026: AI Credit Scoring Model Card

## 1. Model Overview & Bake-Off Results
- **Winning Model**: XGBoost 2.1
- **Evaluation Cohort Size**: 200 records (160 training, 40 testing)
- **AUC-ROC**: 0.8611
- **KS-Statistic**: 0.6111
- **Brier Score Loss**: 0.0729

## 2. TreeSHAP Local Accuracy Reconciliation (Rule 1 & 8)
- **Reconciliation Status**: PASSED
- **Max Discrepancy**: 1e-06 (Tolerance: 0.05)
- **Tested Samples**: 40

## 3. Algorithmic Fairness Evaluation Across Cohort Segments (AUDIT-T2-3)
### MSME Category Parity (Reference: MEDIUM)
- **Overall Fairness Passed**: True
- **MEDIUM**: Sample Size = 1, Mean Score = 897.0, Default Rate = 0.0, Approval Rate = 100.0%, DIR = 1.0 (PASS (Fair))
- **MICRO**: Sample Size = 32, Mean Score = 861.94, Default Rate = 0.125, Approval Rate = 100.0%, DIR = 1.0 (PASS (Fair))
- **SMALL**: Sample Size = 7, Mean Score = 889.43, Default Rate = 0.0, Approval Rate = 100.0%, DIR = 1.0 (PASS (Fair))

### NTC Thin-File Parity (Reference: ESTABLISHED)
- **Overall Fairness Passed**: True
- **ESTABLISHED**: Sample Size = 32, Mean Score = 863.78, Default Rate = 0.125, Approval Rate = 100.0%, DIR = 1.0 (PASS (Fair))
- **NTC_THIN_FILE**: Sample Size = 8, Mean Score = 883.0, Default Rate = 0.0, Approval Rate = 100.0%, DIR = 1.0 (PASS (Fair))

### Sector Parity (Reference: MANUFACTURING)
- **Overall Fairness Passed**: True
- **MANUFACTURING**: Sample Size = 18, Mean Score = 875.28, Default Rate = 0.1111, Approval Rate = 100.0%, DIR = 1.0 (PASS (Fair))
- **SERVICES**: Sample Size = 22, Mean Score = 861.36, Default Rate = 0.0909, Approval Rate = 100.0%, DIR = 1.0 (PASS (Fair))

## 4. Target Leakage & Synthetic Data Governance Callout (AUDIT-T0-2)
> [!IMPORTANT]
> **Synthetic Data Caveat & Production Transition Strategy**
> The current baseline models (XGBoost 2.1 & LightGBM) and bake-off metrics reported above were generated using high-fidelity synthetic alternate datasets (`data-generators/`). While these synthetic generators enforce strict mathematical correlations and boundary conditions representing Indian MSME cash flow behaviors, synthetic evaluation metrics (AUC-ROC 0.8611) inherently reflect idealized statistical separability and do not capture real-world macro-shocks or informal financial noise with 100% fidelity.

### Target Leakage Audit & Prevention
- **Feature Separation**: The target variable (`is_in_default_90dpd`) and direct proxies (`past_due_days`, `recovery_flag`) are strictly excluded during the `X_train` / `X_test` feature extraction phase (`train_model.py`).
- **Lagged Indicators Only**: Features ingested by the model are strictly historical (`lag_1m` to `lag_12m` for GST turnover, Account Aggregator balances, and EPFO active member regularity).
- **Post-Hackathon Production Retraining Protocol**: Before active disbursement by partner banks (IDBI Bank, SBI, HDFC), this model artifact must undergo mandatory retraining on historical production loan performance datasets (`N >= 10,000` real MSME accounts across at least 2 consecutive economic cycles) under the direct supervision of the RBI Digital Lending Governance Committee.
