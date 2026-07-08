package in.co.idbi.innovate.msme.ingestion.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

public class FraudValidationServiceTest {

    private FraudValidationService fraudService;

    @BeforeEach
    void setUp() {
        fraudService = new FraudValidationService();
    }

    @Test
    void testValidPayloadNoFraud() {
        Map<String, Object> profile = Map.of(
                "pan", "AABCU9603R",
                "gstin", "27AABCU9603R1ZM",
                "registrationDate", "2021-04-15",
                "linkedAccounts", List.of(Map.of("accountType", "BANK_CURRENT"))
        );
        Map<String, Object> aaStatement = Map.of(
                "account", Map.of("summary", Map.of("status", "ACTIVE"))
        );
        Map<String, Object> payload = Map.of(
                "profile", profile,
                "gstFilings", List.of(Map.of("retPeriod", "2025-01"), Map.of("retPeriod", "2025-02"), Map.of("retPeriod", "2025-03")),
                "aaStatement", aaStatement
        );

        Map<String, Object> result = fraudService.performFraudChecks(payload);
        assertFalse((Boolean) result.get("isFraudDetected"), "Valid payload should not be flagged as fraud");
        assertEquals("LOW_NORMAL", result.get("riskLevel"));
        assertTrue(((List<?>) result.get("fraudFlags")).isEmpty());
    }

    @Test
    void testPanGstinMismatch() {
        Map<String, Object> profile = Map.of(
                "pan", "XYZPK1234A",
                "gstin", "27AABCU9603R1ZM",
                "registrationDate", "2021-04-15"
        );
        Map<String, Object> payload = Map.of("profile", profile);

        Map<String, Object> result = fraudService.performFraudChecks(payload);
        assertTrue((Boolean) result.get("isFraudDetected"), "PAN-GSTIN mismatch must trigger fraud detection");
        assertEquals("HIGH_FRAUD_RISK", result.get("riskLevel"));
        List<String> flags = (List<String>) result.get("fraudFlags");
        assertTrue(flags.contains("PAN_GSTIN_MISMATCH"));
    }

    @Test
    void testVintageMismatchHighClaimLowActivity() {
        Map<String, Object> profile = Map.of(
                "pan", "AABCU9603R",
                "gstin", "27AABCU9603R1ZM",
                "registrationDate", "2015-01-01" // > 10 years vintage
        );
        // 0 GST filings
        Map<String, Object> payload = Map.of("profile", profile, "gstFilings", List.of());

        Map<String, Object> result = fraudService.performFraudChecks(payload);
        assertTrue((Boolean) result.get("isFraudDetected"), "High vintage claim with 0 filings must trigger fraud flag");
        List<String> flags = (List<String>) result.get("fraudFlags");
        assertTrue(flags.contains("VINTAGE_MISMATCH_HIGH_CLAIM_LOW_ACTIVITY"));
    }

    @Test
    void testBankAccountFrozenStatus() {
        Map<String, Object> profile = Map.of(
                "pan", "AABCU9603R",
                "gstin", "27AABCU9603R1ZM",
                "registrationDate", "2022-01-01"
        );
        Map<String, Object> aaStatement = Map.of(
                "account", Map.of("summary", Map.of("status", "FROZEN"))
        );
        Map<String, Object> payload = Map.of("profile", profile, "aaStatement", aaStatement);

        Map<String, Object> result = fraudService.performFraudChecks(payload);
        assertTrue((Boolean) result.get("isFraudDetected"), "Frozen bank account must trigger fraud flag");
        List<String> flags = (List<String>) result.get("fraudFlags");
        assertTrue(flags.contains("BANK_ACCOUNT_STATUS_FROZEN"));
    }
}
