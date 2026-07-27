package com.prashanth.dashboard.controller;

import com.prashanth.dashboard.dto.AIChatRequest;
import com.prashanth.dashboard.dto.AIChatResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    @PostMapping("/chat")
    public ResponseEntity<AIChatResponse> chat(@RequestBody AIChatRequest request) {
        String message = request.message().trim();
        String currentRoute = request.currentRoute();
        
        String reply = analyzeMessage(message, currentRoute);
        
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
        return ResponseEntity.ok(new AIChatResponse(reply, timestamp));
    }

    private String analyzeMessage(String message, String currentRoute) {
        String msg = message.toLowerCase(Locale.ROOT);
        
        // Checklist / Suggested Question / Direct Matches
        
        if (msg.contains("how do i create an incident") || msg.contains("create incident") || msg.contains("add incident")) {
            return "Go to **Incidents → Create Incident** (accessible via the left sidebar). Fill in details such as Incident ID, Title, Severity Level (Critical, High, Medium, Low), SLA hours, and description, then click **Save Incident**.";
        }
        
        if (msg.contains("how do i add a new asset") || msg.contains("add a new asset") || msg.contains("create asset")) {
            return "Navigate to **Assets**, click the **Add New Asset** button, specify the asset hostname, IP address, type (Server, Firewall, Database, etc.), criticality (Critical, High, Medium, Low), and click **Save Asset**.";
        }

        if (msg.contains("explain the dashboard metrics") || msg.contains("explain dashboard") || msg.contains("dashboard metrics")) {
            return "The Dashboard aggregates real-time indicators across your network:\n\n" +
                   "| Metric | Purpose |\n" +
                   "| :--- | :--- |\n" +
                   "| **Total Assets** | Inventory count of enrolled endpoints, databases, and servers. |\n" +
                   "| **Active Incidents** | Immediate security tickets awaiting SOC operator assignment or resolution. |\n" +
                   "| **Critical Incidents** | High-priority threats posing immediate operational risk. |\n" +
                   "| **Open Vulnerabilities** | Known security gaps (CVEs) currently active on scanned infrastructure. |\n" +
                   "| **Active Alerts** | Unresolved real-time system alerts triggered by firewall logs or host activities. |\n" +
                   "| **Registered Users** | Enrolled user accounts granted access control permissions. |";
        }
        
        if (msg.contains("what is threat intelligence") || msg.contains("threat intelligence") || msg.contains("threat intel")) {
            return "Threat Intelligence tracks Indicators of Compromise (IOCs), correlates threat feeds, and highlights suspect activities. It exposes active feeds, CVE CVE-ID associations, and malicious IP ranges monitored by the SentinelCore security correlation engine.";
        }
        
        if (msg.contains("how do i resolve vulnerabilities") || msg.contains("resolve vulnerabilities") || msg.contains("remediate vulnerabilities")) {
            return "To resolve a vulnerability:\n" +
                   "1. Open **Vulnerabilities** in the sidebar.\n" +
                   "2. Select a target CVE entry from the table.\n" +
                   "3. Click **View Remediation Steps** / **Deploy Patch** to view instructions.\n" +
                   "4. After deploying, run an infrastructure re-scan to close the ticket.";
        }
        
        if (msg.contains("generate a compliance report") || msg.contains("compliance report") || msg.contains("generate compliance")) {
            return "Navigate to the **Compliance** tab. You can review scores across key frameworks (e.g., ISO/IEC 27001:2022, SOC 2 Type II, PCI DSS v4.0) and export compliance audits by heading to **Reports** and selecting compliance templates.";
        }
        
        if (msg.contains("show audit log usage") || msg.contains("audit log") || msg.contains("audit logs")) {
            return "Audit Logs capture operations performed inside SentinelCore for tamper-proof security auditing. Go to **Audit Logs** to view timestamps, actor usernames, actions executed, and outcomes.";
        }
        
        if (msg.contains("explain incident severity levels") || msg.contains("severity levels") || msg.contains("incident severity")) {
            return "SentinelCore classifies incidents into four severity levels:\n" +
                   "- **Critical**: Active breaches, system compromise, or data leaks. Demands immediate triage.\n" +
                   "- **High**: High-probablity intrusion attempts, malware detection, or service disruptions.\n" +
                   "- **Medium**: Suspicious host behaviors or unauthorized policy changes.\n" +
                   "- **Low**: Port scans, transient software updates, or general operational notice logs.";
        }
        
        if (msg.contains("how do i create a user") || msg.contains("create user") || msg.contains("add user")) {
            return "Administrators (ROLE_ADMIN or ROLE_SUPER_ADMIN) can update user profiles and roles. Navigate to the **Users** management page from the sidebar to review system roles, enable/disable access, and reset passwords.";
        }
        
        if (msg.contains("what does active alerts mean") || msg.contains("active alerts")) {
            return "Active Alerts represents the number of current system-triggered alerts that require review by the SOC team. These may originate from infrastructure monitoring, threat intelligence correlations, or vulnerability detections.";
        }

        // Contextual page handling
        if (msg.contains("how do i use this page") || msg.contains("tell me about this page") || msg.contains("help") || msg.contains("what is this page")) {
            if (currentRoute == null || currentRoute.isBlank()) {
                return "You are exploring the SentinelCore SecureOps platform. Let me know which features you need assistance with.";
            }
            if (currentRoute.contains("/dashboard")) {
                return "You are on the **Dashboard**. This view displays operational summaries. You can click on sidebar categories to drill down into metrics like incidents, system status, vulnerability metrics, and recent alert logs.";
            } else if (currentRoute.contains("/infrastructure")) {
                return "You are looking at **Infrastructure Telemetry**. This page monitors server health, showing CPU loads, active memory usage, vault HSM connections, and storage capacities.";
            } else if (currentRoute.contains("/assets")) {
                return "You are viewing the **Asset Management** inventory. Here, you can search for active hosts, add new devices (servers, databases, firewalls), edit existing details, or retire endpoints.";
            } else if (currentRoute.contains("/incidents")) {
                return "You are on the **Incident Queue**. This table captures detected exploits and failed login tickets. You can create incidents, assign responders, inspect details, and mark incidents resolved.";
            } else if (currentRoute.contains("/threat-intelligence")) {
                return "You are viewing the **Threat Intelligence** feed. You can review indicators of compromise (IOCs), blacklisted IP addresses, and real-time security alerts.";
            } else if (currentRoute.contains("/vulnerabilities")) {
                return "You are looking at the **Vulnerability Management** platform. This shows unresolved CVE items. You can view patch instructions or flag vulnerabilities remediated after validation.";
            } else if (currentRoute.contains("/audit-logs")) {
                return "You are reviewing the **Audit Logs**. It lists the historical record of security operations, administrative actions, and user logins for security audits.";
            } else if (currentRoute.contains("/compliance")) {
                return "You are inspecting **Compliance Status**. It tracks posture metrics against ISO 27001:2022, SOC 2, and PCI DSS compliance controls.";
            } else if (currentRoute.contains("/users")) {
                return "You are inside the **Users Administration** module. Administrators can toggle user statuses, reset security passwords, or re-allocate security roles.";
            } else if (currentRoute.contains("/reports")) {
                return "You are on the **Reports** workspace. Here, security telemetry audits can be generated and exported into spreadsheets/PDFs.";
            } else if (currentRoute.contains("/settings")) {
                return "You are inside **System Settings**, where security credentials, server keys, API configurations, and operational notification rules can be modified.";
            }
        }

        // Module explanations
        if (msg.contains("dashboard")) {
            return "The SentinelCore **Dashboard** displays total assets, active threats, open vulnerabilities, and incident distribution trends.";
        }
        if (msg.contains("infrastructure")) {
            return "The **Infrastructure** page tracks server performance telemetry, CPU thread pool states, and memory metrics.";
        }
        if (msg.contains("asset")) {
            return "The **Assets** manager keeps track of inventory items like servers, databases, and network firewalls.";
        }
        if (msg.contains("incident")) {
            return "The **Incidents** module enables creation, investigation, and tracking of security alerts and breaches.";
        }
        if (msg.contains("threat")) {
            return "The **Threat Intelligence** view identifies IP blacklist telemetry and active IOC feeds.";
        }
        if (msg.contains("vulnerabilit")) {
            return "The **Vulnerabilities** component lists pending CVE items along with remediation steps.";
        }
        if (msg.contains("audit")) {
            return "The **Audit Logs** track all events, operations, logins, and settings modifications.";
        }
        if (msg.contains("compliance")) {
            return "The **Compliance** dashboard tracks posture statuses relative to ISO 27001 and SOC 2.";
        }
        if (msg.contains("user")) {
            return "The **Users** page controls user accounts, password resets, and role assignments.";
        }
        if (msg.contains("report")) {
            return "Use **Reports** to output logs and metrics in standard portable formats.";
        }
        if (msg.contains("settings")) {
            return "Modify system rules, alerts thresholds, and credentials inside the **Settings** view.";
        }

        // Fallback response matching "I couldn't find that feature..."
        return "I couldn't find that feature in the current SentinelCore SecureOps application. Let me know if you would like me to explain the Dashboard metrics, how to manage incidents, or another active operational module.";
    }
}
