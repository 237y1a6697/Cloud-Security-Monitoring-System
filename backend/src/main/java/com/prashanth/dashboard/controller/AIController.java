package com.prashanth.dashboard.controller;

import com.prashanth.dashboard.aop.Auditable;
import com.prashanth.dashboard.dto.AIChatRequest;
import com.prashanth.dashboard.dto.AIChatResponse;
import com.prashanth.dashboard.service.AiChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * AI Assistant REST controller.
 *
 * POST /api/ai/chat  — chat turn; delegates to AiChatService → xAI Grok.
 * GET  /api/ai/health — provider health/configuration check
 *
 * The GROK_API_KEY is NEVER included in any response or log line.
 */
@RestController
@RequestMapping("/api/ai")
public class AIController {

    private static final Logger log = LoggerFactory.getLogger(AIController.class);

    private final AiChatService aiChatService;

    public AIController(AiChatService aiChatService) {
        this.aiChatService = aiChatService;
    }

    // ── POST /api/ai/chat ─────────────────────────────────────────────────────

    @PostMapping("/chat")
    @Auditable(action = "AI_CHAT")
    public ResponseEntity<?> chat(@RequestBody AIChatRequest request) {
        String userMessage  = request.message()      != null ? request.message().trim()      : "";
        String currentRoute = request.currentRoute() != null ? request.currentRoute()        : "";
        String currentPage  = request.currentPage()  != null ? request.currentPage()         : "Dashboard";

        if (userMessage.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message cannot be empty."));
        }

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
        long startedAt = System.nanoTime();

        // ── Missing API key: return friendly degraded response ────────────────
        if (!aiChatService.isConfigured()) {
            log.warn("Grok API key is not set; AI Assistant is running with built-in fallback responses.");
            String fallback = buildFallbackResponse(userMessage, currentRoute, currentPage);
            return ResponseEntity.ok(new AIChatResponse(
                fallback + "\n\n*(AI provider not configured — set GROK_API_KEY on Render to enable Grok)*",
                timestamp
            ));
        }

        // ── Call Grok via the Spring AI-backed service ─────────────────────────
        log.info("AI chat request started (model={})", aiChatService.getModel());
        try {
            String reply = aiChatService.chat(userMessage, request.conversation(), currentPage, currentRoute);
            log.info("AI chat request succeeded (model={}, durationMs={})", aiChatService.getModel(), elapsedMillis(startedAt));
            return ResponseEntity.ok(new AIChatResponse(reply, timestamp));

        } catch (AiChatService.AiProviderException e) {
            int status = e.getHttpStatus();
            log.warn("AI chat request failed (model={}, status={}, durationMs={})",
                    aiChatService.getModel(), status, elapsedMillis(startedAt));

            // Map provider errors to user-friendly messages; never surface secrets or raw bodies.
            String userFacingMessage = switch (status) {
                case 0          -> "AI provider is not configured. Please contact your system administrator.";
                case 400        -> "AI request was rejected. Please verify the model/request configuration.";
                case 401, 403   -> "AI authentication failed. Please verify the Grok API key.";
                case 404        -> "AI model or endpoint was not found. Please verify GROK_MODEL and provider configuration.";
                case 408        -> "Unable to reach the AI provider. Please try again.";
                case 429        -> "AI rate limit reached. Please wait a moment and try again.";
                case 500, 502,
                     503, 504   -> "Grok is temporarily unavailable. Please try again shortly.";
                default         -> "Unable to reach the AI provider. Please try again.";
            };
            return ResponseEntity.ok(new AIChatResponse(userFacingMessage, timestamp));

        } catch (Exception e) {
            log.error("Unexpected AI chat failure (type={}, durationMs={}).",
                    e.getClass().getSimpleName(), elapsedMillis(startedAt));
            return ResponseEntity.ok(new AIChatResponse(
                "I'm having trouble connecting to the SentinelCore AI brain right now. Please try again.",
                timestamp
            ));
        }
    }

    private long elapsedMillis(long startedAt) {
        return (System.nanoTime() - startedAt) / 1_000_000;
    }

