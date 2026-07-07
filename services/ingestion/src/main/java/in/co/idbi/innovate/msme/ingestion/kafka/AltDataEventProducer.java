package in.co.idbi.innovate.msme.ingestion.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AltDataEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;

    @Value("${msme.kafka.topics.raw-alt-data:raw-alt-data-events}")
    private String topicName;

    public void publishAltDataEvent(String msmeId, String jsonPayload) {
        log.info("Publishing alternate data ingestion event to Kafka topic [{}] for MSME [{}]", topicName, msmeId);
        try {
            kafkaTemplate.send(topicName, msmeId, jsonPayload);
            log.info("Successfully published Kafka event for MSME [{}]", msmeId);
        } catch (Exception e) {
            log.error("Failed to publish Kafka event for MSME [{}]: {}", msmeId, e.getMessage());
            // In standalone POC without running Kafka broker, we catch exception gracefully to prevent API failure
        }
    }
}
