package com.prashanth.dashboard.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Stores a hashed password-reset token linked to a user.
 *
 * SECURITY NOTES:
 *  - Only the SHA-256 hash of the raw token is stored here.
 *  - The raw token travels in the reset email URL only; it never persists.
 *  - A token is single-use (used = true after a successful reset).
 *  - Expired tokens are rejected at service level.
 */
@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** FK to the user who requested the reset. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * SHA-256 hex digest of the raw reset token.
     * The raw token is only ever sent in the email link — never stored here.
     */
    @Column(name = "token_hash", nullable = false, length = 64)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private boolean used = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // ── Constructors ────────────────────────────────────────────────────────

    public PasswordResetToken() {}

    public PasswordResetToken(User user, String tokenHash, LocalDateTime expiresAt) {
        this.user = user;
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
        this.createdAt = LocalDateTime.now();
        this.used = false;
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    // ── Getters & Setters ───────────────────────────────────────────────────

    public Long getId() { return id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getTokenHash() { return tokenHash; }
    public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public boolean isUsed() { return used; }
    public void setUsed(boolean used) { this.used = used; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
