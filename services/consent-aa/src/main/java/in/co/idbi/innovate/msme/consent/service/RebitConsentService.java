package in.co.idbi.innovate.msme.consent.service;

import in.co.idbi.innovate.msme.consent.model.ConsentLedgerEntity;
import in.co.idbi.innovate.msme.consent.repository.ConsentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RebitConsentService {

    private final ConsentRepository repository;

    @Value("${msme.adapter.mode:SANDBOX}")
    private String adapterMode;

    @Transactional
    public ConsentLedgerEntity initiateConsent(String msmeId, String fiuId, String aaId, String purposeCode, List<String> fiTypes) {
        log.info("Initiating ReBIT AA v2.0 consent for MSME [{}] via AA [{}] in mode [{}]", msmeId, aaId, adapterMode);

        String handle = "REBIT-CH-" + UUID.randomUUID().toString().substring(0, 13).toUpperCase();
        String typesStr = String.join(",", fiTypes);

        ConsentLedgerEntity entity = ConsentLedgerEntity.builder()
                .consentHandle(handle)
                .msmeId(msmeId)
                .fiuId(fiuId)
                .aaId(aaId)
                .purposeCode(purposeCode)
                .fiTypes(typesStr)
                .status(ConsentLedgerEntity.ConsentStatus.PENDING_USER_APPROVAL)
                .consentStart(LocalDateTime.now())
                .consentExpiry(LocalDateTime.now().plusMonths(6))
                .build();

        ConsentLedgerEntity saved = repository.save(entity);
        log.info("Consent initiated successfully. Consent Handle: [{}]", saved.getConsentHandle());
        return saved;
    }

    @Transactional
    public ConsentLedgerEntity approveConsent(String consentHandle) {
        log.info("Processing user consent approval for handle: [{}]", consentHandle);
        ConsentLedgerEntity entity = repository.findByConsentHandle(consentHandle)
                .orElseThrow(() -> new IllegalArgumentException("Invalid consent handle: " + consentHandle));

        entity.setStatus(ConsentLedgerEntity.ConsentStatus.ACTIVE);
        ConsentLedgerEntity updated = repository.save(entity);

        if ("SANDBOX".equalsIgnoreCase(adapterMode)) {
            log.info("Sandbox mode: Automatically generating FI data fetch token for handle [{}]", consentHandle);
        } else {
            log.info("Production mode: Triggering ReBIT FI data request to AA network");
        }

        return updated;
    }

    @Transactional
    public ConsentLedgerEntity revokeConsent(String consentHandle) {
        log.info("Revoking consent handle: [{}]", consentHandle);
        ConsentLedgerEntity entity = repository.findByConsentHandle(consentHandle)
                .orElseThrow(() -> new IllegalArgumentException("Invalid consent handle: " + consentHandle));

        entity.setStatus(ConsentLedgerEntity.ConsentStatus.REVOKED);
        return repository.save(entity);
    }

    public List<ConsentLedgerEntity> getConsentsForMsme(String msmeId) {
        return repository.findByMsmeId(msmeId);
    }

    public Optional<ConsentLedgerEntity> getConsentByHandle(String handle) {
        return repository.findByConsentHandle(handle);
    }
}
