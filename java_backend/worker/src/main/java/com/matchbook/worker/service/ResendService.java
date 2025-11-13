package com.matchbook.worker.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.matchbook.worker.model.EmailJob;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for sending emails via Resend API
 */
@Service
@Slf4j
public class ResendService {

    private static final String RESEND_API_URL = "https://api.resend.com/emails";
    private static final int MAX_RETRIES = 3;
    private static final Duration TIMEOUT = Duration.ofSeconds(30);

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public ResendService(
            @Value("${resend.api-key}") String apiKey,
            ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.webClient = WebClient.builder()
                .baseUrl(RESEND_API_URL)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    /**
     * Send an email via Resend API
     *
     * @param job Email job to send
     * @return true if sent successfully, false otherwise
     */
    public boolean sendEmail(EmailJob job) {
        try {
            Map<String, Object> payload = buildPayload(job);

            String response = webClient.post()
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(TIMEOUT)
                    .block();

            log.info("Email sent successfully to {} (jobId: {})", job.getTo(), job.getJobId());
            return true;

        } catch (WebClientResponseException e) {
            handleResendError(job, e);
            return false;

        } catch (Exception e) {
            log.error("Unexpected error sending email (jobId: {}): {}",
                    job.getJobId(), e.getMessage(), e);
            return false;
        }
    }

    /**
     * Build Resend API payload from EmailJob
     */
    private Map<String, Object> buildPayload(EmailJob job) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("to", job.getTo());
        payload.put("subject", job.getSubject());
        payload.put("html", job.getHtml());

        if (job.getFrom() != null && !job.getFrom().isEmpty()) {
            payload.put("from", job.getFrom());
        } else {
            payload.put("from", "MatchBook Rentals <no-reply@matchbookrentals.com>");
        }

        if (job.getReplyTo() != null && !job.getReplyTo().isEmpty()) {
            payload.put("reply_to", job.getReplyTo());
        }

        return payload;
    }

    /**
     * Handle Resend API errors with appropriate logging
     */
    private void handleResendError(EmailJob job, WebClientResponseException e) {
        HttpStatus status = (HttpStatus) e.getStatusCode();
        String responseBody = e.getResponseBodyAsString();

        switch (status) {
            case TOO_MANY_REQUESTS:
                log.warn("Rate limit hit for jobId {}: {}. Will retry.",
                        job.getJobId(), responseBody);
                break;

            case BAD_REQUEST:
                log.error("Invalid email payload for jobId {}: {}. Moving to DLQ.",
                        job.getJobId(), responseBody);
                break;

            case UNAUTHORIZED:
                log.error("Resend API authentication failed. Check RESEND_API_KEY.");
                break;

            default:
                log.error("Resend API error (status: {}) for jobId {}: {}",
                        status.value(), job.getJobId(), responseBody);
        }
    }

    /**
     * Check if an error is retryable
     */
    public boolean isRetryableError(WebClientResponseException e) {
        HttpStatus status = (HttpStatus) e.getStatusCode();
        return status == HttpStatus.TOO_MANY_REQUESTS ||
               status.is5xxServerError();
    }
}
