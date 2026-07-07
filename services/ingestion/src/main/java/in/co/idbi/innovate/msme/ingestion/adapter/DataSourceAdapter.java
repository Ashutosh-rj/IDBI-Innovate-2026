package in.co.idbi.innovate.msme.ingestion.adapter;

import java.util.Map;

/**
 * Rule 2 & Option B: DataSourceAdapter Interface
 * Abstraction layer decoupling business logic from underlying data sources.
 * In Sandbox mode, delegates to SGSDG synthetic generators.
 * In Production mode, calls live GST/UPI/AA/EPFO API endpoints.
 */
public interface DataSourceAdapter {
    String getAdapterMode();
    Map<String, Object> fetchGstFilings(String gstin, String fromMonth, String toMonth);
    Map<String, Object> fetchUpiSummary(String vpaOrMerchantId, int months);
    Map<String, Object> fetchAaFiStatement(String consentHandle, String msmeId);
    Map<String, Object> fetchEpfoRecord(String udyamOrPan, int months);
    Map<String, Object> fetchAllAlternateData(String msmeId, String gstin, String consentHandle, String scenario);
}
