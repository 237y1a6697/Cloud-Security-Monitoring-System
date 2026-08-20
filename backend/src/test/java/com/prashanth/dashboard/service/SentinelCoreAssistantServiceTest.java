package com.prashanth.dashboard.service;

import com.prashanth.dashboard.dto.AssistantResult;
import com.prashanth.dashboard.dto.ChatMessageDTO;
import com.prashanth.dashboard.repository.AlertRepository;
import com.prashanth.dashboard.repository.AssetRepository;
import com.prashanth.dashboard.repository.VulnerabilityRepository;
import com.prashanth.dashboard.repository.IncidentRepository;
import com.prashanth.dashboard.repository.UserRepository;
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
    @Mock private UserRepository userRepository;
    @Mock private GrokService grokService;

    @InjectMocks private SentinelCoreAssistantService assistantService;

    @BeforeEach
    void setUp() {
        // Reset mocks before each test
    }

    // ── Main Knowledge Topics Tests ──────────────────────────────────────────

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
        when(alertRepository.count()).thenReturn(15L);

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

        List<String> suggestions = result.suggestions();
        assertTrue(suggestions.contains("Show asset status"));
        assertTrue(suggestions.contains("Create Asset"));
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
        assertTrue(suggestions.contains("Create Incident"));
        assertTrue(suggestions.contains("Manage Incidents"));
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
        assertTrue(suggestions.contains("Critical Vulnerabilities"));
        assertTrue(suggestions.contains("Remediation"));
    }

    @Test
    void testCompliance() {
        AssistantResult result = assistantService.chat("what does compliance mean?", null, "Compliance", "/compliance");
        assertNotNull(result);
        String answer = result.text();
        assertTrue(answer.contains("ISO/IEC 27001"));
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
        assertTrue(suggestions.contains("Dashboard Report"));
        assertTrue(suggestions.contains("Compliance Report"));
    }

    @Test
    void testSentinelCoreOverview() {
        AssistantResult result = assistantService.chat("what is sentinelcore secureops?", null, "Dashboard", "/");
        assertNotNull(result);
        String answer = result.text();
        assertTrue(answer.contains("SentinelCore SecureOps"));
        assertTrue(answer.contains("comprehensive security operations platform"));
    }

    // ── Conversational Intents Tests ─────────────────────────────────────────

    @Test
    void testGreetingsGreetingIntents() {
        String[] greetings = {"hi", "hello", "hey", "hii"};
        for (String msg : greetings) {
            AssistantResult result = assistantService.chat(msg, null, "Dashboard", "/");
            assertNotNull(result);
            assertTrue(result.text().contains("Hi! I'm the SentinelCore Internal Assistant"));
            assertTrue(result.suggestions().contains("Create Asset"));
            assertTrue(result.suggestions().contains("Compliance"));
        }
    }

    @Test
    void testWhatCanYouDoHelpIntents() {
        AssistantResult result = assistantService.chat("what can you do?", null, "Dashboard", "/");
        assertNotNull(result);
        assertTrue(result.text().contains("Dashboard"));
        assertTrue(result.text().contains("Compliance"));
        assertTrue(result.suggestions().contains("Dashboard"));
        assertTrue(result.suggestions().contains("Create Asset"));
    }

    // ── Scope Checks & Unknown Questions ─────────────────────────────────────

    @Test
    void testUnknownQuestionOutOfScope() {
        AssistantResult result = assistantService.chat("what is the weather today?", null, "Dashboard", "/");
        assertNotNull(result);
        assertEquals("OUT_OF_SCOPE", result.intent());
        assertTrue(result.text().contains("outside my SentinelCore scope"));
        assertTrue(result.suggestions().contains("Dashboard"));
        assertTrue(result.suggestions().contains("Compliance"));
    }

    @Test
    void testEmptyQuestion() {
        AssistantResult result = assistantService.chat("", null, "Dashboard", "/");
        assertNotNull(result);
        assertEquals("OUT_OF_SCOPE", result.intent());
    }

    // ── Database Metric Retrieval Success ────────────────────────────────────

    @Test
    void testDatabaseMetricRetrieval() {
        when(assetRepository.count()).thenReturn(150L);
        when(incidentRepository.countActiveIncidents()).thenReturn(37L);
        when(vulnerabilityRepository.count()).thenReturn(99L);
        when(vulnerabilityRepository.countCriticalVulnerabilities()).thenReturn(22L);
        when(alertRepository.count()).thenReturn(45L);
        when(userRepository.count()).thenReturn(12L);

        AssistantResult result = assistantService.chat("show live stats", null, "Dashboard", "/");
        assertNotNull(result);
        String answer = result.text();
        assertTrue(answer.contains("150"));
        assertTrue(answer.contains("37"));
        assertTrue(answer.contains("99"));
        assertTrue(answer.contains("22"));
        assertTrue(answer.contains("45"));
        assertTrue(answer.contains("12"));
    }

    @Test
    void testSingleMetricRetrieval() {
        when(assetRepository.count()).thenReturn(7L);
        AssistantResult result = assistantService.chat("what is the current asset count?", null, "Assets", "/assets");
        assertNotNull(result);
        assertEquals("The SentinelCore database currently contains 7 registered assets.", result.text());
    }

    // ── Database Metric Retrieval Failure (Missing / Exception) ──────────────

    @Test
    void testDatabaseMetricRetrievalFailure() {
        when(assetRepository.count()).thenThrow(new RuntimeException("DB Connection Timeout"));

        AssistantResult result = assistantService.chat("how many assets do we have?", null, "Assets", "/assets");
        assertNotNull(result);
        String answer = result.text();
        assertTrue(answer.contains("*(unavailable)*"));
    }

    // ── Health Endpoint / Configuration Verification ─────────────────────────

    @Test
    void testHealthVerification() {
        assertTrue(assistantService.isConfigured());
    }

    // ── Chat Memory / Context Follow-up ──────────────────────────────────────

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

    // ── Guided Workflow Navigation Tests ─────────────────────────────────────

    @Test
    void testGuidedAssetCreationFlow() {
        // Step 1: User triggers workflow
        AssistantResult res1 = assistantService.chat("how do I create an asset?", null, "Assets", "/assets");
        assertNotNull(res1);
        assertEquals("CREATE_ASSET", res1.intent());
        assertEquals(1, res1.step());
        assertEquals(4, res1.totalSteps());
        assertTrue(res1.text().contains("Step 1 of 4"));
        assertTrue(res1.suggestions().contains("Next step"));

        // Step 2: Next step input
        List<ChatMessageDTO> history = List.of(
            new ChatMessageDTO("user", "how do I create an asset?"),
            new ChatMessageDTO("assistant", res1.text())
        );
        AssistantResult res2 = assistantService.chat("next", history, "Assets", "/assets");
        assertNotNull(res2);
        assertEquals("CREATE_ASSET", res2.intent());
        assertEquals(2, res2.step());
        assertEquals(4, res2.totalSteps());
        assertTrue(res2.text().contains("Step 2 of 4"));

        // Step 3: Back navigation step input
        List<ChatMessageDTO> history2 = List.of(
            new ChatMessageDTO("user", "how do I create an asset?"),
            new ChatMessageDTO("assistant", res1.text()),
            new ChatMessageDTO("user", "next"),
            new ChatMessageDTO("assistant", res2.text())
        );
        AssistantResult res3 = assistantService.chat("back", history2, "Assets", "/assets");
        assertNotNull(res3);
        assertEquals("CREATE_ASSET", res3.intent());
        assertEquals(1, res3.step());
        assertTrue(res3.text().contains("Step 1 of 4"));

        // Step 4: Show all steps input
        AssistantResult resShowAll = assistantService.chat("show all steps", history2, "Assets", "/assets");
        assertNotNull(resShowAll);
        assertEquals("CREATE_ASSET", resShowAll.intent());
        assertTrue(resShowAll.text().contains("Access Assets"));
        assertTrue(resShowAll.text().contains("Core Info"));
        assertTrue(resShowAll.text().contains("Metrics & Location"));
        assertTrue(resShowAll.text().contains("Save"));

        // Step 5: Cancel workflow input
        AssistantResult resCancel = assistantService.chat("cancel", history2, "Assets", "/assets");
        assertNotNull(resCancel);
        assertEquals("CANCEL_WORKFLOW", resCancel.intent());
        assertTrue(resCancel.text().contains("cancelled"));
    }

    @Test
    void testFallbackToGrokWhenActive() {
        when(grokService.isConfigured()).thenReturn(true);
        when(grokService.chat(anyString(), any(), anyString())).thenReturn("Grok response text");

        AssistantResult result = assistantService.chat("some unrecognized question?", null, "Dashboard", "/");
        assertNotNull(result);
        assertEquals("GROK_RESPONSE", result.intent());
        assertEquals("Grok response text", result.text());
    }
}

