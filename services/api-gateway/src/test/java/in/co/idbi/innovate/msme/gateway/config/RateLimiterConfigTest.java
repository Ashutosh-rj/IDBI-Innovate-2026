package in.co.idbi.innovate.msme.gateway.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;

import java.net.InetSocketAddress;
import static org.junit.jupiter.api.Assertions.assertEquals;

public class RateLimiterConfigTest {

    private RateLimiterConfig config;

    @BeforeEach
    void setUp() {
        config = new RateLimiterConfig();
    }

    @Test
    void testUserKeyResolverWithUserIdHeader() {
        KeyResolver resolver = config.userKeyResolver();
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/score")
                .header("X-User-Id", "MSME-USER-101")
                .remoteAddress(new InetSocketAddress("192.168.1.50", 80))
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        assertEquals("MSME-USER-101", resolver.resolve(exchange).block());
    }

    @Test
    void testUserKeyResolverFallbackToIpAddress() {
        KeyResolver resolver = config.userKeyResolver();
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/score")
                .remoteAddress(new InetSocketAddress("10.0.0.15", 80))
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        assertEquals("10.0.0.15", resolver.resolve(exchange).block());
    }

    @Test
    void testUserKeyResolverFallbackToAnonymous() {
        KeyResolver resolver = config.userKeyResolver();
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/score").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        assertEquals("anonymous", resolver.resolve(exchange).block());
    }

    @Test
    void testIpKeyResolver() {
        KeyResolver resolver = config.ipKeyResolver();
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/auth")
                .remoteAddress(new InetSocketAddress("172.16.0.5", 8080))
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        assertEquals("172.16.0.5", resolver.resolve(exchange).block());
    }

    @Test
    void testMsmeKeyResolverWithQueryParam() {
        KeyResolver resolver = config.msmeKeyResolver();
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/ingestion?msmeId=MSME-999").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        assertEquals("msme:MSME-999", resolver.resolve(exchange).block());
    }

    @Test
    void testMsmeKeyResolverWithHeader() {
        KeyResolver resolver = config.msmeKeyResolver();
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/ingestion")
                .header("X-MSME-Id", "MSME-888")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        assertEquals("msme:MSME-888", resolver.resolve(exchange).block());
    }
}
