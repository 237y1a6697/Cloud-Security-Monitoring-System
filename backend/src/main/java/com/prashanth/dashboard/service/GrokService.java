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

/**
 * GrokService — integrates the xAI Grok API as an LLM backend
 * for the SentinelCore chatbot.
 *
 * <p>The API key is read from the {@code XAI_API_KEY} environment variable.
 * It is NEVER logged, returned to the client, or exposed in error messages.
 *
 * <p>This service is the fallback layer: the rule-based
 * {@link SentinelCoreAssistantService} handles all known SentinelCore intents
 * first; Grok is only called for UNKNOWN / out-of-scope queries.
 */
@Service
public class GrokService {

    private static final Logger log = LoggerFactory.getLogger(GrokService.class);

    @Value("${xai.api-key:}")
    private String apiKey;

    @Value("${xai.model:grok-4.5}")
    private String model;

    @Value("${xai.api-url:https://api.x.ai/v1/responses}")
    private String apiUrl;

    private static final String SYSTEM_PROMPT =
        "You are the SentinelCore Internal Assistant, an expert AI assistant embedded in " +
        "SentinelCore SecureOps — a cybersecurity operations platform. " +
        "You specialise in cybersecurity, security operations, incident response, " +
        "vulnerability management, compliance (ISO 27001, SOC 2, PCI-DSS), asset management, " +
        "and the SentinelCore platform itself. " +
        "Answer concisely and helpfully. Use markdown formatting where appropriate. " +
        "If a question is entirely unrelated to cybersecurity or SentinelCore, politely " +
        "redirect the user back to security operations topics.";

    private final RestTemplate restTemplate;

    public GrokService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000); // 5 seconds connection timeout
        factory.setReadTimeout(15000);   // 15 seconds read timeout
        this.restTemplate = new RestTemplate(factory);
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public String chat(String userMessage, List<ChatMessageDTO> history, String systemContext) {
        if (!isConfigured()) {
            log.warn("[GrokService] XAI_API_KEY is not configured. Cannot call Grok API.");
            return "The AI assistant is not configured. Please contact your administrator to set the XAI_API_KEY.";
        }

        if (userMessage == null || userMessage.isBlank()) {
            return "Please enter a message.";
        }

        try {
            String fullSystemPrompt = SYSTEM_PROMPT;
            if (systemContext != null && !systemContext.isBlank()) {
                fullSystemPrompt += "\n\n" + systemContext;
            }

            List<GrokMessage> inputMessages = new ArrayList<>();
            inputMessages.add(new GrokMessage("system", fullSystemPrompt));

            if (history != null) {
                for (ChatMessageDTO msg : history) {
                    if (msg == null || msg.content() == null || msg.content().isBlank()) continue;
                    String role = "assistant".equalsIgnoreCase(msg.role()) || "model".equalsIgnoreCase(msg.role())
                            ? "assistant" : "user";
                    inputMessages.add(new GrokMessage(role, msg.content()));
                }
            }

            // Append current user turn
            inputMessages.add(new GrokMessage("user", userMessage));

            GrokRequest payload = new GrokRequest(model, inputMessages, false);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<GrokRequest> entity = new HttpEntity<>(payload, headers);

            log.debug("[GrokService] Sending REST request to xAI endpoint: {} with model: {}", apiUrl, model);
            ResponseEntity<GrokResponse> responseEntity = restTemplate.postForEntity(apiUrl, entity, GrokResponse.class);

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                GrokResponse responseBody = responseEntity.getBody();
                if (responseBody.choices() != null && !responseBody.choices().isEmpty()) {
                    String reply = responseBody.choices().get(0).message().content();
                    if (reply != null && !reply.isBlank()) {
                        return reply.trim();
                    }
                }
                log.warn("[GrokService] Grok returned an empty response choices.");
                return "The AI assistant did not return a response. Please try rephrasing your question.";
            } else {
                log.warn("[GrokService] Grok returned unexpected status: {}", responseEntity.getStatusCode());
                return "The Grok service is temporarily unavailable. Please try again shortly.";
            }

        } catch (Exception ex) {
            return mapException(ex);
        }
    }

    public String chat(String userMessage, List<ChatMessageDTO> history) {
        return chat(userMessage, history, null);
    }

    private String mapException(Exception ex) {
        log.error("[GrokService] Grok API call failed", ex);

        if (ex instanceof ResourceAccessException) {
            return "The connection to the AI service timed out. Please check your network and try again.";
        }

        if (ex instanceof HttpClientErrorException httpEx) {
            HttpStatusCode status = httpEx.getStatusCode();
            if (status.value() == 401) {
                return "The Grok API key is invalid or has been revoked. Please check the XAI_API_KEY configuration.";
            }
            if (status.value() == 429) {
                return "The AI assistant is temporarily unavailable due to rate limiting. Please try again in a moment.";
            }
            if (status.value() == 400) {
                log.error("[GrokService] Grok API bad request details: {}", httpEx.getResponseBodyAsString());
                return "Grok API error: Invalid request parameters or model. Please check configuration.";
            }
            return "Grok API error (" + status.value() + "). Please try again or contact your administrator.";
        }

        if (ex instanceof HttpServerErrorException httpEx) {
            HttpStatusCode status = httpEx.getStatusCode();
            return "The Grok service is temporarily overloaded or failed (" + status.value() + "). Please try again shortly.";
        }

        return "The AI assistant encountered an error. Please try again or contact your administrator if the problem persists.";
    }

    // DTO records inside GrokService to avoid contaminating the main DTO package
    public record GrokRequest(String model, List<GrokMessage> input, boolean store) {}
    public record GrokMessage(String role, String content) {}
    public record GrokResponse(String id, String object, List<Choice> choices) {
        public record Choice(Message message, String finishReason) {
            public record Message(String role, String content) {}
        }
    }
}
