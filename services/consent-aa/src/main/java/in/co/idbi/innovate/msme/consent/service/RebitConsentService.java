package in.co.idbi.innovate.msme.consent.service;

import in.co.idbi.innovate.msme.consent.model.ConsentLedgerEntity;
import in.co.idbi.innovate.msme.consent.repository.ConsentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import jakarta.annotation.PostConstruct;

@Service
@RequiredArgsConstructor
@Slf4j
public class RebitConsentService {

    private final ConsentRepository repository;

    @Value("${msme.adapter.mode:SANDBOX}")
    private String adapterMode;

    private final Map<String, PrivateKey> ephemeralKeyStore = new ConcurrentHashMap<>();
    private KeyPair serviceSigningKeyPair;

    @Value("${msme.adapter.jws-private-key-pkcs8:}")
    private String servicePrivateKeyPem;

    @PostConstruct
    public void initCrypto() {
        try {
            if (Security.getProvider("BC") == null) {
                Security.addProvider(new BouncyCastleProvider());
            }
            if (servicePrivateKeyPem != null && !servicePrivateKeyPem.trim().isEmpty()) {
                byte[] keyBytes = Base64.getDecoder().decode(servicePrivateKeyPem.trim());
                PrivateKey privateKey = KeyFactory.getInstance("RSA").generatePrivate(new java.security.spec.PKCS8EncodedKeySpec(keyBytes));
                this.serviceSigningKeyPair = new KeyPair(null, privateKey);
                log.info("Initialized persistent RSA signing key from injected PKCS8 specification (AUDIT-T0-4).");
            } else {
                KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
                kpg.initialize(2048);
                this.serviceSigningKeyPair = kpg.generateKeyPair();
                log.info("Initialized auto-generated RSA-2048 signing key pair for ReBIT AA JWS detached signatures (AUDIT-T0-4).");
            }
        } catch (Exception e) {
            throw new IllegalStateException("Failed to initialize cryptographic keys", e);
        }
    }

    public String generateEphemeralX25519Key(String consentHandle) {
        try {
            if (Security.getProvider("BC") == null) {
                Security.addProvider(new BouncyCastleProvider());
            }
            KeyPairGenerator kpg = KeyPairGenerator.getInstance("X25519");
            KeyPair keyPair = kpg.generateKeyPair();
            ephemeralKeyStore.put(consentHandle, keyPair.getPrivate());
            byte[] pubKeyBytes = keyPair.getPublic().getEncoded();
            String base64PubKey = Base64.getEncoder().encodeToString(pubKeyBytes);
            log.info("Generated ephemeral X25519 public key for consent handle [{}]: [{}]", consentHandle, base64PubKey);
            return base64PubKey;
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate X25519 ephemeral key pair", e);
        }
    }

    public String generateJwsDetachedSignature(String payload) {
        try {
            Signature signer = Signature.getInstance("SHA256withRSA");
            signer.initSign(serviceSigningKeyPair.getPrivate());
            signer.update(payload.getBytes(StandardCharsets.UTF_8));
            byte[] signatureBytes = signer.sign();
            String base64Sig = Base64.getUrlEncoder().withoutPadding().encodeToString(signatureBytes);

            String headerJson = "{\"alg\":\"RS256\",\"typ\":\"JWS\"}";
            String base64Header = Base64.getUrlEncoder().withoutPadding().encodeToString(headerJson.getBytes(StandardCharsets.UTF_8));
            return base64Header + ".." + base64Sig;
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate JWS detached signature", e);
        }
    }

