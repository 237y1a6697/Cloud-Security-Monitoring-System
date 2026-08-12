package com.prashanth.dashboard.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.*;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class EmailServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private EmailService emailService;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        emailService.setRestTemplate(restTemplate);
        // Inject properties via ReflectionTestUtils
        ReflectionTestUtils.setField(emailService, "brevoApiKey", "test-api-key");
        ReflectionTestUtils.setField(emailService, "brevoSenderEmail", "sender@sentinelcore.com");
        ReflectionTestUtils.setField(emailService, "brevoSenderName", "SentinelCore");
    }

    @Test
    public void testSendHtmlEmailWithAttachment_Success() {
        // Mock successful response
        ResponseEntity<String> response = new ResponseEntity<>("{\"messageId\":\"12345\"}", HttpStatus.CREATED);
        when(restTemplate.exchange(
                eq("https://api.brevo.com/v3/smtp/email"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(response);

        byte[] attachmentData = "dummy pdf data".getBytes(StandardCharsets.UTF_8);
        String expectedBase64 = Base64.getEncoder().encodeToString(attachmentData);

        emailService.sendHtmlEmailWithAttachment(
                "recipient@example.com",
                "Weekly Security Audit",
                "<h3>Alert Details</h3>",
                "weekly_report.pdf",
                attachmentData
        );

        // Capture request details
        ArgumentCaptor<HttpEntity> requestCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(
                eq("https://api.brevo.com/v3/smtp/email"),
                eq(HttpMethod.POST),
                requestCaptor.capture(),
                eq(String.class)
        );

        HttpEntity<Map<String, Object>> entity = requestCaptor.getValue();
        assertNotNull(entity);

        // Verify headers
        HttpHeaders headers = entity.getHeaders();
        assertEquals("test-api-key", headers.getFirst("api-key"));
        assertEquals(MediaType.APPLICATION_JSON, headers.getContentType());

        // Verify body structure
        Map<String, Object> body = entity.getBody();
        assertNotNull(body);

        Map<String, String> sender = (Map<String, String>) body.get("sender");
        assertEquals("SentinelCore", sender.get("name"));
        assertEquals("sender@sentinelcore.com", sender.get("email"));

        List<Map<String, String>> toList = (List<Map<String, String>>) body.get("to");
        assertEquals(1, toList.size());
        assertEquals("recipient@example.com", toList.get(0).get("email"));

        assertEquals("Weekly Security Audit", body.get("subject"));
        assertEquals("<h3>Alert Details</h3>", body.get("htmlContent"));

        List<Map<String, String>> attachmentList = (List<Map<String, String>>) body.get("attachment");
        assertNotNull(attachmentList);
        assertEquals(1, attachmentList.size());
        assertEquals("weekly_report.pdf", attachmentList.get(0).get("name"));
        assertEquals(expectedBase64, attachmentList.get(0).get("content"));
    }

    @Test
    public void testSendHtmlEmail_MissingApiKey_ThrowsException() {
        ReflectionTestUtils.setField(emailService, "brevoApiKey", "");

        assertThrows(IllegalStateException.class, () -> {
            emailService.sendHtmlEmailWithAttachment(
                    "recipient@example.com",
                    "Subject",
                    "<p>Body</p>",
                    null,
                    null
            );
        });
    }

    @Test
    public void testSendHtmlEmail_MissingSenderEmail_ThrowsException() {
        ReflectionTestUtils.setField(emailService, "brevoSenderEmail", " ");

        assertThrows(IllegalStateException.class, () -> {
            emailService.sendHtmlEmailWithAttachment(
                    "recipient@example.com",
                    "Subject",
                    "<p>Body</p>",
                    null,
                    null
            );
        });
    }

    @Test
    public void testSendHtmlEmail_BrevoClientError() {
        // Mock 400 Bad Request
        HttpClientErrorException exception = HttpClientErrorException.create(
                HttpStatus.BAD_REQUEST,
                "Bad Request",
                HttpHeaders.EMPTY,
                "{\"code\":\"invalid_parameter\",\"message\":\"invalid recipient\"}".getBytes(),
                StandardCharsets.UTF_8
        );

        when(restTemplate.exchange(
                anyString(),
                any(HttpMethod.class),
                any(HttpEntity.class),
                eq(String.class)
        )).thenThrow(exception);

        RuntimeException thrown = assertThrows(RuntimeException.class, () -> {
            emailService.sendHtmlEmailWithAttachment(
                    "bad-email",
                    "Subject",
                    "<p>Body</p>",
                    null,
                    null
            );
        });

        assertTrue(thrown.getMessage().contains("BREVO_CLIENT_ERROR"));
        assertTrue(thrown.getMessage().contains("invalid recipient"));
    }
}
