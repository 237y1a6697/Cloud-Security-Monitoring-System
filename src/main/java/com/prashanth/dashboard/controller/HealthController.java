package com.prashanth.dashboard.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * HealthController
 *
 * Provides a lightweight health-check endpoint at GET /health.
 * Used by:
 *   1. Render — as the health check path to confirm the service is live
 *   2. Uptime monitors (e.g., UptimeRobot) to keep the Render free-tier
 *      service warm and prevent cold-start delays that cause login to "hang".
 *
 * This endpoint is explicitly permitted in SecurityConfig.
 */
@RestController
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "SentinelCore SecureOps"
        ));
    }
}
