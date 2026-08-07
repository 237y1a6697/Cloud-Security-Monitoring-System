package com.prashanth.dashboard.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.prashanth.dashboard.aop.Auditable;
import com.prashanth.dashboard.dto.AIChatRequest;
import com.prashanth.dashboard.dto.AIChatResponse;
import com.prashanth.dashboard.dto.ChatMessageDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    private static final Logger log = LoggerFactory.getLogger(AIController.class);

    @Value("${GROK_API_KEY:}")
    private String grokApiKey;

    private static final String GROK_API_URL = "https://api.x.ai/v1/chat/completions";
    private static final String GROK_MODEL = "grok-3-mini";

    private static final String SYSTEM_PROMPT =
        "You are SentinelCore AI Assistant, an enterprise cybersecurity operations expert embedded inside the SentinelCore SecureOps SIEM dashboard. " +
        "Your role is to help SOC analysts, incident responders, and security engineers navigate and use the platform effectively. " +
        "The platform modules are: Dashboard, Assets, Incidents, Threat Intelligence, Vulnerabilities, Audit Logs, Compliance, Users, Reports, Infrastructure, Profile, and Settings. " +
        "Provide concise, accurate, actionable answers. Use markdown for code blocks and tables when helpful. " +
        "If asked about MITRE ATT&CK, CVEs, incident response, threat hunting, or RBAC roles, provide expert-level guidance. " +
        "The RBAC roles are: ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_SOC_MANAGER, ROLE_SECURITY_ANALYST, ROLE_INCIDENT_RESPONDER, ROLE_INFRA_ENGINEER, ROLE_DEVSECOPS, ROLE_AUDITOR, ROLE_VIEWER.";

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/chat")
    @Auditable(action = "AI_CHAT")
    public ResponseEntity<?> chat(@RequestBody AIChatRequest request) {
        String userMessage = request.message() != null ? request.message().trim() : "";
        String currentRoute = request.currentRoute() != null ? request.currentRoute() : "";
        String currentPage = request.currentPage() != null ? request.currentPage() : "Dashboard";

        if (userMessage.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message cannot be empty"));
        }

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));

        // If no Grok API key is configured fall back to built-in responses
        if (grokApiKey == null || grokApiKey.isBlank()) {
            log.warn("GROK_API_KEY is not set – using built-in fallback responses.");
            String fallback = buildFallbackResponse(userMessage, currentRoute);
            return ResponseEntity.ok(new AIChatResponse(fallback, timestamp));
        }

        try {
            String reply = callGrokAPI(userMessage, request.conversation(), currentPage, currentRoute);
            return ResponseEntity.ok(new AIChatResponse(reply, timestamp));
        } catch (Exception e) {
            log.error("Grok API call failed: {}", e.getMessage(), e);
            // Return a graceful degradation instead of 500
            String fallback = buildFallbackResponse(userMessage, currentRoute);
            return ResponseEntity.ok(new AIChatResponse(
                fallback + "\n\n*(AI service temporarily unavailable – using built-in knowledge)*",
                timestamp
            ));
        }
    }

    private String callGrokAPI(String userMessage, List<ChatMessageDTO> conversation, String currentPage, String currentRoute) throws Exception {
        // Build messages array: system + history + new user message
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content",
            SYSTEM_PROMPT + "\n\nCurrent active module: " + currentPage + " (route: " + currentRoute + ")"));

        // Include prior conversation history (up to last 10 messages to stay within context)
        if (conversation != null) {
            int start = Math.max(0, conversation.size() - 10);
            for (int i = start; i < conversation.size(); i++) {
                ChatMessageDTO msg = conversation.get(i);
                String role = msg.role() != null ? msg.role() : "user";
                String content = msg.content() != null ? msg.content() : "";
                if (!content.isBlank()) {
                    messages.add(Map.of("role", role, "content", content));
                }
            }
        }
        messages.add(Map.of("role", "user", "content", userMessage));

        Map<String, Object> requestBody = Map.of(
            "model", GROK_MODEL,
            "messages", messages,
            "max_tokens", 1024,
            "temperature", 0.7
        );

        String jsonBody = objectMapper.writeValueAsString(requestBody);

        HttpRequest httpRequest = HttpRequest.newBuilder()
            .uri(URI.create(GROK_API_URL))
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + grokApiKey)
            .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
            .build();

        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.error("Grok API returned HTTP {}: {}", response.statusCode(), response.body());
            throw new RuntimeException("Grok API error: HTTP " + response.statusCode());
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode choices = root.path("choices");
        if (choices.isEmpty()) {
            throw new RuntimeException("Grok API returned empty choices");
        }
        return choices.get(0).path("message").path("content").asText("(No response generated)");
    }

    /** Built-in fallback when API key not set or API is unavailable */
    private String buildFallbackResponse(String msg, String currentRoute) {
        String m = msg.toLowerCase();

        if (m.contains("create incident") || m.contains("add incident")) {
            return "Go to **Incidents → Create Incident**. Fill in: Incident ID, Title, Severity Level (Critical/High/Medium/Low), SLA hours, and description. Click **Save Incident**.";
        }
        if (m.contains("create asset") || m.contains("add asset")) {
            return "Navigate to **Assets**, click **Add New Asset**, specify hostname, IP, type (Server/Firewall/Database), criticality, and click **Save Asset**.";
        }
        if (m.contains("dashboard metric") || m.contains("explain dashboard")) {
            return "Dashboard aggregates: **Total Assets**, **Active Incidents**, **Critical Incidents**, **Open Vulnerabilities**, **Active Alerts**, and **Registered Users** — all sourced live from PostgreSQL.";
        }
        if (m.contains("threat intel")) {
            return "Threat Intelligence tracks IOCs, MITRE ATT&CK techniques, blacklisted IPs, and real-time attack vectors. Use it to correlate evidence during incident investigations.";
        }
        if (m.contains("audit log")) {
            return "Audit Logs record every login, logout, registration, role change, report generation, and AI interaction for tamper-proof security auditing.";
        }
        if (m.contains("rbac") || m.contains("role")) {
            return "SentinelCore has 9 roles: **SUPER_ADMIN**, **ADMIN**, **SOC_MANAGER**, **SECURITY_ANALYST**, **INCIDENT_RESPONDER**, **INFRA_ENGINEER**, **DEVSECOPS**, **AUDITOR**, **VIEWER**. New users default to VIEWER.";
        }
        if (m.contains("vulnerability") || m.contains("cve")) {
            return "Open **Vulnerabilities** to see active CVE items with CVSS scores. Click **View Remediation** to see patch instructions. Mark resolved after deploying fixes.";
        }
        if (m.contains("report")) {
            return "Use **Reports** to generate and download PDFs. You can also email reports directly from the Reports page using the Email Report button.";
        }

        if (currentRoute != null) {
            if (currentRoute.contains("/incidents")) return "You're on **Incidents**. Create, assign, update severity, and resolve security incidents here.";
            if (currentRoute.contains("/assets")) return "You're on **Assets**. Manage your infrastructure inventory: add, edit, and retire endpoints.";
            if (currentRoute.contains("/audit-logs")) return "You're on **Audit Logs**. Filter by username, action, or date range. Export as CSV or PDF.";
            if (currentRoute.contains("/vulnerabilities")) return "You're on **Vulnerabilities**. Review CVE entries, CVSS scores, and deploy patches.";
            if (currentRoute.contains("/compliance")) return "You're on **Compliance**. Check posture against ISO 27001, SOC 2, and PCI DSS frameworks.";
            if (currentRoute.contains("/reports")) return "You're on **Reports**. Generate incident, audit, or compliance reports and export or email them.";
            if (currentRoute.contains("/users")) return "You're on **Users Admin**. Manage roles, reset passwords, enable/disable accounts.";
            if (currentRoute.contains("/settings")) return "You're on **Settings**. Configure password policies, SIEM rules, and backup schedules.";
        }

        return "I'm the SentinelCore AI Assistant. I can help with incident management, asset inventory, vulnerability remediation, compliance posture, audit logs, and RBAC configuration. What would you like to know?";
    }
}
