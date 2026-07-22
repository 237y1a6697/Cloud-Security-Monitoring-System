package com.prashanth.dashboard.dto;

import java.time.LocalDateTime;

public class RecentAlertDTO {
    private String id;
    private String title;
    private String severity;
    private String source;
    private LocalDateTime timestamp;

    public RecentAlertDTO() {}

    public RecentAlertDTO(String id, String title, String severity, String source, LocalDateTime timestamp) {
        this.id = id;
        this.title = title;
        this.severity = severity;
        this.source = source;
        this.timestamp = timestamp;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}