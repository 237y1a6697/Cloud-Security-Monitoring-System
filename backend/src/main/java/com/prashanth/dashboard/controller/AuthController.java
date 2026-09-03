package com.prashanth.dashboard.controller;

import com.prashanth.dashboard.dto.ForgotPasswordRequest;
import com.prashanth.dashboard.dto.ResetPasswordRequest;
import com.prashanth.dashboard.service.PasswordResetService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * AuthController — public endpoints for password reset.
 *
 * Both endpoints are permitted without authentication (see SecurityConfig).
 * CSRF is already excluded for /api/** via SecurityConfig.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final PasswordResetService passwordResetService;

    public AuthController(PasswordResetService passwordResetService) {
        this.passwordResetService = passwordResetService;
    }

    /**
     * POST /api/auth/forgot-password
     *
     * Accepts an email address and initiates the password-reset flow.
     * Always returns 200 with a generic message to prevent email enumeration.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {

        String message = passwordResetService.initiatePasswordReset(request.getEmail());
        return ResponseEntity.ok(Map.of("message", message));
    }

    /**
     * POST /api/auth/reset-password
     *
     * Validates the reset token and updates the user's password.
     * Returns 400 with an error message on any failure.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {

        try {
            passwordResetService.resetPassword(
                request.getToken(),
                request.getNewPassword(),
                request.getConfirmPassword()
            );
            return ResponseEntity.ok(Map.of("message", "Password reset successfully."));
        } catch (IllegalArgumentException e) {
            logger.warn("Password reset failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
