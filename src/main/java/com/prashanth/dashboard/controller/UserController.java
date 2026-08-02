package com.prashanth.dashboard.controller;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.prashanth.dashboard.dto.ProfileUpdateRequest;
import com.prashanth.dashboard.dto.UserRegistrationRequest;
import com.prashanth.dashboard.dto.UserResponse;
import com.prashanth.dashboard.mapper.UserMapper;
import com.prashanth.dashboard.model.User;
import com.prashanth.dashboard.repository.UserRepository;
import com.prashanth.dashboard.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    private final UserRepository userRepository;
    private final UserService userService;

    public UserController(UserRepository userRepository, UserService userService) {
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody UserRegistrationRequest request) {
        log.info("Received registration request for username: {}", request.getUsername());
        try {
            if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Username is required."));
            }
            if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Password is required."));
            }
            if (request.getPassword().length() < 6) {
                return ResponseEntity.badRequest().body(Map.of("message", "Password must be at least 6 characters."));
            }
            if (request.getRole() == null || request.getRole().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Role is required."));
            }
            if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
                if (!request.getEmail().matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$")) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Please enter a valid email address."));
                }
            }

            User registered = userService.register(
                request.getUsername().trim(),
                request.getEmail() != null ? request.getEmail().trim() : null,
                request.getPassword(),
                request.getFirstName(),
                request.getLastName(),
                request.getPhone(),
                request.getOrganization(),
                request.getRole()
            );

            log.info("User registered successfully: {}", registered.getUsername());
            return ResponseEntity.ok(UserMapper.toResponse(registered));
        } catch (IllegalArgumentException e) {
            log.warn("Registration rejected for username {}: {}", request.getUsername(), e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("Unhandled exception during user registration for username {}:", request.getUsername(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Internal server error. Database connection failed or invalid query."));
        }
    }

    @GetMapping
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public List<UserResponse> getAllUsers() {
        return userService.getAllUsers();
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasAuthority('ROLE_ASSIGN')")
    public String assignRole(@PathVariable long id, @RequestParam String role) {
        userService.assignRole(id, role);
        return "Role updated";
    }

    @PutMapping("/{id}/disable")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public String disableUser(@PathVariable long id, @RequestParam boolean enabled) {
        userService.setEnabled(id, enabled);
        return "User status updated";
    }

    @PutMapping("/{id}/reset-password")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public String resetPassword(@PathVariable long id, @RequestParam String newPassword) {
        userService.resetPassword(id, newPassword);
        return "Password reset";
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public String deleteUser(@PathVariable long id) {
        userRepository.deleteById(id);
        return "User deleted";
    }

    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ProfileUpdateRequest request) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        User updatedUser = userService.updateProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(UserMapper.toResponse(updatedUser));
    }
}
