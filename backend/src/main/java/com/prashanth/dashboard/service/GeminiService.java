package com.prashanth.dashboard.service;

import com.prashanth.dashboard.dto.ChatMessageDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * GeminiService — integrates the Google Gemini API as an LLM backend
 * for the SentinelCore chatbot.
 *
 * <p>The API key is read from the {@code GEMINI_API_KEY} environment variable.
 * It is NEVER logged, returned to the client, or exposed in error messages.
 *
 * <p>This service is the fallback layer: the rule-based
 * {@link SentinelCoreAssistantService} handles all known SentinelCore intents
 * first; Gemini is only called for UNKNOWN / out-of-scope queries.
 */
@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);

    @Value("${gemini.api-key:${GEMINI_API_KEY:}}")
    private String apiKey;

    @Value("${gemini.model:gemini-1.5-pro}")
    private String model;

    private static final String SYSTEM_PROMPT =
        "You are the CSMS-IMA AI Assistant, an expert AI assistant embedded in " +
        "the Cloud Security Monitoring System with Incident Management Assistance (CSMS-IMA) — " +
        "a cybersecurity operations platform. " +
        "You specialise in cybersecurity, security operations, incident response, " +
        "vulnerability management, compliance (ISO 27001, SOC 2, PCI-DSS), asset management, " +
        "and the CSMS-IMA platform itself. " +
        "Answer concisely and helpfully. Use markdown formatting where appropriate. " +
        "If a question is entirely unrelated to cybersecurity or the CSMS-IMA platform, politely " +
        "redirect the user back to security operations topics.";

    private final RestTemplate restTemplate;

    public GeminiService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(6000); // 6 seconds connection timeout
        factory.setReadTimeout(20000);   // 20 seconds read timeout
        this.restTemplate = new RestTemplate(factory);
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public String chat(String userMessage, List<ChatMessageDTO> history, String systemContext) {
        if (!isConfigured()) {
            log.warn("[GeminiService] GEMINI_API_KEY is not configured. Cannot call Gemini API.");
            return "The AI assistant is not configured. Please contact your administrator to set the GEMINI_API_KEY.";
        }

        if (userMessage == null || userMessage.isBlank()) {
            return "Please enter a message.";
        }

        try {
            String fullSystemPrompt = SYSTEM_PROMPT;
            if (systemContext != null && !systemContext.isBlank()) {
                fullSystemPrompt += "\n\n" + systemContext;
            }

            // Build request for Google Gemini API
            List<GeminiContent> contents = new ArrayList<>();

            // 1. History
            if (history != null) {
                for (ChatMessageDTO msg : history) {
                    if (msg == null || msg.content() == null || msg.content().isBlank()) continue;
                    // Gemini uses "user" and "model"
                    String role = "assistant".equalsIgnoreCase(msg.role()) || "model".equalsIgnoreCase(msg.role())
                            ? "model" : "user";
                    contents.add(new GeminiContent(role, List.of(new GeminiPart(msg.content()))));
                }
            }

            // 2. Current user message
            contents.add(new GeminiContent("user", List.of(new GeminiPart(userMessage))));

            // 3. System Instruction
            GeminiContent systemInstruction = new GeminiContent("system", List.of(new GeminiPart(fullSystemPrompt)));

            GeminiRequest payload = new GeminiRequest(contents, systemInstruction);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<GeminiRequest> entity = new HttpEntity<>(payload, headers);

            String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

            log.debug("[GeminiService] Sending REST request to Gemini API endpoint with model: {}", model);
            ResponseEntity<GeminiResponse> responseEntity = restTemplate.postForEntity(apiUrl, entity, GeminiResponse.class);

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                GeminiResponse responseBody = responseEntity.getBody();
                if (responseBody.candidates() != null && !responseBody.candidates().isEmpty()) {
                    var candidate = responseBody.candidates().get(0);
                    if (candidate.content() != null && candidate.content().parts() != null && !candidate.content().parts().isEmpty()) {
                        String reply = candidate.content().parts().get(0).text();
                        if (reply != null && !reply.isBlank()) {
                            return reply.trim();
                        }
                    }
                }
                log.warn("[GeminiService] Gemini returned an empty response candidate.");
                return "The AI assistant did not return a response. Please try rephrasing your question.";
            } else {
                log.warn("[GeminiService] Gemini returned unexpected status: {}", responseEntity.getStatusCode());
                return "The Gemini service is temporarily unavailable. Please try again shortly.";
            }

        } catch (Exception ex) {
            return mapException(ex);
        }
    }

    public String chat(String userMessage, List<ChatMessageDTO> history) {
        return chat(userMessage, history, null);
    }

    private String mapException(Exception ex) {
        log.error("[GeminiService] Gemini API call failed", ex);

        if (ex instanceof ResourceAccessException) {
            return "The connection to Google Gemini timed out. Please check your network and try again.";
        }

        if (ex instanceof HttpClientErrorException httpEx) {
            HttpStatusCode status = httpEx.getStatusCode();
            if (status.value() == 403 || status.value() == 401) {
                return "The Gemini API key is invalid, lacks permissions, or has expired. Please check your GEMINI_API_KEY configuration.";
            }
            if (status.value() == 429) {
                return "The AI assistant is temporarily unavailable due to Google Gemini rate limiting. Please try again in a moment.";
            }
            if (status.value() == 400) {
                log.error("[GeminiService] Gemini API bad request details: {}", httpEx.getResponseBodyAsString());
                return "Gemini API error: Invalid request parameters or model matching error. Please check configuration.";
            }
            return "Gemini API error (" + status.value() + "). Please try again or contact your administrator.";
        }

        if (ex instanceof HttpServerErrorException httpEx) {
            HttpStatusCode status = httpEx.getStatusCode();
            return "The Google Gemini service is temporarily overloaded or failed (" + status.value() + "). Please try again shortly.";
        }

        return "The AI assistant encountered an error communicating with Gemini. Please try again or contact your administrator if the problem persists.";
    }

    // DTO records inside GeminiService
    public record GeminiRequest(List<GeminiContent> contents, GeminiContent systemInstruction) {}
    public record GeminiContent(String role, List<GeminiPart> parts) {}
    public record GeminiPart(String text) {}
    
    public record GeminiResponse(List<GeminiCandidate> candidates) {
        public record GeminiCandidate(GeminiContent content, String finishReason) {}
    }
}
