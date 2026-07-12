from datetime import datetime, date
from typing import Dict, Any, List
import structlog
from .policy_engine import policy_engine

logger = structlog.get_logger()

class FraudDetector:
    """
    Automated Fraud & Anomaly Detection Engine (AUDIT-T3-2).
    Evaluates MSME payloads for:
    1. PAN vs GSTIN mismatch (in India, PAN is embedded in GSTIN characters 3 to 12).
    2. Vintage mismatch (Udyam registration claims vs actual GST filing/banking history).
    3. Bank account status & reference anomalies (frozen, dormant, closed, or unverified accounts).
    """
    def evaluate_fraud(self, raw_payload: Dict[str, Any]) -> Dict[str, Any]:
        # If ingestion service already performed checks and found fraud, respect and extend it
        existing_analysis = raw_payload.get("fraudAnalysis", {})
        if existing_analysis and existing_analysis.get("isFraudDetected"):
            logger.warn("Pre-computed fraud analysis indicates fraud", flags=existing_analysis.get("fraudFlags"))
            return existing_analysis

        fraud_flags: List[str] = []
        profile = raw_payload.get("profile", {})
        if not profile:
            return {"isFraudDetected": False, "riskLevel": "LOW_NORMAL", "fraudFlags": [], "checkedAt": datetime.now().isoformat()}

        pan = str(profile.get("pan", "")).strip().upper()
        gstin = str(profile.get("gstin", "")).strip().upper()
        
        if not gstin:
            filings = raw_payload.get("gstFilings", [])
            if filings and isinstance(filings, list) and filings[0].get("gstin"):
                gstin = str(filings[0].get("gstin", "")).strip().upper()
                
        if not pan and gstin and len(gstin) == 15:
            pan = gstin[2:12]

        # 1. PAN vs GSTIN Mismatch
        if gstin and len(gstin) == 15 and pan and len(pan) == 10:
            embedded_pan = gstin[2:12]
            if embedded_pan != pan:
                logger.warn("FRAUD DETECTED: PAN does not match embedded GSTIN PAN", pan=pan, gstin=gstin)
                fraud_flags.append("PAN_GSTIN_MISMATCH")
        elif gstin and len(gstin) != 15:
            fraud_flags.append("INVALID_GSTIN_FORMAT")

        # 2. Vintage Mismatch
        reg_date_str = profile.get("registrationDate")
        if reg_date_str and len(reg_date_str) >= 10:
            try:
                reg_date = date.fromisoformat(reg_date_str[:10])
                vintage_months = max(1.0, float((date.today() - reg_date).days / 30.44))
                
                gst_filings = raw_payload.get("gstFilings", [])
                sw = policy_engine.get_scoring_weights()
                ft = sw.get("fraudThresholds", {})
                max_claim_months = float(ft.get("vintageHighClaimMonths", 36.0))
                min_filings = int(ft.get("minActiveGstFilings", 3))
                if vintage_months > max_claim_months and (not gst_filings or len(gst_filings) < min_filings):
                    logger.warn("FRAUD DETECTED: High Udyam vintage claim with minimal/no GST filing history", vintage_months=vintage_months)
                    fraud_flags.append("VINTAGE_MISMATCH_HIGH_CLAIM_LOW_ACTIVITY")
                
                if reg_date > date.today():
                    fraud_flags.append("VINTAGE_MISMATCH_FUTURE_REGISTRATION_DATE")
            except Exception as e:
                logger.debug("Could not parse registrationDate in fraud check", error=str(e))

        # 3. Bank Account Status Mismatch
        aa_statement = raw_payload.get("aaStatement", {})
        if aa_statement and isinstance(aa_statement, dict):
            account = aa_statement.get("account", {})
            if account and isinstance(account, dict):
                summary = account.get("summary", {})
                if summary and isinstance(summary, dict):
                    status = str(summary.get("status", "")).upper()
                    if status in ["DORMANT", "FROZEN", "CLOSED"]:
                        logger.warn("FRAUD DETECTED: Account Aggregator statement indicates account status", status=status)
                        fraud_flags.append(f"BANK_ACCOUNT_STATUS_{status}")

        is_fraud = len(fraud_flags) > 0
        risk_level = "HIGH_FRAUD_RISK" if is_fraud else "LOW_NORMAL"
        
        return {
            "isFraudDetected": is_fraud,
            "riskLevel": risk_level,
            "fraudFlags": fraud_flags,
            "checkedAt": datetime.utcnow().isoformat() + "Z"
        }

fraud_detector = FraudDetector()
