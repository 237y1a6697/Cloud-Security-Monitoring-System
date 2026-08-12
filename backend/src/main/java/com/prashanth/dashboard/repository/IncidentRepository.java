package com.prashanth.dashboard.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.prashanth.dashboard.dto.RecentIncidentDTO;
import com.prashanth.dashboard.dto.SeverityCount;
import com.prashanth.dashboard.dto.StatusCount;
import com.prashanth.dashboard.dto.TrendPoint;
import com.prashanth.dashboard.model.Incident;

public interface IncidentRepository extends JpaRepository<Incident, Long> {

    @Query("SELECT COUNT(i) FROM Incident i WHERE i.status IN ('Open', 'Investigating')")
    long countActiveIncidents();

    @Query("SELECT COUNT(i) FROM Incident i WHERE i.severity = 'Critical' AND i.status IN ('Open', 'Investigating')")
    long countCriticalIncidents();

    @Query("SELECT new com.prashanth.dashboard.dto.StatusCount(i.status, COUNT(i)) FROM Incident i GROUP BY i.status")
    List<StatusCount> getIncidentStatusCounts();

    @Query("SELECT new com.prashanth.dashboard.dto.SeverityCount(i.severity, COUNT(i)) FROM Incident i GROUP BY i.severity")
    List<SeverityCount> getIncidentSeverityCounts();

    @Query("SELECT new com.prashanth.dashboard.dto.TrendPoint(CAST(i.createdAt AS DATE), COUNT(i)) FROM Incident i WHERE i.createdAt >= :since GROUP BY CAST(i.createdAt AS DATE) ORDER BY CAST(i.createdAt AS DATE)")
    List<TrendPoint> getIncidentTrend(@Param("since") LocalDateTime since);

    @Query("SELECT new com.prashanth.dashboard.dto.RecentIncidentDTO(i.incidentId, i.title, i.severity, i.status, i.assignedTeam, i.createdAt) FROM Incident i ORDER BY i.createdAt DESC")
    List<RecentIncidentDTO> findRecentIncidents();
}
