package com.prashanth.dashboard.service;

import com.prashanth.dashboard.model.AuditLog;
import com.prashanth.dashboard.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public Page<AuditLog> getAllAuditLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }

    public Page<AuditLog> getFilteredAuditLogs(String search, String outcome, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        String cleanSearch = (search == null || search.trim().isEmpty()) ? null : search.trim();
        String cleanOutcome = (outcome == null || outcome.trim().isEmpty()) ? null : outcome.trim();
        return auditLogRepository.filterLogs(cleanSearch, cleanOutcome, startDate, endDate, pageable);
    }

    public List<AuditLog> getFilteredAuditLogsList(String search, String outcome, LocalDateTime startDate, LocalDateTime endDate, Sort sort) {
        String cleanSearch = (search == null || search.trim().isEmpty()) ? null : search.trim();
        String cleanOutcome = (outcome == null || outcome.trim().isEmpty()) ? null : outcome.trim();
        return auditLogRepository.filterLogsList(cleanSearch, cleanOutcome, startDate, endDate, sort);
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

    @Transactional
    public AuditLog addEvidence(Long logId, String filename) {
        if (filename == null || filename.trim().isEmpty()) {
            throw new IllegalArgumentException("Evidence filename cannot be empty");
        }
        Optional<AuditLog> logOpt = auditLogRepository.findById(logId);
        if (logOpt.isEmpty()) {
            throw new IllegalArgumentException("Audit log not found with ID: " + logId);
        }
        AuditLog log = logOpt.get();
        String currentEvidence = log.getEvidence();
        if (currentEvidence == null || currentEvidence.trim().isEmpty()) {
            log.setEvidence(filename.trim());
        } else {
            // Avoid duplicate filenames in the same audit log
            String[] items = currentEvidence.split(",");
            boolean exists = false;
            for (String item : items) {
                if (item.trim().equalsIgnoreCase(filename.trim())) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                log.setEvidence(currentEvidence + "," + filename.trim());
            }
        }
        return auditLogRepository.save(log);
    }
}