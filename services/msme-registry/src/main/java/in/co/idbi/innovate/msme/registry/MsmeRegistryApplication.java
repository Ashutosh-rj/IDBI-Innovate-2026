package in.co.idbi.innovate.msme.registry;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.Environment;
import java.util.Arrays;

@SpringBootApplication
@Slf4j
public class MsmeRegistryApplication {

    @Value("${spring.datasource.password:}")
    private String dbPassword;

    @Autowired
    private Environment env;

    @PostConstruct
    public void checkDefaultSecrets() {
        boolean isProd = Arrays.asList(env.getActiveProfiles()).contains("production") ||
                         "production".equalsIgnoreCase(env.getProperty("spring.profiles.active")) ||
                         "production".equalsIgnoreCase(env.getProperty("ENVIRONMENT", ""));
        if ("msme_secure_password_2026".equals(dbPassword)) {
            if (isProd) {
                log.error("FATAL: Default PostgreSQL password detected in production environment! Refusing to start (AUDIT-T0-3).");
                throw new IllegalStateException("FATAL: Default PostgreSQL password forbidden in production environment per AUDIT-T0-3.");
            } else {
                log.warn("SECURITY WARNING: Using default PostgreSQL password. Do not use in production environment!");
            }
        }
    }

    public static void main(String[] args) {
        SpringApplication.run(MsmeRegistryApplication.class, args);
    }
}
