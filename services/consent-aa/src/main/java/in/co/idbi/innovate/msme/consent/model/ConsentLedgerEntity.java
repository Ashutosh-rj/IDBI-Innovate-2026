package in.co.idbi.innovate.msme.consent.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "consent_ledger", indexes = {
    @Index(name = "idx_msme_id", columnList = "msmeId"),
    @Index(name = "idx_consent_handle", columnList = "consentHandle", unique = true),
    @Index(name = "idx_status", columnList = "status")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ConsentLedgerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String consentId;

    @Column(nullable = false, unique = true, length = 64)
    private String consentHandle;

    @Column(nullable = false, length = 64)
    private String msmeId;

    @Column(nullable = false, length = 64)
    private String fiuId;

    @Column(nullable = false, length = 64)
    private String aaId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConsentStatus status;

    @Column(nullable = false)
    private String purposeCode;

    @Column(nullable = false, length = 2000)
    private String fiTypes; // Comma-separated: DEPOSIT, GST_RETURNS, EQUITIES

    @Column(nullable = false)
    private LocalDateTime consentStart;

    @Column(nullable = false)
    private LocalDateTime consentExpiry;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum ConsentStatus {
        INITIATED, PENDING_USER_APPROVAL, ACTIVE, REVOKED, EXPIRED, REJECTED
    }
}
