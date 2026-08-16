package com.prashanth.dashboard.controller;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.prashanth.dashboard.aop.Auditable;
import com.prashanth.dashboard.dto.AIChatRequest;
import com.prashanth.dashboard.dto.AIChatResponse;
import com.prashanth.dashboard.service.SentinelCoreAssistantService;

/**
 * AI Assistant REST controller.
 *
 * POST /api/ai/chat   — chat turn; handled entirely by SentinelCoreAssistantService.
 * GET  /api/ai/health — provider health check.
 *
 * No external AI API. No API key. Zero external dependencies.
 */
@RestController
@RequestMapping("/api/ai")
public class AIController {

    private static final Logger log = LoggerFactory.getLogger(AIController.class);

    private final SentinelCoreAssistantService assistantService;

    public AIController(SentinelCoreAssistantService assistantService) {
        this.assistantService = assistantService;
    }

    // ── POST /api/ai/chat ─────────────────────────────────────────────────────

    @PostMapping("/chat")
    @Auditable(action = "AI_CHAT")
    public ResponseEntity<?> chat(@RequestBody AIChatRequest request) {
        String userMessage  = request.message()      != null ? request.message().trim()  : "";
        String currentRoute = request.currentRoute() != null ? request.currentRoute()     : "";
        String currentPage  = request.currentPage()  != null ? request.currentPage()      : "Dashboard";

        if (userMessage.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message cannot be empty."));
        }

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
        long startedAt   = System.nanoTime();

        try {
            String reply = assistantService.chat(userMessage, request.conversation(), currentPage, currentRoute);
            log.debug("AI chat request completed (durationMs={})", elapsedMillis(startedAt));
            return ResponseEntity.ok(new AIChatResponse(reply, timestamp));

        } catch (Exception ex) {
            log.error("Unexpected AI chat failure (type={}, durationMs={}).",
                    ex.getClass().getSimpleName(), elapsedMillis(startedAt));
            return ResponseEntity.ok(new AIChatResponse(
                "Sorry, I couldn't process that request. Please try again.",
                timestamp
            ));
        }
    }

    // ── GET /api/ai/health ────────────────────────────────────────────────────

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
            "provider",   "SentinelCore Internal Assistant",
            "configured", true,
            "status",     "READY"
        ));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private long elapsedMillis(long startedAt) {
        return (System.nanoTime() - startedAt) / 1_000_000;
    }
}
