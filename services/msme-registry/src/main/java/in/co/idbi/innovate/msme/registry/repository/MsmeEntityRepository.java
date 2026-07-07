package in.co.idbi.innovate.msme.registry.repository;

import in.co.idbi.innovate.msme.registry.model.MsmeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface MsmeEntityRepository extends JpaRepository<MsmeEntity, String> {
    Optional<MsmeEntity> findByUdyamNumber(String udyamNumber);
    Optional<MsmeEntity> findByPan(String pan);
    Optional<MsmeEntity> findByGstin(String gstin);
}
