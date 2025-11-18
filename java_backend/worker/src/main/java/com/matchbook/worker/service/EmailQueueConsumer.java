package com.matchbook.worker.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.util.concurrent.RateLimiter;
import com.matchbook.worker.model.EmailJob;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * Email queue consumer with rate limiting (conservative 1.67 emails/sec to avoid Resend rate limits)
 */
@Service
@Slf4j
public class EmailQueueConsumer {

    private static final String PENDING_QUEUE = "matchbook:emails:pending";
    private static final String PROCESSING_QUEUE = "matchbook:emails:processing";
    private static final String FAILED_QUEUE = "matchbook:emails:failed";
    private static final String DLQ = "matchbook:emails:dlq";

    private static final int MAX_ATTEMPTS = 3;
    // Conservative rate: 1 email every 600ms (1.67/sec) to avoid Resend rate limits
    // Resend allows 2/sec but measures per calendar second, so we add buffer
    private static final double EMAILS_PER_SECOND = 1.67;
    private static final long POLL_TIMEOUT_SECONDS = 5;
    private static final long RETRY_DELAY_BASE_MS = 1000; // 1 second base

    private final RedisTemplate<String, String> redisTemplate;
    private final ResendService resendService;
    private final ObjectMapper objectMapper;
    private final RateLimiter rateLimiter;

    @Value("${email.queue.enabled:true}")
    private boolean queueEnabled;

    private volatile boolean running = false;

    public EmailQueueConsumer(
            RedisTemplate<String, String> redisTemplate,
            ResendService resendService,
            ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.resendService = resendService;
        this.objectMapper = objectMapper;
        this.rateLimiter = RateLimiter.create(EMAILS_PER_SECOND);
    }

    @PostConstruct
    public void init() {
        if (queueEnabled) {
            running = true;
            long millisPerEmail = Math.round(1000.0 / EMAILS_PER_SECOND);
            log.info("========================================");
            log.info("Email Queue Consumer Configuration:");
            log.info("  Rate Limit: {} emails/sec", EMAILS_PER_SECOND);
            log.info("  Interval: 1 email per {}ms", millisPerEmail);
            log.info("  Max Attempts: {}", MAX_ATTEMPTS);
            log.info("  Retry Base Delay: {}ms", RETRY_DELAY_BASE_MS);
            log.info("  Queue Poll Timeout: {}s", POLL_TIMEOUT_SECONDS);
            log.info("========================================");
            // Start consumer thread
            Thread consumerThread = new Thread(this::consumeQueue, "email-queue-consumer");
            consumerThread.setDaemon(false);
            consumerThread.start();
        } else {
            log.warn("Email queue consumer is DISABLED");
        }
    }

    @PreDestroy
    public void shutdown() {
        running = false;
        log.info("Email queue consumer shutting down...");
    }

    /**
     * Main consumer loop - runs continuously
     */
    private void consumeQueue() {
        log.info("Email queue consumer started");

        while (running) {
            try {
                processNextEmail();
            } catch (Exception e) {
                log.error("Error in consumer loop: {}", e.getMessage(), e);
                sleepQuietly(1000); // Back off on errors
            }
        }

        log.info("Email queue consumer stopped");
    }

    /**
     * Process next email from queue with rate limiting
     */
    private void processNextEmail() {
        try {
            // Block until we can send (rate limiting)
            rateLimiter.acquire();

            // Pop email from queue (blocking with timeout)
            String jobJson = redisTemplate.opsForList()
                    .rightPopAndLeftPush(PENDING_QUEUE, PROCESSING_QUEUE,
                            POLL_TIMEOUT_SECONDS, TimeUnit.SECONDS);

            if (jobJson == null) {
                return; // No emails in queue, loop will retry
            }

            EmailJob job = objectMapper.readValue(jobJson, EmailJob.class);
            log.debug("Processing email job {} (attempt {})", job.getJobId(), job.getAttemptNumber());

            // Send email
            boolean success = resendService.sendEmail(job);

            if (success) {
                // Remove from processing queue
                redisTemplate.opsForList().remove(PROCESSING_QUEUE, 1, jobJson);
                log.info("Email sent successfully: {}", job.getJobId());
            } else {
                handleFailedEmail(job, jobJson);
            }

        } catch (Exception e) {
            log.error("Error processing email: {}", e.getMessage(), e);
        }
    }

