# Architectural Decisions Log & Review Tracker

This document records key architectural, statistical, and engineering decisions made during the build of the MSME Financial Health Score Platform, satisfying Rule 6 of the Master Build Prompt.

---

## Resolved Decisions (Approved for Option B Full Execution)

### DEC-001: Execution Scope & System Architecture
*   **Context**: The master prompt presented a choice between a simplified Phase 1 vertical slice (Option A) and the full polyglot microservice architecture with real Kafka E2E (Option B).
*   **Decision**: **Option B in Full**. All five backend services (API Gateway, Consent & AA, Ingestion, Scoring Engine, Health Card, MSME Registry) are built as independent Spring Boot 3.3 / FastAPI services communicating over an Apache Kafka 3.7 event backbone in KRaft mode.
*   **Rationale**: Demonstrates maximum scalability and technical rigor for judging criteria. Eliminates tech-debt rework between Phase 1 and Phase 2.

### DEC-002: Synthetic Data Generator Stratification & Size
*   **Context**: How large and diverse should the synthetic cohort be for model training and bake-off?
*   **Decision**: Generate exactly **10,000 synthetic MSME profiles** stratified across 5 documented scenarios: Healthy Established (35%), Stressed/Liquidity Crunch (20%), Seasonal Business (15%), New-to-Credit/Thin-File (20%), and High-Growth Formalizing (10%).
*   **Rationale**: 10,000 profiles provide sufficient statistical power for XGBoost vs. LightGBM hyperparameter tuning and calibration without causing memory/CPU bottlenecks during CI build runs. The 20% NTC share aligns with published TransUnion CIBIL originations data.

### DEC-003: Model Bake-Off & Selection Strategy
*   **Context**: Which gradient boosted scorecard algorithm should power the production scoring engine?
*   **Decision**: Implement a head-to-head bake-off between **XGBoost 2.1** and **LightGBM 4.3** in the training pipeline (`train.py`). Both models are trained on the 10k cohort, evaluated on AUC-ROC, KS-statistic, and Brier calibration score. The winning model is serialized to `artifacts/model.pkl` and documented in `MODEL_CARD.md`.
*   **Rationale**: LightGBM handles categorical features and NaN values (crucial for NTC thin-files) exceptionally well, while XGBoost is the industry standard for credit scorecards. Proving both empirically demonstrates ML systems maturity.

### DEC-004: OCEN / ULI Publish Adapter Target
*   **Context**: Live bank production endpoints for OCEN 4.0 and RBIH ULI are restricted to credentialed financial institutions.
*   **Decision**: Configure the `OcenLspAdapter` to target official sandbox/staging endpoints (`api.sandbox.ocen.dev`) or an embedded schema-validating WireMock server in sandbox mode, while preserving the exact production JSON payload structure (`ocenLspPayload`).
*   **Rationale**: Fully compliant with the prompt's instructions (Section 0.3 & Section 8) to use documented sandbox adapters where production APIs are unreachable.

### DEC-005: Frontend Scope
*   **Context**: Should both banker and MSME user interfaces be built?
*   **Decision**: Build **both**. A React 18 + Vite + TypeScript web dashboard for Bank Officers (with radar charts, SHAP waterfalls, and what-if simulation) AND a responsive Progressive Web App (PWA) shell for MSME Owners (with health card view, consent management, and credit-readiness checklist).
*   **Rationale**: Crucial for scoring highly on the "Financial Inclusion" judging weight by showing direct borrower empowerment.

### DEC-006: Audit Tier 0 Cryptography, Hash Chaining & OCEN Adapter Implementation
*   **Context**: Remediation of AUDIT-T0-4, T0-5, and T0-6 required implementing ReBIT AA v2.0 cryptography, consent ledger hash chaining, and real OCEN ULI adapter integration.
*   **Decision**: Implemented per-MSME SHA-256 hash chaining in `consent_ledger` (preventing global DB contention), BouncyCastle X25519 ephemeral key generation, detached JWS RS256 payload signing, and Spring Boot 3 `RestClient` integration with idempotency headers and offline fallback.
*   **Rationale**: Fully compliant with RBI Account Aggregator technical guidelines and OCEN 4.0 LSP specifications while ensuring robust developer experience and zero external network dependencies during offline testing.

### DEC-007: Audit Tier 1 Consent Expiry Sweep & Secret Management
*   **Context**: Remediation of AUDIT-T1-4 and AUDIT-T1-5 required automated consent expiration handling and formal elimination of plaintext Kubernetes secrets.
*   **Decision**: Implemented a `@Scheduled(fixedRateString = "${consent.sweep.interval:60000}")` sweep job (`ConsentExpirySweepJob`) in `consent-aa` that transitions expired consents to `EXPIRED`, updates the SHA-256 hash chain, and emits a `CONSENT_REVOKED_EVENT` to Kafka. For secrets, permanently removed `k8s/02-configmaps-secrets.yaml` from git tracking and documented 90-day/60-day rotation schedules and Bitnami Sealed Secrets re-sealing procedures in `COMPLIANCE.md`.
*   **Rationale**: Ensures DPDP Act compliance (Section 6(4) & 12) by automatically halting alternate data ingestion upon consent expiration while preserving an immutable audit trail. Eliminating plaintext secrets satisfies ISO/IEC 27001 and RBI cybersecurity controls.

---

## Open Engineering Notes (To Monitor During Build)

*   **NOTE-001 (Kafka KRaft Memory Footprint)**: Running Kafka in KRaft mode inside Docker Compose alongside Postgres, Redis, 4 JVM Spring Boot containers, and a Python FastAPI container requires ~6GB of Docker desktop RAM. We will optimize JVM `-Xms256m -Xmx512m` flags across Spring services to ensure smooth local demo execution on standard developer laptops.
*   **NOTE-002 (SHAP Calculation Latency)**: TreeSHAP exact calculation for 25+ features across bulk scoring requests can add ~100ms latency. We will cache SHAP base explainers in memory and utilize Redis for sub-score caching with TTL invalidation to guarantee the P95 < 3s SLA.
