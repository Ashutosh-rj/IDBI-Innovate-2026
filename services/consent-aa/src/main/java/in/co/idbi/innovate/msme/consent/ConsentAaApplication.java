package in.co.idbi.innovate.msme.consent;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ConsentAaApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConsentAaApplication.class, args);
    }
}
