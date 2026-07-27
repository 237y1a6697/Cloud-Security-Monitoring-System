package com.prashanth.dashboard.controller;

import com.prashanth.dashboard.dto.*;
import com.prashanth.dashboard.model.User;
import com.prashanth.dashboard.repository.AssetRepository;
import com.prashanth.dashboard.repository.AuditLogRepository;
import com.prashanth.dashboard.repository.IncidentRepository;
import com.prashanth.dashboard.repository.UserRepository;
import com.prashanth.dashboard.repository.AlertRepository;
import com.prashanth.dashboard.repository.VulnerabilityRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardApiController {

    private final IncidentRepository incidentRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final AssetRepository assetRepository;
    private final AlertRepository alertRepository;
    private final VulnerabilityRepository vulnerabilityRepository;

    public DashboardApiController(IncidentRepository incidentRepository,
                                  UserRepository userRepository,
                                  AuditLogRepository auditLogRepository,
                                  AssetRepository assetRepository,
                                  AlertRepository alertRepository,
                                  VulnerabilityRepository vulnerabilityRepository) {
        this.incidentRepository = incidentRepository;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.assetRepository = assetRepository;
        this.alertRepository = alertRepository;
        this.vulnerabilityRepository = vulnerabilityRepository;
    }

    // SECTION 1: Summary Cards
    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats() {
        long totalAssets = assetRepository.count();
        long activeIncidents = incidentRepository.countActiveIncidents();
        long criticalIncidents = incidentRepository.countCriticalIncidents();
        long openVulnerabilities = vulnerabilityRepository.count();
        long activeAlerts = alertRepository.count();
        long registeredUsers = userRepository.count();

        DashboardStatsDTO stats = new DashboardStatsDTO(
            totalAssets, activeIncidents, criticalIncidents,
            openVulnerabilities, activeAlerts, registeredUsers
        );
        return ResponseEntity.ok(stats);
    }

    // SECTION 2: Incident Status Chart
    @GetMapping("/incidents/status")
    public ResponseEntity<IncidentStatusDTO> getIncidentStatus() {
        List<StatusCount> counts = incidentRepository.getIncidentStatusCounts();
        IncidentStatusDTO dto = new IncidentStatusDTO();
        dto.setStatusCounts(counts != null ? counts : List.of());
        return ResponseEntity.ok(dto);
    }

    // SECTION 3: Incident Severity Chart
    @GetMapping("/incidents/severity")
    public ResponseEntity<IncidentSeverityDTO> getIncidentSeverity() {
        List<SeverityCount> counts = incidentRepository.getIncidentSeverityCounts();
        IncidentSeverityDTO dto = new IncidentSeverityDTO();
        dto.setSeverityCounts(counts != null ? counts : List.of());
        return ResponseEntity.ok(dto);
    }

    // SECTION 4: Incident Trend
    @GetMapping("/incidents/trend")
    public ResponseEntity<IncidentTrendDTO> getIncidentTrend() {
        LocalDateTime since = LocalDateTime.now().minusDays(30);
        List<TrendPoint> trend = incidentRepository.getIncidentTrend(since);
        IncidentTrendDTO dto = new IncidentTrendDTO();
        dto.setTrendPoints(trend != null ? trend : List.of());
        return ResponseEntity.ok(dto);
    }

    // SECTION 5: Recent Incidents
    @GetMapping("/incidents/recent")
    public ResponseEntity<List<RecentIncidentDTO>> getRecentIncidents() {
        List<RecentIncidentDTO> incidents = incidentRepository.findRecentIncidents();
        return ResponseEntity.ok(incidents != null ? incidents : List.of());
    }

    // SECTION 6: Recent Alerts
    @GetMapping("/alerts/recent")
    public ResponseEntity<List<RecentAlertDTO>> getRecentAlerts() {
        List<com.prashanth.dashboard.model.Alert> alerts = alertRepository.findTop10ByOrderByTimestampDesc();
        List<RecentAlertDTO> dtos = alerts.stream()
            .map(a -> new RecentAlertDTO(
                a.getId().toString(),
                a.getTitle(),
                a.getSeverity(),
                a.getSource(),
                a.getTimestamp()
            ))
            .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // SECTION 7: Recent Audit Logs
    @GetMapping("/audit-logs/recent")
    public ResponseEntity<List<RecentAuditLogDTO>> getRecentAuditLogs() {
        List<com.prashanth.dashboard.model.AuditLog> logs = auditLogRepository.findTop10ByOrderByTimestampDesc();
        List<RecentAuditLogDTO> dtos = logs.stream()
            .map(log -> new RecentAuditLogDTO(
                log.getTimestamp(),
                log.getUsername(),
                log.getAction(),
                log.getResult()
            ))
            .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // SECTION 10: Logged-in User Info
    @GetMapping("/user")
    public ResponseEntity<UserInfoDTO> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.ok(new UserInfoDTO("Unknown", "Unknown", null));
        }
        User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
        if (user == null) {
            return ResponseEntity.ok(new UserInfoDTO(userDetails.getUsername(), "Unknown", null));
        }
        UserInfoDTO dto = new UserInfoDTO(
            user.getUsername(),
            user.getPrimaryRoleName(),
            user.getLastLogin()
        );
        dto.setId(user.getId());
        dto.setDisplayName(user.getDisplayName());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setOrganization(user.getOrganization());
        dto.setDesignation(user.getDesignation());
        dto.setDepartment(user.getDepartment());
        dto.setEmployeeId(user.getEmployeeId());
        dto.setTheme(user.getTheme());
        dto.setNotifications(user.getNotifications());
        dto.setLanguage(user.getLanguage());
        dto.setTimezone(user.getTimezone());
        dto.setAvatar(user.getAvatar());
        return ResponseEntity.ok(dto);
    }

    // DTO for user info
    public static class UserInfoDTO {
        private Long id;
        private String username;
        private String role;
        private LocalDateTime lastLogin;
        private String displayName;
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
        private String organization;
        private String designation;
        private String department;
        private String employeeId;
        private String theme;
        private String notifications;
        private String language;
        private String timezone;
        private String avatar;

        public UserInfoDTO() {}
        public UserInfoDTO(String username, String role, LocalDateTime lastLogin) {
            this.username = username;
            this.role = role;
            this.lastLogin = lastLogin;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public LocalDateTime getLastLogin() { return lastLogin; }
        public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }
        
        public String getDisplayName() { return displayName; }
        public void setDisplayName(String displayName) { this.displayName = displayName; }
        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getOrganization() { return organization; }
        public void setOrganization(String organization) { this.organization = organization; }
        public String getDesignation() { return designation; }
        public void setDesignation(String designation) { this.designation = designation; }
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        public String getEmployeeId() { return employeeId; }
        public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
        public String getTheme() { return theme; }
        public void setTheme(String theme) { this.theme = theme; }
        public String getNotifications() { return notifications; }
        public void setNotifications(String notifications) { this.notifications = notifications; }
        public String getLanguage() { return language; }
        public void setLanguage(String language) { this.language = language; }
        public String getTimezone() { return timezone; }
        public void setTimezone(String timezone) { this.timezone = timezone; }
        public String getAvatar() { return avatar; }
        public void setAvatar(String avatar) { this.avatar = avatar; }
    }
}