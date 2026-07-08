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

---

## 5. Secret Management & Credential Rotation Procedures (AUDIT-T1-5)

To comply with RBI cybersecurity frameworks and ISO/IEC 27001 standards, all static plaintext credentials have been eliminated from source code and version control.

### 5.1 Secret Migration Architecture
*   **Plaintext Elimination**: All plaintext Kubernetes Secret manifests (e.g., `k8s/02-configmaps-secrets.yaml`) have been removed from repository tracking.
*   **Sealed Secrets Engine**: Production Kubernetes environments utilize **Bitnami Sealed Secrets** (`02-sealed-secrets.yaml`). Secrets are encrypted offline using the cluster's public asymmetric key and can only be decrypted at runtime by the `sealed-secrets-controller` running in the Kubernetes control plane.
*   **Developer Templates**: A sanitized template (`02-configmaps-secrets.example.yaml`) is provided for local onboarding without exposing live credentials.

### 5.2 Mandatory Credential Rotation Schedule

| Credential Type | Rotation Cadence | Responsible Component | Rotation Mechanism & Zero-Downtime Procedure |
|---|---|---|---|
| **JWT Signing Secret (`JWT_SECRET`)** | Every **90 Days** | API Gateway (`api-gateway`) | 1. Generate new 256-bit secure random secret.<br>2. Inject into HashiCorp Vault / Kubernetes Secret as `JWT_SECRET_PRIMARY`, moving previous key to `JWT_SECRET_SECONDARY`.<br>3. API Gateway validates incoming tokens against both keys during a **24-hour grace period** while issuing new tokens exclusively with the primary key.<br>4. After 24 hours, drop `JWT_SECRET_SECONDARY`. |
| **PostgreSQL Database Password** | Every **60 Days** | PostgreSQL & All Backend Services | Automated via HashiCorp Vault Database Secret Engine / External Secrets Operator (ESO). Dynamic leases expire after 60 days, triggering rolling pod restarts across microservices to acquire new connection pools. |
| **Redis Cache Password** | Every **60 Days** | Redis & Spring Cloud Gateway | Updated via ESO ConfigMap reload; Spring Cloud Gateway refreshes Lettuce connection pool without dropping active routing threads. |
| **ReBIT AA Cryptographic Keys** | **Annually** or on Compromise | Consent Service (`consent-aa`) | RSA-2048 signing keys and Curve25519 ECDH key pairs are rotated via Sahamati Central Registry certificate renewal protocol. |

### 5.3 Emergency Revocation & Re-Sealing Runbook
In the event of a suspected credential compromise or team personnel departure:
1.  **Immediate Invalidation**: Revoke active JWT sessions by bumping the global revocation epoch in Redis (`jwt:revoked:epoch`).
2.  **Generate New Credentials**: Run `openssl rand -base64 32` to generate secure replacement strings.
3.  **Re-Seal Kubernetes Secrets**:
    ```bash
    # Update local temporary manifest (not tracked in git)
    kubectl create secret generic msme-platform-secrets \
      --namespace=msme-health-platform \
      --from-literal=JWT_SECRET="<NEW_SECRET>" \
      --dry-run=client -o yaml > /tmp/raw-secret.yaml

    # Encrypt using cluster public key
    kubeseal --controller-name=sealed-secrets-controller \
      --controller-namespace=kube-system \
      --format yaml < /tmp/raw-secret.yaml > k8s/02-sealed-secrets.yaml

    # Clean up temporary file
    rm /tmp/raw-secret.yaml
    ```
4.  **Deploy & Verify**: Apply `k8s/02-sealed-secrets.yaml` to the cluster and trigger a rolling restart of dependent pods.

---

## 6. DevSecOps & Automated Security Scanning (AUDIT-T3-6)

To enforce continuous security across the software development lifecycle (SDLC) and prevent vulnerability regressions, automated security scanning is embedded into the continuous integration (`.github/workflows/ci.yml`) pipeline:

### 6.1 Static Application Security Testing (SAST) via Semgrep
*   **Multi-Language Coverage**: Semgrep scans all backend code (Java/Spring Boot, Python/FastAPI) and frontend applications (TypeScript/React) on every push and pull request.
*   **Rulesets Enforced**:
    *   `owasp-top-ten`: Detects SQL injection, XSS, insecure deserialization, and broken access controls.
    *   `secrets`: Identifies accidentally staged API tokens, private keys, or passwords.
    *   Language-specific security standards (`java`, `python`, `javascript`, `typescript`).

