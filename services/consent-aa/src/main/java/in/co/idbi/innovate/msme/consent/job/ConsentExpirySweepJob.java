package in.co.idbi.innovate.msme.consent.job;

import in.co.idbi.innovate.msme.consent.model.ConsentLedgerEntity;
import in.co.idbi.innovate.msme.consent.repository.ConsentRepository;
import in.co.idbi.innovate.msme.consent.service.RebitConsentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class ConsentExpirySweepJob {

    private final ConsentRepository consentRepository;
    private final RebitConsentService consentService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    private static final String CONSENT_TOPIC = "consent-events";

    @Scheduled(fixedRateString = "${consent.sweep.interval:60000}")
    public void sweepExpiredConsents() {
        LocalDateTime now = LocalDateTime.now();
        List<ConsentLedgerEntity> expiredConsents = consentRepository.findByStatusAndConsentExpiryBefore(
                ConsentLedgerEntity.ConsentStatus.ACTIVE, now);

        if (expiredConsents.isEmpty()) {
            return;
        }

        log.info("Found [{}] active consents that have expired. Processing sweep (AUDIT-T1-4)...", expiredConsents.size());

        for (ConsentLedgerEntity entity : expiredConsents) {
            log.info("Transitioning consent handle [{}] to EXPIRED", entity.getConsentHandle());
            ConsentLedgerEntity updated = consentService.expireConsent(entity.getConsentHandle());

            Map<String, Object> eventPayload = new HashMap<>();
            eventPayload.put("eventType", "CONSENT_REVOKED_EVENT");
            eventPayload.put("consentHandle", updated.getConsentHandle());
            eventPayload.put("msmeId", updated.getMsmeId());
            eventPayload.put("fiuId", updated.getFiuId());
            eventPayload.put("timestamp", now.toString());
            eventPayload.put("reason", "EXPIRED");

            try {
                kafkaTemplate.send(CONSENT_TOPIC, updated.getMsmeId(), eventPayload);
                log.info("Emitted CONSENT_REVOKED_EVENT to topic [{}] for expired consent [{}]", CONSENT_TOPIC, updated.getConsentHandle());
            } catch (Exception e) {
                log.warn("Failed to send Kafka event for expired consent [{}]: {}", updated.getConsentHandle(), e.getMessage());
            }
        }
    }
}
