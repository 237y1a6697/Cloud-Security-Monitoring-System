package com.prashanth.dashboard.service;

import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;
import com.prashanth.dashboard.dto.ChatMessageDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * GeminiService — integrates the Google Gemini API as an LLM backend
 * for the SentinelCore chatbot.
 *
 * <p>The API key is read from the {@code GEMINI_API_KEY} environment variable (via
 * Spring's {@code application.properties} binding). It is NEVER logged, returned
 * to the client, or exposed in error messages.
 *
 * <p>This service is the <em>fallback layer</em>: the rule-based
 * {@link SentinelCoreAssistantService} handles all known SentinelCore intents
 * first; Gemini is only called for UNKNOWN / out-of-scope queries.
 */
@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);

    /** Injected from GEMINI_API_KEY env var → gemini.api-key property. Empty string if not set. */
    @Value("${gemini.api-key:}")
    private String apiKey;

    /** Injected from GEMINI_MODEL env var → gemini.model property. Defaults to gemini-3.7-flash. */
    @Value("${gemini.model:gemini-3.7-flash}")
    private String model;

    /**
     * System prompt that keeps Gemini focused on SentinelCore and
     * cybersecurity operations. This is injected as a system instruction,
     * not as a user message, so it is invisible to end-users.
     */
    private static final String SYSTEM_PROMPT =
        "You are the SentinelCore Internal Assistant, an expert AI assistant embedded in " +
        "SentinelCore SecureOps — a cybersecurity operations platform. " +
        "You specialise in cybersecurity, security operations, incident response, " +
        "vulnerability management, compliance (ISO 27001, SOC 2, PCI-DSS), asset management, " +
        "and the SentinelCore platform itself. " +
        "Answer concisely and helpfully. Use markdown formatting where appropriate. " +
        "If a question is entirely unrelated to cybersecurity or SentinelCore, politely " +
        "redirect the user back to security operations topics.";

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Returns {@code true} when {@code GEMINI_API_KEY} is set and non-blank.
     */
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    /**
     * Sends the user's message (plus conversation history and optional dynamic system context)
     * to Gemini and returns the model's text response.
     *
     * @param userMessage   the latest user input
     * @param history       prior conversation turns
     * @param systemContext dynamic system state context (e.g. database counts)
     * @return              Gemini's text reply, or a user-friendly error string
     */
    public String chat(String userMessage, List<ChatMessageDTO> history, String systemContext) {
        if (!isConfigured()) {
            log.warn("[GeminiService] GEMINI_API_KEY is not configured. Cannot call Gemini API.");
            return "The AI assistant is not configured. Please contact your administrator to set the GEMINI_API_KEY.";
        }

        if (userMessage == null || userMessage.isBlank()) {
            return "Please enter a message.";
        }

        try {
            Client client = Client.builder()
                    .apiKey(apiKey)
                    .build();

            // Build conversation history as Content list (Gemini format)
            List<Content> contents = buildContents(history, userMessage);

            String fullSystemPrompt = SYSTEM_PROMPT;
            if (systemContext != null && !systemContext.isBlank()) {
                fullSystemPrompt += "\n\n" + systemContext;
            }

            GenerateContentConfig config = GenerateContentConfig.builder()
                    .systemInstruction(Content.fromParts(Part.fromText(fullSystemPrompt)))
                    .build();

            GenerateContentResponse response = client.models.generateContent(
                    model, contents, config);

            String text = response.text();
            if (text == null || text.isBlank()) {
                log.warn("[GeminiService] Gemini returned a blank response for model={}", model);
                return "The AI assistant did not return a response. Please try rephrasing your question.";
            }

            log.debug("[GeminiService] Gemini responded successfully (model={}, chars={})",
                    model, text.length());
            return text.trim();

        } catch (Exception ex) {
            return mapException(ex);
        }
    }

    /**
     * Backward-compatible simple chat call.
     */
    public String chat(String userMessage, List<ChatMessageDTO> history) {
        return chat(userMessage, history, null);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Converts the SentinelCore conversation history (role/content pairs) into
     * the {@link Content} objects expected by the Google Gen AI SDK, then
     * appends the current user message.
     */
    private List<Content> buildContents(List<ChatMessageDTO> history, String userMessage) {
        List<Content> contents = new ArrayList<>();

        if (history != null) {
            for (ChatMessageDTO msg : history) {
                if (msg == null || msg.content() == null || msg.content().isBlank()) continue;
                // Gemini roles: "user" or "model" (not "assistant")
                String geminiRole = "assistant".equalsIgnoreCase(msg.role()) ? "model" : "user";
                contents.add(Content.builder()
                        .role(geminiRole)
                        .parts(List.of(Part.fromText(msg.content())))
                        .build());
            }
        }

        // Append current user turn
        contents.add(Content.builder()
                .role("user")
                .parts(List.of(Part.fromText(userMessage)))
                .build());

        return contents;
    }

    /**
     * Maps SDK exceptions to safe, user-friendly messages.
     * NEVER includes the API key or full stack trace in the returned string.
     */
    private String mapException(Exception ex) {
        String message = ex.getMessage() != null ? ex.getMessage().toLowerCase() : "";
        log.error("[GeminiService] Gemini API call failed: {}", ex.getClass().getSimpleName());

        if (message.contains("api_key_invalid") || message.contains("api key not valid")
                || message.contains("invalid api key") || message.contains("401")) {
            return "The Gemini API key is invalid or has been revoked. Please check the GEMINI_API_KEY configuration.";
        }
        if (message.contains("quota") || message.contains("rate") || message.contains("429")) {
            return "The AI assistant is temporarily unavailable due to rate limiting. Please try again in a moment.";
        }
        if (message.contains("503") || message.contains("unavailable") || message.contains("overloaded")) {
            return "The Gemini service is temporarily overloaded. Please try again shortly.";
        }
        if (message.contains("timeout") || message.contains("connect")) {
            return "The connection to the AI service timed out. Please check your network and try again.";
        }
        if (message.contains("model") && (message.contains("not found") || message.contains("does not exist"))) {
            return "The configured Gemini model '" + model + "' was not found. Please update the GEMINI_MODEL setting.";
        }
        return "The AI assistant encountered an error. Please try again or contact your administrator if the problem persists.";
    }
}
