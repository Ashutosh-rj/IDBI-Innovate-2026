package in.co.idbi.innovate.msme.registry.controller;

import in.co.idbi.innovate.msme.registry.model.MsmeEntity;
import in.co.idbi.innovate.msme.registry.service.UdyamVerificationService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/registry")
@RequiredArgsConstructor
public class RegistryController {

    private final UdyamVerificationService verificationService;

    @PostMapping("/verify")
    public ResponseEntity<MsmeEntity> verifyAndRegister(@RequestBody VerificationRequest request) {
        MsmeEntity entity = verificationService.verifyAndRegister(
                request.getUdyamNumber(),
                request.getBusinessName(),
                request.getPan(),
                request.getGstin(),
                request.getCategory(),
                request.getSector(),
                request.getRegistrationDate()
        );
        return ResponseEntity.ok(entity);
    }

    @GetMapping("/udyam/{udyamNumber}")
    public ResponseEntity<MsmeEntity> getByUdyam(@PathVariable String udyamNumber) {
        Optional<MsmeEntity> entity = verificationService.getByUdyamNumber(udyamNumber);
        return entity.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{msmeId}")
    public ResponseEntity<MsmeEntity> getById(@PathVariable String msmeId) {
        Optional<MsmeEntity> entity = verificationService.getByMsmeId(msmeId);
        return entity.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/msme/{msmeId}/udyam")
    public ResponseEntity<Map<String, Object>> getUdyamByMsmeId(@PathVariable String msmeId) {
        Optional<MsmeEntity> entity = verificationService.getByMsmeId(msmeId);
        return entity.map(e -> ResponseEntity.ok(Map.<String, Object>of(
                "msmeId", msmeId,
                "udyamNumber", e.getUdyamNumber(),
                "udyamVerified", e.isUdyamVerified()
        ))).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Data
    public static class VerificationRequest {
        private String udyamNumber;
        private String businessName;
        private String pan;
        private String gstin;
        private String category;
        private String sector;
        private String registrationDate;
    }
}
