package com.prashanth.dashboard.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.prashanth.dashboard.model.AuditLog;
import com.prashanth.dashboard.service.AuditLogService;

@RestController
@RequestMapping("/api/audit-logs")
@PreAuthorize("hasAuthority('AUDIT_VIEW')")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ResponseEntity<Page<AuditLog>> getAllAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<AuditLog> auditLogs = auditLogService.getAllAuditLogs(pageable);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/all")
    public ResponseEntity<List<AuditLog>> getAllAuditLogsList() {
        List<AuditLog> auditLogs = auditLogService.getAllAuditLogs();
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<List<AuditLog>> getAuditLogsByUsername(@PathVariable String username) {
        List<AuditLog> auditLogs = auditLogService.getAuditLogsByUsername(username);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/action/{action}")
    public ResponseEntity<List<AuditLog>> getAuditLogsByAction(@PathVariable String action) {
        List<AuditLog> auditLogs = auditLogService.getAuditLogsByAction(action);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/result/{result}")
    public ResponseEntity<List<AuditLog>> getAuditLogsByResult(@PathVariable String result) {
        List<AuditLog> auditLogs = auditLogService.getAuditLogsByResult(result);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<AuditLog>> getAuditLogsByDateRange(
            @RequestParam LocalDateTime start,
            @RequestParam LocalDateTime end) {
        List<AuditLog> auditLogs = auditLogService.getAuditLogsByDateRange(start, end);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/stats")
    public ResponseEntity<AuditLogStats> getAuditLogStats() {
        AuditLogStats stats = new AuditLogStats();
        stats.setTotalLogs(auditLogService.getTotalAuditLogsCount());
        stats.setSuccessCount(auditLogService.getSuccessCount());
        stats.setFailedCount(auditLogService.getFailedCount());
        stats.setDeniedCount(auditLogService.getDeniedCount());
        return ResponseEntity.ok(stats);
    }

    public static class AuditLogStats {
        private long totalLogs;
        private long successCount;
        private long failedCount;
        private long deniedCount;

        public long getTotalLogs() { return totalLogs; }
        public void setTotalLogs(long totalLogs) { this.totalLogs = totalLogs; }
        public long getSuccessCount() { return successCount; }
        public void setSuccessCount(long successCount) { this.successCount = successCount; }
        public long getFailedCount() { return failedCount; }
        public void setFailedCount(long failedCount) { this.failedCount = failedCount; }
        public long getDeniedCount() { return deniedCount; }
        public void setDeniedCount(long deniedCount) { this.deniedCount = deniedCount; }
    }
}