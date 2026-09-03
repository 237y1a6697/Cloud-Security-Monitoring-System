package com.prashanth.dashboard.service;

import com.prashanth.dashboard.model.PasswordResetToken;
import com.prashanth.dashboard.model.User;
import com.prashanth.dashboard.repository.PasswordResetTokenRepository;
import com.prashanth.dashboard.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

/**
 * PasswordResetService
 *
 * Handles the complete forgot-password / reset-password workflow:
 *  1. Generate a cryptographically secure random token.
 *  2. Hash it with SHA-256 — only the hash goes into the DB.
 *  3. Send the raw token (URL-safe Base64) in the reset email.
 *  4. On reset: re-hash the submitted token and compare with stored hash.
 *  5. Validate expiration + single-use, then update the password.
 */
@Service
public class PasswordResetService {

    private static final Logger logger = LoggerFactory.getLogger(PasswordResetService.class);

    private static final String GENERIC_SUCCESS_MSG =
        "If an account exists for this email, a password reset link has been sent.";

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    /** Frontend URL for the reset link (no trailing slash). */
    @Value("${FRONTEND_URL:http://localhost:5173}")
    private String frontendUrl;

    /** How many minutes until the reset token expires. */
    @Value("${password.reset.expiration-minutes:30}")
    private int expirationMinutes;

    public PasswordResetService(UserRepository userRepository,
                                 PasswordResetTokenRepository tokenRepository,
                                 PasswordEncoder passwordEncoder,
                                 EmailService emailService) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Forgot Password — Step 1
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Initiates a password-reset flow.
     * Always returns the same generic message regardless of whether the
     * account exists, to prevent email-enumeration attacks.
     *
     * @param email the submitted email address
     * @return always the same generic success message
     */
    @Transactional
    public String initiatePasswordReset(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            // Do NOT leak that the email doesn't exist — return generic message
            logger.debug("Password reset requested for unknown email (not logged for security)");
            return GENERIC_SUCCESS_MSG;
        }

        User user = userOpt.get();

        // Invalidate all previous active tokens for this user
        tokenRepository.invalidateAllForUser(user);

        // Generate a 32-byte cryptographically secure random token
        byte[] rawBytes = new byte[32];
        new SecureRandom().nextBytes(rawBytes);
        // URL-safe Base64 (no padding) — safe to use directly in a URL query param
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(rawBytes);

        // Hash the raw token for storage — never store raw value in DB
        String tokenHash = sha256Hex(rawToken);

        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(expirationMinutes);
        PasswordResetToken prt = new PasswordResetToken(user, tokenHash, expiresAt);
        tokenRepository.save(prt);

        // Build reset URL
        String resetUrl = frontendUrl + "/reset-password?token=" + rawToken;

        // Send email via existing Brevo EmailService
        try {
            String html = buildResetEmailHtml(user.getDisplayName(), resetUrl, expirationMinutes);
            emailService.sendHtmlEmailWithAttachment(
                user.getEmail(),
                "Reset your SentinelCore SecureOps password",
                html,
                null,
                null
            );
            logger.info("Password reset email dispatched for user id={}", user.getId());
        } catch (Exception e) {
            // Log but do NOT surface email errors to caller — avoids enumeration side-channel
            logger.error("Failed to send password reset email for user id={}: {}", user.getId(), e.getMessage());
        }

