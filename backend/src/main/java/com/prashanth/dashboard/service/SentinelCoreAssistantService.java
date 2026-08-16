package com.prashanth.dashboard.service;

import com.prashanth.dashboard.dto.ChatMessageDTO;
import com.prashanth.dashboard.repository.AlertRepository;
import com.prashanth.dashboard.repository.AssetRepository;
import com.prashanth.dashboard.repository.IncidentRepository;
import com.prashanth.dashboard.repository.VulnerabilityRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

    // ── Repository injection (all pre-existing) ───────────────────────────────
    private final AssetRepository        assetRepository;
    private final IncidentRepository     incidentRepository;
    private final VulnerabilityRepository vulnerabilityRepository;
    private final AlertRepository        alertRepository;

    public SentinelCoreAssistantService(AssetRepository assetRepository,
                                        IncidentRepository incidentRepository,
                                        VulnerabilityRepository vulnerabilityRepository,
                                        AlertRepository alertRepository) {
        this.assetRepository       = assetRepository;
        this.incidentRepository    = incidentRepository;
        this.vulnerabilityRepository = vulnerabilityRepository;
        this.alertRepository        = alertRepository;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Always returns true — the internal assistant is always ready.
     */
    public boolean isConfigured() {
        return true;
    }

    /**
     * Main entry point.  Resolves an intent from the user's message (and
     * optional conversation history for follow-up context), then generates
     * a professional answer from the knowledge base + live data.
     */
    public String chat(String userMessage,
                       List<ChatMessageDTO> history,
                       String currentPage,
                       String currentRoute) {
        try {
            String normalised = normalise(userMessage);

            // Resolve a follow-up topic from recent conversation if needed
            String followUpTopic = resolveFollowUpTopic(normalised, history);

            Intent intent = detectIntent(normalised, followUpTopic, currentPage, currentRoute);
            log.debug("[SentinelCore Assistant] intent={} message='{}'", intent, userMessage);
            return generateAnswer(intent, normalised);
        } catch (Exception ex) {
            log.error("[SentinelCore Assistant] Unexpected error processing chat", ex);
            return "Sorry, I couldn't process that request. Please try again.";
        }
    }

    // ── Normalisation ─────────────────────────────────────────────────────────

    /** Lower-case, trim, collapse whitespace, strip trailing punctuation. */
    static String normalise(String text) {
        if (text == null) return "";
        return text.toLowerCase()
                   .trim()
                   .replaceAll("[?!.,;:]+$", "")
                   .replaceAll("\\s+", " ");
    }

    // ── Intent enum ───────────────────────────────────────────────────────────

    enum Intent {
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
        UNKNOWN
    }

    // ── Intent detection via keyword scoring ──────────────────────────────────

    /**
     * Scores each intent by counting how many of its keywords appear in the
     * normalised message.  The intent with the highest positive score wins.
     * Ties are broken by order of declaration (most-specific first).
     */
    Intent detectIntent(String normalised, String followUpTopic, String currentPage, String currentRoute) {
        if (normalised == null || normalised.isBlank()) {
            return Intent.UNKNOWN;
        }

        Map<Intent, int[]> scores = new HashMap<>();

        score(scores, Intent.LIVE_STATS, normalised,
              "how many", "count", "total", "how much", "live", "current number",
              "how many assets", "how many incidents", "how many vulnerabilities",
              "how many alerts", "asset count", "incident count", "vuln count", "stats");

        score(scores, Intent.DASHBOARD_METRICS, normalised,
              "explain the security dashboard metrics", "what do the dashboard metrics mean",
              "tell me about dashboard metrics", "dashboard metrics", "security metrics",
              "explain the metrics", "what represent");

        score(scores, Intent.DASHBOARD_OVERVIEW, normalised,
              "dashboard", "overview", "home", "main page", "security posture",
              "security overview", "what is the dashboard");

        score(scores, Intent.ASSET_STATUS, normalised,
              "asset status", "asset monitoring", "asset health", "online asset",
              "offline asset", "active asset", "inactive asset");

        score(scores, Intent.ASSET_MANAGEMENT, normalised,
              "asset", "assets", "asset management", "infrastructure", "inventory",
              "add asset", "create asset", "servers", "endpoints", "hardware");

        score(scores, Intent.INCIDENT_LIFECYCLE, normalised,
              "incident lifecycle", "incident workflow", "incident process",
              "resolve incident", "close incident", "incident status", "open incident",
              "investigating", "remediated");

        score(scores, Intent.INCIDENT_RESPONSE, normalised,
              "incident", "incidents", "incident response", "security incident",
              "create incident", "add incident", "response", "severity", "sla",
              "critical incident", "high incident");

        score(scores, Intent.VULNERABILITY_CRITICAL, normalised,
              "critical vulnerabilit", "critical vuln", "high vulnerabilit",
              "which ones are critical", "critical ones", "highest cvss",
              "most severe", "cvss", "cve", "patch", "remediation");

        score(scores, Intent.VULNERABILITY_MANAGEMENT, normalised,
              "vulnerabilit", "vulnerability management", "vuln", "patch status",
              "security weakness", "weakness", "tracking", "vulnerability tracking");

        score(scores, Intent.COMPLIANCE, normalised,
              "compliance", "compliant", "compliance score", "iso", "soc 2",
              "pci", "regulation", "control", "audit", "framework", "posture");

        score(scores, Intent.REPORTS, normalised,
              "report", "reports", "generate report", "export", "csv", "pdf",
              "excel", "download", "schedule", "email report", "send report");

        score(scores, Intent.SENTINELCORE_OVERVIEW, normalised,
              "sentinelcore", "what is sentinelcore", "what are you", "who are you",
              "what can you do", "about sentinelcore", "platform", "modules",
              "secureops", "purpose");

        // Follow-up context boost: if the last topic was, say, vulnerabilities
        // and the user says "which ones are critical", boost the relevant intent
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

        // Find winner
        return scores.entrySet().stream()
                     .filter(e -> e.getValue()[0] > 0)
                     .max(Map.Entry.comparingByValue((a, b) -> a[0] - b[0]))
                     .map(Map.Entry::getKey)
                     .orElse(contextualFallback(currentPage, currentRoute));
    }

    /** Count how many of the given keywords appear in the text and add to score. */
    private void score(Map<Intent, int[]> scores, Intent intent,
                       String text, String... keywords) {
        int count = (int) Arrays.stream(keywords)
                                .filter(text::contains)
                                .count();
        scores.merge(intent, new int[]{count}, (a, b) -> { a[0] += b[0]; return a; });
    }

    /** Boost a follow-up topic's related intent. */
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

    /**
     * If no keyword matches, use current page/route for a contextual fallback.
     */
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

    // ── Follow-up topic resolution ────────────────────────────────────────────

    /**
     * Looks at the last assistant reply in history to infer a topic for
     * short follow-up messages like "which ones are critical?".
     */
    private String resolveFollowUpTopic(String normalised, List<ChatMessageDTO> history) {
        // Only activate for short, vague messages
        if (normalised.split(" ").length > 6) return null;
        if (history == null || history.isEmpty()) return null;

        // Find last assistant message
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

    // ── Answer generation ─────────────────────────────────────────────────────

    private String generateAnswer(Intent intent, String normalised) {
        return switch (intent) {
            case LIVE_STATS          -> buildLiveStats();
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
            case UNKNOWN             -> buildUnknown();
        };
    }

    // ── Answer builders ───────────────────────────────────────────────────────

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
        String alertCount  = safeCount(() -> (long) alertRepository.findAll().size());

        return "The **SentinelCore Dashboard** is your central security operations hub. It aggregates live telemetry from PostgreSQL:\n\n" +
               "• **Total Assets**: " + assetCount + "\n" +
               "• **Active Incidents**: " + incCount + "\n" +
               "• **Total Vulnerabilities**: " + vulnCount + "\n" +
               "• **Security Alerts**: " + alertCount + "\n\n" +
               "Use the dashboard to monitor your security posture at a glance and navigate to any module for deeper analysis.";
    }

    private String buildLiveStats() {
        String assets    = safeCount(() -> assetRepository.count());
        String incidents = safeCount(() -> incidentRepository.countActiveIncidents());
        String vulns     = safeCount(() -> vulnerabilityRepository.count());
        String critVulns = safeCount(() -> vulnerabilityRepository.countCriticalVulnerabilities());
        String alerts    = safeCount(() -> (long) alertRepository.findAll().size());

        return "**Live SentinelCore Metrics** (sourced directly from the database):\n\n" +
               "• Total Assets: **" + assets + "**\n" +
               "• Active Incidents: **" + incidents + "**\n" +
               "• Total Vulnerabilities: **" + vulns + "**\n" +
               "• Critical Vulnerabilities (CVSS ≥ 7.0): **" + critVulns + "**\n" +
               "• Security Alerts: **" + alerts + "**\n\n" +
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
                4. **Closed** — The incident is fully resolved and documented.

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
                • **ISO 27001** — International information security management standard.
                • **SOC 2** — Service Organisation Controls for trust and security.
                • **PCI DSS** — Payment Card Industry Data Security Standard.

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
                • **Audit Logs** — tamper-evident log of all user and system actions.
                • **User Administration** — RBAC with 9 role levels from VIEWER to SUPER_ADMIN.

                **How modules work together:** Security analysts detect alerts on the Dashboard, create Incidents, link affected Assets, track Vulnerabilities to patch, verify Compliance posture, and deliver executive Reports — all within one integrated workflow.

                I am the **SentinelCore Internal Assistant** — I can help with any of these modules.""";
    }

    private String buildUnknown() {
        return "I am the **SentinelCore Internal Assistant**. I can help with the Dashboard, Assets, Incidents, Vulnerabilities, Compliance, Reports, and SentinelCore functionality.";
    }

    // ── Safe database access ──────────────────────────────────────────────────

    /** Executes a database count supplier, returning the result or a safe message on error. */
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
