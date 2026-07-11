package in.co.idbi.innovate.msme.healthcard.kafka;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import in.co.idbi.innovate.msme.healthcard.adapter.OcenUliAdapter;
import in.co.idbi.innovate.msme.healthcard.model.HealthCardEntity;
import in.co.idbi.innovate.msme.healthcard.repository.HealthCardRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScoreComputedConsumer {

    private final HealthCardRepository repository;
    private final OcenUliAdapter ocenAdapter;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @KafkaListener(topics = "${msme.kafka.topics.score-computed:score-computed-events}", groupId = "health-card-service-group")
    @Transactional
    public void consumeScoreComputedEvent(String eventJson) {
        log.info("Received score-computed event from Kafka topic");
        try {
            Map<String, Object> payload = objectMapper.readValue(eventJson, new TypeReference<>() {});
            String msmeId = (String) payload.getOrDefault("msmeId", "UNKNOWN-MSME");

            int score = ((Number) payload.getOrDefault("healthScore", 650)).intValue();
            String riskBand = (String) payload.getOrDefault("riskBand", "MODERATE_RISK");
            double pd = ((Number) payload.getOrDefault("defaultProbability12m", 0.05)).doubleValue();
            boolean isNtc = (boolean) payload.getOrDefault("isNtcThinFile", false);

            Map<String, Object> subScores = (Map<String, Object>) payload.getOrDefault("subScores", Map.of());
            double tax = ((Number) subScores.getOrDefault("taxComplianceScore", 70.0)).doubleValue();
            double cash = ((Number) subScores.getOrDefault("cashFlowVelocityScore", 70.0)).doubleValue();
            double pay = ((Number) subScores.getOrDefault("payrollStabilityScore", 70.0)).doubleValue();
            double vin = ((Number) subScores.getOrDefault("businessVintageScore", 70.0)).doubleValue();
            double liq = ((Number) subScores.getOrDefault("liquidityBufferScore", 70.0)).doubleValue();
            double data = ((Number) subScores.getOrDefault("dataQualityScore", 80.0)).doubleValue();

            String reasonsJson = objectMapper.writeValueAsString(payload.getOrDefault("topReasonCodes", List.of()));
            String ocenPayloadJson = objectMapper.writeValueAsString(payload.getOrDefault("ocenLspPayload", Map.of()));

            HealthCardEntity entity = repository.findByMsmeId(msmeId).orElseGet(() -> HealthCardEntity.builder()
                    .msmeId(msmeId)
                    .build());

            entity.setHealthScore(score);
            entity.setRiskBand(riskBand);
            entity.setDefaultProbability12m(pd);
            entity.setTaxComplianceScore(tax);
            entity.setCashFlowVelocityScore(cash);
            entity.setPayrollStabilityScore(pay);
            entity.setBusinessVintageScore(vin);
            entity.setLiquidityBufferScore(liq);
            entity.setDataQualityScore(data);
            entity.setNtcThinFile(isNtc);
            entity.setTopReasonCodesJson(reasonsJson);
            entity.setOcenLspPayloadJson(ocenPayloadJson);
            entity.setComputedAt(LocalDateTime.now());
            entity.setExpiresAt(LocalDateTime.now().plusMonths(3));

            // Publish to OCEN 4.0 Sandbox
            String txnRef = ocenAdapter.publishScorecardToOcen(msmeId, ocenPayloadJson);
            entity.setPublishedToOcen(true);
            entity.setOcenTransactionRef(txnRef);

            if (entity.getCreditPassportId() == null || entity.getCreditPassportId().trim().isEmpty()) {
                long seq = Math.abs(java.util.UUID.nameUUIDFromBytes(msmeId.getBytes(java.nio.charset.StandardCharsets.UTF_8)).getMostSignificantBits()) % 89999L + 10000L;
                String candidate = String.format("CP-MH-%d-%05d", java.time.Year.now().getValue(), seq);
                entity.setCreditPassportId(candidate);
            }

            repository.save(entity);
            log.info("Successfully persisted Health Card and published to OCEN for MSME [{}]", msmeId);
        } catch (Exception e) {
            log.error("Failed to process score-computed Kafka event: {}", e.getMessage(), e);
        }
    }
}
