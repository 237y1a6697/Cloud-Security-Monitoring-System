package com.prashanth.dashboard.security;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * BrevoConfigValidator — validates that the required Brevo environment
 * variables are present at application startup.
 *
 * Gmail SMTP (SmtpValidator) has been removed. This class replaces it.
 * It logs warnings if BREVO_API_KEY or BREVO_SENDER_EMAIL are absent,
 * but does NOT prevent the application from starting.
 */
@Component
public class SmtpValidator {

    private static final Logger logger = LoggerFactory.getLogger(SmtpValidator.class);

    @Value("${brevo.api-key:}")
    private String brevoApiKey;

    @Value("${brevo.sender-email:}")
    private String brevoSenderEmail;

    @Value("${brevo.sender-name:SentinelCore}")
    private String brevoSenderName;

    @PostConstruct
    public void validateBrevoConfig() {
        logger.info("SentinelCore SecureOps: Performing Brevo email startup validation...");

        boolean missing = false;
        StringBuilder warnMsg = new StringBuilder("Brevo environment variables not fully configured: ");

        if (brevoApiKey == null || brevoApiKey.trim().isEmpty()) {
            warnMsg.append("BREVO_API_KEY ");
            missing = true;
        }
        if (brevoSenderEmail == null || brevoSenderEmail.trim().isEmpty()) {
            warnMsg.append("BREVO_SENDER_EMAIL ");
            missing = true;
        }

        if (missing) {
            // Warn only — do NOT throw. The app can start without email.
            // EmailService validates config at send-time and returns a clear error.
            logger.warn("========================================================================");
            logger.warn("BREVO WARNING: {}", warnMsg.toString().trim());
            logger.warn("Email features will be unavailable until Brevo env vars are set.");
            logger.warn("Set BREVO_API_KEY and BREVO_SENDER_EMAIL on Render.");
            logger.warn("========================================================================");
        } else {
            logger.info("Brevo configuration variables verified successfully.");
            logger.info("  Brevo sender name  : {}", brevoSenderName);
            logger.info("  Brevo sender email : {}", brevoSenderEmail);
            // Do NOT log the API key.
        }
    }
}
