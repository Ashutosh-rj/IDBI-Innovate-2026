package in.co.idbi.innovate.msme.ingestion.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@Slf4j
public class FraudValidationService {

    /**
     * Executes automated fraud & anomaly detection checks on ingested alternate data (AUDIT-T3-2).
     * Checks for:
     * 1. PAN vs GSTIN mismatch (in India, PAN is embedded in GSTIN characters 3 to 12).
     * 2. Business vintage mismatch (Udyam registration date vs GST/banking activity).
     * 3. Bank account status & reference mismatches between profile and Account Aggregator data.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> performFraudChecks(Map<String, Object> payload) {
        log.info("Executing automated fraud & anomaly detection checks on ingested payload (AUDIT-T3-2)");
        List<String> fraudFlags = new ArrayList<>();
        
        Map<String, Object> profile = (Map<String, Object>) payload.getOrDefault("profile", Map.of());
        String pan = (String) profile.get("pan");
        String gstin = (String) profile.get("gstin");
        
        // If not in profile directly, try extracting from payload or filings
        if (gstin == null || gstin.isEmpty()) {
            List<Map<String, Object>> gstFilings = (List<Map<String, Object>>) payload.get("gstFilings");
            if (gstFilings != null && !gstFilings.isEmpty()) {
                gstin = (String) gstFilings.get(0).get("gstin");
            }
        }
        if ((pan == null || pan.isEmpty()) && gstin != null && gstin.length() == 15) {
            // In India, PAN is characters 3 to 12 of GSTIN (0-indexed 2 to 12)
            pan = gstin.substring(2, 12);
        }

        // 1. GSTIN vs PAN Mismatch Check
        if (gstin != null && gstin.length() == 15 && pan != null && pan.length() == 10) {
            String embeddedPan = gstin.substring(2, 12);
            if (!embeddedPan.equalsIgnoreCase(pan)) {
                log.warn("FRAUD DETECTED: PAN [{}] does not match PAN embedded in GSTIN [{}]", pan, gstin);
                fraudFlags.add("PAN_GSTIN_MISMATCH");
            }
        } else if (gstin != null && !gstin.isEmpty() && gstin.length() != 15) {
            log.warn("FRAUD DETECTED: Invalid GSTIN length/format [{}]", gstin);
            fraudFlags.add("INVALID_GSTIN_FORMAT");
        }

        // 2. Vintage Mismatch Check
        String regDateStr = (String) profile.get("registrationDate");
        if (regDateStr != null && regDateStr.length() >= 10) {
            try {
                LocalDate regDate = LocalDate.parse(regDateStr.substring(0, 10), DateTimeFormatter.ISO_LOCAL_DATE);
                long vintageMonths = ChronoUnit.MONTHS.between(regDate, LocalDate.now());
                
                // If Udyam claims vintage > 36 months (3 years), but GST/banking activity shows minimal/0 filings
                List<Map<String, Object>> gstFilings = (List<Map<String, Object>>) payload.get("gstFilings");
                if (vintageMonths > 36 && (gstFilings == null || gstFilings.size() < 3)) {
                    log.warn("FRAUD DETECTED: Vintage mismatch. Udyam claims [{}] months vintage but minimal/no GST filing history found.", vintageMonths);
                    fraudFlags.add("VINTAGE_MISMATCH_HIGH_CLAIM_LOW_ACTIVITY");
                }
                if (regDate.isAfter(LocalDate.now())) {
                    log.warn("FRAUD DETECTED: Registration date is in the future [{}]", regDate);
                    fraudFlags.add("VINTAGE_MISMATCH_FUTURE_REGISTRATION_DATE");
                }
            } catch (Exception e) {
                log.debug("Could not parse registrationDate for vintage fraud check: {}", e.getMessage());
            }
        }

        // 3. Bank Account Mismatch Check
        List<Map<String, Object>> linkedAccounts = (List<Map<String, Object>>) profile.get("linkedAccounts");
        Map<String, Object> aaStatement = (Map<String, Object>) payload.get("aaStatement");
        if (aaStatement != null) {
            Map<String, Object> account = (Map<String, Object>) aaStatement.get("account");
            if (account != null) {
                Map<String, Object> summary = (Map<String, Object>) account.get("summary");
                if (summary != null) {
                    String status = (String) summary.get("status");
                    if ("DORMANT".equalsIgnoreCase(status) || "FROZEN".equalsIgnoreCase(status) || "CLOSED".equalsIgnoreCase(status)) {
                        log.warn("FRAUD DETECTED: Account Aggregator statement indicates bank account status is [{}]", status);
                        fraudFlags.add("BANK_ACCOUNT_STATUS_" + status.toUpperCase());
                    }
                }
            }
        }
        if (linkedAccounts != null && !linkedAccounts.isEmpty() && (aaStatement == null || aaStatement.isEmpty())) {
            log.warn("FRAUD DETECTED: Profile lists linked bank accounts but Account Aggregator statement is missing/unverified");
            fraudFlags.add("BANK_ACCOUNT_UNVERIFIED_MISMATCH");
        }

        boolean isFraud = !fraudFlags.isEmpty();
        String riskLevel = isFraud ? "HIGH_FRAUD_RISK" : "LOW_NORMAL";
        
        Map<String, Object> fraudAnalysis = new HashMap<>();
        fraudAnalysis.put("isFraudDetected", isFraud);
        fraudAnalysis.put("riskLevel", riskLevel);
        fraudAnalysis.put("fraudFlags", fraudFlags);
        fraudAnalysis.put("checkedAt", new Date().toString());
        
        return fraudAnalysis;
    }
}
