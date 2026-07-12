package in.co.idbi.innovate.msme.healthcard.controller;

import in.co.idbi.innovate.msme.healthcard.adapter.OcenUliAdapter;
import in.co.idbi.innovate.msme.healthcard.model.HealthCardEntity;
import in.co.idbi.innovate.msme.healthcard.repository.HealthCardRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health-card")
@RequiredArgsConstructor
@Slf4j
public class HealthCardController {

    private final HealthCardRepository repository;
    private final OcenUliAdapter ocenAdapter;

    @org.springframework.beans.factory.annotation.Value("${healthcard.default.score:700}")
    private int defaultScore;

    @org.springframework.beans.factory.annotation.Value("${healthcard.default.risk-band:MODERATE_RISK}")
    private String defaultRiskBand;

    @org.springframework.beans.factory.annotation.Value("${healthcard.default.pd:0.05}")
    private double defaultPd;

    @org.springframework.beans.factory.annotation.Value("${healthcard.default.tax-score:75.0}")
    private double defaultTaxScore;

    @org.springframework.beans.factory.annotation.Value("${healthcard.default.cf-score:70.0}")
    private double defaultCfScore;

    @org.springframework.beans.factory.annotation.Value("${healthcard.default.pay-score:65.0}")
    private double defaultPayScore;

    @org.springframework.beans.factory.annotation.Value("${healthcard.default.vin-score:80.0}")
    private double defaultVinScore;

    @org.springframework.beans.factory.annotation.Value("${healthcard.default.liq-score:75.0}")
    private double defaultLiqScore;

    @org.springframework.beans.factory.annotation.Value("${healthcard.default.dq-score:95.0}")
    private double defaultDqScore;

    @GetMapping("/{msmeId}")
    public ResponseEntity<HealthCardEntity> getHealthCard(@PathVariable String msmeId) {
        return repository.findByMsmeId(msmeId)
                .map(card -> {
                    if (card.getCreditPassportId() == null || card.getCreditPassportId().trim().isEmpty()) {
                        issueOrGetPassportId(msmeId);
                        return repository.findByMsmeId(msmeId).orElse(card);
                    }
                    return card;
                })
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{msmeId}/passport")
    public ResponseEntity<Map<String, Object>> getPassport(@PathVariable String msmeId) {
        String passportId = issueOrGetPassportId(msmeId);
        return ResponseEntity.ok(Map.of(
                "msmeId", msmeId,
                "creditPassportId", passportId,
                "issuedAt", java.time.LocalDateTime.now().toString()
        ));
    }

    private synchronized String issueOrGetPassportId(String msmeId) {
        HealthCardEntity card = repository.findByMsmeId(msmeId).orElseGet(() -> {
            HealthCardEntity newCard = HealthCardEntity.builder()
                    .msmeId(msmeId)
                    .healthScore(defaultScore)
                    .riskBand(defaultRiskBand)
                    .defaultProbability12m(defaultPd)
                    .taxComplianceScore(defaultTaxScore)
                    .cashFlowVelocityScore(defaultCfScore)
                    .payrollStabilityScore(defaultPayScore)
                    .businessVintageScore(defaultVinScore)
                    .liquidityBufferScore(defaultLiqScore)
                    .dataQualityScore(defaultDqScore)
                    .isNtcThinFile(false)
                    .topReasonCodesJson("[]")
                    .ocenLspPayloadJson("{}")
                    .publishedToOcen(false)
                    .computedAt(java.time.LocalDateTime.now())
                    .expiresAt(java.time.LocalDateTime.now().plusMonths(3))
                    .build();
            return repository.save(newCard);
        });

        if (card.getCreditPassportId() == null || card.getCreditPassportId().trim().isEmpty()) {
            long seq = Math.abs(java.util.UUID.nameUUIDFromBytes(msmeId.getBytes(java.nio.charset.StandardCharsets.UTF_8)).getMostSignificantBits()) % 89999L + 10000L;
            String candidate = String.format("CP-MH-%d-%05d", java.time.Year.now().getValue(), seq);
            card.setCreditPassportId(candidate);
            card = repository.save(card);
            log.info("Issued deterministic credit passport ID [{}] for MSME [{}]", candidate, msmeId);
        }
        return card.getCreditPassportId();
    }

    @GetMapping("/all")
    public ResponseEntity<List<HealthCardEntity>> getAllCards() {
        return ResponseEntity.ok(repository.findAll());
    }

    @PostMapping("/publish/{msmeId}")
    public ResponseEntity<Map<String, Object>> publishToOcen(@PathVariable String msmeId) {
        log.info("Manual request to re-publish scorecard to OCEN for MSME [{}]", msmeId);
        return repository.findByMsmeId(msmeId)
                .map(card -> {
                    String txnRef = ocenAdapter.publishScorecardToOcen(msmeId, card.getOcenLspPayloadJson());
                    card.setPublishedToOcen(true);
                    card.setOcenTransactionRef(txnRef);
                    repository.save(card);
                    return ResponseEntity.ok(Map.<String, Object>of(
                            "status", "SUCCESS",
                            "msmeId", msmeId,
                            "ocenTransactionRef", txnRef,
                            "publishedAt", card.getUpdatedAt().toString()
                    ));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
