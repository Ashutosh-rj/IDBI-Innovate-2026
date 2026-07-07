# Sandbox & Production Adapters Architecture

This document defines the **Sandbox Adapter Pattern** used across all backend services in the MSME Financial Health Score Platform. Per Rule 3 of the Master Build Prompt, every external integration implements a strict interface with both a **Sandbox Adapter** (powered by our Statistically-Grounded Synthetic Data Generator - SGSDG) and a **Production Adapter** skeleton.

---

## 1. The Adapter Interface Pattern

All data connectors (in Java Spring Boot and Python FastAPI) implement a common interface contract. This ensures that switching from synthetic demo data to live bank/government APIs is an atomic configuration change without altering business logic or scoring algorithms.

```
       +--------------------------------------------------+
       |               Data Ingestion Service             |
       +--------------------------------------------------+
                                |
                                v  fetch(consentId, dateRange)
       +--------------------------------------------------+
       |           <<interface>> DataSourceAdapter        |
       +--------------------------------------------------+
                 /                              \
                /                                \
  +---------------------------+    +---------------------------+
  |   GstSandboxAdapter       |    |   GstProductionAdapter    |
  | (Calls SGSDG / Local DB)  |    | (Calls GSTN / GSP OAuth)  |
  +---------------------------+    +---------------------------+
```

### Configuration Switch
In Spring Boot (`application.yml`):
```yaml
idbi:
  adapters:
    mode: sandbox  # Change to 'production' when live credentials are provisioned
    gst:
      provider: sandbox # or 'cleartax_gsp' / 'official_gstn'
    upi:
      provider: sandbox # or 'npci_switch'
    aa:
      provider: sandbox # or 'rebit_sahamati_fiu'
    epfo:
      provider: sandbox # or 'epfo_portal_api'
    ocen:
      provider: production_sandbox_mode # See documented exception below
```

---

## 2. Connector Implementations

| Connector | Interface Name | Sandbox Adapter Behavior (`mode: sandbox`) | Production Adapter Behavior (`mode: production`) |
|---|---|---|---|
| **GST (GSTR-3B/1)** | `GstDataConnector` | Invokes SGSDG GST generator or queries locally seeded Postgres table. Returns JSON matching `gst-filing.schema.json`. Appends `source="SANDBOX"`. | Connects to GST Suvidha Provider (GSP) or GSTN Developer API via OAuth 2.0. Fetches live returns for consented GSTIN. Appends `source="PRODUCTION"`. |
| **UPI / NPCI** | `UpiDataConnector` | Generates time-series UPI transactions anchored to NPCI aggregate stats via negative-binomial arrival process. Returns `upi-transactions.schema.json`. | Connects to bank's UPI switch / NPCI merchant analytics feed via secure mutual-TLS webhook or API. |
| **Account Aggregator** | `AccountAggregatorConnector` | Simulates ReBIT FI Notification (`READY`) and decrypts synthetic FI Data payload generated per ReBIT v2.0.0 DEPOSIT schema. | Connects to Sahamati/ReBIT-compliant AA Gateway (e.g., Anumati, Finvu, OneMoney) using JWS detached signature and ECDH encryption. |
| **EPFO Payroll** | `EpfoDataConnector` | Generates monthly establishment wage and contribution records with realistic delay/penalty distributions matching EPFO FY24 stats. | Connects to EPFO employer lookup service / ULI Tax & Business DSP gateway. |
| **Udyam Registry** | `UdyamRegistryConnector` | Validates Udyam registration number format (`UDYAM-XX-00-0000000`) against synthetic registry table. | Connects to MSME Ministry Udyam verification API / DigiLocker verification service. |

---

## 3. Documented Exception: OCEN / ULI Adapter

> [!IMPORTANT]
> **Live Production Endpoint in Sandbox Mode**
> Per the Master Build Prompt instructions, there is **one documented exception** to the local-only sandbox rule: the **OCEN / ULI Publish Adapter**.
>
> Because IDBI Bank's real production OCEN 4.0 Loan Service Provider (LSP) endpoint and RBIH's Unified Lending Interface (ULI) gateway require institutional onboarding and bank-level SSL certificates not accessible prior to the hackathon shortlist (July 21), our `OcenLspAdapter` is configured to target the **official OCEN / ULI staging/sandbox cloud endpoints** (`https://api.sandbox.ocen.dev/v4/` and RBIH ULI testbed) when available, or fall back to an embedded WireMock server that strictly validates the `CreateLoanApplicationRequest` schema.
>
> When publishing a scorecard, the adapter formats the payload exactly as specified in `health-card.schema.json` (`ocenLspPayload`), signs it with an RSA-256 test key, and performs an HTTP POST. This proves E2E readiness for live OCEN lending workflows.

---

## 4. Audit & Traceability
Every envelope emitted by an adapter includes two mandatory metadata headers:
1. `X-Data-Source-Mode`: `SANDBOX` or `PRODUCTION`
2. `X-Adapter-Version`: e.g., `v1.0.0-sgsdg` or `v1.0.0-gstn-oauth`

If a scoring request mixes production and sandbox data (e.g., live Udyam check but synthetic GST), the final score result sets `dataQualityScore` accordingly and logs an audit event in Postgres.
