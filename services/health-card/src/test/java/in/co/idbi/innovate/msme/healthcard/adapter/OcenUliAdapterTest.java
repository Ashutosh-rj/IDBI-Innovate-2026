package in.co.idbi.innovate.msme.healthcard.adapter;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.security.Signature;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class OcenUliAdapterTest {

    @Autowired
    private OcenUliAdapter ocenUliAdapter;

    @Test
    void testSignPayloadProducesValidRsaSignature() throws Exception {
        String payload = "{\"msmeId\":\"MSME-123\",\"score\":780}";
        String signatureBase64 = ocenUliAdapter.signPayload(payload);

        assertNotNull(signatureBase64);
        assertFalse(signatureBase64.isEmpty());

        byte[] sigBytes = Base64.getDecoder().decode(signatureBase64);
        Signature verifier = Signature.getInstance("SHA256withRSA");
        verifier.initVerify(ocenUliAdapter.getLspSigningKeyPair().getPublic());
        verifier.update(payload.getBytes(StandardCharsets.UTF_8));
        assertTrue(verifier.verify(sigBytes), "RSA signature verification failed");
    }

    @Test
    void testPublishScorecardWithUnreachableUrlReturnsFallbackRef() {
        ReflectionTestUtils.setField(ocenUliAdapter, "ocenSandboxUrl", "http://localhost:19999/non-existent-port");
        String result = ocenUliAdapter.publishScorecardToOcen("MSME-404", "{\"test\":true}");

        assertNotNull(result);
        assertTrue(result.startsWith("OCEN-TXN-"), "Should return fallback transaction ref when URL is unreachable");
    }

    @Test
    void testPublishScorecardSendsRequiredHeadersAndReceivesResponse() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/v4/lsp/publish-scorecard", exchange -> {
            String idempotencyKey = exchange.getRequestHeaders().getFirst("X-Idempotency-Key");
            String signature = exchange.getRequestHeaders().getFirst("X-Signature");
            String lspId = exchange.getRequestHeaders().getFirst("X-LSP-ID");

            if (idempotencyKey != null && signature != null && lspId != null) {
                String response = "OCEN-REAL-SUCCESS-REF-999";
                exchange.sendResponseHeaders(200, response.length());
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(response.getBytes(StandardCharsets.UTF_8));
                }
            } else {
                exchange.sendResponseHeaders(400, 0);
                exchange.close();
            }
        });
        server.start();

        try {
            int port = server.getAddress().getPort();
            ReflectionTestUtils.setField(ocenUliAdapter, "ocenSandboxUrl", "http://localhost:" + port + "/v4/lsp/publish-scorecard");

            String result = ocenUliAdapter.publishScorecardToOcen("MSME-888", "{\"score\":850}");
            assertEquals("OCEN-REAL-SUCCESS-REF-999", result);
        } finally {
            server.stop(0);
        }
    }
}
