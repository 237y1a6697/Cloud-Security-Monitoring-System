package com.prashanth.dashboard.scheduler;

import com.prashanth.dashboard.service.ScheduledReportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Triggers every 60 seconds (UTC) and delegates to ScheduledReportService
 * to detect and dispatch any due scheduled reports.
 *
 * Design: one shared scheduler polls the database — no per-user threads.
 * Duplicate-execution prevention is handled by nextRunAt in the database row.
 */
@Component
public class ScheduledReportScheduler {

    private static final Logger logger = LoggerFactory.getLogger(ScheduledReportScheduler.class);

    private final ScheduledReportService scheduledReportService;

    public ScheduledReportScheduler(ScheduledReportService scheduledReportService) {
        this.scheduledReportService = scheduledReportService;
    }

    @Scheduled(fixedDelay = 60000)
    public void checkAndRunDueSchedules() {
        logger.debug("ScheduledReportScheduler: checking due schedules (UTC)");
        try {
            scheduledReportService.runDueSchedules();
        } catch (Exception e) {
            logger.error("Unexpected error in scheduled report runner", e);
        }
    }
}