    // ── GET /api/ai/health ────────────────────────────────────────────────────

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        boolean configured = aiChatService.isConfigured();
        return ResponseEntity.ok(Map.of(
            "status",     configured ? "READY" : "NOT_CONFIGURED",
            "provider",   "Grok",
            "model",      aiChatService.getModel(),
            "configured", configured
        ));
    }

    // ── Built-in fallback (no API key / provider down) ────────────────────────

    private String buildFallbackResponse(String msg, String currentRoute, String currentPage) {
        String m = msg.toLowerCase();

        if (m.contains("schedule") && m.contains("report")) {
            return "Go to **Reports → Schedule Automated Deliveries**. Fill in the Report Type, Frequency " +
                   "(Daily/Weekly/Monthly), UTC Time, and Recipient Email, then click **Schedule**. " +
                   "Active schedules appear in the table below with ON/OFF toggle and delete controls.";
        }
        if (m.contains("csv") || m.contains("xlsx") || m.contains("export")) {
            return "In the **Reports** page, select your report type, choose **CSV** or **Excel Workbook** from the Format " +
                   "dropdown, and click **Generate & View Report**. The file will download automatically.";
        }
        if (m.contains("email") && m.contains("report")) {
            return "On the **Reports** page, enter a recipient email in the **Direct Email Dispatcher** box and click " +
                   "**Send Now**. The current report is generated as PDF and dispatched via Brevo.";
        }
        if (m.contains("create incident") || m.contains("add incident")) {
            return "Go to **Incidents → Create Incident**. Fill in: Title, Severity (Critical/High/Medium/Low), " +
                   "SLA hours, Assigned Team, and description. Click **Save Incident**.";
        }
        if (m.contains("create asset") || m.contains("add asset")) {
            return "Navigate to **Assets**, click **Add New Asset**, specify hostname, IP, Type (Server/Firewall/Database), " +
                   "Criticality, and Location, then click **Save Asset**.";
        }
        if (m.contains("rbac") || m.contains("role") || m.contains("permission")) {
            return "SentinelCore has 9 roles: **SUPER_ADMIN**, **ADMIN**, **SOC_MANAGER**, **SECURITY_ANALYST**, " +
                   "**INCIDENT_RESPONDER**, **INFRA_ENGINEER**, **DEVSECOPS**, **AUDITOR**, **VIEWER**. " +
                   "Manage roles in **Users Administration**.";
        }
        if (m.contains("vulnerability") || m.contains("cve")) {
            return "Open **Vulnerabilities** to see active CVE items with CVSS scores. Click **View Remediation** " +
                   "to see patch instructions. Mark resolved after deploying fixes.";
        }
        if (m.contains("audit log")) {
            return "**Audit Logs** record every login, logout, registration, role change, report, and AI interaction. " +
                   "Filter by username, action, or date range and export as CSV or PDF.";
        }
        if (m.contains("report")) {
            return "Use **Reports** to generate Executive Summary, IT Assets, Security Incidents, or Vulnerability CVE reports. " +
                   "Download as PDF/CSV, email directly, or schedule automated deliveries.";
        }
        if (m.contains("dashboard")) {
            return "The Dashboard aggregates live telemetry: **Total Assets**, **Active Incidents**, **Critical Incidents**, " +
                   "**Open Vulnerabilities**, **Active Alerts**, and **Registered Users** — all sourced from PostgreSQL.";
        }

        // Route-based context
        if (currentRoute != null) {
            if (currentRoute.contains("/incidents"))   return "You're on **Incidents**. Create, assign, update severity, and resolve security incidents here.";
            if (currentRoute.contains("/assets"))      return "You're on **Assets**. Manage your infrastructure inventory: add, edit, and retire endpoints.";
            if (currentRoute.contains("/audit-logs"))  return "You're on **Audit Logs**. Filter by username, action, or date range. Export as CSV or PDF.";
            if (currentRoute.contains("/vulnerabilities")) return "You're on **Vulnerabilities**. Review CVE entries, CVSS scores, and deploy patches.";
            if (currentRoute.contains("/compliance"))  return "You're on **Compliance**. Check posture against ISO 27001, SOC 2, and PCI DSS frameworks.";
            if (currentRoute.contains("/reports"))     return "You're on **Reports**. Generate, email, or schedule automated delivery of security reports.";
            if (currentRoute.contains("/users"))       return "You're on **Users Admin**. Manage roles, reset passwords, enable/disable accounts.";
        }

        return "I'm the SentinelCore AI Assistant. I can help with incident management, asset inventory, " +
               "vulnerability remediation, compliance posture, audit logs, reports, and RBAC. What would you like to know?";
    }
}
