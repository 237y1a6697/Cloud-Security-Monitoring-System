package com.prashanth.dashboard.dto;

import java.time.LocalDateTime;

public class RecentIncidentDTO {
    private String incidentId;
    private String title;
    private String severity;
    private String status;
    private String assignedTeam;
    private LocalDateTime createdAt;

    public RecentIncidentDTO() {}

    public RecentIncidentDTO(String incidentId, String title, String severity, String status,
                             String assignedTeam, LocalDateTime createdAt) {
        this.incidentId = incidentId;
        this.title = title;
        this.severity = severity;
        this.status = status;
        this.assignedTeam = assignedTeam;
        this.createdAt = createdAt;
    }

    public String getIncidentId() { return incidentId; }
    public void setIncidentId(String incidentId) { this.incidentId = incidentId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getAssignedTeam() { return assignedTeam; }
    public void setAssignedTeam(String assignedTeam) { this.assignedTeam = assignedTeam; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}