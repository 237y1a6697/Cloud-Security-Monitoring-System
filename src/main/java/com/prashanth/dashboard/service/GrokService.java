package com.prashanth.dashboard.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.prashanth.dashboard.dto.ChatMessageDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Wraps the xAI Responses API (POST /v1/responses) for the SentinelCore AI Assistant.
 *
 * API contract used:
 *   POST https://api.x.ai/v1/responses
 *   Authorization: Bearer <XAI_API_KEY>
 *   Body: { "model": "grok-4.5", "input": [...], "max_output_tokens": 800 }
 *   Response: { "output": [{ "type": "message", "content": [{ "type": "output_text", "text": "..." }] }] }
 *
 * The XAI_API_KEY is read exclusively from the server-side environment variable.
 * It is NEVER logged, serialised, or returned in any response.
 */
@Service
public class GrokService {

    private static final Logger log = LoggerFactory.getLogger(GrokService.class);

    /** Max previous turns sent to Grok to bound context window usage. */
    private static final int MAX_HISTORY_MESSAGES = 10;

    @Value("${xai.api-key:}")
    private String apiKey;

    @Value("${xai.base-url:https://api.x.ai/v1}")
    private String baseUrl;

    @Value("${xai.model:grok-4.5}")
    private String model;

    /**
     * Injected in tests via setter to avoid real HTTP calls.
     * In production this is the singleton created at field initialisation.
     */
    private HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    /** Allow test injection of a mock HttpClient. */
    public void setHttpClient(HttpClient httpClient) {
        this.httpClient = httpClient;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Returns true when XAI_API_KEY has been provided via the environment.
     */
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public String getModel() {
        return model;
    }

    /**
     * Sends a chat turn to the xAI Responses API and returns the text reply.
     *
     * @param userMessage  the latest user message
     * @param history      prior turns (role+content), capped to MAX_HISTORY_MESSAGES
     * @param currentPage  name of the active SentinelCore module (injected into system prompt)
     * @param currentRoute current browser route for additional context
     * @throws GrokException on any API error with an HTTP-status-aware message
     */
    public String chat(String userMessage,
                       List<ChatMessageDTO> history,
                       String currentPage,
                       String currentRoute) throws GrokException {

        if (!isConfigured()) {
            throw new GrokException(0, "XAI_API_KEY is not configured on the server.");
        }

        String systemPrompt = buildSystemPrompt(currentPage, currentRoute);
        String jsonBody = buildRequestBody(systemPrompt, userMessage, history);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/responses"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .timeout(Duration.ofSeconds(30))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (java.net.http.HttpTimeoutException e) {
            log.error("xAI API request timed out: {}", e.getMessage());
            throw new GrokException(408, "AI provider request timed out. Please try again.");
        } catch (Exception e) {
            log.error("xAI API HTTP transport error: {}", e.getMessage());
            throw new GrokException(503, "AI provider unreachable: " + e.getMessage());
        }

        int status = response.statusCode();
        log.debug("xAI Responses API returned HTTP {}", status);

        if (status != 200) {
            String errorBody = response.body();
            // Log body but truncate to avoid leaking huge payloads; never log the key
            log.error("xAI API error HTTP {}: {}", status,
                    errorBody.length() > 300 ? errorBody.substring(0, 300) + "…" : errorBody);
            handleHttpError(status);
        }

        return parseResponseBody(response.body());
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private String buildSystemPrompt(String currentPage, String currentRoute) {
        return "You are the SentinelCore SecureOps AI Assistant.\n\n" +
               "You help authenticated users understand and operate the SentinelCore SecureOps security platform.\n\n" +
               "You are currently assisting from the user's active module.\n\n" +
               "Current module: " + (currentPage != null ? currentPage : "Dashboard") + "\n" +
               (currentRoute != null && !currentRoute.isBlank()
                   ? "Current route: " + currentRoute + "\n" : "") +
               "\nKnown SentinelCore modules include:\n" +
               "- Dashboard\n- Infrastructure\n- Assets\n- Incidents\n" +
               "- Threat Intelligence\n- Vulnerabilities\n- Audit Logs\n" +
               "- Compliance\n- Reports\n- User Administration & Identity\n\n" +
               "Answer questions about SentinelCore clearly and concisely.\n\n" +
               "Use the application's actual implemented functionality as the source of truth.\n\n" +
               "Do not invent features that do not exist.\n\n" +
               "If you are unsure whether SentinelCore supports something, clearly say that you cannot verify it.\n\n" +
               "For questions about navigation, explain where the user can find the feature.\n\n" +
               "For questions about reports, explain the existing report generation, email, and scheduling functionality.\n\n" +
               "For questions about users and roles, explain the existing RBAC functionality.\n" +
               "The RBAC roles are: ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_SOC_MANAGER, ROLE_SECURITY_ANALYST, " +
               "ROLE_INCIDENT_RESPONDER, ROLE_INFRA_ENGINEER, ROLE_DEVSECOPS, ROLE_AUDITOR, ROLE_VIEWER.\n\n" +
               "For security-related questions, provide practical and accurate explanations.\n\n" +
               "Do not expose API keys, passwords, JWT secrets, database credentials, environment variables, or other secrets.\n\n" +
               "Keep answers concise unless the user asks for detailed instructions.";
    }

    /**
     * Builds the xAI Responses API request body.
     * Structure: { "model": ..., "input": [ system turn, ...history, user turn ], "max_output_tokens": 800 }
     */
    private String buildRequestBody(String systemPrompt,
                                    String userMessage,
                                    List<ChatMessageDTO> history) {
        try {
            List<Map<String, Object>> input = new ArrayList<>();

            // System turn
            input.add(Map.of(
                "role", "system",
                "content", List.of(Map.of("type", "input_text", "text", systemPrompt))
            ));

            // Conversation history (capped)
            if (history != null && !history.isEmpty()) {
                int start = Math.max(0, history.size() - MAX_HISTORY_MESSAGES);
                for (int i = start; i < history.size(); i++) {
                    ChatMessageDTO msg = history.get(i);
                    String role    = msg.role()    != null ? msg.role()    : "user";
                    String content = msg.content() != null ? msg.content() : "";
                    if (!content.isBlank()) {
                        // Map assistant role to the xAI Responses API convention
                        String xaiRole = "assistant".equals(role) ? "assistant" : "user";
                        input.add(Map.of(
                            "role", xaiRole,
                            "content", List.of(Map.of("type", "input_text", "text", content))
                        ));
                    }
                }
            }

            // Current user turn
            input.add(Map.of(
                "role", "user",
                "content", List.of(Map.of("type", "input_text", "text", userMessage))
            ));

            Map<String, Object> body = Map.of(
                "model", model,
                "input", input,
                "max_output_tokens", 800
            );

            return objectMapper.writeValueAsString(body);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialise Grok request body", e);
        }
    }

    /**
     * Parses the xAI Responses API response.
     * Expected shape: { "output": [ { "type": "message", "content": [ { "type": "output_text", "text": "..." } ] } ] }
     */
    String parseResponseBody(String body) throws GrokException {
        try {
            JsonNode root = objectMapper.readTree(body);

            // Primary path: output[0].content[0].text
            JsonNode output = root.path("output");
            if (output.isArray() && !output.isEmpty()) {
                JsonNode firstOutput = output.get(0);
                JsonNode content = firstOutput.path("content");
                if (content.isArray() && !content.isEmpty()) {
                    String text = content.get(0).path("text").asText("");
                    if (!text.isBlank()) {
                        return text;
                    }
                }
                // Fallback: top-level text field on the output item
                String directText = firstOutput.path("text").asText("");
                if (!directText.isBlank()) {
                    return directText;
                }
            }

            log.error("Unexpected xAI Responses API response shape. Body (truncated): {}",
                    body.length() > 400 ? body.substring(0, 400) : body);
            throw new GrokException(502, "Unexpected response structure from AI provider.");
        } catch (GrokException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to parse xAI response body: {}", e.getMessage());
            throw new GrokException(502, "Failed to parse AI provider response.");
        }
    }

    private void handleHttpError(int status) throws GrokException {
        switch (status) {
            case 401 -> throw new GrokException(401,
                    "AI provider authentication failed. Check XAI_API_KEY on Render.");
            case 403 -> throw new GrokException(403,
                    "AI provider access forbidden. Verify API key permissions.");
            case 404 -> throw new GrokException(404,
                    "AI provider endpoint not found. Check xai.base-url in application.properties.");
            case 429 -> throw new GrokException(429,
                    "AI provider rate limit reached. Please wait a moment and try again.");
            case 500 -> throw new GrokException(500,
                    "AI provider internal error. The xAI service is experiencing issues.");
            case 502, 503 -> throw new GrokException(status,
                    "AI provider temporarily unavailable (HTTP " + status + "). Please retry.");
            default  -> throw new GrokException(status,
                    "AI provider returned unexpected status HTTP " + status + ".");
        }
    }

    // ── Nested exception type ─────────────────────────────────────────────────

    public static class GrokException extends Exception {
        private final int httpStatus;

        public GrokException(int httpStatus, String message) {
            super(message);
            this.httpStatus = httpStatus;
        }

        public int getHttpStatus() { return httpStatus; }
    }
}
