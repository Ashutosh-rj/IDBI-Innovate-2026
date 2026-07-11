package in.co.idbi.innovate.msme.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.env.Environment;
import jakarta.annotation.PostConstruct;
import java.util.Arrays;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
@Slf4j
public class JwtAuthFilter implements GlobalFilter, Ordered {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Autowired
    private Environment env;

    @PostConstruct
    public void validateSecret() {
        if (jwtSecret == null || jwtSecret.trim().isEmpty() || jwtSecret.length() < 32) {
            log.error("FATAL: JWT secret is missing or less than 32 characters (256 bits). Refusing to start (AUDIT-T0-2).");
            throw new IllegalStateException("FATAL: JWT secret is missing or insecure. Minimum 256 bits required.");
        }
        boolean isProd = Arrays.asList(env.getActiveProfiles()).contains("production") ||
                         "production".equalsIgnoreCase(env.getProperty("spring.profiles.active")) ||
                         "production".equalsIgnoreCase(env.getProperty("ENVIRONMENT", ""));
        if ("idbi_innovate_2026_super_secret_jwt_signing_key_at_least_256_bits".equals(jwtSecret)) {
            if (isProd) {
                log.error("FATAL: Default JWT secret detected in production environment! Refusing to start (AUDIT-T0-3).");
                throw new IllegalStateException("FATAL: Default JWT secret detected in production environment per AUDIT-T0-3.");
            } else {
                log.warn("SECURITY WARNING: Using default JWT secret. Do not use in production environment!");
            }
        }
    }

    private static final List<String> OPEN_ENDPOINTS = List.of(
            "/health", "/actuator", "/api/v1/auth", "/docs", "/redoc", "/openapi.json"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        // Allow open endpoints without JWT authentication
        if (OPEN_ENDPOINTS.stream().anyMatch(path::startsWith)) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("Missing or invalid Authorization header for path: [{}]", path);
            return onError(exchange, HttpStatus.UNAUTHORIZED);
        }

        String token = authHeader.substring(7);
        try {
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();

            String userId = claims.getSubject();
            String role = claims.get("role", String.class);

            ServerHttpRequest mutated = exchange.getRequest().mutate()
                    .header("X-User-Id", userId != null ? userId : "UNKNOWN")
                    .header("X-User-Role", role != null ? role : "MSME_USER")
                    .build();

            return chain.filter(exchange.mutate().request(mutated).build());
        } catch (Exception e) {
            log.error("JWT validation failed: {}", e.getMessage());
            return onError(exchange, HttpStatus.UNAUTHORIZED);
        }
    }

    private Mono<Void> onError(ServerWebExchange exchange, HttpStatus status) {
        exchange.getResponse().setStatusCode(status);
        return exchange.getResponse().setComplete();
    }

    @Override
    public int getOrder() {
        return -100; // Execute early in filter chain
    }
}
