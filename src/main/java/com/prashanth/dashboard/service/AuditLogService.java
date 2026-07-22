package com.prashanth.dashboard.service;

import com.prashanth.dashboard.model.AuditLog;
import com.prashanth.dashboard.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public Page<AuditLog> getAllAuditLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }

    public List<AuditLog> getAllAuditLogs() {
        return auditLogRepository.findAll();
    }

    public List<AuditLog> getAuditLogsByUsername(String username) {
        return auditLogRepository.findByUsername(username);
    }

    public List<AuditLog> getAuditLogsByAction(String action) {
        return auditLogRepository.findByAction(action);
    }

    public List<AuditLog> getAuditLogsByResult(String result) {
        return auditLogRepository.findByResult(result);
    }

    public List<AuditLog> getAuditLogsByDateRange(LocalDateTime start, LocalDateTime end) {
        return auditLogRepository.findByTimestampBetween(start, end);
    }

    public long getTotalAuditLogsCount() {
        return auditLogRepository.count();
    }

    public long getSuccessCount() {
        return auditLogRepository.countByResult("SUCCESS");
    }

    public long getFailedCount() {
        return auditLogRepository.countByResultContaining("FAILED");
    }

    public long getDeniedCount() {
        return auditLogRepository.countByResult("DENIED");
    }
}