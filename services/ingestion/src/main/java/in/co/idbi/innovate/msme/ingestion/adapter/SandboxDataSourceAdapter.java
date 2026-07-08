package in.co.idbi.innovate.msme.ingestion.adapter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import java.util.*;

@Component
@ConditionalOnProperty(name = "msme.adapter.mode", havingValue = "SANDBOX", matchIfMissing = true)
@Slf4j
public class SandboxDataSourceAdapter implements DataSourceAdapter {

    @Override
    public String getAdapterMode() {
        return "SANDBOX";
    }

    @Override
    public Map<String, Object> fetchGstFilings(String gstin, String fromMonth, String toMonth) {
        log.info("Sandbox Adapter: Generating synthetic GSTR-3B filings for GSTIN [{}]", gstin);
        List<Map<String, Object>> filings = new ArrayList<>();
        for (int i = 1; i <= 12; i++) {
            String month = String.format("2025-%02d", i);
            filings.add(Map.of(
                    "gstin", gstin != null ? gstin : "27AABCU9603R1ZM",
                    "retPeriod", month,
                    "filingStatus", i % 10 == 0 ? "LATE" : "ON_TIME",
                    "supDetails", Map.of("osupDet", Map.of("txval", 850000.0, "iamt", 153000.0)),
                    "itcElg", Map.of("itcNet", Map.of("iamt", 120000.0, "camt", 0.0, "samt", 0.0, "csamt", 0.0)),
                    "lateFeeAmount", i % 10 == 0 ? 500.0 : 0.0
            ));
        }
        return Map.of("gstFilings", filings);
    }

    @Override
    public Map<String, Object> fetchUpiSummary(String vpaOrMerchantId, int months) {
        log.info("Sandbox Adapter: Generating synthetic UPI merchant transaction summary");
        List<Map<String, Object>> summaries = new ArrayList<>();
        for (int i = 1; i <= months; i++) {
            summaries.add(Map.of(
                    "month", String.format("2025-%02d", i),
                    "creditCount", 450,
                    "debitCount", 80,
                    "totalCredits", 950000.0,
                    "totalDebits", 620000.0,
                    "below500Count", 310,
                    "uniquePayerCount", 65,
                    "peakDayVolume", 42,
                    "lowDayVolume", 8
            ));
        }
        return Map.of("monthlySummaries", summaries);
    }

    @Override
    public Map<String, Object> fetchAaFiStatement(String consentHandle, String msmeId) {
        log.info("Sandbox Adapter: Generating synthetic ReBIT Account Aggregator bank statement");
        return Map.of(
                "account", Map.of(
                        "summary", Map.of(
                                "currentBalance", 280000.0,
                                "currentODLimit", 1000000.0,
                                "drawingLimit", 850000.0,
                                "currency", "INR",
                                "status", "ACTIVE"
                        ),
                        "transactions", Map.of(
                                "transaction", List.of(
                                        Map.of("type", "CREDIT", "amount", 45000.0, "narration", "UPI/CR/MERCHANT/SETTLEMENT"),
                                        Map.of("type", "DEBIT", "amount", 12000.0, "narration", "VENDOR/PAYMENT/NEFT"),
                                        Map.of("type", "CREDIT", "amount", 85000.0, "narration", "CLIENT/INVOICE/RTGS")
                                )
                        )
                )
        );
    }

    @Override
    public Map<String, Object> fetchEpfoRecord(String udyamOrPan, int months) {
        log.info("Sandbox Adapter: Generating synthetic EPFO payroll compliance record");
        return Map.of(
                "coveredUnderAct", true,
                "establishmentId", "MH/BAN/0012345/000",
                "aggregateStats", Map.of(
                        "avgActiveMembers", 32.5,
                        "memberGrowthRate", 0.08,
                        "contributionRegularity", 1.0,
                        "totalDefaultedMonths", 0,
                        "totalPenaltiesIncurred", 0.0
                ),
                "monthlySummaries", List.of(
                        Map.of("wageMonth", "2025-12", "activeMembers", 34, "totalBasicWages", 680000.0, "contributionStatus", "ON_TIME")
                )
        );
    }

    @Override
    public Map<String, Object> fetchAllAlternateData(String msmeId, String gstin, String consentHandle, String scenario) {
        log.info("Sandbox Adapter: Orchestrating full alternate data extraction for MSME [{}] in scenario [{}]", msmeId, scenario);
        
        String resolvedGstin = gstin != null ? gstin : "27AABCU9603R1ZM";
        String resolvedPan = resolvedGstin.length() == 15 ? resolvedGstin.substring(2, 12) : "AABCU9603R";

        Map<String, Object> profile = new HashMap<>();
        profile.put("msmeId", msmeId);
        profile.put("udyamNumber", "UDYAM-MH-12-0001234");
        profile.put("businessName", "IDBI Innovate Sandbox MSME");
        profile.put("category", "SMALL");
        profile.put("sector", "MANUFACTURING");
        profile.put("registrationDate", "2021-04-15");
        profile.put("gstin", resolvedGstin);
        profile.put("pan", resolvedPan);
        profile.put("linkedAccounts", List.of(Map.of("accountType", "BANK_CURRENT")));

        Map<String, Object> gst = fetchGstFilings(gstin, "2025-01", "2025-12");
        Map<String, Object> upi = fetchUpiSummary("merchant@upi", 12);
        Map<String, Object> aa = fetchAaFiStatement(consentHandle, msmeId);
        Map<String, Object> epfo = fetchEpfoRecord(msmeId, 12);

        Map<String, Object> fullPayload = new HashMap<>();
        fullPayload.put("profile", profile);
        fullPayload.put("gstFilings", gst.get("gstFilings"));
        fullPayload.put("upiSummary", upi);
        fullPayload.put("aaStatement", aa);
        fullPayload.put("epfoRecord", epfo);
        fullPayload.put("scenario", scenario != null ? scenario : "HEALTHY_ESTABLISHED");
        fullPayload.put("extractedAt", new Date().toString());
        fullPayload.put("adapterMode", getAdapterMode());

        return fullPayload;
    }
}
