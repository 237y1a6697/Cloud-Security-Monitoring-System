package com.prashanth.dashboard.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime timestamp;
    private String username;

    @Column(columnDefinition = "TEXT")
    private String role;

    private String ipAddress;

    @Column(columnDefinition = "TEXT")
    private String deviceBrowser;
    
    @Column(columnDefinition = "TEXT")
    private String action; // e.g. "Delete Asset"
    
    @Column(columnDefinition = "TEXT")
    private String prevValue;
    
    @Column(columnDefinition = "TEXT")
    private String newValue;
    
    @Column(columnDefinition = "TEXT")
    private String result; // e.g. "SUCCESS", "DENIED"

    @Column(columnDefinition = "TEXT")
    private String evidence; // e.g. "saml_auth_challenge.json,user_ip_verification.log"

    public AuditLog() {
        this.timestamp = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public String getDeviceBrowser() { return deviceBrowser; }
    public void setDeviceBrowser(String deviceBrowser) { this.deviceBrowser = deviceBrowser; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getPrevValue() { return prevValue; }
    public void setPrevValue(String prevValue) { this.prevValue = prevValue; }
    public String getNewValue() { return newValue; }
    public void setNewValue(String newValue) { this.newValue = newValue; }
    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }
    public String getEvidence() { return evidence; }
    public void setEvidence(String evidence) { this.evidence = evidence; }
}