    private String computeHash(String previousHash, String consentHandle, String status, String timestamp) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String input = (previousHash != null ? previousHash : "GENESIS_HASH") + "|" + consentHandle + "|" + status + "|" + timestamp;
            byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 computation failed", e);
        }
    }

    public boolean verifyHashChain(String msmeId) {
        List<ConsentLedgerEntity> chain = repository.findByMsmeIdOrderByCreatedAtAsc(msmeId);
        if (chain.isEmpty()) return true;

        String expectedPrevHash = null;
        for (int i = 0; i < chain.size(); i++) {
            ConsentLedgerEntity current = chain.get(i);
            if (!Objects.equals(current.getPreviousHash(), expectedPrevHash)) {
                log.error("Hash chain broken at index [{}] for MSME [{}]. Expected prevHash [{}], found [{}]",
                        i, msmeId, expectedPrevHash, current.getPreviousHash());
                return false;
            }
            String recomputedHash = computeHash(current.getPreviousHash(), current.getConsentHandle(), current.getStatus().name(), current.getUpdatedAt().toString());
            if (!Objects.equals(current.getEntryHash(), recomputedHash)) {
                log.error("Hash mismatch at index [{}] for MSME [{}]. Expected entryHash [{}], found [{}]",
                        i, msmeId, recomputedHash, current.getEntryHash());
                return false;
            }
            expectedPrevHash = current.getEntryHash();
        }
        return true;
    }

    @Transactional
    public ConsentLedgerEntity initiateConsent(String msmeId, String fiuId, String aaId, String purposeCode, List<String> fiTypes) {
        log.info("Initiating ReBIT AA v2.0 consent for MSME [{}] via AA [{}] in mode [{}]", msmeId, aaId, adapterMode);

        String handle = "REBIT-CH-" + UUID.randomUUID().toString().substring(0, 13).toUpperCase();
        String typesStr = String.join(",", fiTypes);
        LocalDateTime now = LocalDateTime.now();
        String statusStr = ConsentLedgerEntity.ConsentStatus.PENDING_USER_APPROVAL.name();

        Optional<ConsentLedgerEntity> latestOpt = repository.findFirstByMsmeIdOrderByCreatedAtDesc(msmeId);
        String prevHash = latestOpt.map(ConsentLedgerEntity::getEntryHash).orElse(null);

        ConsentLedgerEntity entity = ConsentLedgerEntity.builder()
                .consentHandle(handle)
                .msmeId(msmeId)
                .fiuId(fiuId)
                .aaId(aaId)
                .purposeCode(purposeCode)
                .fiTypes(typesStr)
                .status(ConsentLedgerEntity.ConsentStatus.PENDING_USER_APPROVAL)
                .consentStart(now)
                .consentExpiry(now.plusMonths(6))
                .createdAt(now)
                .updatedAt(now)
                .previousHash(prevHash)
                .entryHash(computeHash(prevHash, handle, statusStr, now.toString()))
                .build();

        ConsentLedgerEntity saved = repository.save(entity);
        log.info("Consent initiated successfully. Consent Handle: [{}], entryHash: [{}]", saved.getConsentHandle(), saved.getEntryHash());
        return saved;
    }

    @Transactional
    public ConsentLedgerEntity approveConsent(String consentHandle) {
        log.info("Processing user consent approval for handle: [{}]", consentHandle);
        ConsentLedgerEntity entity = repository.findByConsentHandle(consentHandle)
                .orElseThrow(() -> new IllegalArgumentException("Invalid consent handle: " + consentHandle));

        LocalDateTime now = LocalDateTime.now();
        entity.setStatus(ConsentLedgerEntity.ConsentStatus.ACTIVE);
        entity.setUpdatedAt(now);
        entity.setEntryHash(computeHash(entity.getPreviousHash(), entity.getConsentHandle(), entity.getStatus().name(), now.toString()));
        ConsentLedgerEntity updated = repository.save(entity);

        String x25519PubKey = generateEphemeralX25519Key(consentHandle);
        String fiRequestPayload = "{\"consentHandle\":\"" + consentHandle + "\",\"keyMaterial\":{\"cryptoAlg\":\"ECDH\",\"curve\":\"Curve25519\",\"DHPublicKey\":{\"KeyValue\":\"" + x25519PubKey + "\"}}}";
        String jwsSignature = generateJwsDetachedSignature(fiRequestPayload);

        updated.setEphemeralX25519PublicKey(x25519PubKey);
        PrivateKey privKey = ephemeralKeyStore.get(consentHandle);
        if (privKey != null) {
            updated.setEphemeralPrivateKeyBase64(Base64.getEncoder().encodeToString(privKey.getEncoded()));
        }
        updated.setJwsDetachedSignature(jwsSignature);

        if ("SANDBOX".equalsIgnoreCase(adapterMode)) {
            log.info("Sandbox mode: Automatically generating FI data fetch token for handle [{}] with JWS [{}]", consentHandle, jwsSignature);
        } else {
            log.info("Production mode: Triggering ReBIT FI data request to AA network");
        }

        return updated;
    }

    @Transactional
    public ConsentLedgerEntity revokeConsent(String consentHandle) {
        log.info("Revoking consent handle: [{}]", consentHandle);
        ConsentLedgerEntity entity = repository.findByConsentHandle(consentHandle)
                .orElseThrow(() -> new IllegalArgumentException("Invalid consent handle: " + consentHandle));

        LocalDateTime now = LocalDateTime.now();
        entity.setStatus(ConsentLedgerEntity.ConsentStatus.REVOKED);
        entity.setUpdatedAt(now);
        entity.setEntryHash(computeHash(entity.getPreviousHash(), entity.getConsentHandle(), entity.getStatus().name(), now.toString()));
        return repository.save(entity);
    }

    @Transactional
    public ConsentLedgerEntity expireConsent(String consentHandle) {
        log.info("Expiring consent handle: [{}]", consentHandle);
        ConsentLedgerEntity entity = repository.findByConsentHandle(consentHandle)
                .orElseThrow(() -> new IllegalArgumentException("Invalid consent handle: " + consentHandle));

        LocalDateTime now = LocalDateTime.now();
        entity.setStatus(ConsentLedgerEntity.ConsentStatus.EXPIRED);
        entity.setUpdatedAt(now);
        entity.setEntryHash(computeHash(entity.getPreviousHash(), entity.getConsentHandle(), entity.getStatus().name(), now.toString()));
        return repository.save(entity);
    }

    public List<ConsentLedgerEntity> getConsentsForMsme(String msmeId) {
        return repository.findByMsmeId(msmeId);
    }

    public Optional<ConsentLedgerEntity> getConsentByHandle(String handle) {
        return repository.findByConsentHandle(handle);
    }

    public PrivateKey getEphemeralPrivateKey(String consentHandle) {
        PrivateKey key = ephemeralKeyStore.get(consentHandle);
        if (key != null) return key;
        return repository.findByConsentHandle(consentHandle)
                .map(ConsentLedgerEntity::getEphemeralPrivateKeyBase64)
                .filter(b64 -> b64 != null && !b64.isEmpty())
                .map(b64 -> {
                    try {
                        if (Security.getProvider("BC") == null) {
                            Security.addProvider(new BouncyCastleProvider());
                        }
                        KeyFactory kf = KeyFactory.getInstance("X25519");
                        PrivateKey rehydrated = kf.generatePrivate(new java.security.spec.PKCS8EncodedKeySpec(Base64.getDecoder().decode(b64)));
                        ephemeralKeyStore.put(consentHandle, rehydrated);
                        return rehydrated;
                    } catch (Exception e) {
                        log.error("Failed to rehydrate X25519 private key from DB for handle [{}]: {}", consentHandle, e.getMessage());
                        return null;
                    }
                }).orElse(null);
    }
}
