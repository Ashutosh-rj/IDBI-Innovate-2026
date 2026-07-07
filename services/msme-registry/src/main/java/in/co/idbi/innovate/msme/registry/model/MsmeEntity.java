package in.co.idbi.innovate.msme.registry.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "msme_entities", indexes = {
    @Index(name = "idx_udyam_number", columnList = "udyamNumber", unique = true),
    @Index(name = "idx_pan", columnList = "pan", unique = true),
    @Index(name = "idx_gstin", columnList = "gstin")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MsmeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String msmeId;

    @Column(nullable = false, unique = true, length = 30)
    private String udyamNumber;

    @Column(nullable = false, length = 150)
    private String businessName;

    @Column(nullable = false, length = 10)
    private String pan;

    @Column(length = 15)
    private String gstin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Sector sector;

    @Column(nullable = false)
    private LocalDate registrationDate;

    @Column(nullable = false)
    private boolean udyamVerified;

    @Column(nullable = false)
    private boolean panGstMatched;

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

    public enum Category { MICRO, SMALL, MEDIUM }
    public enum Sector { MANUFACTURING, SERVICES, TRADING }
}
