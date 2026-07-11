# IDBI Innovate 2026: AI Credit Scoring Model Card

## 1. Model Overview & Bake-Off Results
- **Winning Model**: LightGBM 4.3
- **Evaluation Cohort Size**: 10000 records (8000 training, 2000 testing)
- **AUC-ROC**: 0.8461
- **KS-Statistic**: 0.599
- **Brier Score Loss**: 0.0654

## 2. TreeSHAP Local Accuracy Reconciliation (Rule 1 & 8)
- **Reconciliation Status**: PASSED
- **Max Discrepancy**: 0.0 (Tolerance: 0.05)
- **Tested Samples**: 500

## 3. Algorithmic Fairness Evaluation Across Cohort Segments (AUDIT-T2-3)
### MSME Category Parity (Reference: MEDIUM)
- **Overall Fairness Passed**: True
- **MEDIUM**: Sample Size = 189, Mean Score = 850.29, Default Rate = 0.1111, Approval Rate = 100.0%, DIR = 1.0 (PASS (Fair))
- **MICRO**: Sample Size = 1415, Mean Score = 853.81, Default Rate = 0.0763, Approval Rate = 98.0%, DIR = 0.9802 (PASS (Fair))
- **SMALL**: Sample Size = 396, Mean Score = 836.57, Default Rate = 0.1212, Approval Rate = 97.5%, DIR = 0.9747 (PASS (Fair))

### NTC Thin-File Parity (Reference: ESTABLISHED)
- **Overall Fairness Passed**: True
- **ESTABLISHED**: Sample Size = 1604, Mean Score = 840.48, Default Rate = 0.1072, Approval Rate = 97.6%, DIR = 1.0 (PASS (Fair))
- **NTC_THIN_FILE**: Sample Size = 396, Mean Score = 888.87, Default Rate = 0.0126, Approval Rate = 100.0%, DIR = 1.0243 (PASS (Fair))

### Sector Parity (Reference: MANUFACTURING)
- **Overall Fairness Passed**: True
- **MANUFACTURING**: Sample Size = 895, Mean Score = 853.05, Default Rate = 0.0827, Approval Rate = 98.8%, DIR = 1.0 (PASS (Fair))
- **SERVICES**: Sample Size = 1105, Mean Score = 847.65, Default Rate = 0.0932, Approval Rate = 97.6%, DIR = 0.9877 (PASS (Fair))

## 4. Target Leakage & Synthetic Data Governance Callout (AUDIT-T0-2)
> [!IMPORTANT]
> **Synthetic Data Caveat & Production Transition Strategy**
> The current baseline models (LightGBM 4.3) and bake-off metrics reported above were generated using high-fidelity synthetic alternate datasets (`data-generators/`). While these synthetic generators enforce strict mathematical correlations and boundary conditions representing Indian MSME cash flow behaviors, synthetic evaluation metrics (AUC-ROC 0.8461) inherently reflect idealized statistical separability and do not capture real-world macro-shocks or informal financial noise with 100% fidelity.

### Target Leakage Audit & Prevention
- **Feature Separation**: The target variable (`is_in_default_90dpd`) and direct proxies (`past_due_days`, `recovery_flag`) are strictly excluded during the `X_train` / `X_test` feature extraction phase (`train_model.py`).
- **Lagged Indicators Only**: Features ingested by the model are strictly historical (`lag_1m` to `lag_12m` for GST turnover, Account Aggregator balances, and EPFO active member regularity).
- **Post-Hackathon Production Retraining Protocol**: Before active disbursement by partner banks (IDBI Bank, SBI, HDFC), this model artifact must undergo mandatory retraining on historical production loan performance datasets (`N >= 10,000` real MSME accounts across at least 2 consecutive economic cycles) under the direct supervision of the RBI Digital Lending Governance Committee.
