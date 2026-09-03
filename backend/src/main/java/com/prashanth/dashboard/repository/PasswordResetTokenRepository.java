package com.prashanth.dashboard.repository;

import com.prashanth.dashboard.model.PasswordResetToken;
import com.prashanth.dashboard.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    /** Find by stored token hash for validation. */
    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    /** Invalidate all previous active tokens for a user before issuing a new one. */
    @Modifying
    @Query("UPDATE PasswordResetToken t SET t.used = true WHERE t.user = :user AND t.used = false")
    void invalidateAllForUser(@Param("user") User user);
}
