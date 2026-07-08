package in.co.idbi.innovate.msme.consent.repository;

import in.co.idbi.innovate.msme.consent.model.ConsentLedgerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConsentRepository extends JpaRepository<ConsentLedgerEntity, String> {
    Optional<ConsentLedgerEntity> findByConsentHandle(String consentHandle);
    List<ConsentLedgerEntity> findByMsmeId(String msmeId);
    List<ConsentLedgerEntity> findByMsmeIdAndStatus(String msmeId, ConsentLedgerEntity.ConsentStatus status);
    Optional<ConsentLedgerEntity> findFirstByMsmeIdOrderByCreatedAtDesc(String msmeId);
    List<ConsentLedgerEntity> findByMsmeIdOrderByCreatedAtAsc(String msmeId);
    List<ConsentLedgerEntity> findByStatusAndConsentExpiryBefore(ConsentLedgerEntity.ConsentStatus status, java.time.LocalDateTime now);
}
