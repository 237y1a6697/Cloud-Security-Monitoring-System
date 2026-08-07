package com.prashanth.dashboard.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:search IS NULL OR LOWER(a.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(a.action) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(a.ipAddress) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(a.result) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:outcome IS NULL OR a.result = :outcome) AND " +
           "(cast(:startDate as timestamp) IS NULL OR a.timestamp >= :startDate) AND " +
           "(cast(:endDate as timestamp) IS NULL OR a.timestamp <= :endDate)")
    Page<AuditLog> filterLogs(@Param("search") String search,
                              @Param("outcome") String outcome,
                              @Param("startDate") LocalDateTime startDate,
                              @Param("endDate") LocalDateTime endDate,
                              Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:search IS NULL OR LOWER(a.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(a.action) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(a.ipAddress) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(a.result) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:outcome IS NULL OR a.result = :outcome) AND " +
           "(cast(:startDate as timestamp) IS NULL OR a.timestamp >= :startDate) AND " +
           "(cast(:endDate as timestamp) IS NULL OR a.timestamp <= :endDate)")
    List<AuditLog> filterLogsList(@Param("search") String search,
                                  @Param("outcome") String outcome,
                                  @Param("startDate") LocalDateTime startDate,
                                  @Param("endDate") LocalDateTime endDate,
                                  org.springframework.data.domain.Sort sort);
}
