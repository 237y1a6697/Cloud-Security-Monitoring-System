package com.prashanth.dashboard.repository;

import com.prashanth.dashboard.model.ScheduledReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScheduledReportRepository extends JpaRepository<ScheduledReport, Long> {
    List<ScheduledReport> findByEnabled(boolean enabled);
    List<ScheduledReport> findByEnabledTrue();
}
