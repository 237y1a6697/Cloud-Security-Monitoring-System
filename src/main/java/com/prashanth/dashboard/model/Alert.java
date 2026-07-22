package com.prashanth.dashboard.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "alerts")
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String severity; // Critical, Warning, Info
    private String source;     // e.g. "FW-GW-03", "DB-SRV-12"
    private LocalDateTime timestamp;

    public Alert() {
        this.timestamp = LocalDateTime.now();
    }

    public Alert(String title, String severity, String source, LocalDateTime timestamp) {
        this.title = title;
        this.severity = severity;
        this.source = source;
        this.timestamp = timestamp;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
