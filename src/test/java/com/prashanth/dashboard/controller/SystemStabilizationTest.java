package com.prashanth.dashboard.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.test.context.support.WithMockUser;

import com.prashanth.dashboard.dto.UserRegistrationRequest;
import com.prashanth.dashboard.dto.UserResponse;
import com.prashanth.dashboard.model.User;
import com.prashanth.dashboard.repository.UserRepository;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class SystemStabilizationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserController userController;

    @Autowired
    private UserRepository userRepository;

    @Test
    public void testRootEndpointIsPublic() {
        ResponseEntity<String> response = restTemplate.getForEntity("http://localhost:" + port + "/", String.class);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().contains("SentinelCore") || response.getBody().contains("SecureOps"));
    }

    @Test
    public void testNonExistentResourceReturns404() {
        ResponseEntity<Map> response = restTemplate.getForEntity("http://localhost:" + port + "/css/nonexistent-file.css", Map.class);
        // Exposing public root and mapped 404 for other unmapped static resources
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"USER_MANAGE"})
    public void testRegistrationRoleViewerDefault() {
        String testUser = "securityenforced_" + System.currentTimeMillis();
        UserRegistrationRequest request = new UserRegistrationRequest(
            testUser,
            "superSecPwd123!",
            testUser + "@secops.corp",
            "Security",
            "Guard",
            "555-0199",
            "SecOps Corp",
            "ROLE_SUPER_ADMIN" // Requesting SUPER_ADMIN role maliciously
        );

        ResponseEntity<?> response = userController.registerUser(request);
        assertEquals(HttpStatus.OK, response.getStatusCode());

        Optional<User> persisted = userRepository.findByUsername(testUser);
        assertTrue(persisted.isPresent());
        
        // Assert user roles count and name - it should ONLY contain ROLE_VIEWER
        assertEquals(1, persisted.get().getRoles().size());
        assertEquals("ROLE_VIEWER", persisted.get().getRoles().iterator().next().getName());
    }
}
