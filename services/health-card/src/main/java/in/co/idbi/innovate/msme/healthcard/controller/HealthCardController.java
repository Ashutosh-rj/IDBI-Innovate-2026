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

    @GetMapping("/{msmeId}")
    public ResponseEntity<HealthCardEntity> getHealthCard(@PathVariable String msmeId) {
        return repository.findByMsmeId(msmeId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
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
