package com.prashanth.dashboard.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.awt.Color;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.prashanth.dashboard.aop.Auditable;
import com.prashanth.dashboard.model.AuditLog;
import com.prashanth.dashboard.service.AuditLogService;
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

@RestController
@RequestMapping("/api/audit-logs")
@PreAuthorize("hasAuthority('AUDIT_VIEW')")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ResponseEntity<Page<AuditLog>> getAllAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<AuditLog> auditLogs = auditLogService.getAllAuditLogs(pageable);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/all")
    public ResponseEntity<List<AuditLog>> getAllAuditLogsList() {
        List<AuditLog> auditLogs = auditLogService.getAllAuditLogs();
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<List<AuditLog>> getAuditLogsByUsername(@PathVariable String username) {
        List<AuditLog> auditLogs = auditLogService.getAuditLogsByUsername(username);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/action/{action}")
    public ResponseEntity<List<AuditLog>> getAuditLogsByAction(@PathVariable String action) {
        List<AuditLog> auditLogs = auditLogService.getAuditLogsByAction(action);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/result/{result}")
    public ResponseEntity<List<AuditLog>> getAuditLogsByResult(@PathVariable String result) {
        List<AuditLog> auditLogs = auditLogService.getAuditLogsByResult(result);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<AuditLog>> getAuditLogsByDateRange(
            @RequestParam LocalDateTime start,
            @RequestParam LocalDateTime end) {
        List<AuditLog> auditLogs = auditLogService.getAuditLogsByDateRange(start, end);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/stats")
    public ResponseEntity<AuditLogStats> getAuditLogStats() {
        AuditLogStats stats = new AuditLogStats();
        stats.setTotalLogs(auditLogService.getTotalAuditLogsCount());
        stats.setSuccessCount(auditLogService.getSuccessCount());
        stats.setFailedCount(auditLogService.getFailedCount());
        stats.setDeniedCount(auditLogService.getDeniedCount());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/export/csv")
    @Auditable(action = "AUDIT_LOG_EXPORT_CSV")
    public ResponseEntity<byte[]> exportCsv() {
        List<AuditLog> logs = auditLogService.getAllAuditLogs();
        StringBuilder sb = new StringBuilder();
        sb.append("ID,Timestamp,Username,Role,IP Address,Action,Result,Device/Browser\n");
        for (AuditLog log : logs) {
            sb.append(log.getId()).append(",")
              .append(log.getTimestamp() != null ? log.getTimestamp().toString() : "").append(",")
              .append(escapeCsv(log.getUsername())).append(",")
              .append(escapeCsv(log.getRole())).append(",")
              .append(escapeCsv(log.getIpAddress())).append(",")
              .append(escapeCsv(log.getAction())).append(",")
              .append(escapeCsv(log.getResult())).append(",")
              .append(escapeCsv(log.getDeviceBrowser())).append("\n");
        }
        
        byte[] csvBytes = sb.toString().getBytes(StandardCharsets.UTF_8);
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8");
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"audit_logs.csv\"");
        return new ResponseEntity<>(csvBytes, headers, HttpStatus.OK);
    }

    @GetMapping("/export/pdf")
    @Auditable(action = "AUDIT_LOG_EXPORT_PDF")
    public ResponseEntity<byte[]> exportPdf() throws Exception {
        List<AuditLog> logs = auditLogService.getAllAuditLogs();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        
        Document document = new Document(PageSize.A4.rotate());
        PdfWriter.getInstance(document, out);
        document.open();
        
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
        Paragraph title = new Paragraph("SentinelCore SecureOps - Audit Log Registry", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(20);
        document.add(title);
        
        Font dateFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
        Paragraph date = new Paragraph("Exported on: " + LocalDateTime.now().toString(), dateFont);
        date.setSpacingAfter(10);
        document.add(date);
        
        PdfPTable table = new PdfPTable(7);
        table.setWidthPercentage(100f);
        table.setWidths(new float[]{1.0f, 3.0f, 2.5f, 2.5f, 2.5f, 3.5f, 2.0f});
        
        Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        String[] headersList = {"ID", "Timestamp", "Username", "Role", "IP Address", "Action", "Result"};
        for (String headerTitle : headersList) {
            PdfPCell cell = new PdfPCell(new Phrase(headerTitle, headFont));
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setBackgroundColor(new Color(226, 230, 238));
            cell.setPadding(6);
            table.addCell(cell);
        }
        
        Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 8);
        for (AuditLog log : logs) {
            table.addCell(new Phrase(String.valueOf(log.getId()), cellFont));
            table.addCell(new Phrase(log.getTimestamp() != null ? log.getTimestamp().toString() : "", cellFont));
            table.addCell(new Phrase(log.getUsername() != null ? log.getUsername() : "", cellFont));
            table.addCell(new Phrase(log.getRole() != null ? log.getRole() : "", cellFont));
            table.addCell(new Phrase(log.getIpAddress() != null ? log.getIpAddress() : "", cellFont));
            table.addCell(new Phrase(log.getAction() != null ? log.getAction() : "", cellFont));
            table.addCell(new Phrase(log.getResult() != null ? log.getResult() : "", cellFont));
        }
        
        document.add(table);
        document.close();
        
        byte[] pdfBytes = out.toByteArray();
        HttpHeaders responseHeaders = new HttpHeaders();
        responseHeaders.set(HttpHeaders.CONTENT_TYPE, "application/pdf");
        responseHeaders.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"audit_logs.pdf\"");
        return new ResponseEntity<>(pdfBytes, responseHeaders, HttpStatus.OK);
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        String escaped = value.replace("\"", "\"\"");
        if (escaped.contains(",") || escaped.contains("\n") || escaped.contains("\r") || escaped.contains("\"")) {
            return "\"" + escaped + "\"";
        }
        return escaped;
    }

    public static class AuditLogStats {
        private long totalLogs;
        private long successCount;
        private long failedCount;
        private long deniedCount;

        public long getTotalLogs() { return totalLogs; }
        public void setTotalLogs(long totalLogs) { this.totalLogs = totalLogs; }
        public long getSuccessCount() { return successCount; }
        public void setSuccessCount(long successCount) { this.successCount = successCount; }
        public long getFailedCount() { return failedCount; }
        public void setFailedCount(long failedCount) { this.failedCount = failedCount; }
        public long getDeniedCount() { return deniedCount; }
        public void setDeniedCount(long deniedCount) { this.deniedCount = deniedCount; }
    }
}