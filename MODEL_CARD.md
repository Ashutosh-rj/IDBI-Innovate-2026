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
