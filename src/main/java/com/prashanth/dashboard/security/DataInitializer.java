package com.prashanth.dashboard.security;

import com.prashanth.dashboard.model.Permission;
import com.prashanth.dashboard.model.Role;
import com.prashanth.dashboard.model.User;
import com.prashanth.dashboard.repository.PermissionRepository;
import com.prashanth.dashboard.repository.RoleRepository;
import com.prashanth.dashboard.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import com.prashanth.dashboard.model.Incident;
import com.prashanth.dashboard.repository.IncidentRepository;
import com.prashanth.dashboard.model.Alert;
import com.prashanth.dashboard.model.Vulnerability;
import com.prashanth.dashboard.repository.AlertRepository;
import com.prashanth.dashboard.repository.VulnerabilityRepository;
import java.time.LocalDateTime;

import java.util.Arrays;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;
    private final IncidentRepository incidentRepository;
    private final AlertRepository alertRepository;
    private final VulnerabilityRepository vulnerabilityRepository;

    public DataInitializer(UserRepository userRepository,
                           RoleRepository roleRepository,
                           PermissionRepository permissionRepository,
                           PasswordEncoder passwordEncoder,
                           IncidentRepository incidentRepository,
                           AlertRepository alertRepository,
                           VulnerabilityRepository vulnerabilityRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.passwordEncoder = passwordEncoder;
        this.incidentRepository = incidentRepository;
        this.alertRepository = alertRepository;
        this.vulnerabilityRepository = vulnerabilityRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // ── 1. Seed permissions (idempotent) ─────────────────────────────────
        String[] allPerms = {
            "USER_MANAGE", "ROLE_ASSIGN", "ASSET_CREATE", "ASSET_EDIT", "ASSET_DELETE", "ASSET_VIEW",
            "SERVER_RESTART", "CLUSTER_SCALE", "CLOUD_MODIFY", "INCIDENT_MANAGE", "INCIDENT_RESOLVE",
            "VULN_MANAGE", "COMPLIANCE_VIEW", "REPORT_EXPORT", "AUDIT_VIEW", "INTEGRATION_CONFIG"
        };
        for (String p : allPerms) {
            if (permissionRepository.findByName(p).isEmpty()) {
                permissionRepository.save(new Permission(p));
            }
        }

        // ── 2. Seed roles (idempotent) ────────────────────────────────────────
        seedRole("ROLE_SUPER_ADMIN", allPerms);
        seedRole("ROLE_ADMIN", "ASSET_CREATE","ASSET_EDIT","ASSET_DELETE","ASSET_VIEW",
                "SERVER_RESTART","CLUSTER_SCALE","INCIDENT_MANAGE","VULN_MANAGE",
                "USER_MANAGE","ROLE_ASSIGN","COMPLIANCE_VIEW","REPORT_EXPORT");
        seedRole("ROLE_SOC_MANAGER", "ASSET_VIEW","INCIDENT_MANAGE","INCIDENT_RESOLVE",
                "VULN_MANAGE","REPORT_EXPORT","AUDIT_VIEW");
        seedRole("ROLE_SECURITY_ANALYST", "ASSET_VIEW","INCIDENT_MANAGE","VULN_MANAGE","REPORT_EXPORT");
        seedRole("ROLE_INCIDENT_RESPONDER", "ASSET_VIEW","INCIDENT_MANAGE","INCIDENT_RESOLVE","AUDIT_VIEW");
        seedRole("ROLE_DEVSECOPS", "ASSET_VIEW","VULN_MANAGE","SERVER_RESTART","CLUSTER_SCALE");
        seedRole("ROLE_AUDITOR", "ASSET_VIEW","AUDIT_VIEW","COMPLIANCE_VIEW","REPORT_EXPORT");
        seedRole("ROLE_INFRA_ENGINEER", "ASSET_VIEW","ASSET_EDIT","SERVER_RESTART","CLUSTER_SCALE","CLOUD_MODIFY");
        seedRole("ROLE_VIEWER", "ASSET_VIEW");

        // ── 3. Bootstrap super-admin (only if username "admin" absent) ────────
        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = new User("admin", passwordEncoder.encode("admin123"), "admin@sentinelcore.com");
            admin.setFirstName("System");
            admin.setLastName("Administrator");
            admin.setOrganization("SentinelCore");
            roleRepository.findByName("ROLE_SUPER_ADMIN").ifPresent(r -> admin.getRoles().add(r));
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
    }

    private void seedRole(String roleName, String... perms) {
        if (roleRepository.findByName(roleName).isPresent()) return;
        Role role = new Role(roleName);
        Set<Permission> pSet = Arrays.stream(perms)
                .map(p -> permissionRepository.findByName(p))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toSet());
        role.setPermissions(pSet);
        roleRepository.save(role);
    }
}
