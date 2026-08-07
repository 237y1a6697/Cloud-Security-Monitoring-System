package com.prashanth.dashboard.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.test.context.support.WithMockUser;

import com.prashanth.dashboard.model.AuditLog;
import com.prashanth.dashboard.repository.AuditLogRepository;

import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;

@SpringBootTest
public class AuditLogControllerTest {

    @Autowired
    private AuditLogController auditLogController;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Test
    @WithMockUser(username = "auditor", authorities = {"AUDIT_VIEW"})
    public void testGetAllAuditLogsPaginationAndFilters() {
        // Create matching logs directly in repository
        AuditLog successLog = new AuditLog();
        successLog.setUsername("security_officer_success");
        successLog.setRole("ROLE_ADMIN");
        successLog.setIpAddress("10.0.0.99");
        successLog.setDeviceBrowser("Chrome/109");
        successLog.setAction("AUDIT_TEST_ACTION_SUCCESS");
        successLog.setResult("SUCCESS");
        successLog.setTimestamp(LocalDateTime.of(2026, 8, 1, 10, 0));
        successLog.setEvidence("proof_success.json");
        auditLogRepository.save(successLog);

        AuditLog deniedLog = new AuditLog();
        deniedLog.setUsername("security_officer_denied");
        deniedLog.setRole("ROLE_VIEWER");
        deniedLog.setIpAddress("10.0.0.101");
        deniedLog.setDeviceBrowser("Firefox/115");
        deniedLog.setAction("AUDIT_TEST_ACTION_DENIED");
        deniedLog.setResult("DENIED");
        deniedLog.setTimestamp(LocalDateTime.of(2026, 8, 2, 11, 0));
        deniedLog.setEvidence("proof_denied.json");
        auditLogRepository.save(deniedLog);

        // Fetch all
        ResponseEntity<Page<AuditLog>> allRes = auditLogController.getAllAuditLogs(0, 20, "timestamp", "desc", null, null, null, null);
        assertEquals(HttpStatus.OK, allRes.getStatusCode());
        Page<AuditLog> allPage = allRes.getBody();
        assertNotNull(allPage);
        assertTrue(allPage.getTotalElements() >= 2);

        // Filter by search term
        ResponseEntity<Page<AuditLog>> searchRes = auditLogController.getAllAuditLogs(0, 20, "timestamp", "desc", "security_officer_success", null, null, null);
        Page<AuditLog> searchPage = searchRes.getBody();
        assertNotNull(searchPage);
        assertTrue(searchPage.getContent().stream().anyMatch(l -> "security_officer_success".equalsIgnoreCase(l.getUsername())));
        assertFalse(searchPage.getContent().stream().anyMatch(l -> "security_officer_denied".equalsIgnoreCase(l.getUsername())));

        // Filter by outcome
        ResponseEntity<Page<AuditLog>> outcomeRes = auditLogController.getAllAuditLogs(0, 20, "timestamp", "desc", null, "DENIED", null, null);
        Page<AuditLog> outcomePage = outcomeRes.getBody();
        assertNotNull(outcomePage);
        assertTrue(outcomePage.getContent().stream().allMatch(l -> "DENIED".equals(l.getResult())));

        // Filter by date range
        ResponseEntity<Page<AuditLog>> dateRes = auditLogController.getAllAuditLogs(0, 20, "timestamp", "desc", null, null, "2026-08-01", "2026-08-01");
        Page<AuditLog> datePage = dateRes.getBody();
        assertNotNull(datePage);
        assertTrue(datePage.getContent().stream().allMatch(l -> l.getTimestamp().toLocalDate().toString().equals("2026-08-01")));
    }

    @Test
    @WithMockUser(username = "auditor", authorities = {"AUDIT_VIEW"})
    public void testGetStats() {
        ResponseEntity<AuditLogController.AuditLogStats> statsRes = auditLogController.getAuditLogStats();
        assertEquals(HttpStatus.OK, statsRes.getStatusCode());
        AuditLogController.AuditLogStats stats = statsRes.getBody();
        assertNotNull(stats);
        assertTrue(stats.getTotalLogs() > 0);
    }

    @Test
    @WithMockUser(username = "auditor", authorities = {"AUDIT_VIEW"})
    public void testAttachEvidence() {
        AuditLog targetLog = new AuditLog();
        targetLog.setUsername("target_evidence_user");
        targetLog.setAction("EVIDENCE_BINDING_TEST");
        targetLog.setResult("SUCCESS");
        targetLog.setTimestamp(LocalDateTime.now());
        // Start empty or with single evidence
        targetLog.setEvidence("first_evidence.xml");
        targetLog = auditLogRepository.save(targetLog);

        ResponseEntity<AuditLog> attachRes = auditLogController.attachEvidence(targetLog.getId(), "second_evidence.json");
        assertEquals(HttpStatus.OK, attachRes.getStatusCode());
        AuditLog updatedLog = attachRes.getBody();
        assertNotNull(updatedLog);
        assertEquals("first_evidence.xml,second_evidence.json", updatedLog.getEvidence());

        // Verify loaded from DB
        AuditLog reloaded = auditLogRepository.findById(targetLog.getId()).orElse(null);
        assertNotNull(reloaded);
        assertEquals("first_evidence.xml,second_evidence.json", reloaded.getEvidence());
    }
}
