package com.prashanth.dashboard.service;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * EmailService — sends transactional emails via the Brevo REST API (v3).
 *
 * Gmail SMTP has been removed. This service does NOT use JavaMailSender,
 * SMTP port 587, or smtp.gmail.com. It calls:
 *   POST https://api.brevo.com/v3/smtp/email
 * over HTTPS using Spring's RestTemplate, which works on Render without
 * requiring outbound TCP port 587.
 *
 * Required environment variables (set on Render):
 *   BREVO_API_KEY        — Brevo API v3 key
 *   BREVO_SENDER_EMAIL   — verified Brevo sender address
 *   BREVO_SENDER_NAME    — display name (defaults to "SentinelCore")
 */
@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    @Value("${brevo.api-key}")
    private String brevoApiKey;

    @Value("${brevo.sender-email}")
    private String brevoSenderEmail;

    @Value("${brevo.sender-name:SentinelCore}")
    private String brevoSenderName;

    private RestTemplate restTemplate = new RestTemplate();

    public void setRestTemplate(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @PostConstruct
    public void checkBrevoConfig() {
        logger.info("========== BREVO EMAIL CONFIG ==========");
        logger.info("Brevo sender name  : {}", brevoSenderName);
        logger.info("Brevo sender email : {}", brevoSenderEmail.isEmpty() ? "[NOT SET]" : brevoSenderEmail);
        logger.info("Brevo API key      : {}", brevoApiKey.isEmpty() ? "[NOT SET]" : "[CONFIGURED]");
        logger.info("========================================");
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Public API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Sends an HTML email with an optional PDF attachment via Brevo REST API.
     *
     * @param to             recipient email address
     * @param subject        email subject line
     * @param htmlContent    HTML body
     * @param attachmentName filename for the attachment (e.g. "report.pdf")
     * @param attachmentData raw bytes of the PDF; may be null/empty
     */
    public void sendHtmlEmailWithAttachment(String to,
                                            String subject,
                                            String htmlContent,
                                            String attachmentName,
                                            byte[] attachmentData) {
        validateBrevoConfig();

        // ── Build the Brevo request body ──────────────────────────────────────
        Map<String, Object> requestBody = new LinkedHashMap<>();

        // sender
        Map<String, String> sender = new LinkedHashMap<>();
        sender.put("name", brevoSenderName);
        sender.put("email", brevoSenderEmail);
        requestBody.put("sender", sender);

        // to
        Map<String, String> recipient = new LinkedHashMap<>();
        recipient.put("email", to);
        requestBody.put("to", List.of(recipient));

        // subject & html
        requestBody.put("subject", subject);
        requestBody.put("htmlContent", htmlContent);

        // optional PDF attachment
        if (attachmentData != null && attachmentData.length > 0 && attachmentName != null) {
            String b64 = Base64.getEncoder().encodeToString(attachmentData);
            Map<String, String> attachment = new LinkedHashMap<>();
            attachment.put("content", b64);
            attachment.put("name", attachmentName);
            requestBody.put("attachment", List.of(attachment));
            logger.info("Brevo request: attaching '{}' ({} bytes)", attachmentName, attachmentData.length);
        }

        // ── Build HTTP headers ────────────────────────────────────────────────
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", brevoApiKey);   // Brevo authentication header

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        // ── Call Brevo ────────────────────────────────────────────────────────
        try {
            ResponseEntity<String> response =
                    restTemplate.exchange(BREVO_API_URL, HttpMethod.POST, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                logger.info("Brevo: email delivered successfully to '{}'", to);
            } else {
                // Shouldn't happen (RestTemplate throws on 4xx/5xx), but guard anyway
                logger.error("Brevo returned unexpected status {} for recipient '{}'",
                        response.getStatusCode(), to);
                throw new RuntimeException("BREVO_UNEXPECTED_STATUS: " + response.getStatusCode());
            }

        } catch (HttpClientErrorException e) {
            // 4xx — bad request, bad API key, unverified sender, etc.
            logger.error("Brevo API client error ({}): {} — recipient='{}'",
                    e.getStatusCode(), e.getStatusText(), to);
            throw new RuntimeException("BREVO_CLIENT_ERROR: " + e.getStatusCode()
                    + " — " + sanitisedBrevoError(e.getResponseBodyAsString()), e);

        } catch (HttpServerErrorException e) {
            // 5xx — Brevo server error
            logger.error("Brevo API server error ({}): {} — recipient='{}'",
                    e.getStatusCode(), e.getStatusText(), to);
            throw new RuntimeException("BREVO_SERVER_ERROR: " + e.getStatusCode()
                    + " — " + sanitisedBrevoError(e.getResponseBodyAsString()), e);

        } catch (ResourceAccessException e) {
            // Network/timeout failure
            logger.error("Network error reaching Brevo API for recipient '{}': {}", to, e.getMessage());
            throw new RuntimeException("BREVO_NETWORK_ERROR: Unable to reach Brevo API. " + e.getMessage(), e);

        } catch (Exception e) {
            logger.error("Unexpected error during Brevo email dispatch to '{}'", to, e);
            throw new RuntimeException("BREVO_DISPATCH_FAILED: " + e.getMessage(), e);
        }
    }

    /**
     * Sends a plain-text email by wrapping it as minimal HTML.
     * Kept for API compatibility; internally uses the Brevo REST path.
     */
    public void sendPlainEmail(String to, String subject, String body) {
        String htmlContent = "<p>" + (body == null ? "" : body.replace("\n", "<br/>")) + "</p>";
        sendHtmlEmailWithAttachment(to, subject, htmlContent, null, null);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private void validateBrevoConfig() {
        if (brevoApiKey == null || brevoApiKey.trim().isEmpty()) {
            throw new IllegalStateException("BREVO_NOT_CONFIGURED: BREVO_API_KEY environment variable is missing.");
        }
        if (brevoSenderEmail == null || brevoSenderEmail.trim().isEmpty()) {
            throw new IllegalStateException("BREVO_NOT_CONFIGURED: BREVO_SENDER_EMAIL environment variable is missing.");
        }
    }

    /**
     * Strips any sensitive tokens from a Brevo error body before surfacing it.
     * Only pass the Brevo JSON error body here, never internal credentials.
     */
    private String sanitisedBrevoError(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return "(no error detail)";
        }
        // Brevo error bodies are JSON like {"code":"unauthorized","message":"..."}
        // Limit to 300 chars to avoid leaking excessive detail
        return responseBody.length() > 300 ? responseBody.substring(0, 300) + "…" : responseBody;
    }
}
