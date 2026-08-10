package com.prashanth.dashboard.service;

import com.prashanth.dashboard.model.ScheduledReport;
import com.prashanth.dashboard.repository.ScheduledReportRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

@Service
public class ScheduledReportService {

    private static final Logger logger = LoggerFactory.getLogger(ScheduledReportService.class);

    private final ScheduledReportRepository repository;
    private final ReportGenerationService reportGenerationService;
    private final EmailService emailService;

    public ScheduledReportService(ScheduledReportRepository repository,
                                  ReportGenerationService reportGenerationService,
                                  EmailService emailService) {
        this.repository = repository;
        this.reportGenerationService = reportGenerationService;
        this.emailService = emailService;
    }

    public List<ScheduledReport> getAllSchedules() {
        return repository.findAll();
    }

    public Optional<ScheduledReport> getScheduleById(Long id) {
        return repository.findById(id);
    }

    public ScheduledReport createSchedule(ScheduledReport schedule) {
        LocalDateTime utcNow = LocalDateTime.now(ZoneId.of("UTC"));
        schedule.setCreatedAt(utcNow);
        schedule.setEnabled(true);
        schedule.setLastStatus("SCHEDULED");
        schedule.setNextRunAt(calculateNextRunAt(schedule.getFrequency(), schedule.getUtcTime(), utcNow));
        return repository.save(schedule);
    }

    public Optional<ScheduledReport> updateSchedule(Long id, ScheduledReport scheduleDetails) {
        return repository.findById(id).map(existing -> {
            existing.setReportType(scheduleDetails.getReportType());
            existing.setFrequency(scheduleDetails.getFrequency());
            existing.setUtcTime(scheduleDetails.getUtcTime());
            existing.setRecipientEmail(scheduleDetails.getRecipientEmail());
            
            LocalDateTime utcNow = LocalDateTime.now(ZoneId.of("UTC"));
            existing.setNextRunAt(calculateNextRunAt(existing.getFrequency(), existing.getUtcTime(), utcNow));
            return repository.save(existing);
        });
    }

    public Optional<ScheduledReport> toggleSchedule(Long id) {
        return repository.findById(id).map(existing -> {
            existing.setEnabled(!existing.isEnabled());
            if (existing.isEnabled()) {
                LocalDateTime utcNow = LocalDateTime.now(ZoneId.of("UTC"));
                existing.setNextRunAt(calculateNextRunAt(existing.getFrequency(), existing.getUtcTime(), utcNow));
                existing.setLastStatus("SCHEDULED");
            } else {
                existing.setNextRunAt(null);
            }
            return repository.save(existing);
        });
    }

    public boolean deleteSchedule(Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return true;
        }
        return false;
    }

    public void runDueSchedules() {
        LocalDateTime utcNow = LocalDateTime.now(ZoneId.of("UTC"));
        List<ScheduledReport> dueSchedules = repository.findByEnabledTrue();

        for (ScheduledReport schedule : dueSchedules) {
            if (schedule.getNextRunAt() != null && !utcNow.isBefore(schedule.getNextRunAt())) {
                logger.info("Executing scheduled report: ID={}, Type={}, Recipient={}", 
                        schedule.getId(), schedule.getReportType(), schedule.getRecipientEmail());
                
                try {
                    // Generate PDF Report bytes
                    byte[] pdfBytes = reportGenerationService.generateReportPdf(schedule.getReportType());
                    
                    // HTML email body
                    String reportTitle = schedule.getReportType().replace("_", " ");
                    String htmlBody = "<h3>SentinelCore SecureOps</h3>"
                            + "<p><strong>Automated Security Report</strong></p>"
                            + "<p><strong>Report Type:</strong> " + reportTitle + "</p>"
                            + "<p><strong>Generated At:</strong> " + utcNow + " UTC</p>"
                            + "<p><strong>Frequency:</strong> " + schedule.getFrequency() + "</p>"
                            + "<br/>"
                            + "<p>The requested PDF report is attached to this email.</p>";

                    String filename = "sentinelcore_" + schedule.getReportType().toLowerCase() + "_report.pdf";
                    
                    // Dispatch via EmailService (which uses Brevo HTTPS REST API)
                    emailService.sendHtmlEmailWithAttachment(
                            schedule.getRecipientEmail(),
                            "SentinelCore - Scheduled " + reportTitle + " Report",
                            htmlBody,
                            filename,
                            pdfBytes
                    );

                    // Success update
                    schedule.setLastRunAt(utcNow);
                    schedule.setLastStatus("SENT");
                    schedule.setLastError(null);
                } catch (Exception e) {
                    logger.error("Failed to generate/deliver scheduled report ID={}", schedule.getId(), e);
                    schedule.setLastStatus("FAILED");
                    schedule.setLastError(e.getMessage() != null ? e.getMessage() : "Unknown scheduler error");
                } finally {
                    // Always calculate next runtime to prevent duplicate running or locking
                    schedule.setNextRunAt(calculateNextRunAt(schedule.getFrequency(), schedule.getUtcTime(), utcNow.plusMinutes(1)));
                    repository.save(schedule);
                }
            }
        }
    }

    public LocalDateTime calculateNextRunAt(String frequency, String utcTime, LocalDateTime startFrom) {
        if (utcTime == null || !utcTime.contains(":")) {
            return startFrom.plusDays(1); // safety fallback
        }
        
        try {
            String[] parts = utcTime.split(":");
            int hour = Integer.parseInt(parts[0].trim());
            int minute = Integer.parseInt(parts[1].trim());

            LocalDateTime candidate = startFrom.withHour(hour).withMinute(minute).withSecond(0).withNano(0);
            String normFreq = frequency.toUpperCase().trim();

            if ("DAILY".equals(normFreq)) {
                if (!candidate.isAfter(startFrom)) {
                    candidate = candidate.plusDays(1);
                }
                return candidate;
            } else if ("WEEKLY".equals(normFreq)) {
                while (!candidate.isAfter(startFrom) || candidate.getDayOfWeek() != java.time.DayOfWeek.MONDAY) {
                    candidate = candidate.plusDays(1);
                }
                return candidate;
            } else if ("MONTHLY".equals(normFreq)) {
                while (!candidate.isAfter(startFrom) || candidate.getDayOfMonth() != 1) {
                    candidate = candidate.plusDays(1);
                }
                return candidate;
            }
            return candidate.plusDays(1);
        } catch (Exception e) {
            logger.error("Error calculating next run time for frequency={}, time={}", frequency, utcTime, e);
            return startFrom.plusDays(1);
        }
    }
}
