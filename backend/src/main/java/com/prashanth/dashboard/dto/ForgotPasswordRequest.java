package com.prashanth.dashboard.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Request body for POST /api/auth/forgot-password */
public class ForgotPasswordRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String email;

    public ForgotPasswordRequest() {}

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
