package in.co.idbi.innovate.msme.consent.service;

import in.co.idbi.innovate.msme.consent.model.ConsentLedgerEntity;
import in.co.idbi.innovate.msme.consent.repository.ConsentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class RebitConsentServiceTest {

    @Autowired
    private RebitConsentService consentService;

    @Autowired
    private ConsentRepository consentRepository;

    private static final String TEST_MSME_ID = "MSME-HASH-TEST-001";
    private static final String FIU_ID = "FIU-TEST";
    private static final String AA_ID = "AA-TEST";
    private static final String PURPOSE = "101";

    @BeforeEach
    void setUp() {
        consentRepository.deleteAll();
    }

    @Test
    void testInitiateConsentCreatesGenesisHashChain() {
        ConsentLedgerEntity entity = consentService.initiateConsent(TEST_MSME_ID, FIU_ID, AA_ID, PURPOSE, List.of("DEPOSIT"));

        assertNull(entity.getPreviousHash());
        assertNotNull(entity.getEntryHash());
        assertEquals(64, entity.getEntryHash().length());
        assertTrue(consentService.verifyHashChain(TEST_MSME_ID));
    }

    @Test
    void testHashChainAcrossMultipleConsentsAndTransitions() {
        // 1. Initiate C1
        ConsentLedgerEntity c1 = consentService.initiateConsent(TEST_MSME_ID, FIU_ID, AA_ID, PURPOSE, List.of("DEPOSIT"));
        String c1PendingHash = c1.getEntryHash();

        // 2. Approve C1 -> state transition recomputes hash
        ConsentLedgerEntity c1Approved = consentService.approveConsent(c1.getConsentHandle());
        assertEquals(ConsentLedgerEntity.ConsentStatus.ACTIVE, c1Approved.getStatus());
        assertNotEquals(c1PendingHash, c1Approved.getEntryHash());
        assertNotNull(c1Approved.getEphemeralX25519PublicKey());
        assertNotNull(c1Approved.getJwsDetachedSignature());
        assertTrue(c1Approved.getJwsDetachedSignature().contains("..")); // Detached JWS format

        // 3. Initiate C2 -> chains onto C1's latest entryHash
        ConsentLedgerEntity c2 = consentService.initiateConsent(TEST_MSME_ID, FIU_ID, AA_ID, PURPOSE, List.of("GST_RETURNS"));
        assertEquals(c1Approved.getEntryHash(), c2.getPreviousHash());

        // 4. Revoke C2 -> state transition recomputes hash
        ConsentLedgerEntity c2Revoked = consentService.revokeConsent(c2.getConsentHandle());
        assertEquals(ConsentLedgerEntity.ConsentStatus.REVOKED, c2Revoked.getStatus());
        assertEquals(c1Approved.getEntryHash(), c2Revoked.getPreviousHash());

        // Verify entire chain is valid
        assertTrue(consentService.verifyHashChain(TEST_MSME_ID));
    }

    @Test
    void testTamperingBreaksHashChain() {
        ConsentLedgerEntity c1 = consentService.initiateConsent(TEST_MSME_ID, FIU_ID, AA_ID, PURPOSE, List.of("DEPOSIT"));
        ConsentLedgerEntity c2 = consentService.initiateConsent(TEST_MSME_ID, FIU_ID, AA_ID, PURPOSE, List.of("GST_RETURNS"));

        assertTrue(consentService.verifyHashChain(TEST_MSME_ID));

        // Tamper with C1's entryHash directly in the DB
        c1.setEntryHash("0000000000000000000000000000000000000000000000000000000000000000");
        consentRepository.saveAndFlush(c1);

        // Chain verification must fail
        assertFalse(consentService.verifyHashChain(TEST_MSME_ID));
    }
}
