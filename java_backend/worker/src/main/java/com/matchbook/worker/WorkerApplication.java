package com.matchbook.worker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * MatchBook Worker Service
 *
 * Background worker for:
 * - Email queue processing with rate limiting (2 emails/sec for Resend)
 * - Heavy computation offloading (future)
 * - Scheduled background jobs (future)
 */
@SpringBootApplication
@EnableScheduling
public class WorkerApplication {

    public static void main(String[] args) {
        SpringApplication.run(WorkerApplication.class, args);
    }
}
