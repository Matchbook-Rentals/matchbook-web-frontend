package com.matchbook.worker.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Email job model matching the structure from Next.js sendNotificationEmail()
 *
 * @see /contracts/schemas/email-job.v1.schema.json - Contract schema (source of truth)
 * @see src/lib/email-queue-client.ts - TypeScript implementation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailJob {

    @JsonProperty("to")
    private String to;

    @JsonProperty("subject")
    private String subject;

    @JsonProperty("html")
    private String html;

    @JsonProperty("from")
    private String from;

    @JsonProperty("replyTo")
    private String replyTo;

    @JsonProperty("metadata")
    private Map<String, String> metadata;

    @JsonProperty("jobId")
    private String jobId;

    @JsonProperty("enqueuedAt")
    private Long enqueuedAt;

    @JsonProperty("attemptNumber")
    private Integer attemptNumber;

    /**
     * Get attempt number, defaulting to 1 if not set
     */
    public int getAttemptNumber() {
        return attemptNumber != null ? attemptNumber : 1;
    }

    /**
     * Check if this job has exceeded max retry attempts
     */
    public boolean hasExceededMaxAttempts(int maxAttempts) {
        return getAttemptNumber() > maxAttempts;
    }

    /**
     * Increment attempt number for retry
     */
    public void incrementAttempt() {
        this.attemptNumber = getAttemptNumber() + 1;
    }
}
