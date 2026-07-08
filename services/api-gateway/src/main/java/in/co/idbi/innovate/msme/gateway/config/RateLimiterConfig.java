package in.co.idbi.innovate.msme.gateway.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;

@Configuration
@Slf4j
public class RateLimiterConfig {

    /**
     * Primary KeyResolver for Redis-backed rate limiting (AUDIT-T3-3).
     * Resolves the rate limit key based on:
     * 1. Authenticated User ID (X-User-Id header injected by JwtAuthFilter).
     * 2. Fallback to Client Remote IP Address if unauthenticated/open endpoint.
     * 3. Fallback to "anonymous" if IP cannot be resolved.
     */
    @Bean
    @Primary
    public KeyResolver userKeyResolver() {
        return exchange -> {
            String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");
            if (userId != null && !userId.trim().isEmpty() && !"UNKNOWN".equalsIgnoreCase(userId)) {
                log.debug("Rate limiting key resolved to User ID: [{}]", userId);
                return Mono.just(userId);
            }

            InetSocketAddress remoteAddress = exchange.getRequest().getRemoteAddress();
            if (remoteAddress != null && remoteAddress.getAddress() != null) {
                String ip = remoteAddress.getAddress().getHostAddress();
                log.debug("Rate limiting key resolved to Remote IP: [{}]", ip);
                return Mono.just(ip);
            }

            log.debug("Rate limiting key resolved to fallback: [anonymous]");
            return Mono.just("anonymous");
        };
    }

    /**
     * IP-only KeyResolver for public/open endpoints (e.g., authentication, docs).
     */
    @Bean
    public KeyResolver ipKeyResolver() {
        return exchange -> {
            InetSocketAddress remoteAddress = exchange.getRequest().getRemoteAddress();
            if (remoteAddress != null && remoteAddress.getAddress() != null) {
                return Mono.just(remoteAddress.getAddress().getHostAddress());
            }
            return Mono.just("anonymous");
        };
    }

    /**
     * MSME-specific KeyResolver for tenant-scoped operations.
     */
    @Bean
    public KeyResolver msmeKeyResolver() {
        return exchange -> {
            String msmeId = exchange.getRequest().getQueryParams().getFirst("msmeId");
            if (msmeId == null || msmeId.trim().isEmpty()) {
                msmeId = exchange.getRequest().getHeaders().getFirst("X-MSME-Id");
            }
            if (msmeId != null && !msmeId.trim().isEmpty()) {
                return Mono.just("msme:" + msmeId);
            }
            // Fallback to userKeyResolver logic
            String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");
            return Mono.just(userId != null && !userId.trim().isEmpty() ? userId : "anonymous");
        };
    }
}
