package com.prashanth.dashboard.controller;

import com.prashanth.dashboard.dto.UserResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class UserControllerTest {

    @Autowired
    private UserController userController;

    @Test
    // Standard mock user annotation supplying 'USER_MANAGE' authority required by
    // UserController's class/method method-level authorization.
    @WithMockUser(username = "admin", authorities = {"USER_MANAGE"})
    public void testGetAllUsersDirectly() {
        assertNotNull(userController);
        List<UserResponse> users = userController.getAllUsers();
        assertNotNull(users);
        assertFalse(users.isEmpty());
        
        // Find the admin user bootstrapped in DataInitializer
        UserResponse adminUser = users.stream()
                .filter(u -> "admin".equals(u.username()))
                .findFirst()
                .orElse(null);
        
        assertNotNull(adminUser, "Bootstrap admin user should be present");
        assertEquals("admin", adminUser.username());
        assertEquals("admin@sentinelcore.com", adminUser.email());
        assertEquals("System Administrator", adminUser.displayName());
        assertTrue("ROLE_SUPER_ADMIN".equals(adminUser.primaryRoleName()) || "ROLE_ADMIN".equals(adminUser.primaryRoleName()));
        assertTrue(adminUser.roles().contains("ROLE_SUPER_ADMIN") || adminUser.roles().contains("ROLE_ADMIN"));
        assertTrue(adminUser.permissions().contains("USER_MANAGE"));
        assertTrue(adminUser.permissions().contains("ROLE_ASSIGN"));
        assertTrue(adminUser.permissions().contains("ASSET_VIEW"));
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"USER_MANAGE"})
    public void testUserRegistrationDirectly() {
        String uniqueUsername = "testreguser_" + System.currentTimeMillis();
        com.prashanth.dashboard.dto.UserRegistrationRequest request = new com.prashanth.dashboard.dto.UserRegistrationRequest(
            uniqueUsername,
            "password123",
            uniqueUsername + "@example.com",
            "Test",
            "Registrant",
            "123-456-7890",
            "TestOrg",
            "ROLE_VIEWER"
        );
        org.springframework.http.ResponseEntity<?> response = userController.registerUser(request);
        assertEquals(org.springframework.http.HttpStatus.OK, response.getStatusCode());
        
        // Try double registering same username -> should fail with BAD_REQUEST
        org.springframework.http.ResponseEntity<?> duplicateResponse = userController.registerUser(request);
        assertEquals(org.springframework.http.HttpStatus.BAD_REQUEST, duplicateResponse.getStatusCode());
        
        // Assert on database
        List<UserResponse> users = userController.getAllUsers();
        UserResponse createdUser = users.stream()
                .filter(u -> uniqueUsername.equals(u.username()))
                .findFirst()
                .orElse(null);
        assertNotNull(createdUser);
        assertEquals(uniqueUsername + "@example.com", createdUser.email());
        assertEquals("Test Registrant", createdUser.displayName());
        assertEquals("ROLE_VIEWER", createdUser.primaryRoleName());
    }
}
