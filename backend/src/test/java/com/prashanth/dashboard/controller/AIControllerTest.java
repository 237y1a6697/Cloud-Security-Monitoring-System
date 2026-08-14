package com.prashanth.dashboard.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prashanth.dashboard.dto.AIChatRequest;
import com.prashanth.dashboard.service.AiChatService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Slice tests for AIController.
 *
 * AiChatService is mocked — no real Grok API calls are made.
 * A real Grok API key is never required.
 */
@WebMvcTest(AIController.class)
class AIControllerTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean AiChatService aiChatService;

    // ── /api/ai/health ────────────────────────────────────────────────────────

    @Test
    @WithMockUser
    void health_whenConfigured_returnsUp() throws Exception {
        when(aiChatService.isConfigured()).thenReturn(true);
        when(aiChatService.getModel()).thenReturn("grok-4.5");

        mvc.perform(get("/api/ai/health").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("READY"))
            .andExpect(jsonPath("$.provider").value("Grok"))
            .andExpect(jsonPath("$.model").value("grok-4.5"))
            .andExpect(jsonPath("$.configured").value(true));
    }

    @Test
    @WithMockUser
    void health_whenNotConfigured_returnsDown() throws Exception {
        when(aiChatService.isConfigured()).thenReturn(false);
        when(aiChatService.getModel()).thenReturn("grok-4.5");

        mvc.perform(get("/api/ai/health").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("NOT_CONFIGURED"))
            .andExpect(jsonPath("$.configured").value(false));
    }

    @Test
    void health_unauthenticated_redirectsToLogin() throws Exception {
        // OAuth2 security: unauthenticated requests are redirected to Google login (302)
        mvc.perform(get("/api/ai/health").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().is3xxRedirection());
    }

    // ── /api/ai/chat ──────────────────────────────────────────────────────────

    @Test
    @WithMockUser
    void chat_successfulGrokResponse_returnsTextAndTimestamp() throws Exception {
        when(aiChatService.isConfigured()).thenReturn(true);
        when(aiChatService.chat(anyString(), any(), anyString(), anyString()))
            .thenReturn("Yes, SentinelCore supports CSV export from the Reports module.");

        AIChatRequest req = new AIChatRequest("Can I export CSV?", List.of(), "Reports", "/reports");

        mvc.perform(post("/api/ai/chat")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.text").value(containsString("CSV export")))
            .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    @WithMockUser
    void chat_activeModuleIsSentToAiChatService() throws Exception {
        when(aiChatService.isConfigured()).thenReturn(true);
        when(aiChatService.chat(anyString(), any(), eq("Incidents"), anyString()))
            .thenReturn("Incidents module answer.");

        AIChatRequest req = new AIChatRequest("test question", null, "Incidents", "/incidents");

        mvc.perform(post("/api/ai/chat")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.text").value("Incidents module answer."));

        verify(aiChatService).chat(anyString(), any(), eq("Incidents"), anyString());
    }

    @Test
    @WithMockUser
    void chat_emptyMessage_returns400() throws Exception {
        AIChatRequest req = new AIChatRequest("", null, "Dashboard", "/");

        mvc.perform(post("/api/ai/chat")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @WithMockUser
    void chat_notConfigured_returnsFallbackWithNote() throws Exception {
        when(aiChatService.isConfigured()).thenReturn(false);

        AIChatRequest req = new AIChatRequest("Who are you?", null, "Dashboard", "/");

        mvc.perform(post("/api/ai/chat")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.text").value(containsString("not configured")));
    }

    @Test
    @WithMockUser
    void chat_grok401_returnsUserFriendlyMessage() throws Exception {
        when(aiChatService.isConfigured()).thenReturn(true);
        when(aiChatService.chat(anyString(), any(), anyString(), anyString()))
            .thenThrow(new AiChatService.AiProviderException(401, "Unauthorized"));

        AIChatRequest req = new AIChatRequest("test", null, "Dashboard", "/");

        mvc.perform(post("/api/ai/chat")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.text").value(containsString("authentication failed")));
    }

    @Test
    @WithMockUser
    void chat_grok400_returnsConfigurationMessage() throws Exception {
        assertProviderMessage(400, "rejected");
    }

    @Test
    @WithMockUser
    void chat_grok403_returnsAuthenticationMessage() throws Exception {
        assertProviderMessage(403, "authentication failed");
    }

    @Test
    @WithMockUser
    void chat_grok404_returnsModelConfigurationMessage() throws Exception {
        assertProviderMessage(404, "GROK_MODEL");
    }

    @Test
    @WithMockUser
    void chat_grok429_returnsRateLimitMessage() throws Exception {
        when(aiChatService.isConfigured()).thenReturn(true);
        when(aiChatService.chat(anyString(), any(), anyString(), anyString()))
            .thenThrow(new AiChatService.AiProviderException(429, "Too Many Requests"));

        AIChatRequest req = new AIChatRequest("test", null, "Dashboard", "/");

        mvc.perform(post("/api/ai/chat")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.text").value(containsString("rate limit")));
    }

    @Test
    @WithMockUser
    void chat_grok500_returnsServiceErrorMessage() throws Exception {
        when(aiChatService.isConfigured()).thenReturn(true);
        when(aiChatService.chat(anyString(), any(), anyString(), anyString()))
            .thenThrow(new AiChatService.AiProviderException(500, "Internal Server Error"));

        AIChatRequest req = new AIChatRequest("test", null, "Dashboard", "/");

        mvc.perform(post("/api/ai/chat")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.text").value(containsString("temporarily unavailable")));
    }

    @Test
    @WithMockUser
    void chat_malformedProviderResponse_returnsSafeError() throws Exception {
        assertProviderMessage(502, "temporarily unavailable");
    }

    @Test
    @WithMockUser
    void chat_timeout_returnsTimeoutMessage() throws Exception {
        when(aiChatService.isConfigured()).thenReturn(true);
        when(aiChatService.chat(anyString(), any(), anyString(), anyString()))
            .thenThrow(new AiChatService.AiProviderException(408, "Request Timeout"));

        AIChatRequest req = new AIChatRequest("test", null, "Dashboard", "/");

        mvc.perform(post("/api/ai/chat")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.text").value(containsString("Unable to reach")));
    }

    @Test
    @WithMockUser
    void chat_responseFormatMatchesFrontendContract() throws Exception {
        when(aiChatService.isConfigured()).thenReturn(true);
        when(aiChatService.chat(anyString(), any(), anyString(), anyString()))
            .thenReturn("Grok answer.");

        AIChatRequest req = new AIChatRequest("Question?", null, "Dashboard", "/");

        // Frontend expects { text: string, timestamp: string } — nothing else
        mvc.perform(post("/api/ai/chat")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.text").isString())
            .andExpect(jsonPath("$.timestamp").isString())
            // No API key or internal details leaked
            .andExpect(jsonPath("$.apiKey").doesNotExist())
            .andExpect(jsonPath("$.key").doesNotExist());
    }

    @Test
    void chat_unauthenticated_redirectsToLogin() throws Exception {
        // OAuth2 security: unauthenticated requests are redirected to Google login (302)
        AIChatRequest req = new AIChatRequest("test", null, "Dashboard", "/");

        mvc.perform(post("/api/ai/chat")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().is3xxRedirection());
    }

    private void assertProviderMessage(int providerStatus, String expectedText) throws Exception {
        when(aiChatService.isConfigured()).thenReturn(true);
        when(aiChatService.chat(anyString(), any(), anyString(), anyString()))
            .thenThrow(new AiChatService.AiProviderException(providerStatus, "Provider failure"));

        AIChatRequest req = new AIChatRequest("test", null, "Dashboard", "/");
        mvc.perform(post("/api/ai/chat")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.text").value(containsString(expectedText)));
    }
}