### 6.2 Container & Dependency Scanning via Trivy & Grype
*   **Dual-Engine Analysis**: Both **Trivy** and **Grype** analyze filesystem dependencies and compiled Docker container images (`msme-scoring-engine:ci`, microservice images) prior to Kubernetes deployment.
*   **Vulnerability Thresholds**: Detects OS-level vulnerabilities in Alpine/Debian base images, third-party libraries (Maven POMs, NPM packages, Python wheels), and configuration missteps.
*   **Compliance Alignment**: Ensures all deployed container artifacts satisfy RBI Guidelines on Cyber Security Framework for Banks by maintaining visibility into Software Bill of Materials (SBOM) and zero unmitigated CRITICAL CVEs in production namespaces.

---

## 7. Zero-Trust Service Mesh & mTLS Runbook (AUDIT-T3-4)

To satisfy **DPDP Act Section 8** (Mandatory Security Safeguards) and **RBI Zero-Trust Network Architecture (ZTNA)** mandates, all east-west inter-process communication across microservices must be cryptographically authenticated and encrypted using Mutual TLS (mTLS).

### 7.1 Declarative Scaffolding
The declarative configuration for both **Istio** and **Linkerd** is maintained in `k8s/10-service-mesh-mtls.yaml`. This scaffolding enforces:
1.  **Strict PeerAuthentication**: Rejects all unencrypted plaintext HTTP/TCP traffic within the `msme-health-platform` namespace.
2.  **Least-Privilege AuthorizationPolicies**: Ensures microservices can only receive requests from authorized sidecar principals (e.g., only `api-gateway` can invoke business logic; only business services can query `postgres` or `kafka`).

### 7.2 Istio Service Mesh Operational Runbook

#### Step 1: Install Control Plane & Enable Injection
```bash
# Install Istio with default production profile
istioctl install --set profile=default -y

# Label namespace for automatic sidecar proxy injection
kubectl label namespace msme-health-platform istio-injection=enabled --overwrite

# Apply mTLS security policies and authorization rules
kubectl apply -f k8s/10-service-mesh-mtls.yaml
```

#### Step 2: Verify mTLS Enforceability & Certificate Health
```bash
# Verify all pods have active Envoy sidecars and strict mTLS enabled
istioctl experimental mtls-check $(kubectl get pod -l app=scoring-engine -n msme-health-platform -o jsonpath='{.items[0].metadata.name}') -n msme-health-platform

# Inspect SPIFFE X.509 certificate identities and expiration dates
istioctl proxy-config secret $(kubectl get pod -l app=api-gateway -n msme-health-platform -o jsonpath='{.items[0].metadata.name}') -n msme-health-platform
```

### 7.3 Linkerd Service Mesh Operational Runbook (Alternative)

#### Step 1: Install Control Plane & Inject Proxy Sidecars
```bash
# Validate cluster readiness
linkerd check --pre

# Install Linkerd Custom Resource Definitions and Control Plane
linkerd install --crds | kubectl apply -f -
linkerd install | kubectl apply -f -
linkerd check

# Annotate namespace and perform rolling restart to inject Rust micro-proxies
kubectl annotate ns msme-health-platform linkerd.io/inject=enabled --overwrite
kubectl rollout restart -n msme-health-platform deploy
```

#### Step 2: Monitor mTLS Encryption Status
```bash
# Verify live mTLS traffic metrics across microservice boundaries
linkerd viz stat -n msme-health-platform

# Validate proxy certificate health and trust anchor validity
linkerd check --proxy -n msme-health-platform
```

### 7.4 Emergency Disaster Recovery & Tracing Bypass
In the event of network partition debugging or legacy system migration, mTLS can be temporarily relaxed to `PERMISSIVE` mode without dropping customer transactions:
```bash
# Patch Istio PeerAuthentication to PERMISSIVE (allows both mTLS and plaintext temporarily)
kubectl patch peerauthentication default-strict-mtls -n msme-health-platform --type='json' -p='[{"op": "replace", "path": "/spec/mtls/mode", "value": "PERMISSIVE"}]'

# Revert to STRICT mode immediately after incident resolution
kubectl patch peerauthentication default-strict-mtls -n msme-health-platform --type='json' -p='[{"op": "replace", "path": "/spec/mtls/mode", "value": "STRICT"}]'
```



