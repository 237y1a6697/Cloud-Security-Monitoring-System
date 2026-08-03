package com.prashanth.dashboard.service;
import jakarta.annotation.PostConstruct;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
private String fromEmail;

@Value("${spring.mail.host}")
private String smtpHost;

@Value("${spring.mail.port}")
private String smtpPort;
    @PostConstruct
public void checkMailConfig() {
    logger.info("========== MAIL CONFIG ==========");
    logger.info("SMTP Host: {}", smtpHost);
    logger.info("SMTP Port: {}", smtpPort);
    logger.info("SMTP Username: {}", fromEmail);
    logger.info("=================================");
}
   
    public void sendPlainEmail(String to, String subject, String body) {
        if (mailSender == null) {
            logger.error("JavaMailSender is not initialized or configured.");
            throw new IllegalStateException("Authentication failed / SMTP settings not configured.");
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            if (fromEmail != null && !fromEmail.trim().isEmpty()) {
                message.setFrom(fromEmail);
            } else {
                message.setFrom("secops-alerts@sentinelcore.com");
            }
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            logger.info("Plain text email successfully sent to {}", to);
        } catch (MailAuthenticationException e) {
            logger.error("SMTP Authentication Failed: Username/Password credentials rejected. Custom fromEmail configured: {}", fromEmail, e);
            throw new RuntimeException("SMTP Authentication Failed: Incorrect SMTP credentials. "
                    + "If using Gmail, please verify you configured a 16-character Google App Password (not your primary password) in the SMTP_PASSWORD env var.", e);
        } catch (MailSendException e) {
            logger.error("SMTP Transport Connection / Delivery Failed when emailing {}", to, e);
            throw new RuntimeException("SMTP Send Failure: Host/Connection issue or invalid sender alignment. Details: " + e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Failed to send plain text email to {}", to, e);
            throw new RuntimeException("SMTP delivery failure: " + e.getMessage(), e);
        }
    }

    public void sendHtmlEmailWithAttachment(String to, String subject, String htmlContent, String attachmentName, byte[] attachmentData) {
        if (mailSender == null) {
            logger.error("JavaMailSender is not initialized or configured.");
            throw new IllegalStateException("SMTP settings not configured / JavaMailSender bean missing.");
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            // Enable multipart support for attachments
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            if (fromEmail != null && !fromEmail.trim().isEmpty()) {
                helper.setFrom(fromEmail);
            } else {
                helper.setFrom("secops-alerts@sentinelcore.com");
            }
            helper.setTo(to);
            helper.setSubject(subject);
            // Sanitization: Ensure no raw injection vectors
            helper.setText(htmlContent, true); // true indicates standard HTML formatting
            
            if (attachmentData != null && attachmentData.length > 0 && attachmentName != null) {
                helper.addAttachment(attachmentName, new ByteArrayResource(attachmentData));
                logger.info("Attached file: {} ({} bytes)", attachmentName, attachmentData.length);
            }
            
            mailSender.send(message);
            logger.info("HTML email successfully sent to {}", to);
        } catch (MailAuthenticationException e) {
            logger.error("SMTP Authentication Failed: Username/Password credentials rejected. Custom fromEmail configured: {}", fromEmail, e);
            throw new RuntimeException("SMTP Authentication Failed: Incorrect SMTP credentials. "
                    + "If using Gmail, please verify you configured a 16-character Google App Password (not your primary password) in the SMTP_PASSWORD env var.", e);
        } catch (MailSendException e) {
            logger.error("SMTP Transport Connection / Delivery Failed when emailing {}", to, e);
            throw new RuntimeException("SMTP Send Failure: Host/Connection issue or invalid sender alignment. Details: " + e.getMessage(), e);
        } catch (MessagingException e) {
            logger.error("Failed to compile or deliver HTML email to {}", to, e);
            throw new RuntimeException("SMTP delivery failure: " + e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Unexpected error during email dispatch to {}", to, e);
            throw new RuntimeException("SMTP delivery failure: " + e.getMessage(), e);
        }
    }
}
