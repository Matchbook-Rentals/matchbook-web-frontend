package com.matchbook.worker.controller;

import com.matchbook.worker.service.EmailQueueConsumer;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Health check and monitoring endpoints
 */
@RestController
@RequestMapping("/health")
@RequiredArgsConstructor
public class HealthController {

    private final EmailQueueConsumer emailQueueConsumer;
    private final RedisTemplate<String, String> redisTemplate;

    @GetMapping
    public Map<String, Object> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "matchbook-worker");
        health.put("timestamp", System.currentTimeMillis());

        // Check Redis connectivity
        try {
            redisTemplate.getConnectionFactory().getConnection().ping();
            health.put("redis", "connected");
        } catch (Exception e) {
            health.put("redis", "disconnected");
            health.put("status", "DOWN");
        }

        return health;
    }

    @GetMapping("/queue")
    public Map<String, Object> queueStats() {
        EmailQueueConsumer.QueueStats stats = emailQueueConsumer.getQueueStats();

        Map<String, Object> response = new HashMap<>();
        response.put("pending", stats.pending());
        response.put("processing", stats.processing());
        response.put("failed", stats.failed());
        response.put("dlq", stats.dlq());
        response.put("total", stats.pending() + stats.processing());
        response.put("timestamp", System.currentTimeMillis());

        return response;
    }
}
