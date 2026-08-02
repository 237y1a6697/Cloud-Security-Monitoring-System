package com.prashanth.dashboard.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.prashanth.dashboard.dto.*;
import com.prashanth.dashboard.mapper.UserMapper;
import com.prashanth.dashboard.model.User;
import com.prashanth.dashboard.repository.RoleRepository;
import com.prashanth.dashboard.repository.UserRepository;

import java.util.Objects;
import java.util.List;
import java.util.stream.Collectors;


@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /** Register a new user. Throws if username/email already taken. */
    @Transactional
    public User register(String username, String email, String password,
                         String firstName, String lastName, String phone,
                         String organization, String role) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("Username already exists: " + username);
        }
        if (email != null && !email.isBlank() && userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Email already registered: " + email);
        }

        User user = new User(username, passwordEncoder.encode(password), email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setPhone(phone);
        user.setOrganization(organization);

        // Assign the selected role
        if (role != null && !role.isBlank()) {
            roleRepository.findByName(role).ifPresent(r -> user.getRoles().add(r));
        }
        return userRepository.save(Objects.requireNonNull(user, "user"));
    }

    /** Update profile fields (no password change here). */
    @Transactional
    public User updateProfile(String username, String firstName, String lastName,
                               String email, String phone, String organization) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (firstName != null) user.setFirstName(firstName);
        if (lastName != null) user.setLastName(lastName);
        if (email != null && !email.isBlank()) user.setEmail(email);
        if (phone != null) user.setPhone(phone);
        if (organization != null) user.setOrganization(organization);
        return userRepository.save(Objects.requireNonNull(user, "user"));
    }

    /** Overloaded updateProfile to support ProfileUpdateRequest DTO values and password updates. */
    @Transactional
    public User updateProfile(String username, ProfileUpdateRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getEmail() != null) {
            if (!request.getEmail().matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$")) {
                throw new IllegalArgumentException("Please enter a valid email address.");
            }
            user.setEmail(request.getEmail());
        }
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getDesignation() != null) user.setDesignation(request.getDesignation());
        if (request.getDepartment() != null) user.setDepartment(request.getDepartment());
        if (request.getEmployeeId() != null) user.setEmployeeId(request.getEmployeeId());
        
        // Also map department to organization for backwards-compatibility/dashboard stats
        if (request.getDepartment() != null) user.setOrganization(request.getDepartment());

        if (request.getTheme() != null) user.setTheme(request.getTheme());
        if (request.getNotifications() != null) user.setNotifications(request.getNotifications());
        if (request.getLanguage() != null) user.setLanguage(request.getLanguage());
        if (request.getTimezone() != null) user.setTimezone(request.getTimezone());
        if (request.getAvatar() != null) user.setAvatar(request.getAvatar());

        // Password change logic if a new password is provided
        if (request.getNewPassword() != null && !request.getNewPassword().trim().isEmpty()) {
            String newPwd = request.getNewPassword().trim();
            if (newPwd.length() < 8) {
                throw new IllegalArgumentException("Password must contain at least 8 characters.");
            }
            if (request.getCurrentPassword() == null || request.getCurrentPassword().trim().isEmpty()) {
                throw new IllegalArgumentException("Current password is required to change password.");
            }
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new IllegalArgumentException("Current password is incorrect.");
            }
            user.setPassword(passwordEncoder.encode(newPwd));
        }

        return userRepository.save(Objects.requireNonNull(user, "user"));
    }

    /** Change password — verifies old password first. */
    @Transactional
    public void changePassword(String username, String oldPassword, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    /** Admin reset password — no old password check. */
    @Transactional
    public void resetPassword(long userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(Objects.requireNonNull(user, "user"));
    }

    /** Admin enable/disable. */
    @Transactional
    public void setEnabled(long userId, boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setEnabled(enabled);
        userRepository.save(Objects.requireNonNull(user, "user"));
    }

    /** Admin assign role. */
    @Transactional
    public void assignRole(long userId, String roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        roleRepository.findByName(roleName).ifPresent(r -> {
            user.getRoles().clear();
            user.getRoles().add(r);
        });
        userRepository.save(Objects.requireNonNull(user, "user"));
    }

    /** Get all users mapped to DTO. */
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserMapper::toResponse)
                .collect(Collectors.toList());
    }
}

