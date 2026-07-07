package in.co.idbi.innovate.msme.healthcard.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "health_cards", indexes = {
    @Index(name = "idx_card_msme_id", columnList = "msmeId", unique = true),
    @Index(name = "idx_card_score", columnList = "healthScore"),
    @Index(name = "idx_card_risk", columnList = "riskBand")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class HealthCardEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String cardId;

    @Column(nullable = false, unique = true, length = 64)
    private String msmeId;

    @Column(nullable = false)
    private int healthScore;

    @Column(nullable = false, length = 30)
    private String riskBand;

    @Column(nullable = false)
    private double defaultProbability12m;

    @Column(nullable = false)
    private double taxComplianceScore;

    @Column(nullable = false)
    private double cashFlowVelocityScore;

    @Column(nullable = false)
    private double payrollStabilityScore;

    @Column(nullable = false)
    private double businessVintageScore;

    @Column(nullable = false)
    private double liquidityBufferScore;

    @Column(nullable = false)
    private double dataQualityScore;

    @Column(nullable = false)
    private boolean isNtcThinFile;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String topReasonCodesJson;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String ocenLspPayloadJson;

    @Column(nullable = false)
    private boolean publishedToOcen;

    @Column(length = 128)
    private String ocenTransactionRef;

    @Column(nullable = false)
    private LocalDateTime computedAt;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

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
}
