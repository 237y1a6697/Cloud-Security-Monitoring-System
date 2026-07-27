package com.prashanth.dashboard.controller;

import com.prashanth.dashboard.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Base64;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class EmailController {
    
    private static final Logger logger = LoggerFactory.getLogger(EmailController.class);

    @Autowired
    private EmailService emailService;

    @PostMapping("/send-email")
    @PreAuthorize("hasAuthority('REPORT_EXPORT')")
    public ResponseEntity<?> sendReportEmail(@RequestBody Map<String, Object> payload) {
        String to = (String) payload.get("to");
        String subject = (String) payload.get("subject");
        String body = (String) payload.get("body");
        String reportType = (String) payload.get("reportType");
        String fileName = (String) payload.get("fileName");
        String attachmentBase64 = (String) payload.get("attachmentBase64");

        logger.info("Attempting to email report type: {} to: {}", reportType, to);

        // Validation checks
        if (to == null || to.trim().isEmpty() || !to.contains("@")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Recipient address is invalid or empty."));
        }
        if (subject == null || subject.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Subject header cannot be empty."));
        }

        try {
            byte[] attachmentData = null;
            if (attachmentBase64 != null && !attachmentBase64.trim().isEmpty()) {
                // If it starts with data URI scheme, strip it: "data:application/pdf;base64,"
                if (attachmentBase64.contains(";base64,")) {
                    attachmentBase64 = attachmentBase64.substring(attachmentBase64.indexOf(";base64,") + 8);
                }
                attachmentData = Base64.getDecoder().decode(attachmentBase64.trim());
            }

            String htmlBody = "<h3>SentinelCore SecureOps Report</h3>"
                    + "<p><strong>Report Module:</strong> " + reportType + "</p>"
                    + "<p>" + (body == null ? "" : body.replace("\n", "<br/>")) + "</p>"
                    + "<br/><hr/>"
                    + "<p style='font-size:0.8rem;color:#888;'>This is an automated operational report from SentinelCore SecureOps Security Operations Center.</p>";

            emailService.sendHtmlEmailWithAttachment(to, subject, htmlBody, fileName, attachmentData);
            return ResponseEntity.ok(Map.of("message", "Report emailed successfully."));
        } catch (IllegalArgumentException e) {
            logger.error("Base64 decoding failed for email attachment", e);
            return ResponseEntity.badRequest().body(Map.of("message", "Malformed attachment payload structure."));
        } catch (Exception e) {
            logger.error("Failed to process and send email", e);
            String errorMsg = e.getMessage() != null ? e.getMessage() : "Unknown SMTP transmission error";
            return ResponseEntity.status(500).body(Map.of("message", errorMsg));
        }
    }
}
