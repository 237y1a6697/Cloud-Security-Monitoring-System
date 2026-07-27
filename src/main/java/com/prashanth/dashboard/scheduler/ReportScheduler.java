package com.prashanth.dashboard.scheduler;

import com.prashanth.dashboard.model.Incident;
import com.prashanth.dashboard.service.EmailService;
import com.prashanth.dashboard.service.IncidentService;
import com.prashanth.dashboard.dto.UserResponse;
import com.prashanth.dashboard.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class ReportScheduler {

    private static final Logger logger = LoggerFactory.getLogger(ReportScheduler.class);

    @Autowired
    private EmailService emailService;

    @Autowired
    private IncidentService incidentService;

    @Autowired
    private UserService userService;

    // Run daily at midnight to send a summary incident report to all active users
    @Scheduled(cron = "${report.schedule.cron:0 0 0 * * ?}")
    public void executeScheduledReport() {
        logger.info("Executing scheduled SEC-OPS cron report job at {}", LocalDateTime.now());
        
        try {
            List<Incident> incidents = incidentService.getAllIncidents();
            List<UserResponse> users = userService.getAllUsers();
            
            long openIncidents = incidents.stream().filter(i -> !"RESOLVED".equalsIgnoreCase(i.getStatus())).count();
            long criticalIncidents = incidents.stream().filter(i -> "CRITICAL".equalsIgnoreCase(i.getSeverity())).count();

            String htmlBody = "<h2>SentinelCore Cron Report: Security Summary</h2>"
                    + "<p><strong>Date Generated:</strong> " + LocalDateTime.now() + "</p>"
                    + "<p>This is the scheduled security execution overview.</p>"
                    + "<ul>"
                    + "  <li><strong>Total Security Incidents:</strong> " + incidents.size() + "</li>"
                    + "  <li><strong>Open/Active Incidents:</strong> " + openIncidents + "</li>"
                    + "  <li><strong>Unresolved Critical Severity:</strong> " + criticalIncidents + "</li>"
                    + "</ul>"
                    + "<br/><p style='color:#777;font-size:0.8rem;'>Delivered automatically via cron scheduler. System Admin contact: admin@sentinelcore.local</p>";

            for (UserResponse user : users) {
                if (user.email() != null && !user.email().trim().isEmpty()) {
                    try {
                        logger.info("Dispatching scheduled cron-report to email: {}", user.email());
                        emailService.sendHtmlEmailWithAttachment(user.email(), "Scheduled SentinelCore incident summary", htmlBody, null, null);
                    } catch (Exception e) {
                        logger.error("Failed to deliver scheduled mail to: {}", user.email(), e);
                    }
                }
            }
            logger.info("Successfully executed all scheduled report jobs.");
        } catch (Exception e) {
            logger.error("Fatal error during scheduled report execution", e);
        }
    }
}
