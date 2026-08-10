package com.prashanth.dashboard.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTO for self-registration.
 *
 * NOTE: There is intentionally NO `role` field here. All self-registered users
 * are assigned ROLE_VIEWER by UserService, regardless of any client input.
 * Role promotion is performed exclusively by admins via the Users management page.
 */
public class UserRegistrationRequest {
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 30, message = "Username must be between 3 and 30 characters")
    @Pattern(
        regexp = "^[A-Za-z][A-Za-z0-9._-]{2,29}$",
        message = "Invalid username. Username must start with a letter and may contain only letters, numbers, '.', '_' or '-'."
    )
    private String username;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be at least 6 characters")
    private String password;

    @Email(message = "Please enter a valid email address")
    private String email;

    private String firstName;
    private String lastName;
    private String phone;
    private String organization;

    public UserRegistrationRequest() {}

    public UserRegistrationRequest(String username, String password, String email,
                                   String firstName, String lastName, String phone,
                                   String organization) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phone = phone;
        this.organization = organization;
    }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getOrganization() { return organization; }
    public void setOrganization(String organization) { this.organization = organization; }
}
