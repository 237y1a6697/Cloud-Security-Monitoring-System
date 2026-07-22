package com.prashanth.dashboard.dto;

import java.time.LocalDateTime;

public class RecentAuditLogDTO {
    private LocalDateTime timestamp;
    private String username;
    private String action;
    private String result;

    public RecentAuditLogDTO() {}

    public RecentAuditLogDTO(LocalDateTime timestamp, String username, String action, String result) {
        this.timestamp = timestamp;
        this.username = username;
        this.action = action;
        this.result = result;
    }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }
}