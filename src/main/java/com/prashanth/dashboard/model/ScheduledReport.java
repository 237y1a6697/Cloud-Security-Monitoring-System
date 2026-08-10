package com.prashanth.dashboard.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "scheduled_reports")
public class ScheduledReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String reportType; // EXECUTIVE_SUMMARY, IT_ASSETS_LOG, SECURITY_INCIDENTS, VULNERABILITY_CVE

    @Column(nullable = false)
    private String frequency; // DAILY, WEEKLY, MONTHLY

    @Column(nullable = false)
    private String utcTime; // String: e.g. "02:02" (HH:mm)

    @Column(nullable = false)
    private String recipientEmail;

    private boolean enabled = true;

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime lastRunAt;

    private LocalDateTime nextRunAt;

    private String lastStatus = "SCHEDULED";

    @Column(columnDefinition = "TEXT")
    private String lastError;

    public ScheduledReport() {
    }

    public ScheduledReport(String reportType, String frequency, String utcTime, String recipientEmail) {
        this.reportType = reportType;
        this.frequency = frequency;
        this.utcTime = utcTime;
        this.recipientEmail = recipientEmail;
        this.enabled = true;
        this.createdAt = LocalDateTime.now();
        this.lastStatus = "SCHEDULED";
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getReportType() {
        return reportType;
    }

    public void setReportType(String reportType) {
        this.reportType = reportType;
    }

    public String getFrequency() {
        return frequency;
    }

    public void setFrequency(String frequency) {
        this.frequency = frequency;
    }

    public String getUtcTime() {
        return utcTime;
    }

    public void setUtcTime(String utcTime) {
        this.utcTime = utcTime;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getLastRunAt() {
        return lastRunAt;
    }

    public void setLastRunAt(LocalDateTime lastRunAt) {
        this.lastRunAt = lastRunAt;
    }

    public LocalDateTime getNextRunAt() {
        return nextRunAt;
    }

    public void setNextRunAt(LocalDateTime nextRunAt) {
        this.nextRunAt = nextRunAt;
    }

    public String getLastStatus() {
        return lastStatus;
    }

    public void setLastStatus(String lastStatus) {
        this.lastStatus = lastStatus;
    }

    public String getLastError() {
        return lastError;
    }

    public void setLastError(String lastError) {
        this.lastError = lastError;
    }
}
