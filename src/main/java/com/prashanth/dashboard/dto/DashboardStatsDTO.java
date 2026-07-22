package com.prashanth.dashboard.dto;

public class DashboardStatsDTO {
    private long totalAssets;
    private long activeIncidents;
    private long criticalIncidents;
    private long openVulnerabilities;
    private long activeAlerts;
    private long registeredUsers;

    public DashboardStatsDTO() {}

    public DashboardStatsDTO(long totalAssets, long activeIncidents, long criticalIncidents,
                             long openVulnerabilities, long activeAlerts, long registeredUsers) {
        this.totalAssets = totalAssets;
        this.activeIncidents = activeIncidents;
        this.criticalIncidents = criticalIncidents;
        this.openVulnerabilities = openVulnerabilities;
        this.activeAlerts = activeAlerts;
        this.registeredUsers = registeredUsers;
    }

    public long getTotalAssets() { return totalAssets; }
    public void setTotalAssets(long totalAssets) { this.totalAssets = totalAssets; }
    public long getActiveIncidents() { return activeIncidents; }
    public void setActiveIncidents(long activeIncidents) { this.activeIncidents = activeIncidents; }
    public long getCriticalIncidents() { return criticalIncidents; }
    public void setCriticalIncidents(long criticalIncidents) { this.criticalIncidents = criticalIncidents; }
    public long getOpenVulnerabilities() { return openVulnerabilities; }
    public void setOpenVulnerabilities(long openVulnerabilities) { this.openVulnerabilities = openVulnerabilities; }
    public long getActiveAlerts() { return activeAlerts; }
    public void setActiveAlerts(long activeAlerts) { this.activeAlerts = activeAlerts; }
    public long getRegisteredUsers() { return registeredUsers; }
    public void setRegisteredUsers(long registeredUsers) { this.registeredUsers = registeredUsers; }
}