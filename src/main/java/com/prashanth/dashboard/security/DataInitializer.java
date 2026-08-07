package com.prashanth.dashboard.security;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.prashanth.dashboard.model.Alert;
import com.prashanth.dashboard.model.Incident;
import com.prashanth.dashboard.model.Notification;
import com.prashanth.dashboard.model.Permission;
import com.prashanth.dashboard.model.Role;
import com.prashanth.dashboard.model.User;
import com.prashanth.dashboard.model.Vulnerability;
import com.prashanth.dashboard.repository.AlertRepository;
import com.prashanth.dashboard.repository.IncidentRepository;
import com.prashanth.dashboard.repository.NotificationRepository;
import com.prashanth.dashboard.repository.PermissionRepository;
import com.prashanth.dashboard.repository.RoleRepository;
import com.prashanth.dashboard.repository.UserRepository;
import com.prashanth.dashboard.repository.VulnerabilityRepository;

import com.prashanth.dashboard.model.AuditLog;
import com.prashanth.dashboard.repository.AuditLogRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;
    private final IncidentRepository incidentRepository;
    private final AlertRepository alertRepository;
    private final VulnerabilityRepository vulnerabilityRepository;
    private final NotificationRepository notificationRepository;
    private final AuditLogRepository auditLogRepository;

    public DataInitializer(UserRepository userRepository,
                           RoleRepository roleRepository,
                           PermissionRepository permissionRepository,
                           PasswordEncoder passwordEncoder,
                           IncidentRepository incidentRepository,
                           AlertRepository alertRepository,
                           VulnerabilityRepository vulnerabilityRepository,
                           NotificationRepository notificationRepository,
                           AuditLogRepository auditLogRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.passwordEncoder = passwordEncoder;
        this.incidentRepository = incidentRepository;
        this.alertRepository = alertRepository;
        this.vulnerabilityRepository = vulnerabilityRepository;
        this.notificationRepository = notificationRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // ── 1. Seed permissions (idempotent) ─────────────────────────────────
        String[] allPerms = {
            "USER_MANAGE", "ROLE_ASSIGN",
            "ASSET_CREATE", "ASSET_EDIT", "ASSET_DELETE", "ASSET_VIEW",
            "INCIDENT_VIEW", "INCIDENT_CREATE", "INCIDENT_MANAGE", "INCIDENT_RESOLVE", "INCIDENT_DELETE",
            "SERVER_RESTART", "CLUSTER_SCALE", "CLOUD_MODIFY",
            "VULN_MANAGE", "COMPLIANCE_VIEW", "REPORT_EXPORT", "AUDIT_VIEW",
            "INTEGRATION_CONFIG", "SETTINGS_ACCESS"
        };

        // Cache all database permissions in memory to avoid N+1 select queries on startup.
                java.util.Map<String, Permission> permMap = new java.util.HashMap<>();
                for (Permission permission : permissionRepository.findAll()) {
                        if (permission != null && permission.getName() != null) {
                                permMap.putIfAbsent(permission.getName(), permission);
                        }
                }

        for (String p : allPerms) {
            if (!permMap.containsKey(p)) {
                Permission newPerm = permissionRepository.save(new Permission(p));
                permMap.put(p, newPerm);
            }
        }

        // Cache roles to avoid multiple redundant selects
                java.util.Map<String, Role> roleMap = new java.util.HashMap<>();
                for (Role role : roleRepository.findAll()) {
                        if (role != null && role.getName() != null) {
                                roleMap.putIfAbsent(role.getName(), role);
                        }
                }

        // ── 2. Seed roles (idempotent + update permissions if role already exists) ──
        seedOrUpdateRole(roleMap, permMap, "ROLE_SUPER_ADMIN", allPerms);

        seedOrUpdateRole(roleMap, permMap, "ROLE_ADMIN",
                "ASSET_CREATE","ASSET_EDIT","ASSET_DELETE","ASSET_VIEW",
                "INCIDENT_VIEW","INCIDENT_CREATE","INCIDENT_MANAGE","INCIDENT_RESOLVE","INCIDENT_DELETE",
                "SERVER_RESTART","CLUSTER_SCALE","CLOUD_MODIFY",
                "VULN_MANAGE","COMPLIANCE_VIEW","REPORT_EXPORT","AUDIT_VIEW",
                "USER_MANAGE","ROLE_ASSIGN","SETTINGS_ACCESS","INTEGRATION_CONFIG");

        seedOrUpdateRole(roleMap, permMap, "ROLE_SOC_MANAGER",
                "ASSET_VIEW",
                "INCIDENT_VIEW","INCIDENT_CREATE","INCIDENT_MANAGE","INCIDENT_RESOLVE",
                "REPORT_EXPORT","AUDIT_VIEW");

        seedOrUpdateRole(roleMap, permMap, "ROLE_SECURITY_ANALYST",
                "ASSET_VIEW",
                "INCIDENT_VIEW","INCIDENT_CREATE","INCIDENT_MANAGE",
                "VULN_MANAGE","REPORT_EXPORT");

        seedOrUpdateRole(roleMap, permMap, "ROLE_INCIDENT_RESPONDER",
                "ASSET_VIEW",
                "INCIDENT_VIEW","INCIDENT_MANAGE","INCIDENT_RESOLVE",
                "AUDIT_VIEW");

        seedOrUpdateRole(roleMap, permMap, "ROLE_INFRA_ENGINEER",
                "ASSET_VIEW","ASSET_CREATE","ASSET_EDIT","ASSET_DELETE",
                "INCIDENT_VIEW",
                "SERVER_RESTART","CLUSTER_SCALE","CLOUD_MODIFY",
                "REPORT_EXPORT");

        seedOrUpdateRole(roleMap, permMap, "ROLE_DEVSECOPS",
                "ASSET_VIEW","ASSET_CREATE","ASSET_EDIT",
                "INCIDENT_VIEW","INCIDENT_CREATE","INCIDENT_MANAGE",
                "VULN_MANAGE","SERVER_RESTART","CLUSTER_SCALE",
                "REPORT_EXPORT");

        seedOrUpdateRole(roleMap, permMap, "ROLE_AUDITOR",
                "ASSET_VIEW",
                "INCIDENT_VIEW",
                "AUDIT_VIEW","COMPLIANCE_VIEW","REPORT_EXPORT");

        seedOrUpdateRole(roleMap, permMap, "ROLE_VIEWER",
                "ASSET_VIEW","INCIDENT_VIEW");

        // ── 3. Bootstrap super-admin (only if username "admin" absent) ────────
        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = new User("admin", passwordEncoder.encode("admin123"), "admin@sentinelcore.com");
            admin.setFirstName("System");
            admin.setLastName("Administrator");
            admin.setOrganization("SentinelCore");
            Role superAdminRole = roleMap.get("ROLE_SUPER_ADMIN");
            if (superAdminRole != null) {
                admin.getRoles().add(superAdminRole);
            }
            userRepository.save(admin);
            System.out.println("[SentinelCore] Bootstrap admin created: admin / admin123");
        }
      if (incidentRepository.count() == 0) {

        Incident i1 = new Incident();
        i1.setIncidentId("INC-889");
        i1.setTitle("Failed Login Attempts");
        i1.setDescription("Multiple failed logins detected.");
        i1.setSeverity("Critical");
        i1.setStatus("Open");
        i1.setAssignedTeam("Security Team");
        i1.setAssignedTo("John");
        i1.setSlaHours(2);
        i1.setCreatedAt(LocalDateTime.now());

        Incident i2 = new Incident();
        i2.setIncidentId("INC-888");
        i2.setTitle("Kubernetes Cluster Alert");
        i2.setDescription("High CPU usage detected.");
        i2.setSeverity("High");
        i2.setStatus("Investigating");
        i2.setAssignedTeam("SOC Team");
        i2.setAssignedTo("Alice");
        i2.setSlaHours(4);
        i2.setCreatedAt(LocalDateTime.now());

        incidentRepository.save(i1);
        incidentRepository.save(i2);
      }

      // Seed alerts
      if (alertRepository.count() == 0) {
          alertRepository.save(new Alert("DB-SRV-12 partition close to full", "Warning", "DB-SRV-12", LocalDateTime.now().minusMinutes(15)));
          alertRepository.save(new Alert("DDoS Attempt Blocked on Gateway", "Critical", "FW-GW-03", LocalDateTime.now().minusMinutes(35)));
          alertRepository.save(new Alert("Unusual outbound traffic on APP-SRV-47", "Critical", "APP-SRV-47", LocalDateTime.now().minusMinutes(50)));
      }

      // Seed vulnerabilities
      if (vulnerabilityRepository.count() == 0) {
          vulnerabilityRepository.save(new Vulnerability("CVE-2023-4863", 8.8, 92, "14 Servers, 2 Clusters", "Pending", "Deploy Patch"));
          vulnerabilityRepository.save(new Vulnerability("CVE-2023-5363", 6.5, 65, "3 Firewalls", "Scheduled", "View Steps"));
      }

          if (notificationRepository.count() == 0) {
                  notificationRepository.save(new Notification(
                          "Critical alert escalated",
                          "DDoS Attempt Blocked on Gateway requires immediate review.",
                          "ALERT",
                          "alerts",
                          2L
                  ));
                  notificationRepository.save(new Notification(
                          "New incident assigned",
                          "Failed Login Attempts has been assigned to the Security Team.",
                          "INCIDENT",
                          "incidents",
                          1L
                  ));
                  notificationRepository.save(new Notification(
                          "Vulnerability patch pending",
                          "CVE-2023-4863 remains pending and needs remediation planning.",
                          "VULNERABILITY",
                          "vulnerabilities",
                          1L
                  ));
                  notificationRepository.save(new Notification(
                          "Audit review completed",
                          "Recent audit log activity was successfully archived.",
                          "AUDIT",
                          "audit-logs",
                          null
                  ));
          }

          // Seed audit logs
          if (auditLogRepository.count() == 0) {
              AuditLog log1 = new AuditLog();
              log1.setUsername("admin");
              log1.setRole("ROLE_SUPER_ADMIN");
              log1.setIpAddress("10.0.4.15");
              log1.setAction("USER_LOGIN_SUCCESS");
              log1.setResult("SUCCESS");
              log1.setDeviceBrowser("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36");
              log1.setEvidence("saml_auth_challenge.json,user_ip_verification.log");
              log1.setTimestamp(LocalDateTime.now().minusHours(24));
              auditLogRepository.save(log1);

              AuditLog log2 = new AuditLog();
              log2.setUsername("viewer");
              log2.setRole("ROLE_VIEWER");
              log2.setIpAddress("192.168.1.45");
              log2.setAction("USER_LOGIN_FAILED");
              log2.setResult("FAILED");
              log2.setDeviceBrowser("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0");
              log2.setEvidence("");
              log2.setTimestamp(LocalDateTime.now().minusHours(18).plusMinutes(10));
              auditLogRepository.save(log2);

              AuditLog log3 = new AuditLog();
              log3.setUsername("viewer");
              log3.setRole("ROLE_VIEWER");
              log3.setIpAddress("192.168.1.45");
              log3.setAction("USER_LOGIN_SUCCESS");
              log3.setResult("SUCCESS");
              log3.setDeviceBrowser("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0");
              log3.setEvidence("user_ip_verification.log");
              log3.setTimestamp(LocalDateTime.now().minusHours(18).plusMinutes(12));
              auditLogRepository.save(log3);

              AuditLog log4 = new AuditLog();
              log4.setUsername("admin");
              log4.setRole("ROLE_SUPER_ADMIN");
              log4.setIpAddress("10.0.4.15");
              log4.setAction("DATABASE_PCI_QUERY");
              log4.setResult("DENIED");
              log4.setDeviceBrowser("DBeaver Enterprise 23.1");
              log4.setEvidence("db_query_intent_pci.sql");
              log4.setTimestamp(LocalDateTime.now().minusHours(5));
              auditLogRepository.save(log4);

              AuditLog log5 = new AuditLog();
              log5.setUsername("devops");
              log5.setRole("ROLE_DEVSECOPS");
              log5.setIpAddress("10.1.2.98");
              log5.setAction("FIREWALL_RULE_MODIFY");
              log5.setResult("SUCCESS");
              log5.setDeviceBrowser("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36");
              log5.setEvidence("fortinet_payload_diff.json,change_request_18992.pdf");
              log5.setTimestamp(LocalDateTime.now().minusHours(1));
              auditLogRepository.save(log5);
          }
    }

    /** Creates role if absent; always updates its permission set so new perms are picked up on restart. */
    private void seedOrUpdateRole(java.util.Map<String, Role> roleMap, java.util.Map<String, Permission> permMap, String roleName, String... perms) {
        Role role = roleMap.computeIfAbsent(roleName, k -> roleRepository.save(new Role(k)));
        Set<Permission> pSet = Arrays.stream(perms)
                .map(permMap::get)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());
        role.setPermissions(pSet);
        roleRepository.save(role);
    }
}