        return GENERIC_SUCCESS_MSG;
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Reset Password — Step 2
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Validates the reset token and updates the user's password.
     *
     * @param rawToken       the raw token from the email URL
     * @param newPassword    the new plain-text password (will be encoded)
     * @param confirmPassword must match newPassword
     * @throws IllegalArgumentException for any validation failure
     */
    @Transactional
    public void resetPassword(String rawToken, String newPassword, String confirmPassword) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException("Reset token is missing.");
        }
        if (newPassword == null || newPassword.trim().isEmpty()) {
            throw new IllegalArgumentException("New password is required.");
        }
        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalArgumentException("Passwords do not match.");
        }
        if (newPassword.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters.");
        }

        // Hash incoming raw token and look it up in DB
        String tokenHash = sha256Hex(rawToken);
        PasswordResetToken prt = tokenRepository.findByTokenHash(tokenHash)
            .orElseThrow(() -> new IllegalArgumentException("This password reset link is invalid or has expired."));

        if (prt.isUsed()) {
            throw new IllegalArgumentException("This password reset link has already been used.");
        }
        if (prt.isExpired()) {
            throw new IllegalArgumentException("This password reset link has expired. Please request a new one.");
        }

        // Update password using existing PasswordEncoder
        User user = prt.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Invalidate the token (mark used) — no raw data is touched
        prt.setUsed(true);
        tokenRepository.save(prt);

        logger.info("Password successfully reset for user id={}", user.getId());
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Computes SHA-256 hex digest of the given string.
     * Used to hash the raw reset token before storing/comparing.
     */
    private String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 is guaranteed by the Java spec — this will never happen
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    /** Builds the HTML body for the password-reset email. */
    private String buildResetEmailHtml(String displayName, String resetUrl, int expiryMinutes) {
        return "<!DOCTYPE html>" +
            "<html lang='en'><head><meta charset='UTF-8'>" +
            "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
            "<title>Reset Your Password</title></head>" +
            "<body style='margin:0;padding:0;background:#0a0e1a;font-family:Inter,Segoe UI,system-ui,sans-serif;'>" +
            "<table width='100%' cellpadding='0' cellspacing='0'>" +
            "<tr><td align='center' style='padding:40px 20px;'>" +
            "<table width='520' cellpadding='0' cellspacing='0' style='background:rgba(13,21,47,0.95);" +
            "border:1px solid rgba(30,90,200,0.3);border-radius:16px;overflow:hidden;'>" +
            // Header
            "<tr><td style='background:linear-gradient(135deg,#1e3a8a,#1e5fc8);padding:32px 36px;text-align:center;'>" +
            "<h1 style='color:#fff;margin:0;font-size:1.4rem;font-weight:700;'>🔐 SentinelCore SecureOps</h1>" +
            "<p style='color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:0.85rem;'>Cybersecurity Infrastructure Monitoring Portal</p>" +
            "</td></tr>" +
            // Body
            "<tr><td style='padding:36px;'>" +
            "<p style='color:#e8edf8;font-size:1rem;margin:0 0 14px;'>Hello, <strong>" + escapeHtml(displayName) + "</strong>,</p>" +
            "<p style='color:#8a9bb8;font-size:0.9rem;margin:0 0 28px;line-height:1.6;'>" +
            "We received a request to reset your SentinelCore SecureOps password. " +
            "Click the button below to set a new password.</p>" +
            // Button
            "<div style='text-align:center;margin:0 0 28px;'>" +
            "<a href='" + resetUrl + "' " +
            "style='display:inline-block;padding:14px 36px;" +
            "background:linear-gradient(135deg,#1e5fc8,#3a7bd5);" +
            "color:#fff;text-decoration:none;border-radius:9px;font-weight:600;" +
            "font-size:0.95rem;box-shadow:0 4px 18px rgba(58,123,213,0.4);'>" +
            "Reset Password</a></div>" +
            "<p style='color:#6b7fa0;font-size:0.8rem;margin:0 0 8px;'>" +
            "⏱ This link expires in <strong style='color:#e8edf8;'>" + expiryMinutes + " minutes</strong>.</p>" +
            "<p style='color:#6b7fa0;font-size:0.8rem;margin:0 0 24px;'>" +
            "If you did not request this, you can safely ignore this email. Your password will not change.</p>" +
            "<hr style='border:none;border-top:1px solid rgba(255,255,255,0.08);margin:24px 0;'/>" +
            "<p style='color:#3a4a68;font-size:0.75rem;margin:0;word-break:break-all;'>" +
            "If the button doesn't work, copy and paste this link into your browser:<br/>" +
            "<span style='color:#3a7bd5;'>" + resetUrl + "</span></p>" +
            "</td></tr>" +
            // Footer
            "<tr><td style='padding:16px 36px;background:rgba(0,0,0,0.2);text-align:center;'>" +
            "<p style='color:#3a4a68;font-size:0.72rem;margin:0;'>© 2026 SentinelCore SecureOps. This is an automated message.</p>" +
            "</td></tr>" +
            "</table></td></tr></table></body></html>";
    }

    /** Minimal HTML escaping to prevent injection in the display name. */
    private String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#x27;");
    }
}
