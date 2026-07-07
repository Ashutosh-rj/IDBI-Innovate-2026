package in.co.idbi.innovate.msme.healthcard.repository;

import in.co.idbi.innovate.msme.healthcard.model.HealthCardEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface HealthCardRepository extends JpaRepository<HealthCardEntity, String> {
    Optional<HealthCardEntity> findByMsmeId(String msmeId);
}
