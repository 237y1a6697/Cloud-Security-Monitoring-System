package com.prashanth.dashboard.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prashanth.dashboard.dto.AIChatRequest;
import com.prashanth.dashboard.service.SentinelCoreAssistantService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Slice tests for AIController under the internal assistant architecture.
 */
@WebMvcTest(AIController.class)
class AIControllerTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean SentinelCoreAssistantService assistantService;

    // ── /api/ai/health ────────────────────────────────────────────────────────

    @Test
    @WithMockUser
    void health_endpointConfigured_returnsReadyAndInternalProvider() throws Exception {
        mvc.perform(get("/api/ai/health").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("READY"))
            .andExpect(jsonPath("$.provider").value("SentinelCore Internal Assistant"))
            .andExpect(jsonPath("$.configured").value(true));
    }

    @Test
    void health_unauthenticated_redirectsToLogin() throws Exception {
        mvc.perform(get("/api/ai/health").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().is3xxRedirection());
    }

    // ── /api/ai/chat ──────────────────────────────────────────────────────────

    @Test
    @WithMockUser
    void chat_successfulResponse_returnsTextAndTimestamp() throws Exception {
        when(assistantService.chat(anyString(), any(), anyString(), anyString()))
            .thenReturn("Internal response about CSV export.");

        AIChatRequest req = new AIChatRequest("Can I export CSV?", List.of(), "Reports", "/reports");

        mvc.perform(post("/api/ai/chat")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.text").value("Internal response about CSV export."))
            .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    @WithMockUser
    void chat_activeModuleIsSentToAssistantService() throws Exception {
        when(assistantService.chat(anyString(), any(), eq("Incidents"), eq("/incidents")))
            .thenReturn("Incidents response.");

        AIChatRequest req = new AIChatRequest("How to create an incident?", null, "Incidents", "/incidents");

        mvc.perform(post("/api/ai/chat")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.text").value("Incidents response."));

        verify(assistantService).chat(anyString(), any(), eq("Incidents"), eq("/incidents"));
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
    void chat_serviceThrowsException_returnsFriendlyError() throws Exception {
        when(assistantService.chat(anyString(), any(), anyString(), anyString()))
            .thenThrow(new RuntimeException("Simulated service failure"));

        AIChatRequest req = new AIChatRequest("Tell me about compliance", null, "Compliance", "/compliance");

        mvc.perform(post("/api/ai/chat")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.text").value("Sorry, I couldn't process that request. Please try again."));
    }

    @Test
    @WithMockUser
    void chat_responseFormatMatchesFrontendContract() throws Exception {
        when(assistantService.chat(anyString(), any(), anyString(), anyString()))
            .thenReturn("Mock answer text.");

        AIChatRequest req = new AIChatRequest("Question?", null, "Dashboard", "/");

        // Frontend expects ONLY text and timestamp in the JSON response
        mvc.perform(post("/api/ai/chat")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.text").isString())
            .andExpect(jsonPath("$.timestamp").isString())
            // No API key or internal secrets leaked
            .andExpect(jsonPath("$.apiKey").doesNotExist())
            .andExpect(jsonPath("$.key").doesNotExist());
    }

    @Test
    void chat_unauthenticated_redirectsToLogin() throws Exception {
        AIChatRequest req = new AIChatRequest("test", null, "Dashboard", "/");

        mvc.perform(post("/api/ai/chat")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().is3xxRedirection());
    }
}
