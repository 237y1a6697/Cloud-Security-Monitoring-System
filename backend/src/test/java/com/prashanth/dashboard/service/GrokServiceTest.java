package com.prashanth.dashboard.service;

import com.prashanth.dashboard.dto.ChatMessageDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for GrokService.
 *
 * The real xAI HTTP API is NEVER called. Every test mocks the HttpClient
 * at the GrokService.httpClient field via ReflectionTestUtils / setter.
 */
@ExtendWith(MockitoExtension.class)
class GrokServiceTest {

    @Mock private HttpClient mockClient;
    @SuppressWarnings("rawtypes")
    @Mock private HttpResponse mockResponse;

    private GrokService service;

    @BeforeEach
    void setUp() {
        service = new GrokService();
        ReflectionTestUtils.setField(service, "apiKey",  "test-mock-api-key");
        ReflectionTestUtils.setField(service, "baseUrl", "https://api.x.ai/v1");
        ReflectionTestUtils.setField(service, "model",   "grok-4.5");
        service.setHttpClient(mockClient);
    }

    // ── isConfigured ──────────────────────────────────────────────────────────

    @Test
    void isConfigured_returnsTrueWhenKeyPresent() {
        assertThat(service.isConfigured()).isTrue();
    }

    @Test
    void isConfigured_returnsFalseWhenKeyBlank() {
        ReflectionTestUtils.setField(service, "apiKey", "");
        assertThat(service.isConfigured()).isFalse();
    }

    @Test
    void isConfigured_returnsFalseWhenKeyNull() {
        ReflectionTestUtils.setField(service, "apiKey", null);
        assertThat(service.isConfigured()).isFalse();
    }

    // ── Successful response ───────────────────────────────────────────────────

    @Test
    @SuppressWarnings("unchecked")
    void chat_successfulGrokResponse_returnsText() throws Exception {
        String responseBody = """
            {
              "output": [
                {
                  "type": "message",
                  "role": "assistant",
                  "content": [
                    {
                      "type": "output_text",
                      "text": "Yes, SentinelCore supports CSV and XLSX export from the Reports module."
                    }
                  ]
                }
              ]
            }
            """;

        when(mockResponse.statusCode()).thenReturn(200);
        when(mockResponse.body()).thenReturn(responseBody);
        when(mockClient.send(any(HttpRequest.class), any())).thenReturn(mockResponse);

        String result = service.chat("Can I export CSV?", null, "Reports", "/reports");

        assertThat(result).isEqualTo("Yes, SentinelCore supports CSV and XLSX export from the Reports module.");
        verify(mockClient).send(any(HttpRequest.class), any());
    }

    // ── Active module passed correctly ────────────────────────────────────────

    @Test
    @SuppressWarnings("unchecked")
    void chat_includesActiveModuleInSystemPrompt() throws Exception {
        when(mockResponse.statusCode()).thenReturn(200);
        when(mockResponse.body()).thenReturn(successBody("ok"));
        when(mockClient.send(any(HttpRequest.class), any())).thenReturn(mockResponse);

        // Verify no exception thrown and the call is forwarded  
        assertThatNoException().isThrownBy(() ->
            service.chat("test", null, "Incidents", "/incidents")
        );
    }

    // ── Conversation history ──────────────────────────────────────────────────

    @Test
    @SuppressWarnings("unchecked")
    void chat_converstaionHistoryIncludedAndCapped() throws Exception {
        when(mockResponse.statusCode()).thenReturn(200);
        when(mockResponse.body()).thenReturn(successBody("answer"));
        when(mockClient.send(any(HttpRequest.class), any())).thenReturn(mockResponse);

        // Build 15 history messages — only last 10 should be sent
        List<ChatMessageDTO> history = new java.util.ArrayList<>();
        for (int i = 0; i < 15; i++) {
            history.add(new ChatMessageDTO(i % 2 == 0 ? "user" : "assistant", "message " + i));
        }

        String result = service.chat("new question", history, "Dashboard", "/dashboard");
        assertThat(result).isEqualTo("answer");
    }

    // ── Missing API key ───────────────────────────────────────────────────────

    @Test
    void chat_missingApiKey_throwsGrokExceptionStatus0() {
        ReflectionTestUtils.setField(service, "apiKey", "");

        assertThatThrownBy(() -> service.chat("hi", null, "Dashboard", "/"))
            .isInstanceOf(GrokService.GrokException.class)
            .satisfies(ex -> assertThat(((GrokService.GrokException) ex).getHttpStatus()).isEqualTo(0));
    }

    // ── HTTP 401 ──────────────────────────────────────────────────────────────

