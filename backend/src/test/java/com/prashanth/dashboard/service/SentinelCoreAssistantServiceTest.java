package com.prashanth.dashboard.service;

import com.prashanth.dashboard.dto.ChatMessageDTO;
import com.prashanth.dashboard.repository.AlertRepository;
import com.prashanth.dashboard.repository.AssetRepository;
import com.prashanth.dashboard.repository.VulnerabilityRepository;
import com.prashanth.dashboard.repository.IncidentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SentinelCoreAssistantServiceTest {

    @Mock private AssetRepository assetRepository;
    @Mock private IncidentRepository incidentRepository;
    @Mock private VulnerabilityRepository vulnerabilityRepository;
    @Mock private AlertRepository alertRepository;

    @InjectMocks private SentinelCoreAssistantService assistantService;

    @BeforeEach
    void setUp() {
        // Reset mocks before each test
    }

    // 1-8. Main Knowledge Topics Tests

    @Test
    void testDashboardExplanationAndMetrics() {
        String answer = assistantService.chat("explain the security dashboard metrics", null, "Dashboard", "/");
        assertNotNull(answer);
        assertTrue(answer.contains("Assets"));
        assertTrue(answer.contains("Security Alerts"));
        assertTrue(answer.contains("Active Incidents"));
        assertTrue(answer.contains("Vulnerabilities"));
    }

    @Test
    void testDashboardOverview() {
        when(assetRepository.count()).thenReturn(10L);
        when(incidentRepository.countActiveIncidents()).thenReturn(5L);
        when(vulnerabilityRepository.count()).thenReturn(12L);
        when(alertRepository.findAll()).thenReturn(Collections.emptyList());

        String answer = assistantService.chat("tell me about the dashboard overview", null, "Dashboard", "/");
        assertNotNull(answer);
        assertTrue(answer.contains("10"));
        assertTrue(answer.contains("5"));
        assertTrue(answer.contains("12"));
    }

    @Test
    void testAssetManagement() {
        when(assetRepository.count()).thenReturn(25L);
        String answer = assistantService.chat("tell me about asset management", null, "Assets", "/assets");
        assertNotNull(answer);
        assertTrue(answer.contains("25"));
        assertTrue(answer.contains("Asset Management"));
        assertTrue(answer.contains("inventory"));
    }

    @Test
    void testIncidentResponse() {
        when(incidentRepository.countActiveIncidents()).thenReturn(4L);
        when(incidentRepository.countCriticalIncidents()).thenReturn(1L);

        String answer = assistantService.chat("tell me about incident response workflow", null, "Incidents", "/incidents");
        assertNotNull(answer);
        assertTrue(answer.contains("4"));
        assertTrue(answer.contains("1"));
        assertTrue(answer.contains("Incident Response"));
    }

    @Test
    void testVulnerabilityManagement() {
        when(vulnerabilityRepository.count()).thenReturn(30L);
        when(vulnerabilityRepository.countCriticalVulnerabilities()).thenReturn(8L);

        String answer = assistantService.chat("explain vulnerability management", null, "Vulnerabilities", "/vulnerabilities");
        assertNotNull(answer);
        assertTrue(answer.contains("30"));
        assertTrue(answer.contains("8"));
        assertTrue(answer.contains("Vulnerability Management"));
    }

    @Test
    void testCompliance() {
        String answer = assistantService.chat("what does compliance mean?", null, "Compliance", "/compliance");
        assertNotNull(answer);
        assertTrue(answer.contains("ISO 27001"));
        assertTrue(answer.contains("SOC 2"));
        assertTrue(answer.contains("Compliance"));
    }

    @Test
    void testReports() {
        String answer = assistantService.chat("explain available reports", null, "Reports", "/reports");
        assertNotNull(answer);
        assertTrue(answer.contains("Executive Summary"));
        assertTrue(answer.contains("Reports"));
        assertTrue(answer.contains("PDF"));
    }

    @Test
    void testSentinelCoreOverview() {
        String answer = assistantService.chat("what is sentinelcore secureops?", null, "Dashboard", "/");
        assertNotNull(answer);
        assertTrue(answer.contains("SentinelCore SecureOps"));
        assertTrue(answer.contains("comprehensive security operations platform"));
    }

    // 9. Unknown Questions

    @Test
    void testUnknownQuestion() {
        String answer = assistantService.chat("what is the weather helper?", null, "Dashboard", "/");
        assertNotNull(answer);
        assertTrue(answer.contains("SentinelCore Internal Assistant"));
        assertTrue(answer.contains("Dashboard, Assets, Incidents"));
    }

    // 10. Empty Question

    @Test
    void testEmptyQuestion() {
        String answer = assistantService.chat("", null, "Dashboard", "/");
        assertNotNull(answer);
        assertTrue(answer.contains("SentinelCore Internal Assistant"));
    }

    // 11. Database Metric Retrieval Success

    @Test
    void testDatabaseMetricRetrieval() {
        when(assetRepository.count()).thenReturn(150L);
        when(incidentRepository.countActiveIncidents()).thenReturn(37L);
        when(vulnerabilityRepository.count()).thenReturn(99L);
        when(vulnerabilityRepository.countCriticalVulnerabilities()).thenReturn(22L);
        when(alertRepository.findAll()).thenReturn(new ArrayList<>()); // 0 alerts

        String answer = assistantService.chat("show live stats", null, "Dashboard", "/");
        assertNotNull(answer);
        assertTrue(answer.contains("150"));
        assertTrue(answer.contains("37"));
        assertTrue(answer.contains("99"));
        assertTrue(answer.contains("22"));
    }

    // 12. Database Metric Retrieval Failure (Missing / Exception)

    @Test
    void testDatabaseMetricRetrievalFailure() {
        when(assetRepository.count()).thenThrow(new RuntimeException("DB Connection Timeout"));

        String answer = assistantService.chat("how many assets do we have?", null, "Assets", "/assets");
        assertNotNull(answer);
        assertTrue(answer.contains("*(unavailable)*"));
    }

    // 13. Health Endpoint / Configuration Readiness

    @Test
    void testHealthVerification() {
        assertTrue(assistantService.isConfigured());
    }

    // 14. Chat Memory / Context Follow-up

    @Test
    void testChatMemoryContextVulnerabilities() {
        List<ChatMessageDTO> history = List.of(
            new ChatMessageDTO("user", "what is vulnerability management?"),
            new ChatMessageDTO("assistant", "Vulnerability Management in SentinelCore tracks...")
        );

        when(vulnerabilityRepository.countCriticalVulnerabilities()).thenReturn(5L);
        when(vulnerabilityRepository.count()).thenReturn(20L);

        // User asks a follow-up containing "which ones are critical"
        String answer = assistantService.chat("which ones are critical?", history, "Dashboard", "/");
        assertNotNull(answer);
        assertTrue(answer.contains("Critical Vulnerabilities"));
        assertTrue(answer.contains("5"));
    }

    @Test
    void testChatMemoryContextIncidents() {
        List<ChatMessageDTO> history = List.of(
            new ChatMessageDTO("user", "explain incidents"),
            new ChatMessageDTO("assistant", "Incident Response in SentinelCore manages...")
        );

        // User asks a follow-up that gets boosted to incident lifecycle
        String answer = assistantService.chat("what is the lifecycle?", history, "Dashboard", "/");
        assertNotNull(answer);
        assertTrue(answer.contains("Incident Lifecycle"));
        assertTrue(answer.contains("Investigating"));
    }
}
