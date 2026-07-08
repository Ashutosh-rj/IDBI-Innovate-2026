package in.co.idbi.innovate.msme.consent.job;

import in.co.idbi.innovate.msme.consent.model.ConsentLedgerEntity;
import in.co.idbi.innovate.msme.consent.repository.ConsentRepository;
import in.co.idbi.innovate.msme.consent.service.RebitConsentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class ConsentExpirySweepJobTest {

    @Autowired
    private ConsentExpirySweepJob sweepJob;

    @Autowired
    private RebitConsentService consentService;

    @Autowired
    private ConsentRepository consentRepository;

    @MockBean
    private KafkaTemplate<String, Object> kafkaTemplate;

    private static final String TEST_MSME = "MSME-SWEEP-001";

    @BeforeEach
    void setUp() {
        consentRepository.deleteAll();
    }

    @Test
    void testSweepExpiredConsentsTransitionsStatusAndEmitsEvent() {
        // 1. Initiate and approve a consent
        ConsentLedgerEntity consent = consentService.initiateConsent(TEST_MSME, "FIU-1", "AA-1", "101", List.of("DEPOSIT"));
        ConsentLedgerEntity active = consentService.approveConsent(consent.getConsentHandle());
        assertEquals(ConsentLedgerEntity.ConsentStatus.ACTIVE, active.getStatus());

        // 2. Manually set expiry to the past in DB
        active.setConsentExpiry(LocalDateTime.now().minusDays(1));
        consentRepository.saveAndFlush(active);

        // 3. Run sweep job
        sweepJob.sweepExpiredConsents();

        // 4. Verify status transitioned to EXPIRED
        ConsentLedgerEntity expired = consentRepository.findByConsentHandle(active.getConsentHandle()).orElseThrow();
        assertEquals(ConsentLedgerEntity.ConsentStatus.EXPIRED, expired.getStatus());

        // 5. Verify hash chain is intact and valid
        assertTrue(consentService.verifyHashChain(TEST_MSME));

        // 6. Verify Kafka event was emitted
        verify(kafkaTemplate, times(1)).send(eq("consent-events"), eq(TEST_MSME), anyMap());
    }
}
