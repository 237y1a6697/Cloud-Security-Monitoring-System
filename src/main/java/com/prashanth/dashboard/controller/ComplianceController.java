package com.prashanth.dashboard.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/compliance")
@PreAuthorize("hasAuthority('COMPLIANCE_VIEW')")
public class ComplianceController {

    @GetMapping("/standards")
    public List<Map<String, Object>> getStandards() {
        return List.of(
            Map.of(
                "id", "iso27001",
                "name", "ISO/IEC 27001:2022",
                "score", 94,
                "passed", 107,
                "total", 114,
                "status", "Compliant"
            ),
            Map.of(
                "id", "soc2",
                "name", "SOC 2 Type II (Trust Services Criteria)",
                "score", 98,
                "passed", 56,
                "total", 57,
                "status", "Compliant"
            ),
            Map.of(
                "id", "pcidss",
                "name", "PCI DSS v4.0",
                "score", 88,
                "passed", 22,
                "total", 25,
                "status", "Review Required"
            )
        );
    }

    @GetMapping("/controls")
    public List<Map<String, Object>> getControls() {
        return List.of(
            Map.of(
                "id", "A.5.15",
                "framework", "ISO 27001",
                "control", "Access Control Policy",
                "status", "PASS",
                "checkedBy", "SentinelCore IAM Engine",
                "lastAudited", "10 minutes ago"
            ),
            Map.of(
                "id", "A.8.24",
                "framework", "ISO 27001",
                "control", "Use of Cryptography",
                "status", "PASS",
                "checkedBy", "Vault Key Checker",
                "lastAudited", "1 hour ago"
            ),
            Map.of(
                "id", "CC6.1",
                "framework", "SOC 2",
                "control", "Perimeter Defense & Firewalls",
                "status", "PASS",
                "checkedBy", "SecureOps Firewall Listener",
                "lastAudited", "30 minutes ago"
            ),
            Map.of(
                "id", "CC6.3",
                "framework", "SOC 2",
                "control", "Role-Based Access Controls (RBAC)",
                "status", "PASS",
                "checkedBy", "Spring Security Audit Aspect",
                "lastAudited", "Just now"
            ),
            Map.of(
                "id", "PCI-3.4",
                "framework", "PCI DSS",
                "control", "Protection of Cardholder Data at Rest",
                "status", "WARNING",
                "checkedBy", "DB Encryption Guard",
                "lastAudited", "4 hours ago"
            )
        );
    }
}