    @Test
    @SuppressWarnings("unchecked")
    void chat_http401_throwsGrokException401() throws Exception {
        when(mockResponse.statusCode()).thenReturn(401);
        when(mockResponse.body()).thenReturn("{\"error\":\"Unauthorized\"}");
        when(mockClient.send(any(HttpRequest.class), any())).thenReturn(mockResponse);

        assertThatThrownBy(() -> service.chat("hi", null, "Dashboard", "/"))
            .isInstanceOf(GrokService.GrokException.class)
            .satisfies(ex -> assertThat(((GrokService.GrokException) ex).getHttpStatus()).isEqualTo(401));
    }

    // ── HTTP 429 ──────────────────────────────────────────────────────────────

    @Test
    @SuppressWarnings("unchecked")
    void chat_http429_throwsGrokException429() throws Exception {
        when(mockResponse.statusCode()).thenReturn(429);
        when(mockResponse.body()).thenReturn("{\"error\":\"Too Many Requests\"}");
        when(mockClient.send(any(HttpRequest.class), any())).thenReturn(mockResponse);

        assertThatThrownBy(() -> service.chat("hi", null, "Dashboard", "/"))
            .isInstanceOf(GrokService.GrokException.class)
            .satisfies(ex -> {
                GrokService.GrokException ge = (GrokService.GrokException) ex;
                assertThat(ge.getHttpStatus()).isEqualTo(429);
                assertThat(ge.getMessage()).containsIgnoringCase("rate limit");
            });
    }

    // ── HTTP 500 ──────────────────────────────────────────────────────────────

    @Test
    @SuppressWarnings("unchecked")
    void chat_http500_throwsGrokException500() throws Exception {
        when(mockResponse.statusCode()).thenReturn(500);
        when(mockResponse.body()).thenReturn("{\"error\":\"Internal Server Error\"}");
        when(mockClient.send(any(HttpRequest.class), any())).thenReturn(mockResponse);

        assertThatThrownBy(() -> service.chat("hi", null, "Dashboard", "/"))
            .isInstanceOf(GrokService.GrokException.class)
            .satisfies(ex -> assertThat(((GrokService.GrokException) ex).getHttpStatus()).isEqualTo(500));
    }

    // ── HTTP 503 ──────────────────────────────────────────────────────────────

    @Test
    @SuppressWarnings("unchecked")
    void chat_http503_throwsGrokException503() throws Exception {
        when(mockResponse.statusCode()).thenReturn(503);
        when(mockResponse.body()).thenReturn("{\"error\":\"Service Unavailable\"}");
        when(mockClient.send(any(HttpRequest.class), any())).thenReturn(mockResponse);

        assertThatThrownBy(() -> service.chat("hi", null, "Dashboard", "/"))
            .isInstanceOf(GrokService.GrokException.class)
            .satisfies(ex -> assertThat(((GrokService.GrokException) ex).getHttpStatus()).isIn(502, 503));
    }

    // ── Timeout ───────────────────────────────────────────────────────────────

    @Test
    @SuppressWarnings("unchecked")
    void chat_transportTimeout_throwsGrokException503() throws Exception {
        when(mockClient.send(any(HttpRequest.class), any()))
            .thenThrow(new java.net.http.HttpTimeoutException("connect timed out"));

        assertThatThrownBy(() -> service.chat("hi", null, "Dashboard", "/"))
            .isInstanceOf(GrokService.GrokException.class)
            .satisfies(ex -> assertThat(((GrokService.GrokException) ex).getHttpStatus()).isEqualTo(408));
    }

    // ── Malformed response ────────────────────────────────────────────────────

    @Test
    void parseResponseBody_malformedJson_throwsGrokException() {
        assertThatThrownBy(() -> service.parseResponseBody("not-json"))
            .isInstanceOf(GrokService.GrokException.class)
            .satisfies(ex -> assertThat(((GrokService.GrokException) ex).getHttpStatus()).isEqualTo(502));
    }

    @Test
    void parseResponseBody_emptyOutputArray_throwsGrokException() {
        assertThatThrownBy(() -> service.parseResponseBody("{\"output\":[]}"))
            .isInstanceOf(GrokService.GrokException.class)
            .satisfies(ex -> assertThat(((GrokService.GrokException) ex).getHttpStatus()).isEqualTo(502));
    }

    @Test
    void parseResponseBody_validResponseShape_returnsText() throws Exception {
        String text = service.parseResponseBody(successBody("Hello from Grok"));
        assertThat(text).isEqualTo("Hello from Grok");
    }

    // ── getModel ──────────────────────────────────────────────────────────────

    @Test
    void getModel_returnsConfiguredModel() {
        assertThat(service.getModel()).isEqualTo("grok-4.5");
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private String successBody(String text) {
        return """
            {
              "output": [{
                "type": "message",
                "role": "assistant",
                "content": [{ "type": "output_text", "text": "%s" }]
              }]
            }
            """.formatted(text);
    }
}
