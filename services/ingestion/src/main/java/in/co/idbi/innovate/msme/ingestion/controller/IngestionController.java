package in.co.idbi.innovate.msme.ingestion.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import in.co.idbi.innovate.msme.ingestion.adapter.DataSourceAdapter;
import in.co.idbi.innovate.msme.ingestion.kafka.AltDataEventProducer;
import in.co.idbi.innovate.msme.ingestion.service.FraudValidationService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ingestion")
@RequiredArgsConstructor
@Slf4j
public class IngestionController {

    private final DataSourceAdapter dataSourceAdapter;
    private final AltDataEventProducer eventProducer;
    private final FraudValidationService fraudValidationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/fetch")
    public ResponseEntity<Map<String, Object>> fetchAlternateData(@RequestBody IngestionRequest request) {
        log.info("Received ingestion request for MSME [{}] in mode [{}]", request.getMsmeId(), dataSourceAdapter.getAdapterMode());

        Map<String, Object> payload = dataSourceAdapter.fetchAllAlternateData(
                request.getMsmeId(),
                request.getGstin(),
                request.getConsentHandle(),
                request.getScenario()
        );

        // Execute automated fraud & anomaly checks (AUDIT-T3-2)
        Map<String, Object> fraudAnalysis = fraudValidationService.performFraudChecks(payload);
        payload.put("fraudAnalysis", fraudAnalysis);

        // Publish to Kafka event backbone
        try {
            String jsonStr = objectMapper.writeValueAsString(payload);
            eventProducer.publishAltDataEvent(request.getMsmeId(), jsonStr);
        } catch (Exception e) {
            log.warn("Could not serialize or publish event to Kafka: {}", e.getMessage());
        }

        return ResponseEntity.ok(payload);
    }

    @GetMapping("/adapter-mode")
    public ResponseEntity<Map<String, String>> getMode() {
        return ResponseEntity.ok(Map.of("adapterMode", dataSourceAdapter.getAdapterMode()));
    }

    @Data
    public static class IngestionRequest {
        private String msmeId;
        private String gstin;
        private String consentHandle;
        private String scenario = "HEALTHY_ESTABLISHED";
    }
}
