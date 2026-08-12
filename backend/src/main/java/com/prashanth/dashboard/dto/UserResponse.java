package com.prashanth.dashboard.dto;

import java.time.LocalDateTime;
import java.util.List;

public record UserResponse(
    Long id,
    String username,
    String displayName,
    String email,
    String firstName,
    String lastName,
    String phone,
    String organization,
    boolean enabled,
    boolean locked,
    LocalDateTime lastLogin,
    String primaryRoleName,
    List<String> roles,
    List<String> permissions,
    String designation,
    String department,
    String employeeId,
    String theme,
    String notifications,
    String language,
    String timezone,
    String avatar
) {}
