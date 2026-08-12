package com.prashanth.dashboard.service;

import com.lowagie.text.Document;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfWriter;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPCell;

import com.prashanth.dashboard.model.*;
import com.prashanth.dashboard.repository.*;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReportGenerationService {

    private final AssetRepository assetRepository;
    private final IncidentRepository incidentRepository;
    private final VulnerabilityRepository vulnerabilityRepository;
    private final AlertRepository alertRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;

    public ReportGenerationService(AssetRepository assetRepository,
                                   IncidentRepository incidentRepository,
                                   VulnerabilityRepository vulnerabilityRepository,
                                   AlertRepository alertRepository,
                                   UserRepository userRepository,
                                   AuditLogRepository auditLogRepository) {
        this.assetRepository = assetRepository;
        this.incidentRepository = incidentRepository;
        this.vulnerabilityRepository = vulnerabilityRepository;
        this.alertRepository = alertRepository;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
    }

    public byte[] generateReportPdf(String reportType) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4.rotate());
        
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Add Header Title
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.RED);
            Paragraph title = new Paragraph("SentinelCore SecureOps - Security Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(10);
            document.add(title);

            // Subtitle
            Font typeFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Paragraph subtitle = new Paragraph("Report Type: " + reportType.replace("_", " "), typeFont);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(15);
            document.add(subtitle);

            // Date
            Font dateFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY);
            Paragraph date = new Paragraph("Generated on: " + LocalDateTime.now() + " UTC", dateFont);
            date.setAlignment(Element.ALIGN_CENTER);
            date.setSpacingAfter(20);
            document.add(date);

            String normType = reportType.toUpperCase().trim();

            if ("EXECUTIVE_SUMMARY".equals(normType) || "DASHBOARD".equals(normType)) {
                writeExecutiveSummary(document);
            } else if ("IT_ASSETS_LOG".equals(normType) || "ASSETS".equals(normType)) {
                writeAssetsLog(document);
            } else if ("SECURITY_INCIDENTS".equals(normType) || "INCIDENTS".equals(normType)) {
                writeIncidentsHistory(document);
            } else if ("VULNERABILITY_CVE".equals(normType) || "VULNERABILITIES".equals(normType)) {
                writeVulnerabilities(document);
            } else {
                // Fallback / default content
                Font normFont = FontFactory.getFont(FontFactory.HELVETICA, 12);
                document.add(new Paragraph("SentinelCore generic telemetry log. No details found for type: " + reportType, normFont));
            }

            // Footer / confidentiality
            Font footerFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, Color.LIGHT_GRAY);
            Paragraph footer = new Paragraph("\n\nTHIS SECURITY REPORT GENERATED FROM REAL-TIME MONITORING APIS IS CLASSIFIED AS CONFIDENTIAL.", footerFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF report: " + e.getMessage(), e);
        }

        return out.toByteArray();
    }

    private void writeExecutiveSummary(Document document) throws Exception {
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
        document.add(new Paragraph("Security Console Statistics Overview\n", headerFont));

        long totalAssets = assetRepository.count();
        long activeIncidents = incidentRepository.countActiveIncidents();
        long criticalIncidents = incidentRepository.countCriticalIncidents();
        long openVulnerabilities = vulnerabilityRepository.count();
        long activeAlerts = alertRepository.count();
        long registeredUsers = userRepository.count();

        PdfPTable statsTable = new PdfPTable(2);
        statsTable.setWidthPercentage(80f);
        statsTable.setSpacingAfter(20);
        
        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        Font valFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
        
        statsTable.addCell(new PdfPCell(new Phrase("Total CMDB Assets", labelFont)));
        statsTable.addCell(new PdfPCell(new Phrase(String.valueOf(totalAssets), valFont)));
        statsTable.addCell(new PdfPCell(new Phrase("Active Security Incidents", labelFont)));
        statsTable.addCell(new PdfPCell(new Phrase(String.valueOf(activeIncidents), valFont)));
        statsTable.addCell(new PdfPCell(new Phrase("Critical Incidents High Severity", labelFont)));
        statsTable.addCell(new PdfPCell(new Phrase(String.valueOf(criticalIncidents), valFont)));
        statsTable.addCell(new PdfPCell(new Phrase("Open CVE Vulnerabilities", labelFont)));
        statsTable.addCell(new PdfPCell(new Phrase(String.valueOf(openVulnerabilities), valFont)));
        statsTable.addCell(new PdfPCell(new Phrase("Pending Console Alerts", labelFont)));
        statsTable.addCell(new PdfPCell(new Phrase(String.valueOf(activeAlerts), valFont)));
        statsTable.addCell(new PdfPCell(new Phrase("Registered Operators", labelFont)));
        statsTable.addCell(new PdfPCell(new Phrase(String.valueOf(registeredUsers), valFont)));
        document.add(statsTable);

        // Recent Incidents
        document.add(new Paragraph("Recent Security Incidents\n", headerFont));
        List<Incident> incidents = incidentRepository.findAll();
        
        PdfPTable incidentTable = new PdfPTable(4);
        incidentTable.setWidthPercentage(100f);
        incidentTable.setSpacingAfter(20);
        incidentTable.setWidths(new float[] {1f, 3f, 1.5f, 1.5f});
        
        incidentTable.addCell(new PdfPCell(new Phrase("ID", labelFont)));
        incidentTable.addCell(new PdfPCell(new Phrase("Title", labelFont)));
        incidentTable.addCell(new PdfPCell(new Phrase("Severity", labelFont)));
        incidentTable.addCell(new PdfPCell(new Phrase("Status", labelFont)));
        
        int count = 0;
        for (Incident inc : incidents) {
            if (count++ >= 5) break;
            incidentTable.addCell(new Phrase("INC-" + inc.getId(), valFont));
            incidentTable.addCell(new Phrase(inc.getTitle() != null ? inc.getTitle() : "", valFont));
            incidentTable.addCell(new Phrase(inc.getSeverity() != null ? inc.getSeverity() : "", valFont));
            incidentTable.addCell(new Phrase(inc.getStatus() != null ? inc.getStatus() : "", valFont));
        }
        document.add(incidentTable);
    }

    private void writeAssetsLog(Document document) throws Exception {
        List<Asset> assets = assetRepository.findAll();
        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100f);
        table.setWidths(new float[] {2.5f, 2.0f, 2.5f, 1.5f, 2.0f, 2.0f});

        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        Font valFont = FontFactory.getFont(FontFactory.HELVETICA, 9);

        table.addCell(new PdfPCell(new Phrase("Asset Name", labelFont)));
        table.addCell(new PdfPCell(new Phrase("Type", labelFont)));
        table.addCell(new PdfPCell(new Phrase("IP Address", labelFont)));
        table.addCell(new PdfPCell(new Phrase("Status", labelFont)));
        table.addCell(new PdfPCell(new Phrase("CPU Usage / RAM", labelFont)));
        table.addCell(new PdfPCell(new Phrase("Location", labelFont)));

        for (Asset asset : assets) {
            table.addCell(new Phrase(asset.getAssetName() != null ? asset.getAssetName() : "", valFont));
            table.addCell(new Phrase(asset.getAssetType() != null ? asset.getAssetType() : "", valFont));
            table.addCell(new Phrase(asset.getIpAddress() != null ? asset.getIpAddress() : "", valFont));
            table.addCell(new Phrase(asset.getStatus() != null ? asset.getStatus() : "", valFont));
            table.addCell(new Phrase("CPU: " + asset.getCpuUsage() + "% | RAM: " + asset.getMemoryUsage() + "%", valFont));
            table.addCell(new Phrase(asset.getLocation() != null ? asset.getLocation() : "", valFont));
        }
        document.add(table);
    }

    private void writeIncidentsHistory(Document document) throws Exception {
        List<Incident> incidents = incidentRepository.findAll();
        PdfPTable table = new PdfPTable(7);
        table.setWidthPercentage(100f);
        table.setWidths(new float[] {1f, 3f, 1.5f, 1.5f, 2f, 2f, 2.5f});

        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        Font valFont = FontFactory.getFont(FontFactory.HELVETICA, 8);

        table.addCell(new PdfPCell(new Phrase("ID", labelFont)));
        table.addCell(new PdfPCell(new Phrase("Incident Title", labelFont)));
        table.addCell(new PdfPCell(new Phrase("Severity", labelFont)));
        table.addCell(new PdfPCell(new Phrase("Status", labelFont)));
        table.addCell(new PdfPCell(new Phrase("Assigned Team", labelFont)));
        table.addCell(new PdfPCell(new Phrase("Assigned Operator", labelFont)));
        table.addCell(new PdfPCell(new Phrase("Created Time", labelFont)));

        for (Incident inc : incidents) {
            table.addCell(new Phrase("INC-" + inc.getId(), valFont));
            table.addCell(new Phrase(inc.getTitle() != null ? inc.getTitle() : "", valFont));
            table.addCell(new Phrase(inc.getSeverity() != null ? inc.getSeverity() : "", valFont));
            table.addCell(new Phrase(inc.getStatus() != null ? inc.getStatus() : "", valFont));
            table.addCell(new Phrase(inc.getAssignedTeam() != null ? inc.getAssignedTeam() : "", valFont));
            table.addCell(new Phrase(inc.getAssignedTo() != null ? inc.getAssignedTo() : "", valFont));
            table.addCell(new Phrase(inc.getCreatedAt() != null ? inc.getCreatedAt().toString() : "", valFont));
        }
        document.add(table);
    }

    private void writeVulnerabilities(Document document) throws Exception {
        List<Vulnerability> vulnerabilities = vulnerabilityRepository.findAll();
        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100f);
        table.setWidths(new float[] {2.5f, 1.5f, 1.5f, 2.5f, 2f, 4f});

        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        Font valFont = FontFactory.getFont(FontFactory.HELVETICA, 8);

        table.addCell(new PdfPCell(new Phrase("CVE Identifier", labelFont)));
        table.addCell(new PdfPCell(new Phrase("CVSS Score", labelFont)));
        table.addCell(new PdfPCell(new Phrase("Severity", labelFont)));
        table.addCell(new PdfPCell(new Phrase("Affected Hosts", labelFont)));
        table.addCell(new PdfPCell(new Phrase("Status", labelFont)));
        table.addCell(new PdfPCell(new Phrase("Remediation", labelFont)));

        for (Vulnerability vuln : vulnerabilities) {
            table.addCell(new Phrase(vuln.getCve() != null ? vuln.getCve() : "", valFont));
            table.addCell(new Phrase(String.valueOf(vuln.getCvss()), valFont));
            table.addCell(new Phrase(vuln.getRiskScore() >= 7 ? "CRITICAL" : "MEDIUM", valFont));
            table.addCell(new Phrase(vuln.getAffectedAssets() != null ? vuln.getAffectedAssets() : "", valFont));
            table.addCell(new Phrase(vuln.getPatchStatus() != null ? vuln.getPatchStatus() : "", valFont));
            table.addCell(new Phrase(vuln.getRemediation() != null ? vuln.getRemediation() : "", valFont));
        }
        document.add(table);
    }
}
