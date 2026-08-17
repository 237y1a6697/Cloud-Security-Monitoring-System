package com.prashanth.dashboard.service;

import com.prashanth.dashboard.dto.AssistantResult;
import com.prashanth.dashboard.dto.ChatMessageDTO;
import com.prashanth.dashboard.repository.AlertRepository;
import com.prashanth.dashboard.repository.AssetRepository;
import com.prashanth.dashboard.repository.IncidentRepository;
import com.prashanth.dashboard.repository.VulnerabilityRepository;
import com.prashanth.dashboard.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.Collections;

/**
 * SentinelCore Internal Assistant — a fully deterministic, rule-based
 * assistant that answers questions about the SentinelCore SecureOps platform
 * using an internal knowledge base and live PostgreSQL data.
 *
 * No external AI API. No API key. No network calls.
 */
@Service
public class SentinelCoreAssistantService {

    private static final Logger log = LoggerFactory.getLogger(SentinelCoreAssistantService.class);

    private final AssetRepository        assetRepository;
    private final IncidentRepository     incidentRepository;
    private final VulnerabilityRepository vulnerabilityRepository;
    private final AlertRepository        alertRepository;
    private final UserRepository         userRepository;

    public SentinelCoreAssistantService(AssetRepository assetRepository,
                                        IncidentRepository incidentRepository,
                                        VulnerabilityRepository vulnerabilityRepository,
                                        AlertRepository alertRepository,
                                        UserRepository userRepository) {
        this.assetRepository       = assetRepository;
        this.incidentRepository    = incidentRepository;
        this.vulnerabilityRepository = vulnerabilityRepository;
        this.alertRepository        = alertRepository;
        this.userRepository        = userRepository;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    public boolean isConfigured() {
        return true;
    }

    /**
     * Chat entry point. Resolves user message, matches intent, queries DB,
     * and compiles dynamic, context-aware suggestions.
     */
    public AssistantResult chat(String userMessage,
                               List<ChatMessageDTO> history,
                               String currentPage,
                               String currentRoute) {
        try {
            String normalised = normalise(userMessage);

            // Scope Check: Reject questions unrelated to SentinelCore
            if (!isWithinSentinelCoreScope(normalised)) {
                return new AssistantResult(
                    "That question is outside my SentinelCore scope.\n\n" +
                    "I can help you with the Dashboard, Assets, Incidents, Vulnerabilities, Compliance, Reports, and SentinelCore workflows.",
                    getSuggestionsForGreetingAndHelp(currentPage),
                    "OUT_OF_SCOPE",
                    null,
                    null
                );
            }

            // Navigational Intents
            if (isNavigational(normalised)) {
                WorkflowContext ctx = getActiveWorkflow(history);
                if (ctx != null) {
                    if (normalised.equals("cancel")) {
                        return new AssistantResult(
                            "Workflow cancelled. What else can I help you with?",
                            getSuggestionsForGreetingAndHelp(currentPage),
                            "CANCEL_WORKFLOW",
                            null,
                            null
                        );
                    } else if (normalised.contains("all steps") || normalised.equals("all steps")) {
                        return handleShowAllSteps(ctx.workflow);
                    } else if (normalised.equals("next") || normalised.equals("next step")) {
                        int nextStep = ctx.currentStep + 1;
                        if (nextStep > ctx.totalSteps) {
                            return new AssistantResult(
                                "You have completed the guided workflow! What else can I help you with?",
                                getSuggestionsForGreetingAndHelp(currentPage),
                                ctx.workflow,
                                null,
                                null
                            );
                        } else {
                            return renderWorkflowStep(ctx.workflow, nextStep);
                        }
                    } else if (normalised.equals("back") || normalised.equals("go back")) {
                        int prevStep = Math.max(1, ctx.currentStep - 1);
                        return renderWorkflowStep(ctx.workflow, prevStep);
                    }
                } else {
                    return new AssistantResult(
                        "There is no active workflow to navigate. How can I help you today?",
                        getSuggestionsForGreetingAndHelp(currentPage),
                        "UNKNOWN",
                        null,
                        null
                    );
                }
            }

            // Resolve follow-up topics
            String followUpTopic = resolveFollowUpTopic(normalised, history);

            Intent intent = detectIntent(normalised, followUpTopic, currentPage, currentRoute);
            log.debug("[SentinelCore Assistant] intent={} message='{}'", intent, userMessage);

            String text = generateAnswer(intent, normalised, currentPage);
            List<String> suggestions = getSuggestionsForIntent(intent, currentPage);

            // Set workflow step settings for Rich DTO if applicable
            Integer step = null;
            Integer totalSteps = null;
            String intentStr = intent.name();

            if (intent == Intent.CREATE_ASSET) {
                step = 1;
                totalSteps = 4;
            } else if (intent == Intent.CREATE_INCIDENT) {
                step = 1;
                totalSteps = 4;
            }

            return new AssistantResult(text, suggestions, intentStr, step, totalSteps);
        } catch (Exception ex) {
            log.error("[SentinelCore Assistant] Unexpected error processing chat", ex);
            return new AssistantResult("Sorry, I couldn't process that request. Please try again.", List.of());
        }
    }

    // ── Normalisation ─────────────────────────────────────────────────────────

    static String normalise(String text) {
        if (text == null) return "";
        return text.toLowerCase()
                   .replaceAll("[^a-z0-9\\s]", " ")
                   .trim()
                   .replaceAll("\\s+", " ");
    }

    // ── Intent Enum ───────────────────────────────────────────────────────────

    enum Intent {
        GREETING,
        HOW_ARE_YOU,
        WHO_ARE_YOU,
        HELP,
        THANKS,
        GOODBYE,
        DASHBOARD_METRICS,
        DASHBOARD_OVERVIEW,
        ASSET_MANAGEMENT,
        ASSET_STATUS,
        INCIDENT_RESPONSE,
        INCIDENT_LIFECYCLE,
        VULNERABILITY_MANAGEMENT,
        VULNERABILITY_CRITICAL,
        COMPLIANCE,
        REPORTS,
        SENTINELCORE_OVERVIEW,
        LIVE_STATS,
        CREATE_ASSET,
        MANAGE_ASSET,
        CREATE_INCIDENT,
        MANAGE_INCIDENT,
        MANAGE_VULNERABILITY,
        UNKNOWN
    }

    // ── Scope Verification ───────────────────────────────────────────────────

    boolean isWithinSentinelCoreScope(String normalised) {
        if (normalised == null || normalised.isBlank()) {
            return false;
        }

        String[] keywords = {
            "asset", "assets", "device", "devices", "hardware", "server", "servers",
            "workstation", "workstations", "router", "routers", "switch", "switches",
            "firewall", "firewalls", "computer", "computers", "endpoint", "endpoints",
            "ip address", "ipaddress", "inventory", "cmdb", "euleros", "euler",
            "incident", "incidents", "ticket", "tickets", "breach", "breaches", "severity",
            "sla", "unresolved", "resolved", "investigating", "assigned", "response",
            "status", "title", "description", "team", "teams", "close", "remediate",
            "remediated", "vulnerability", "vulnerabilities", "cve", "cvss", "threat",
            "scan", "patch", "patching", "remediation", "sonarqube", "trivy",
            "gate", "risk", "mitigation", "mitigations", "compliance", "iso", "soc",
            "pci", "dss", "regulation", "regulations", "audit", "auditing", "control",
            "controls", "posture", "iso27001", "soc2", "readiness", "report", "reports",
            "generate", "export", "csv", "pdf", "download", "email", "schedule",
            "executive summary", "mail", "dispatch", "excel", "dashboard", "overview",
            "console", "portal", "home", "metrics", "alert", "alerts", "post", "panel",
            "card", "chart", "trend", "help", "capable", "do", "greet", "hi", "hello",
            "hey", "morning", "evening", "afternoon", "thanks", "bye", "goodbye", "restart",
            "lock", "diagnostic", "diagnostics", "next", "back", "cancel", "step", "steps",
            "previous", "option", "menu", "who are you", "what are you", "what can you",
            "user", "users", "register", "registered", "current", "count", "stats",
            // Platform-level scope terms
            "sentinelcore", "secureops", "lifecycle", "live", "platform", "module",
            "modules", "purpose"
        };
        
        for (String kw : keywords) {
            if (normalised.contains(kw)) {
                return true;
            }
        }
        return false;
    }

    boolean isNavigational(String normalised) {
        return normalised.equals("next") || normalised.equals("next step") || normalised.equals("nextstep") || 
               normalised.equals("back") || normalised.equals("go back") || normalised.equals("previous") || 
               normalised.equals("cancel") || normalised.equals("stop") || normalised.equals("exit") || 
               normalised.equals("show all steps") || normalised.equals("show me all steps") || normalised.equals("all steps") || 
               normalised.equals("show steps");
    }

    // ── Workflow Parsing from history ────────────────────────────────────────

    public static class WorkflowContext {
        public String workflow;
        public int currentStep;
        public int totalSteps;

        public WorkflowContext(String workflow, int currentStep, int totalSteps) {
            this.workflow = workflow;
            this.currentStep = currentStep;
            this.totalSteps = totalSteps;
        }
    }

    WorkflowContext getActiveWorkflow(List<ChatMessageDTO> history) {
        if (history == null || history.isEmpty()) {
            return null;
        }
        for (int i = history.size() - 1; i >= 0; i--) {
            ChatMessageDTO msg = history.get(i);
            if ("assistant".equals(msg.role()) && msg.content() != null) {
                String content = msg.content();
                if (content.contains("Step ") && content.contains(" of ")) {
                    int stepIdx = content.indexOf("Step ");
                    int ofIdx = content.indexOf(" of ", stepIdx);
                    if (stepIdx != -1 && ofIdx != -1) {
                        try {
                            String stepNumStr = content.substring(stepIdx + 5, ofIdx).trim();
                            int stepNum = Integer.parseInt(stepNumStr);

                            int endIdx = ofIdx + 4;
                            while (endIdx < content.length() && Character.isDigit(content.charAt(endIdx))) {
                                endIdx++;
                            }
                            String totalNumStr = content.substring(ofIdx + 4, endIdx).trim();
                            int totalNum = Integer.parseInt(totalNumStr);

                            String wf = null;
                            if (content.toLowerCase().contains("asset")) {
                                wf = "CREATE_ASSET";
                            } else if (content.toLowerCase().contains("incident")) {
                                wf = "CREATE_INCIDENT";
                            }

                            if (wf != null) {
                                return new WorkflowContext(wf, stepNum, totalNum);
                            }
                        } catch (Exception e) {
                            // Ignored
                        }
                    }
                }
            }
        }
        return null;
    }

    private AssistantResult handleShowAllSteps(String workflow) {
        if ("CREATE_ASSET".equals(workflow)) {
            String text = "Here are all the steps to create a new asset:\n\n" +
                          "1. **Access Assets**: Open **Assets** from the sidebar and click **Add Asset**.\n" +
                          "2. **Core Info**: Fill in the required `Asset Name`, `IP Address`, `Type` (Server, Workstation, Router, etc.), and `Status`.\n" +
                          "3. **Metrics & Location**: Set performance metrics like `CPU %`, `Memory %`, `Disk %`, `Network %`, `Location`, and `Uptime`.\n" +
                          "4. **Save**: Click **Save** to persist the asset to the database.";
            return new AssistantResult(text, List.of("View Assets", "Create Asset"), "CREATE_ASSET", 4, 4);
        } else {
            String text = "Here is the complete process to report a security incident:\n\n" +
                          "1. **Access Incidents**: Open **Incidents** in the sidebar and click **Create Incident**.\n" +
                          "2. **Ticket Fields**: Enter the `Title`, `Description`, `Assigned Team`, and `Affected Asset`.\n" +
                          "3. **Severity & Status**: Set severity (Critical, High, etc.) and status (Open/Investigating).\n" +
                          "4. **Submit**: Click **Save Incident** to start the SLA timer.";
            return new AssistantResult(text, List.of("View Incidents", "Create Incident"), "CREATE_INCIDENT", 4, 4);
        }
    }

    private AssistantResult renderWorkflowStep(String workflow, int step) {
        if ("CREATE_ASSET".equals(workflow)) {
            switch (step) {
                case 1:
                    return new AssistantResult(
                        "Sure. I can guide you through creating an asset.\n\n### Step 1 of 4\n\nOpen **Assets** from the left navigation.\n\nOnce you're there, click **Add Asset**.\n\nWould you like the next step?",
                        List.of("Next step", "Show all steps", "Cancel"), "CREATE_ASSET", 1, 4
                    );
                case 2:
                    return new AssistantResult(
                        "### Step 2 of 4\n\nEnter the required asset information shown in the form:\n• `Asset Name` (hostname/identifier)\n• `IP Address` (network address)\n• `Type` (choose Server, Workstation, Router, etc.)\n• `Status` (Active, Inactive, Offline, Maintenance)\n\nReady for the next step?",
                        List.of("Next step", "Back", "Cancel"), "CREATE_ASSET", 2, 4
                    );
                case 3:
                    return new AssistantResult(
                        "### Step 3 of 4\n\nConfigure system threshold performance metrics:\n• `CPU %`, `Memory %`, `Disk %`, `Network %` (current workload levels)\n• `Location` (deployment region/datacenter)\n• `Uptime` (active duration)\n\nReady for final step?",
                        List.of("Next step", "Back", "Cancel"), "CREATE_ASSET", 3, 4
                    );
                case 4:
                default:
                    return new AssistantResult(
                        "### Step 4 of 4\n\nClick the **Save** button to persist the asset to the database.\n\nYou're all set! The asset will now be audited and monitored in real-time.",
                        List.of("View Assets", "Back", "Cancel"), "CREATE_ASSET", 4, 4
                    );
            }
        } else {
            switch (step) {
                case 1:
                    return new AssistantResult(
                        "Sure. I can guide you through creating an incident.\n\n### Step 1 of 4\n\nOpen **Incidents** from the left navigation.\n\nOnce you're there, click **Create Incident**.\n\nWould you like the next step?",
                        List.of("Next step", "Show all steps", "Cancel"), "CREATE_INCIDENT", 1, 4
                    );
                case 2:
                    return new AssistantResult(
                        "### Step 2 of 4\n\nEnter the required incident details:\n• `Title` (meaningful name)\n• `Description` (detailed description)\n• `Assigned Team` (team to handle)\n• `Affected Asset` (asset name)\n\nReady for the next step?",
                        List.of("Next step", "Back", "Cancel"), "CREATE_INCIDENT", 2, 4
                    );
                case 3:
                    return new AssistantResult(
                        "### Step 3 of 4\n\nSelect the Severity (Critical, High, Medium, Low) and Status (Open, Investigating, Remediated, Closed).\n\n*Note: Setting severity determines the default SLA hours countdown.* Ready to finalize?",
                        List.of("Next step", "Back", "Cancel"), "CREATE_INCIDENT", 3, 4
                    );
                case 4:
                default:
                    return new AssistantResult(
                        "### Step 4 of 4\n\nClick the **Save Incident** button to submit. The incident will be created and the SLA timer starts counting down immediately!\n\nYou can track the remediation status directly from the Incidents page.",
                        List.of("View Incidents", "Back", "Cancel"), "CREATE_INCIDENT", 4, 4
                    );
            }
        }
    }

    // ── Intent Detection via Word-boundary Keyword Scoring ────────────────────

    Intent detectIntent(String normalised, String followUpTopic, String currentPage, String currentRoute) {
        if (normalised == null || normalised.isBlank()) {
            return Intent.UNKNOWN;
        }

        Map<Intent, int[]> scores = new HashMap<>();

        // Multi-word phrase mapping
        score(scores, Intent.LIVE_STATS, normalised,
              "how many", "count", "total", "how much", "live", "current number",
              "how many assets", "how many incidents", "how many vulnerabilities",
              "how many alerts", "asset count", "incident count", "vuln count", "stats");

        score(scores, Intent.DASHBOARD_METRICS, normalised,
              "explain the security dashboard metrics", "what do the dashboard metrics mean",
              "tell me about dashboard metrics", "dashboard metrics", "security metrics",
              "explain the metrics", "what represent", "what does active incidents mean", 
              "what does open vulnerabilities mean", "what does compliance score mean");

        score(scores, Intent.DASHBOARD_OVERVIEW, normalised,
              "dashboard", "overview", "home", "main page", "security posture",
              "security overview", "what is the dashboard", "explain dashboard");

        score(scores, Intent.ASSET_STATUS, normalised,
              "asset status", "asset monitoring", "asset health", "online asset",
              "offline asset", "active asset", "inactive asset");

        score(scores, Intent.CREATE_ASSET, normalised,
              "how do i create an asset", "how can i add a device", "add new asset", "create asset",
              "add asset", "new asset", "create devices", "add devices");
        // Boost CREATE_ASSET so it wins over the generic ASSET_MANAGEMENT hit on "asset"
        if (normalised.contains("create") || normalised.contains("add new")) {
            scores.merge(Intent.CREATE_ASSET, new int[]{2}, (a, b) -> { a[0] += b[0]; return a; });
        }

        score(scores, Intent.MANAGE_ASSET, normalised,
              "how do i manage assets", "how do i edit an asset", "how do i delete an asset", 
              "how do i view assets", "edit an asset", "view asset details", "delete an asset",
              "manage assets", "edit asset", "delete asset", "view assets", "manage asset");

        score(scores, Intent.ASSET_MANAGEMENT, normalised,
              "asset", "assets", "asset management", "infrastructure", "inventory",
              "servers", "endpoints", "hardware");

        score(scores, Intent.CREATE_INCIDENT, normalised,
              "how do i create an incident", "how do i report an incident", "create incident",
              "report incident", "new incident", "add incident");
        // Boost CREATE_INCIDENT similarly
        if (normalised.contains("create") && normalised.contains("incident")) {
            scores.merge(Intent.CREATE_INCIDENT, new int[]{2}, (a, b) -> { a[0] += b[0]; return a; });
        }

        score(scores, Intent.MANAGE_INCIDENT, normalised,
              "how do i manage incidents", "how do i update an incident", "how do i change incident status", 
              "how do i assign an incident", "how do i resolve an incident", "update incident", 
              "change severity", "change status", "resolve incident", "assign incident", "manage incidents");

        score(scores, Intent.INCIDENT_LIFECYCLE, normalised,
              "incident lifecycle", "incident workflow", "incident process",
              "resolve incident", "close incident", "incident status", "open incident",
              "investigating", "remediated");

        score(scores, Intent.INCIDENT_RESPONSE, normalised,
              "incident", "incidents", "incident response", "security incident",
              "response", "severity", "sla", "critical incident", "high incident");

        score(scores, Intent.VULNERABILITY_CRITICAL, normalised,
              "critical vulnerabilit", "critical vuln", "high vulnerabilit",
              "which ones are critical", "critical ones", "highest cvss",
              "most severe", "cvss", "cve", "patch", "remediation", "critical vulnerabilities");

        score(scores, Intent.MANAGE_VULNERABILITY, normalised,
              "how do i manage vulnerabilities", "how do i remediate a vulnerability",
              "how do i add a vulnerability", "mitigate vulnerability", "mitigate vulnerabilities",
              "deploy patch", "apply patch", "remediate vulnerability");

        score(scores, Intent.VULNERABILITY_MANAGEMENT, normalised,
              "vulnerabilit", "vulnerability management", "vuln", "patch status",
              "security weakness", "weakness", "tracking", "vulnerability tracking");

        score(scores, Intent.COMPLIANCE, normalised,
              "compliance", "compliant", "compliance score", "iso", "soc 2",
              "pci", "regulation", "control", "audit", "framework", "posture",
              "explain compliance", "how do i check compliance", "what is my compliance score", 
              "how do i generate a compliance report", "compliance score", "security controls", 
              "compliance reports", "check compliance");

        score(scores, Intent.REPORTS, normalised,
              "report", "reports", "generate report", "export", "csv", "pdf",
              "excel", "download", "schedule", "email report", "send report",
              "what reports are available", "how do i generate a report", "how do i generate a compliance report", 
              "how do i export a dashboard report", "dashboard report", "compliance report", 
              "vulnerability report", "incident report", "export report");

        score(scores, Intent.SENTINELCORE_OVERVIEW, normalised,
              "sentinelcore", "what is sentinelcore", "about sentinelcore", "platform", "modules",
              "secureops", "purpose");

        // Conversational Intents
        score(scores, Intent.GREETING, normalised,
              "hi", "hello", "hey", "hii", "good morning", "good afternoon", "good evening", "yo");

        score(scores, Intent.HOW_ARE_YOU, normalised,
              "how are you", "how is it going", "how s it going");

        score(scores, Intent.WHO_ARE_YOU, normalised,
              "who are you", "who is this");

        score(scores, Intent.HELP, normalised,
              "what can you do", "help", "what are you", "capabilities");

        score(scores, Intent.THANKS, normalised,
              "thanks", "thank you", "thx", "appreciated");

        score(scores, Intent.GOODBYE, normalised,
              "bye", "goodbye", "exit", "quit");

        // Follow-up context boost
        if (followUpTopic != null) {
            boost(scores, followUpTopic);
        }

        // Find max matching score
        int maxScore = scores.values().stream().mapToInt(a -> a[0]).max().orElse(0);

        if (maxScore == 0) {
            long wordCount = Arrays.stream(normalised.split(" "))
                                  .filter(s -> !s.isBlank())
                                  .count();
            if (wordCount > 2) {
                return Intent.UNKNOWN;
            }
            return contextualFallback(currentPage, currentRoute);
        }

        // Find winner based on score
        return scores.entrySet().stream()
                     .filter(e -> e.getValue()[0] > 0)
                     .max(Map.Entry.comparingByValue((a, b) -> a[0] - b[0]))
                     .map(Map.Entry::getKey)
                     .orElse(contextualFallback(currentPage, currentRoute));
    }

    private void score(Map<Intent, int[]> scores, Intent intent,
                       String text, String... keywords) {
        String spacedText = " " + text + " ";
        int count = 0;
        for (String kw : keywords) {
            if (spacedText.contains(" " + kw + " ")) {
                count++;
            }
        }
        scores.merge(intent, new int[]{count}, (a, b) -> { a[0] += b[0]; return a; });
    }

    private void boost(Map<Intent, int[]> scores, String topic) {
        switch (topic) {
            case "vulnerability" ->
                scores.merge(Intent.VULNERABILITY_CRITICAL, new int[]{2}, (a, b) -> { a[0] += b[0]; return a; });
            case "incident" ->
                scores.merge(Intent.INCIDENT_LIFECYCLE,    new int[]{2}, (a, b) -> { a[0] += b[0]; return a; });
            case "asset" ->
                scores.merge(Intent.ASSET_STATUS,          new int[]{2}, (a, b) -> { a[0] += b[0]; return a; });
            default -> { /* no boost */ }
        }
    }

    private Intent contextualFallback(String currentPage, String currentRoute) {
        String route = currentRoute != null ? currentRoute.toLowerCase() : "";
        String page  = currentPage  != null ? currentPage.toLowerCase()  : "";
        if (route.contains("asset")        || page.contains("asset"))       return Intent.ASSET_MANAGEMENT;
        if (route.contains("incident")     || page.contains("incident"))    return Intent.INCIDENT_RESPONSE;
        if (route.contains("vulnerabilit") || page.contains("vulnerabilit"))return Intent.VULNERABILITY_MANAGEMENT;
        if (route.contains("compliance")   || page.contains("compliance"))  return Intent.COMPLIANCE;
        if (route.contains("report")       || page.contains("report"))      return Intent.REPORTS;
        if (route.contains("dashboard")    || page.contains("dashboard"))   return Intent.DASHBOARD_OVERVIEW;
        return Intent.UNKNOWN;
    }

    private String resolveFollowUpTopic(String normalised, List<ChatMessageDTO> history) {
        if (normalised.split(" ").length > 6) return null;
        if (history == null || history.isEmpty()) return null;

        for (int i = history.size() - 1; i >= 0; i--) {
            ChatMessageDTO msg = history.get(i);
            if ("assistant".equals(msg.role()) && msg.content() != null) {
                String content = msg.content().toLowerCase();
                if (content.contains("vulnerabilit")) return "vulnerability";
                if (content.contains("incident"))     return "incident";
                if (content.contains("asset"))        return "asset";
                break;
            }
        }
        return null;
    }

    // ── Answer Generation ─────────────────────────────────────────────────────

    private String generateAnswer(Intent intent, String normalised, String currentPage) {
        return switch (intent) {
            case GREETING            -> "👋 Hi! I'm the SentinelCore Internal Assistant.\n\nI can help you operate and understand SentinelCore.\n\nWhat would you like to do?";
            case HOW_ARE_YOU         -> "I'm functioning normally and ready to help you monitor SentinelCore's security posture. How can I assist you today?";
            case WHO_ARE_YOU         -> "I am the **SentinelCore Internal Assistant**, running offline within your Spring Boot backend to assist with SecureOps queries.";
            case HELP                -> "I can guide you through SentinelCore and help you understand or manage:\n\n• Dashboard\n• Assets\n• Incidents\n• Vulnerabilities\n• Compliance\n• Reports\n\nYou can ask me how to create, update, manage, or understand any of these.";
            case THANKS              -> "You're welcome! I'm here whenever you need help with SentinelCore.";
            case GOODBYE             -> "Goodbye! Feel free to reach back out if you have more security operations questions.";
            case LIVE_STATS          -> buildLiveStats(normalised);
            case DASHBOARD_METRICS   -> buildDashboardMetrics();
            case DASHBOARD_OVERVIEW  -> buildDashboardOverview();
            case ASSET_STATUS        -> buildAssetStatus();
            case ASSET_MANAGEMENT    -> buildAssetManagement();
            case INCIDENT_LIFECYCLE  -> buildIncidentLifecycle();
            case INCIDENT_RESPONSE   -> buildIncidentResponse();
            case VULNERABILITY_CRITICAL -> buildVulnerabilityCritical();
            case VULNERABILITY_MANAGEMENT -> buildVulnerabilityManagement();
            case COMPLIANCE          -> buildCompliance();
            case REPORTS             -> buildReports();
            case SENTINELCORE_OVERVIEW -> buildSentinelCoreOverview();
            
            // Guided workflows step 1
            case CREATE_ASSET        -> "Sure. I can guide you through creating an asset.\n\n### Step 1 of 4\n\nOpen **Assets** from the left navigation.\n\nOnce you're there, click **Add Asset**.\n\nWould you like the next step?";
            case MANAGE_ASSET        -> "Open **Assets** from the sidebar. You can view specifications, edit parameters, schedule maintenance, or delete systems. What do you need to do?";
            case CREATE_INCIDENT     -> "Sure. I can guide you through creating an incident.\n\n### Step 1 of 4\n\nOpen **Incidents** from the left navigation.\n\nOnce you're there, click **Create Incident**.\n\nWould you like the next step?";
            case MANAGE_INCIDENT     -> "Open **Incidents** from the sidebar. You can edit details, assign teams or change status / severity. What action would you like to perform?";
            case MANAGE_VULNERABILITY -> "Open **Vulnerabilities** from sidebar. The Active Vulnerabilities Tracker lists all CVEs tracked by SentinelCore.\n\n• **Remediation**: Click **Deploy Patch** next to the CVE (requires VULN_MANAGE permission).\n• **Scanning**: Code gates (SonarQube) and Container Scans (Trivy) run automatically, but can also be reviewed under Threat Scanning Registry.\n• **Severity**: Prioritize items with CVSS score >= 9.0 (Critical) and 7.0–8.9 (High).";

            case UNKNOWN             -> "I'm currently focused on SentinelCore and can help with your security dashboard, assets, incidents, vulnerabilities, compliance, and reports.";
        };
    }

    // ── Suggestions Mapping Service ───────────────────────────────────────────

    private List<String> getSuggestionsForIntent(Intent intent, String currentPage) {
        return switch (intent) {
            case DASHBOARD_OVERVIEW, DASHBOARD_METRICS -> List.of(
                "Explain Dashboard metrics",
                "Show security overview",
                "Explain compliance score",
                "Explain Asset Management"
            );
            case ASSET_MANAGEMENT, ASSET_STATUS -> List.of(
                "Create Asset",
                "Manage Assets",
                "Show asset status",
                "How do I edit an asset?"
            );
            case CREATE_ASSET -> List.of(
                "Next step",
                "Show all steps",
                "Cancel"
            );
            case MANAGE_ASSET -> List.of(
                "Edit an asset",
                "View asset details",
                "Delete an asset",
                "Back to Assets"
            );
            case INCIDENT_RESPONSE, INCIDENT_LIFECYCLE -> List.of(
                "Create Incident",
                "Manage Incidents",
                "Incident Severity",
                "Resolve Incident"
            );
            case CREATE_INCIDENT -> List.of(
                "Next step",
                "Show all steps",
                "Cancel"
            );
            case MANAGE_INCIDENT -> List.of(
                "Update incident",
                "Change severity",
                "Change status",
                "Resolve incident",
                "Back to Incidents"
            );
            case VULNERABILITY_MANAGEMENT, VULNERABILITY_CRITICAL, MANAGE_VULNERABILITY -> List.of(
                "View Vulnerabilities",
                "Critical Vulnerabilities",
                "Remediation",
                "Manage Vulnerabilities"
            );
            case COMPLIANCE -> List.of(
                "Explain compliance score",
                "View compliance",
                "Generate compliance report",
                "Back to Dashboard"
            );
            case REPORTS -> List.of(
                "Dashboard Report",
                "Compliance Report",
                "Vulnerability Report",
                "Incident Report"
            );
            case GREETING, HELP -> getSuggestionsForGreetingAndHelp(currentPage);
            case UNKNOWN -> getSuggestionsForGreetingAndHelp(currentPage);
            default -> getSuggestionsForGreetingAndHelp(currentPage);
        };
    }

    private List<String> getSuggestionsForGreetingAndHelp(String currentPage) {
        if (currentPage == null) currentPage = "Dashboard";
        switch (currentPage) {
            case "Assets" -> {
                return List.of("Create Asset", "Manage Assets", "View Asset Details", "Explain Asset Status");
            }
            case "Incidents" -> {
                return List.of("Create Incident", "Manage Incidents", "Incident Severity", "Resolve Incident");
            }
            case "Vulnerabilities" -> {
                return List.of("View Vulnerabilities", "Critical Vulnerabilities", "Remediation", "Manage Vulnerabilities");
            }
            case "Compliance" -> {
                return List.of("Compliance Score", "Security Controls", "Compliance Reports", "Back to Dashboard");
            }
            case "Reports" -> {
                return List.of("Dashboard Report", "Compliance Report", "Vulnerability Report", "Incident Report");
            }
            default -> {
                return List.of("Dashboard", "Create Asset", "Create Incident", "Manage Vulnerabilities", "Compliance", "Reports");
            }
        }
    }

    // ── Answer Builders ───────────────────────────────────────────────────────

    private String buildDashboardMetrics() {
        return """
                Your SentinelCore security dashboard provides a high-level view of your security posture. The main metrics represent:

                • **Assets** — all systems and resources currently being monitored in your infrastructure.
                • **Security Alerts** — detected security events that require attention or investigation.
                • **Active Incidents** — security incidents currently in an Open or Investigating state.
                • **Vulnerabilities** — identified security weaknesses tracked across your assets.
                • **Critical Vulnerabilities** — vulnerabilities with CVSS ≥ 7.0 requiring the highest priority remediation.
                • **Compliance Score** — an overall indicator of your organisation's adherence to configured security requirements.

                The dashboard helps security teams quickly identify which areas require immediate attention.""";
    }

    private String buildDashboardOverview() {
        String assetCount  = safeCount(() -> assetRepository.count());
        String incCount    = safeCount(() -> incidentRepository.countActiveIncidents());
        String vulnCount   = safeCount(() -> vulnerabilityRepository.count());
        String alertCount  = safeCount(() -> alertRepository.count());

        return "The **SentinelCore Dashboard** is your central security operations hub. It aggregates live telemetry from PostgreSQL:\n\n" +
               "• **Total Assets**: " + assetCount + "\n" +
               "• **Active Incidents**: " + incCount + "\n" +
               "• **Total Vulnerabilities**: " + vulnCount + "\n" +
               "• **Security Alerts**: " + alertCount + "\n\n" +
               "Use the dashboard to monitor your security posture at a glance and navigate to any module for deeper analysis.";
    }

    private String buildLiveStats(String normalised) {
        String assetCount = safeCount(() -> assetRepository.count());
        String activeIncidents = safeCount(() -> incidentRepository.countActiveIncidents());
        String openVulns = safeCount(() -> vulnerabilityRepository.count());
        String criticalVulns = safeCount(() -> vulnerabilityRepository.countCriticalVulnerabilities());
        String activeAlerts = safeCount(() -> alertRepository.count());
        String registeredUsers = safeCount(() -> userRepository.count());

        // Exact match support for assets query
        if (normalised.contains("asset")) {
            return "The SentinelCore database currently contains " + assetCount + " registered assets.";
        }
        if (normalised.contains("incident")) {
            return "There are currently " + activeIncidents + " active security incidents in the database.";
        }
        if (normalised.contains("vulnerabilit")) {
            return "The database currently records " + openVulns + " vulnerabilities (with " + criticalVulns + " critical ones).";
        }
        if (normalised.contains("alert")) {
            return "The database currently contains " + activeAlerts + " active security alerts.";
        }
        if (normalised.contains("user")) {
            return "There are currently " + registeredUsers + " registered users in SentinelCore.";
        }

        return "**Live SentinelCore Metrics** (sourced directly from the database):\n\n" +
               "• Total Assets: **" + assetCount + "**\n" +
               "• Active Incidents: **" + activeIncidents + "**\n" +
               "• Total Vulnerabilities: **" + openVulns + "**\n" +
               "• Critical Vulnerabilities (CVSS ≥ 7.0): **" + criticalVulns + "**\n" +
               "• Security Alerts: **" + activeAlerts + "**\n" +
               "• Registered Users: **" + registeredUsers + "**\n\n" +
               "Navigate to the relevant module for full details and filtering options.";
    }

    private String buildAssetManagement() {
        String count = safeCount(() -> assetRepository.count());
        return "**Asset Management** in SentinelCore allows you to maintain a complete inventory of your IT infrastructure.\n\n" +
               "• **Current asset count**: " + count + "\n" +
               "• Track servers, firewalls, databases, endpoints, and cloud resources.\n" +
               "• Each asset has a hostname, IP address, type, criticality level, and location.\n" +
               "• Asset status is monitored in real-time (Active / Inactive / Maintenance).\n\n" +
               "**To add an asset**: Navigate to **Assets → Add New Asset**, fill in the details, and click **Save Asset**.\n" +
               "**To search**: Use the search bar in the Assets module to filter by name, IP, or type.";
    }

    private String buildAssetStatus() {
        String active   = safeCount(() -> assetRepository.countByStatus("Active"));
        String inactive = safeCount(() -> assetRepository.countByStatus("Inactive"));
        return "**Asset Status Overview**:\n\n" +
               "• **Active assets**: " + active + "\n" +
               "• **Inactive assets**: " + inactive + "\n\n" +
               "Asset status reflects the current operational state:\n" +
               "• **Active** — asset is online and being monitored.\n" +
               "• **Inactive** — asset is offline or decommissioned.\n" +
               "• **Maintenance** — asset is temporarily taken offline for maintenance.\n\n" +
               "Update asset status from the **Assets** module by selecting an asset and editing its record.";
    }

    private String buildIncidentResponse() {
        String active   = safeCount(() -> incidentRepository.countActiveIncidents());
        String critical = safeCount(() -> incidentRepository.countCriticalIncidents());
        return "**Incident Response** in SentinelCore manages the full lifecycle of security incidents.\n\n" +
               "• **Active incidents**: " + active + "\n" +
               "• **Critical active incidents**: " + critical + "\n\n" +
               "**Severity levels**: Critical → High → Medium → Low\n" +
               "**Incident statuses**: Open → Investigating → Remediated → Closed\n\n" +
               "**To create an incident**: Go to **Incidents → Create Incident**. Fill in the Title, Severity, SLA hours, Assigned Team, and Description, then click **Save Incident**.\n\n" +
               "SLA timers track time-to-resolution targets. Critical incidents have the shortest SLA windows.";
    }

    private String buildIncidentLifecycle() {
        return """
                **Incident Lifecycle** in SentinelCore follows a structured workflow:

                1. **Open** — Incident is detected and logged. The clock starts on the SLA timer.
                2. **Investigating** — The assigned team is actively analysing the incident.
                3. **Remediated** — Corrective actions have been applied.
                4. **Closed** — The incident is fully resolved and documentation generated.

                **Key concepts:**
                • **Severity** (Critical / High / Medium / Low) determines priority and SLA requirements.
                • **Assigned Team** — responsible for investigation and resolution.
                • **SLA Hours** — maximum time allowed before the incident must be resolved.

                Navigate to **Incidents** to view, filter, and manage all incidents by status or severity.""";
    }

    private String buildVulnerabilityManagement() {
        String total    = safeCount(() -> vulnerabilityRepository.count());
        String critical = safeCount(() -> vulnerabilityRepository.countCriticalVulnerabilities());
        return "**Vulnerability Management** in SentinelCore tracks and prioritises security weaknesses across your infrastructure.\n\n" +
               "• **Total vulnerabilities tracked**: " + total + "\n" +
               "• **Critical (CVSS ≥ 7.0)**: " + critical + "\n\n" +
               "Each vulnerability entry includes:\n" +
               "• **CVE identifier** — industry standard vulnerability reference.\n" +
               "• **CVSS score** — numerical severity rating (0–10).\n" +
               "• **Risk score** — internal risk assessment.\n" +
               "• **Affected assets** — systems impacted.\n" +
               "• **Patch status** — whether a patch is available and applied.\n" +
               "• **Remediation guidance** — steps to mitigate or resolve the vulnerability.\n\n" +
               "Navigate to **Vulnerabilities** to view all entries and filter by severity or patch status.";
    }

    private String buildVulnerabilityCritical() {
        String critical = safeCount(() -> vulnerabilityRepository.countCriticalVulnerabilities());
        String total    = safeCount(() -> vulnerabilityRepository.count());
        return "**Critical Vulnerabilities** are those with a CVSS score of 7.0 or higher — these represent the most severe security risks.\n\n" +
               "• **Critical vulnerabilities** (CVSS ≥ 7.0): **" + critical + "**\n" +
               "• **Total vulnerabilities**: " + total + "\n\n" +
               "**Severity bands:**\n" +
               "• Critical: CVSS 9.0–10.0 — immediate remediation required.\n" +
               "• High: CVSS 7.0–8.9 — remediate within days.\n" +
               "• Medium: CVSS 4.0–6.9 — remediate within weeks.\n" +
               "• Low: CVSS 0.1–3.9 — schedule remediation.\n\n" +
               "Navigate to **Vulnerabilities**, filter by CVSS score, and prioritise patching the highest-scored entries first.";
    }

    private String buildCompliance() {
        return """
                **Compliance** in SentinelCore measures your organisation's adherence to security frameworks and regulatory requirements.

                **Supported frameworks:**
                • **ISO/IEC 27001:2022** — 94% Compliant (107 / 114 Checks Passed)
                • **SOC 2 Type II (TSC)** — 98% Compliant (56 / 57 Checks Passed)
                • **PCI DSS v4.0** — 88% Compliant (22 / 25 Checks Passed - Review Required)

                **Compliance Score** — an aggregated percentage reflecting how many security controls are currently passing.

                **Security Controls** include access management, encryption, incident response procedures, vulnerability management, and audit logging.

                Navigate to **Compliance** to view your current posture per framework, identify failing controls, and generate compliance reports.
                Use **Reports → Compliance Report** to export a detailed compliance summary.""";
    }

    private String buildReports() {
        return """
                **Reports** in SentinelCore allow you to generate, export, email, and schedule security reports.

                **Available report types:**
                • **Executive Summary** — high-level security posture overview for leadership.
                • **IT Assets Report** — full inventory of monitored infrastructure.
                • **Security Incidents Report** — detailed incident history and status.
                • **Vulnerability CVE Report** — complete vulnerability listings with CVSS scores.
                • **Compliance Report** — framework-level compliance posture.

                **Export formats:** PDF · CSV · Excel Workbook (.xlsx)

                **To generate a report:** Go to **Reports**, select the report type and format, then click **Generate & View Report**.

                **To email a report:** Enter a recipient email in the **Direct Email Dispatcher** and click **Send Now**.

                **To schedule a report:** Use **Schedule Automated Deliveries** — set the type, frequency (Daily/Weekly/Monthly), time, and recipient email.""";
    }

    private String buildSentinelCoreOverview() {
        return """
                **SentinelCore SecureOps** is a comprehensive security operations platform designed for enterprise security teams.

                **Purpose:** Centralise security visibility, incident management, vulnerability tracking, compliance monitoring, and reporting in a single platform.

                **Core modules:**
                • **Dashboard** — live security posture overview with key metrics.
                • **Assets** — infrastructure inventory management.
                • **Incidents** — full incident lifecycle management with SLA tracking.
                • **Vulnerabilities** — CVE tracking, CVSS scoring, and remediation guidance.
                • **Compliance** — ISO 27001, SOC 2, and PCI DSS framework posture.
                • **Reports** — PDF/CSV/Excel reports with email and scheduling.
                • **Audit Logs** — tamper-evident log of all user and operator actions.
                • **User Administration** — RBAC setup.

                I am the **SentinelCore Internal Assistant** — I can help with any of these modules.""";
    }

    // ── Safe Database Access ──────────────────────────────────────────────────

    private String safeCount(CountSupplier supplier) {
        try {
            return String.valueOf(supplier.get());
        } catch (Exception ex) {
            log.warn("[SentinelCore Assistant] Database metric unavailable: {}", ex.getMessage());
            return "*(unavailable)*";
        }
    }

    @FunctionalInterface
    interface CountSupplier {
        long get() throws Exception;
    }
}
