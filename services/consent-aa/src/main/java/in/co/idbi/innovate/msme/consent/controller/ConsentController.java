package in.co.idbi.innovate.msme.consent.controller;

import in.co.idbi.innovate.msme.consent.model.ConsentLedgerEntity;
import in.co.idbi.innovate.msme.consent.service.RebitConsentService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/consent")
@RequiredArgsConstructor
public class ConsentController {

    private final RebitConsentService consentService;

    @PostMapping("/initiate")
    public ResponseEntity<ConsentLedgerEntity> initiate(@RequestBody ConsentInitiateRequest request) {
        ConsentLedgerEntity entity = consentService.initiateConsent(
                request.getMsmeId(),
                request.getFiuId(),
                request.getAaId(),
                request.getPurposeCode(),
                request.getFiTypes()
        );
        return ResponseEntity.ok(entity);
    }

    @PostMapping("/approve/{handle}")
    public ResponseEntity<ConsentLedgerEntity> approve(@PathVariable String handle) {
        ConsentLedgerEntity entity = consentService.approveConsent(handle);
        return ResponseEntity.ok(entity);
    }

    @PostMapping("/revoke/{handle}")
    public ResponseEntity<ConsentLedgerEntity> revoke(@PathVariable String handle) {
        ConsentLedgerEntity entity = consentService.revokeConsent(handle);
        return ResponseEntity.ok(entity);
    }

    @GetMapping("/msme/{msmeId}")
    public ResponseEntity<List<ConsentLedgerEntity>> getForMsme(@PathVariable String msmeId) {
        return ResponseEntity.ok(consentService.getConsentsForMsme(msmeId));
    }

    @GetMapping("/{handle}")
    public ResponseEntity<ConsentLedgerEntity> getByHandle(@PathVariable String handle) {
        return consentService.getConsentByHandle(handle)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Data
    public static class ConsentInitiateRequest {
        private String msmeId;
        private String fiuId = "FIU-IDBI-INNOVATE-001";
        private String aaId = "ONEMONEY_AA";
        private String purposeCode = "101"; // ReBIT Working Capital Assessment code
        private List<String> fiTypes = List.of("DEPOSIT", "GST_RETURNS", "EQUITIES");
    }
}
