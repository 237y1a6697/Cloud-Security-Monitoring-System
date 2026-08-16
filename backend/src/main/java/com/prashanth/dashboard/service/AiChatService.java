package com.prashanth.dashboard.service;

import com.prashanth.dashboard.dto.ChatMessageDTO;
import com.prashanth.dashboard.repository.VulnerabilityRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Spring AI-backed OpenAI implementation for the SentinelCore assistant. */
@Service
public class AiChatService {

    private static final int MAX_HISTORY_MESSAGES = 10;
    private static final Pattern HTTP_STATUS_PATTERN =
            Pattern.compile("(?<!\\d)(400|401|403|404|408|429|5\\d{2})(?!\\d)");
    private final ChatClient chatClient;
    private final String apiKey;
    private final String model;
    private final VulnerabilityRepository vulnerabilityRepository;

    public AiChatService(ChatClient.Builder chatClientBuilder,
                         @Value("${spring.ai.openai.api-key:}") String apiKey,
                         @Value("${spring.ai.openai.chat.options.model:gpt-4o}") String model,
                         VulnerabilityRepository vulnerabilityRepository) {
        this.chatClient = chatClientBuilder.build();
        this.apiKey = apiKey;
        this.model = model;
        this.vulnerabilityRepository = vulnerabilityRepository;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public String getModel() {
        return model;
    }

    public String chat(String userMessage, List<ChatMessageDTO> history,
                       String currentPage, String currentRoute) throws AiProviderException {
        if (!isConfigured()) {
            throw new AiProviderException(0, "OpenAI API key is not configured on the server.");
        }

        List<Message> messages = new ArrayList<>();
        messages.add(new SystemMessage(buildSystemPrompt(currentPage, currentRoute, getVulnerabilityCount())));
        appendHistory(messages, history);
        messages.add(new UserMessage(userMessage));

        try {
            String response = chatClient.prompt(new Prompt(messages)).call().content();
            if (response == null || response.isBlank()) {
                throw new AiProviderException(502, "OpenAI returned an empty response.");
            }
            return response;
        } catch (AiProviderException e) {
            throw e;
        } catch (Exception e) {
            throw toProviderException(e);
        }
    }

    private void appendHistory(List<Message> messages, List<ChatMessageDTO> history) {
        if (history == null || history.isEmpty()) {
            return;
        }
        int start = Math.max(0, history.size() - MAX_HISTORY_MESSAGES);
        for (int i = start; i < history.size(); i++) {
            ChatMessageDTO item = history.get(i);
            String content = item.content() == null ? "" : item.content().trim();
            if (!content.isBlank()) {
                messages.add("assistant".equals(item.role())
                        ? new AssistantMessage(content) : new UserMessage(content));
            }
        }
    }

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AiChatService.class);

    private AiProviderException toProviderException(Exception exception) {
        log.error("AI chat/provider call failed: {}", exception.getMessage(), exception);
        Throwable current = exception;
        while (current != null) {
            if (current instanceof RestClientResponseException responseException) {
                String responseBody = responseException.getResponseBodyAsString();
                log.error("AI provider returned status={} responseBody={}", responseException.getStatusCode().value(), responseBody);
                return new AiProviderException(responseException.getStatusCode().value(), "OpenAI request failed: " + responseBody);
            }
            if (current instanceof ResourceAccessException) {
                return new AiProviderException(408, "OpenAI request timed out or could not be reached.");
            }
            Integer status = findHttpStatus(current.getMessage());
            if (status != null) {
                return new AiProviderException(status, "OpenAI request failed with HTTP " + status + ".");
            }
            current = current.getCause();
        }
        return new AiProviderException(503, "OpenAI provider request failed.");
    }

    private Integer findHttpStatus(String message) {
        if (message == null) {
            return null;
        }
        Matcher matcher = HTTP_STATUS_PATTERN.matcher(message);
        return matcher.find() ? Integer.valueOf(matcher.group(1)) : null;
    }

    private Long getVulnerabilityCount() {
        try {
            return vulnerabilityRepository.count();
        } catch (RuntimeException exception) {
            return null;
        }
    }

    private String buildSystemPrompt(String currentPage, String currentRoute, Long vulnerabilityCount) {
        return "You are the SentinelCore SecureOps AI Assistant.\n\n" +
                "You help authenticated users understand and operate the SentinelCore SecureOps security platform.\n\n" +
                "Current module: " + (currentPage != null ? currentPage : "Dashboard") + "\n" +
                (currentRoute != null && !currentRoute.isBlank() ? "Current route: " + currentRoute + "\n" : "") +
                "\nKnown SentinelCore modules include:\n" +
                "- Dashboard\n- Infrastructure\n- Assets\n- Incidents\n- Threat Intelligence\n" +
                "- Vulnerabilities\n- Audit Logs\n- Compliance\n- Reports\n- Scheduled Reports\n" +
                "- User Administration, RBAC & Identity\n- Security Operations\n- DevSecOps\n- Incident Response\n\n" +
                "Answer questions about SentinelCore clearly and concisely. Use implemented functionality as the source of truth; " +
                "do not invent features. For navigation, explain where to find the feature. Explain existing report generation, " +
                "email and scheduling, and RBAC when relevant. The RBAC roles are ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_SOC_MANAGER, " +
                "ROLE_SECURITY_ANALYST, ROLE_INCIDENT_RESPONDER, ROLE_INFRA_ENGINEER, ROLE_DEVSECOPS, ROLE_AUDITOR, ROLE_VIEWER.\n\n" +
                (vulnerabilityCount != null
                        ? "Live dashboard context: there are currently " + vulnerabilityCount + " recorded vulnerability entries. "
                        : "Live dashboard context is unavailable for this request; do not invent counts or operational data. ") +
                "Do not expose API keys, passwords, JWT secrets, database credentials, environment variables, or other secrets. " +
                "Keep answers concise unless the user asks for detailed instructions.";
    }

    public static class AiProviderException extends Exception {
        private final int httpStatus;

        public AiProviderException(int httpStatus, String message) {
            super(message);
            this.httpStatus = httpStatus;
        }

        public int getHttpStatus() {
            return httpStatus;
        }
    }
}
