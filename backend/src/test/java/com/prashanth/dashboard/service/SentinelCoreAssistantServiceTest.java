package com.prashanth.dashboard.service;

import com.prashanth.dashboard.dto.AssistantResult;
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
        AssistantResult result = assistantService.chat("explain the security dashboard metrics", null, "Dashboard", "/");
        assertNotNull(result);
        String answer = result.text();
        assertTrue(answer.contains("Assets"));
        assertTrue(answer.contains("Security Alerts"));
        assertTrue(answer.contains("Active Incidents"));
        assertTrue(answer.contains("Vulnerabilities"));

        // Match context suggestions
        List<String> suggestions = result.suggestions();
        assertFalse(suggestions.isEmpty());
        assertTrue(suggestions.contains("Show security overview"));
        assertTrue(suggestions.contains("Explain compliance score"));
    }

    @Test
    void testDashboardOverview() {
        when(assetRepository.count()).thenReturn(10L);
        when(incidentRepository.countActiveIncidents()).thenReturn(5L);
        when(vulnerabilityRepository.count()).thenReturn(12L);
        when(alertRepository.findAll()).thenReturn(Collections.emptyList());

        AssistantResult result = assistantService.chat("tell me about the dashboard overview", null, "Dashboard", "/");
        assertNotNull(result);
        String answer = result.text();
        assertTrue(answer.contains("10"));
        assertTrue(answer.contains("5"));
        assertTrue(answer.contains("12"));

        List<String> suggestions = result.suggestions();
        assertFalse(suggestions.isEmpty());
        assertTrue(suggestions.contains("Explain Dashboard metrics"));
        assertTrue(suggestions.contains("Explain compliance score"));
    }

    @Test
    void testAssetManagement() {
        when(assetRepository.count()).thenReturn(25L);
        AssistantResult result = assistantService.chat("tell me about asset management", null, "Assets", "/assets");
        assertNotNull(result);
        String answer = result.text();
        assertTrue(answer.contains("25"));
        assertTrue(answer.contains("Asset Management"));
        assertTrue(answer.contains("inventory"));

        List<String> suggestions = result.suggestions();
        assertTrue(suggestions.contains("Show asset status"));
        assertTrue(suggestions.contains("How are assets categorized?"));
    }

    @Test
    void testIncidentResponse() {
        when(incidentRepository.countActiveIncidents()).thenReturn(4L);
        when(incidentRepository.countCriticalIncidents()).thenReturn(1L);

        AssistantResult result = assistantService.chat("tell me about incident response workflow", null, "Incidents", "/incidents");
        assertNotNull(result);
        String answer = result.text();
        assertTrue(answer.contains("4"));
        assertTrue(answer.contains("1"));
        assertTrue(answer.contains("Incident Response"));

        List<String> suggestions = result.suggestions();
        assertTrue(suggestions.contains("Explain incident lifecycle"));
        assertTrue(suggestions.contains("Explain incident severity"));
    }

    @Test
    void testVulnerabilityManagement() {
        when(vulnerabilityRepository.count()).thenReturn(30L);
        when(vulnerabilityRepository.countCriticalVulnerabilities()).thenReturn(8L);

        AssistantResult result = assistantService.chat("explain vulnerability management", null, "Vulnerabilities", "/vulnerabilities");
        assertNotNull(result);
        String answer = result.text();
        assertTrue(answer.contains("30"));
        assertTrue(answer.contains("8"));
        assertTrue(answer.contains("Vulnerability Management"));

        List<String> suggestions = result.suggestions();
        assertTrue(suggestions.contains("Explain critical vulnerabilities"));
        assertTrue(suggestions.contains("Explain remediation"));
    }

    @Test
    void testCompliance() {
        AssistantResult result = assistantService.chat("what does compliance mean?", null, "Compliance", "/compliance");
        assertNotNull(result);
        String answer = result.text();
        assertTrue(answer.contains("ISO 27001"));
        assertTrue(answer.contains("SOC 2"));
        assertTrue(answer.contains("Compliance"));

        List<String> suggestions = result.suggestions();
        assertTrue(suggestions.contains("Explain compliance score"));
        assertTrue(suggestions.contains("Generate compliance report"));
    }

    @Test
    void testReports() {
        AssistantResult result = assistantService.chat("explain available reports", null, "Reports", "/reports");
        assertNotNull(result);
        String answer = result.text();
        assertTrue(answer.contains("Executive Summary"));
        assertTrue(answer.contains("Reports"));
        assertTrue(answer.contains("PDF"));

        List<String> suggestions = result.suggestions();
        assertTrue(suggestions.contains("Available reports"));
        assertTrue(suggestions.contains("Dashboard report"));
    }

    @Test
    void testSentinelCoreOverview() {
        AssistantResult result = assistantService.chat("what is sentinelcore secureops?", null, "Dashboard", "/");
        assertNotNull(result);
        String answer = result.text();
        assertTrue(answer.contains("SentinelCore SecureOps"));
        assertTrue(answer.contains("comprehensive security operations platform"));

        List<String> suggestions = result.suggestions();
        assertTrue(suggestions.contains("Explain Dashboard"));
        assertTrue(suggestions.contains("Explain Assets"));
    }

    // Conversational Intents Tests

    @Test
    void testGreetingsGreetingIntents() {
        String[] greetings = {"hi", "hello", "hey", "hii"};
        for (String msg : greetings) {
            AssistantResult result = assistantService.chat(msg, null, "Dashboard", "/");
            assertNotNull(result);
            assertTrue(result.text().contains("Hi! I'm the SentinelCore Internal Assistant"));
            assertTrue(result.suggestions().contains("Explain Dashboard metrics"));
            assertTrue(result.suggestions().contains("Explain compliance"));
        }
    }

    @Test
    void testWhatCanYouDoHelpIntents() {
        AssistantResult result = assistantService.chat("what can you do?", null, "Dashboard", "/");
        assertNotNull(result);
        assertTrue(result.text().contains("Dashboard metrics"));
        assertTrue(result.text().contains("Compliance"));
        assertTrue(result.suggestions().contains("Explain Dashboard"));
        assertTrue(result.suggestions().contains("Explain Assets"));
    }

    @Test
    void testThanksIntent() {
        AssistantResult result = assistantService.chat("thanks so much", null, "Dashboard", "/");
        assertNotNull(result);
        assertTrue(result.text().contains("welcome"));
        assertTrue(result.suggestions().contains("Explain Dashboard"));
    }

    @Test
    void testGoodbyeIntent() {
        AssistantResult result = assistantService.chat("bye bye", null, "Dashboard", "/");
        assertNotNull(result);
        assertTrue(result.text().contains("Goodbye"));
        assertTrue(result.suggestions().contains("Explain Dashboard"));
    }

    // 9. Unknown Questions

    @Test
    void testUnknownQuestion() {
        AssistantResult result = assistantService.chat("what is the weather helper?", null, "Dashboard", "/");
        assertNotNull(result);
        assertTrue(result.text().contains("currently focused on SentinelCore"));
        assertTrue(result.suggestions().contains("Explain Dashboard"));
        assertTrue(result.suggestions().contains("Explain Compliance"));
    }

    // 10. Empty Question

    @Test
    void testEmptyQuestion() {
        AssistantResult result = assistantService.chat("", null, "Dashboard", "/");
        assertNotNull(result);
        assertTrue(result.text().contains("currently focused on SentinelCore"));
        assertTrue(result.suggestions().contains("Explain Dashboard"));
    }

    // 11. Database Metric Retrieval Success

    @Test
    void testDatabaseMetricRetrieval() {
        when(assetRepository.count()).thenReturn(150L);
        when(incidentRepository.countActiveIncidents()).thenReturn(37L);
        when(vulnerabilityRepository.count()).thenReturn(99L);
        when(vulnerabilityRepository.countCriticalVulnerabilities()).thenReturn(22L);
        when(alertRepository.findAll()).thenReturn(new ArrayList<>()); // 0 alerts

        AssistantResult result = assistantService.chat("show live stats", null, "Dashboard", "/");
        assertNotNull(result);
        String answer = result.text();
        assertTrue(answer.contains("150"));
        assertTrue(answer.contains("37"));
        assertTrue(answer.contains("99"));
        assertTrue(answer.contains("22"));
    }

    // 12. Database Metric Retrieval Failure (Missing / Exception)

    @Test
    void testDatabaseMetricRetrievalFailure() {
        when(assetRepository.count()).thenThrow(new RuntimeException("DB Connection Timeout"));

        AssistantResult result = assistantService.chat("how many assets do we have?", null, "Assets", "/assets");
        assertNotNull(result);
        String answer = result.text();
        assertTrue(answer.contains("*(unavailable)*"));
    }

    // 13. Health Endpoint / Configuration Verification

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
        AssistantResult result = assistantService.chat("which ones are critical?", history, "Dashboard", "/");
        assertNotNull(result);
        String answer = result.text();
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
        AssistantResult result = assistantService.chat("what is the lifecycle?", history, "Dashboard", "/");
        assertNotNull(result);
        String answer = result.text();
        assertTrue(answer.contains("Incident Lifecycle"));
        assertTrue(answer.contains("Investigating"));
    }
}
