package com.prashanth.dashboard.service;

import com.prashanth.dashboard.dto.ChatMessageDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class GrokServiceTest {

    private GrokService grokService;
    private RestTemplate restTemplate;
    private MockRestServiceServer mockServer;
    private final String apiUrl = "https://api.x.ai/v1/responses";

    @BeforeEach
    void setUp() {
        grokService = new GrokService();
        restTemplate = (RestTemplate) ReflectionTestUtils.getField(grokService, "restTemplate");
        mockServer = MockRestServiceServer.createServer(restTemplate);
        
        ReflectionTestUtils.setField(grokService, "apiKey", "test-api-key");
        ReflectionTestUtils.setField(grokService, "model", "grok-4.5");
        ReflectionTestUtils.setField(grokService, "apiUrl", apiUrl);
    }

    @Test
    void testIsConfigured() {
        assertTrue(grokService.isConfigured());

        ReflectionTestUtils.setField(grokService, "apiKey", "");
        assertFalse(grokService.isConfigured());

        ReflectionTestUtils.setField(grokService, "apiKey", null);
        assertFalse(grokService.isConfigured());
    }

    @Test
    void testChatSuccess() {
        String responseJson = "{\"id\":\"res-123\",\"object\":\"response\",\"choices\":[{\"message\":{\"role\":\"assistant\",\"content\":\"This is Grok response\"},\"finish_reason\":\"stop\"}]}";

        mockServer.expect(requestTo(apiUrl))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(responseJson, MediaType.APPLICATION_JSON));

        String response = grokService.chat("Hello assistant", List.of());
        assertEquals("This is Grok response", response);
        mockServer.verify();
    }

    @Test
    void testChatEmptyMessage() {
        String response = grokService.chat("", List.of());
        assertEquals("Please enter a message.", response);
    }

    @Test
    void testChatMissingApiKey() {
        ReflectionTestUtils.setField(grokService, "apiKey", "");
        String response = grokService.chat("Hello", List.of());
        assertTrue(response.contains("not configured"));
    }

    @Test
    void testChatUnauthorized() {
        mockServer.expect(requestTo(apiUrl))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withStatus(HttpStatus.UNAUTHORIZED).body("{\"error\": \"Invalid API key\"}"));

        String response = grokService.chat("Hello", List.of());
        assertTrue(response.contains("invalid or has been revoked"));
        mockServer.verify();
    }

    @Test
    void testChatRateLimited() {
        mockServer.expect(requestTo(apiUrl))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));

        String response = grokService.chat("Hello", List.of());
        assertTrue(response.contains("rate limiting"));
    }

    @Test
    void testChatTimeout() {
        mockServer.expect(requestTo(apiUrl))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withException(new java.io.IOException("Timeout occurred")));

        String response = grokService.chat("Hello", List.of());
        assertTrue(response.contains("timed out"));
    }

    @Test
    void testChatServerError() {
        mockServer.expect(requestTo(apiUrl))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withServerError());

        String response = grokService.chat("Hello", List.of());
        assertTrue(response.contains("overloaded or failed"));
    }
}
