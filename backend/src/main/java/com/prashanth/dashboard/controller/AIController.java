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
 * POST /api/ai/chat  — chat turn; delegates to AiChatService → Kimi/Moonshot.
 * GET  /api/ai/health — provider health/configuration check
 *
 * The MOONSHOT_API_KEY is NEVER included in any response or log line.
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

        // ── Missing API key: return friendly degraded response ────────────────
        if (!aiChatService.isConfigured()) {
            log.warn("MOONSHOT_API_KEY is not set; AI Assistant is running with built-in fallback responses.");
            String fallback = buildFallbackResponse(userMessage, currentRoute, currentPage);
            return ResponseEntity.ok(new AIChatResponse(
                fallback + "\n\n*(AI provider not configured — set MOONSHOT_API_KEY on Render to enable Kimi)*",
                timestamp
            ));
        }

        // ── Call Kimi via the Spring AI-backed service ─────────────────────────
        try {
            String reply = aiChatService.chat(userMessage, request.conversation(), currentPage, currentRoute);
            return ResponseEntity.ok(new AIChatResponse(reply, timestamp));

        } catch (AiChatService.AiProviderException e) {
            int status = e.getHttpStatus();
            log.error("Kimi API error (HTTP {}): {}", status, e.getMessage());

            // Map Kimi errors to user-friendly messages; never surface secrets or raw bodies.
            String userFacingMessage = switch (status) {
                case 0    -> "AI provider is not configured. Please contact your system administrator.";
                case 401  -> "AI provider authentication failed. Please contact your system administrator.";
                case 403  -> "AI provider access denied. Please contact your system administrator.";
                case 404  -> "AI provider endpoint not found. Please contact your system administrator.";
                case 408  -> "The AI provider took too long to respond. Please try again in a moment.";
                case 429  -> "AI provider rate limit reached. Please wait a moment and try again.";
                case 500  -> "The AI provider is experiencing internal issues. Please try again shortly.";
                case 502,
                     503  -> "The AI provider is temporarily unavailable. Please try again shortly.";
                default   -> "I'm unable to reach the AI provider right now. Please try again.";
            };
            return ResponseEntity.ok(new AIChatResponse(userFacingMessage, timestamp));

        } catch (Exception e) {
            log.error("Unexpected error in AI chat: {}", e.getMessage(), e);
            return ResponseEntity.ok(new AIChatResponse(
                "I'm having trouble connecting to the SentinelCore AI brain right now. Please try again.",
                timestamp
            ));
        }
    }

    // ── GET /api/ai/health ────────────────────────────────────────────────────

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        boolean configured = aiChatService.isConfigured();
        return ResponseEntity.ok(Map.of(
            "status",     configured ? "READY" : "NOT_CONFIGURED",
            "provider",   "Kimi",
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
