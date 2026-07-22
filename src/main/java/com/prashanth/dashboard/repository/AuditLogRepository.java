package com.prashanth.dashboard.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.prashanth.dashboard.model.AuditLog;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    
    List<AuditLog> findByUsername(String username);
    
    List<AuditLog> findByAction(String action);
    
    List<AuditLog> findByResult(String result);
    
    List<AuditLog> findByResultContaining(String result);
    
    List<AuditLog> findByTimestampBetween(LocalDateTime start, LocalDateTime end);
    
    long countByResult(String result);
    
    long countByResultContaining(String result);
    
    List<AuditLog> findTop10ByOrderByTimestampDesc();
}
