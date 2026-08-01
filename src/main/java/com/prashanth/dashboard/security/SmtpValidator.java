package com.prashanth.dashboard.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;

@Component
public class SmtpValidator {
    private static final Logger logger = LoggerFactory.getLogger(SmtpValidator.class);

    @Value("${spring.mail.host:}")
    private String host;

    @Value("${spring.mail.port:}")
    private String port;

    @Value("${spring.mail.username:}")
    private String username;

    @Value("${spring.mail.password:}")
    private String password;

    @PostConstruct
    public void validateSmtpConfig() {
        logger.info("SentinelCore SecureOps: Performing SMTP startup validation...");

        boolean missing = false;
        StringBuilder warnMsg = new StringBuilder("SMTP environment variables not fully configured: ");

        if (host == null || host.trim().isEmpty()) {
            warnMsg.append("SMTP_HOST ");
            missing = true;
        }
        if (port == null || port.trim().isEmpty()) {
            warnMsg.append("SMTP_PORT ");
            missing = true;
        }
        if (username == null || username.trim().isEmpty()) {
            warnMsg.append("SMTP_USERNAME ");
            missing = true;
        }
        if (password == null || password.trim().isEmpty()) {
            warnMsg.append("SMTP_PASSWORD ");
            missing = true;
        }

        if (missing) {
            // Warn only — do NOT throw. The app can start without email.
            // EmailService uses @Autowired(required=false) and guards each send call.
            logger.warn("========================================================================");
            logger.warn("SMTP WARNING: " + warnMsg.toString().trim());
            logger.warn("Email features will be unavailable until SMTP env vars are set.");
            logger.warn("Set SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD on Render.");
            logger.warn("========================================================================");
        } else {
            logger.info("SMTP configuration variables verified successfully.");
            logger.info("  Resolved SMTP Host: {}", host);
            logger.info("  Resolved SMTP Port: {}", port);
            logger.info("  Resolved SMTP Username: '{}'", username);
            logger.info("  Resolved SMTP Password Length: {}", password != null ? password.length() : 0);
            if (password != null && password.length() > 0) {
                String masked = password.substring(0, Math.min(3, password.length())) + "..." +
                                 password.substring(Math.max(0, password.length() - 3));
                logger.info("  Masked SMTP Password: {}", masked);
            }
        }
    }
}
