package com.prashanth.dashboard.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/api/infrastructure")
public class InfrastructureController {

    private final Random random = new Random();

    @GetMapping("/telemetry")
    public Map<String, Object> getTelemetry() {
        double cpu = 30.0 + random.nextDouble() * 25.0; // 30% to 55%
        double mem = 62.0 + random.nextDouble() * 10.0; // 62% to 72%
        double net = 1.0 + random.nextDouble() * 1.5;   // 1.0 to 2.5 GB/s
        int dbPool = 8 + random.nextInt(12);            // 8 to 20 connections

        return Map.of(
            "cpuCount", String.format("%.1f%%", cpu),
            "memoryPoolInfo", String.format("%.1f%%", mem),
            "networkIoRate", String.format("%.2f GB/s", net),
            "activeInstances", "3 Active",
            "vaultHsmStatus", "OK",
            "dbConnections", dbPool + "/100"
        );
    }
}
