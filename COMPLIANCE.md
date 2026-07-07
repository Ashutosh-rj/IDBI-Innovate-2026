# Regulatory & Legal Compliance Framework

This document details how the MSME Financial Health Score Platform aligns with Indian banking regulations, data privacy laws, and technical security standards.

---

## 1. Alignment with Digital Personal Data Protection (DPDP) Act, 2023

The platform is designed from the ground up to comply with the statutory obligations of a Data Fiduciary under India's DPDP Act 2023 when handling MSME owner personal data (PAN, Aadhaar-linked phone numbers, bank statements).

### Key Compliance Pillars:
1.  **Purpose Limitation & Notice (Section 5 & 6)**:
    *   Data is ingested *exclusively* for the stated purpose of "Credit Risk Assessment & Financial Health Scoring" (ReBIT Purpose Code `103` / `104`).
    *   No alternate data stream (UPI, GST, EPFO) is fetched without an explicit, cryptographically signed Consent Artifact from the MSME owner.
2.  **Consent Revocability & Right to Erasure (Section 6(4) & 12)**:
    *   An MSME owner can revoke consent at any time via the Self-Service Portal or Account Aggregator app.
    *   **Immediate Halt**: Revoking consent triggers an immediate Kafka event (`consent.revoked`) that terminates any in-flight ingestion worker tasks within 2 seconds.
    *   **Data Purge / Anonymization**: Upon revocation or expiration of `DataLife` (e.g., 30 days), all raw alternate data payloads in PostgreSQL are purged or cryptographically erased, retaining only the immutable, anonymized score snapshot required for bank audit trails.
3.  **Data Minimization**:
    *   The scoring engine only extracts features necessary for credit underwriting (e.g., monthly turnover volatility, tax payment ratios). Raw transaction narrations or personal expenditure details are discarded after feature extraction.

---

## 2. ReBIT Account Aggregator Security & Encryption

The Account Aggregator (AA) module adheres strictly to ReBIT technical specifications:
*   **End-to-End Encryption (E2EE)**: Financial Information (FI) transferred from the Financial Information Provider (FIP) to our Financial Information User (FIU) service is encrypted using **Elliptic Curve Diffie-Hellman (ECDH)** key exchange over `Curve25519`. The AA network acts purely as a data-blind conduit and cannot read the payload.
*   **Digital Signatures**: All consent requests and FI fetch requests carry a detached JSON Web Signature (`x-jws-signature`) validated against public keys registered in the Sahamati Central Registry.

---

## 3. Data at Rest & in Transit Protection

| Layer | Security Control | Implementation Details |
|---|---|---|
| **Data in Transit** | TLS 1.3 | All inter-service REST APIs, external webhook endpoints, and frontend-to-gateway traffic enforce TLS 1.3 with strong cipher suites. |
| **Data at Rest** | PostgreSQL `pgcrypto` | PII columns (PAN, GSTIN, Bank Account Numbers, Contact Details) are encrypted at rest using AES-256 via Postgres `pgcrypto` extension. |
| **Event Backbone** | Kafka SASL/SSL | Kafka brokers (running in KRaft mode) enforce SASL/PLAIN authentication and SSL encryption for all topic producers and consumers. |
| **Secret Management** | Environment Vault | Database credentials, JWT signing keys, and adapter API secrets are injected via environment variables / Kubernetes Secrets (never committed to git). |

---

## 4. Role-Based Access Control (RBAC) & Audit Trails

Access to the system is governed by Spring Cloud Gateway using stateless JSON Web Tokens (JWT) signed with RSA-256:

*   **Bank Officer / Credit Analyst (`ROLE_BANKER`)**: Can initiate scoring requests, view full Health Cards, inspect SHAP feature attributions, and run What-If simulations for assigned MSME portfolios. Cannot modify raw alternate data.
*   **MSME Owner (`ROLE_MSME_OWNER`)**: Can view their own Health Card, manage/revoke active consents, and view credit-readiness recommendations. Strictly isolated from viewing other MSME profiles via tenant ID checks.
*   **System Auditor (`ROLE_AUDITOR`)**: Read-only access to immutable score logs, consent ledger hash chains, and model monitoring PSI dashboards.

### Tamper-Evident Consent Ledger
Every consent grant, renewal, or revocation is recorded in an append-only PostgreSQL table (`consent_ledger`). Each row includes a SHA-256 hash chaining it to the previous row (`previous_hash`), guaranteeing that audit histories cannot be retroactively altered or deleted without detection.