    /**
     * Handle failed email with retry logic
     */
    private void handleFailedEmail(EmailJob job, String originalJobJson) {
        job.incrementAttempt();

        if (job.hasExceededMaxAttempts(MAX_ATTEMPTS)) {
            // Move to dead letter queue
            moveToDLQ(job, originalJobJson);
        } else {
            // Retry with exponential backoff
            retryEmail(job, originalJobJson);
        }

        // Remove from processing queue
        redisTemplate.opsForList().remove(PROCESSING_QUEUE, 1, originalJobJson);
    }

    /**
     * Retry email with exponential backoff
     */
    private void retryEmail(EmailJob job, String originalJobJson) {
        try {
            long delayMs = RETRY_DELAY_BASE_MS * (long) Math.pow(2, job.getAttemptNumber() - 1);

            log.info("Retrying email {} (attempt {}/{}) after {}ms",
                    job.getJobId(), job.getAttemptNumber(), MAX_ATTEMPTS, delayMs);

            // Sleep before re-queueing
            Thread.sleep(delayMs);

            // Update job JSON with new attempt number
            String updatedJobJson = objectMapper.writeValueAsString(job);

            // Add back to pending queue
            redisTemplate.opsForList().leftPush(PENDING_QUEUE, updatedJobJson);

            // Track retry
            redisTemplate.opsForList().leftPush(FAILED_QUEUE, updatedJobJson);

        } catch (Exception e) {
            log.error("Error retrying email {}: {}", job.getJobId(), e.getMessage(), e);
        }
    }

    /**
     * Move email to dead letter queue (max retries exceeded)
     */
    private void moveToDLQ(EmailJob job, String jobJson) {
        log.error("Email {} exceeded max attempts ({}). Moving to DLQ.",
                job.getJobId(), MAX_ATTEMPTS);

        redisTemplate.opsForList().leftPush(DLQ, jobJson);

        // TODO: Send alert to admins about DLQ emails
    }

    /**
     * Scheduled task to recover stuck emails in processing queue
     * Runs every 5 minutes
     */
    @Scheduled(fixedDelay = 300000) // 5 minutes
    public void recoverStuckEmails() {
        if (!queueEnabled) return;

        try {
            Long processingCount = redisTemplate.opsForList().size(PROCESSING_QUEUE);

            if (processingCount != null && processingCount > 0) {
                log.warn("Found {} stuck emails in processing queue. Recovering...", processingCount);

                // Move all stuck emails back to pending queue
                for (int i = 0; i < processingCount; i++) {
                    String jobJson = redisTemplate.opsForList()
                            .rightPopAndLeftPush(PROCESSING_QUEUE, PENDING_QUEUE);

                    if (jobJson == null) break;
                }

                log.info("Recovered {} emails from processing queue", processingCount);
            }
        } catch (Exception e) {
            log.error("Error recovering stuck emails: {}", e.getMessage(), e);
        }
    }

    /**
     * Get queue stats for monitoring
     */
    public QueueStats getQueueStats() {
        return new QueueStats(
                getQueueSize(PENDING_QUEUE),
                getQueueSize(PROCESSING_QUEUE),
                getQueueSize(FAILED_QUEUE),
                getQueueSize(DLQ)
        );
    }

    private long getQueueSize(String queueName) {
        Long size = redisTemplate.opsForList().size(queueName);
        return size != null ? size : 0;
    }

    private void sleepQuietly(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /**
     * Queue statistics record
     */
    public record QueueStats(
            long pending,
            long processing,
            long failed,
            long dlq
    ) {}
}
