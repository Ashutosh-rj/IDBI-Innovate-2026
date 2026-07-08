package in.co.idbi.innovate.msme.gateway.filter;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest(properties = {
        "jwt.secret=idbi_innovate_2026_super_secret_jwt_signing_key_at_least_256_bits",
        "management.health.redis.enabled=false"
})
@AutoConfigureWebTestClient
@ActiveProfiles("test")
public class JwtAuthFilterTest {

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    @Autowired
    private Environment env;

    private static final String VALID_SECRET = "idbi_innovate_2026_super_secret_jwt_signing_key_at_least_256_bits";

    @Test
    void testMissingAuthHeaderReturns401() {
        webTestClient.get()
                .uri("/api/v1/registry/udyam/verify")
                .exchange()
                .expectStatus().isUnauthorized();
    }

    @Test
    void testTamperedJwtReturns401() {
        webTestClient.get()
                .uri("/api/v1/registry/udyam/verify")
                .header("Authorization", "Bearer invalid.token.string")
                .exchange()
                .expectStatus().isUnauthorized();
    }

    @Test
    void testOpenEndpointAllowedWithoutAuth() {
        webTestClient.get()
                .uri("/actuator/health")
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    void testValidJwtAllowsRequest() {
        SecretKey key = Keys.hmacShaKeyFor(VALID_SECRET.getBytes(StandardCharsets.UTF_8));
        String token = Jwts.builder()
                .subject("MSME-12345")
                .claim("role", "ROLE_BANKER")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(key)
                .compact();

        webTestClient.get()
                .uri("/api/v1/registry/udyam/verify")
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().is5xxServerError(); // 5xx from offline downstream service on port 8083, proving JwtAuthFilter passed (not 401) and RateLimiter KeyResolver succeeded!
    }

    @Test
    void testStartupFailsWithoutJwtSecret() {
        JwtAuthFilter filter = new JwtAuthFilter();
        ReflectionTestUtils.setField(filter, "jwtSecret", "");
        assertThrows(IllegalStateException.class, filter::validateSecret);

        ReflectionTestUtils.setField(filter, "jwtSecret", "short_secret");
        assertThrows(IllegalStateException.class, filter::validateSecret);
    }
}
