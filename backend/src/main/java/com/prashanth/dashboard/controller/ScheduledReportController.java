package com.prashanth.dashboard.controller;

import com.prashanth.dashboard.model.ScheduledReport;
import com.prashanth.dashboard.service.ScheduledReportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * REST controller for managing Scheduled Report configurations.
 *
 * All endpoints require REPORT_EXPORT authority (the same authority
 * used by /api/reports/send-email).
 */
@RestController
@RequestMapping("/api/reports/schedules")
public class ScheduledReportController {

    private static final Logger logger = LoggerFactory.getLogger(ScheduledReportController.class);

    private static final Set<String> VALID_REPORT_TYPES = Set.of(
            "EXECUTIVE_SUMMARY", "IT_ASSETS_LOG", "SECURITY_INCIDENTS", "VULNERABILITY_CVE"
    );
    private static final Set<String> VALID_FREQUENCIES = Set.of("DAILY", "WEEKLY", "MONTHLY");
    private static final Pattern UTC_TIME_PATTERN = Pattern.compile("^([01]\\d|2[0-3]):([0-5]\\d)$");
    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private final ScheduledReportService service;

    public ScheduledReportController(ScheduledReportService service) {
        this.service = service;
    }

    // ── GET all ──────────────────────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasAuthority('REPORT_EXPORT')")
    public ResponseEntity<List<ScheduledReport>> getAllSchedules() {
        return ResponseEntity.ok(service.getAllSchedules());
    }

    // ── GET by ID ─────────────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('REPORT_EXPORT')")
    public ResponseEntity<?> getScheduleById(@PathVariable Long id) {
        return service.getScheduleById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(404).body(Map.of("message", "Schedule not found with id: " + id)));
    }

    // ── POST create ───────────────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasAuthority('REPORT_EXPORT')")
    public ResponseEntity<?> createSchedule(@RequestBody Map<String, String> payload) {
        String reportType = payload.get("reportType");
        String frequency  = payload.get("frequency");
        String utcTime    = payload.get("utcTime");
        String email      = payload.get("recipientEmail");

        ResponseEntity<?> validationError = validatePayload(reportType, frequency, utcTime, email);
        if (validationError != null) return validationError;

        ScheduledReport schedule = new ScheduledReport(
                reportType.toUpperCase().trim(),
                frequency.toUpperCase().trim(),
                utcTime.trim(),
                email.trim()
        );

        ScheduledReport created = service.createSchedule(schedule);
        logger.info("Created scheduled report: id={}, type={}, freq={}, recipient={}",
                created.getId(), created.getReportType(), created.getFrequency(), created.getRecipientEmail());
        return ResponseEntity.status(201).body(created);
    }

    // ── PUT update ────────────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('REPORT_EXPORT')")
    public ResponseEntity<?> updateSchedule(@PathVariable Long id,
                                            @RequestBody Map<String, String> payload) {
        String reportType = payload.get("reportType");
        String frequency  = payload.get("frequency");
        String utcTime    = payload.get("utcTime");
        String email      = payload.get("recipientEmail");

        ResponseEntity<?> validationError = validatePayload(reportType, frequency, utcTime, email);
        if (validationError != null) return validationError;

        ScheduledReport details = new ScheduledReport(
                reportType.toUpperCase().trim(),
                frequency.toUpperCase().trim(),
                utcTime.trim(),
                email.trim()
        );

        return service.updateSchedule(id, details)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(404).body(Map.of("message", "Schedule not found with id: " + id)));
    }

    // ── PATCH toggle enable/disable ───────────────────────────────────────────────

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasAuthority('REPORT_EXPORT')")
    public ResponseEntity<?> toggleSchedule(@PathVariable Long id) {
        return service.toggleSchedule(id)
                .<ResponseEntity<?>>map(updated -> {
                    logger.info("Schedule id={} toggled: enabled={}", id, updated.isEnabled());
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.status(404).body(Map.of("message", "Schedule not found with id: " + id)));
    }

    // ── DELETE ────────────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('REPORT_EXPORT')")
    public ResponseEntity<?> deleteSchedule(@PathVariable Long id) {
        if (service.deleteSchedule(id)) {
            logger.info("Deleted scheduled report id={}", id);
            return ResponseEntity.ok(Map.of("message", "Schedule deleted successfully."));
        }
        return ResponseEntity.status(404).body(Map.of("message", "Schedule not found with id: " + id));
    }

    // ── Validation helper ─────────────────────────────────────────────────────────

    private ResponseEntity<?> validatePayload(String reportType, String frequency,
                                              String utcTime, String email) {
        if (reportType == null || reportType.isBlank()) {
            return badRequest("reportType is required.");
        }
        if (!VALID_REPORT_TYPES.contains(reportType.toUpperCase().trim())) {
            return badRequest("reportType must be one of: " + VALID_REPORT_TYPES);
        }
        if (frequency == null || frequency.isBlank()) {
            return badRequest("frequency is required.");
        }
        if (!VALID_FREQUENCIES.contains(frequency.toUpperCase().trim())) {
            return badRequest("frequency must be one of: DAILY, WEEKLY, MONTHLY");
        }
        if (utcTime == null || utcTime.isBlank()) {
            return badRequest("utcTime is required (format: HH:mm).");
        }
        if (!UTC_TIME_PATTERN.matcher(utcTime.trim()).matches()) {
            return badRequest("utcTime must be in HH:mm format (00:00 – 23:59).");
        }
        if (email == null || email.isBlank()) {
            return badRequest("recipientEmail is required.");
        }
        if (!EMAIL_PATTERN.matcher(email.trim()).matches()) {
            return badRequest("recipientEmail is not a valid email address.");
        }
        return null;
    }

    private ResponseEntity<Map<String, String>> badRequest(String message) {
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }
}
