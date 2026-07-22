package com.prashanth.dashboard.controller;

import com.prashanth.dashboard.model.User;
import com.prashanth.dashboard.repository.RoleRepository;
import com.prashanth.dashboard.repository.UserRepository;
import com.prashanth.dashboard.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class DashboardController {

    private final UserRepository userRepository;
    private final UserService userService;
    private final RoleRepository roleRepository;

    public DashboardController(UserRepository userRepository, UserService userService,
                               RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.roleRepository = roleRepository;
    }

    // ── Auth Pages ────────────────────────────────────────────────────────────

    @GetMapping("/")
    public String root() {
        return "redirect:/dashboard";
    }

    @GetMapping("/login")
    public String loginPage() {
        return "login";
    }

    @GetMapping("/register")
    public String registerPage() {
        return "register";
    }

    @PostMapping("/register")
    public String register(
            @RequestParam String username,
            @RequestParam(required = false, defaultValue = "") String email,
            @RequestParam String password,
            @RequestParam String confirmPassword,
            @RequestParam(required = false, defaultValue = "") String firstName,
            @RequestParam(required = false, defaultValue = "") String lastName,
            @RequestParam(required = false, defaultValue = "") String phone,
            @RequestParam(required = false, defaultValue = "") String organization,
            @RequestParam(required = false, defaultValue = "") String role,
            RedirectAttributes redirectAttributes) {

        // Basic validations
        if (!password.equals(confirmPassword)) {
            redirectAttributes.addFlashAttribute("error", "Passwords do not match");
            return "redirect:/register";
        }
        if (password.length() < 6) {
            redirectAttributes.addFlashAttribute("error", "Password must be at least 6 characters");
            return "redirect:/register";
        }
        if (role == null || role.isBlank()) {
            redirectAttributes.addFlashAttribute("error", "Role selection is required");
            return "redirect:/register";
        }

        try {
            userService.register(username, email, password, firstName, lastName, phone, organization, role);
            redirectAttributes.addFlashAttribute("success", "Account created! You can now log in.");
            return "redirect:/login?registered=true";
        } catch (IllegalArgumentException ex) {
            redirectAttributes.addFlashAttribute("error", ex.getMessage());
            return "redirect:/register";
        }
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────

    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        addCurrentUserToModel(model);
        return "dashboard";
    }

    // ── Profile ───────────────────────────────────────────────────────────────

    @GetMapping("/profile")
    public String profilePage(Model model) {
        addCurrentUserToModel(model);
        return "profile";
    }

    @PostMapping("/profile/update")
    public String updateProfile(
            @RequestParam(required = false) String firstName,
            @RequestParam(required = false) String lastName,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String organization,
            RedirectAttributes redirectAttributes) {

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            userService.updateProfile(username, firstName, lastName, email, phone, organization);
            redirectAttributes.addFlashAttribute("success", "Profile updated successfully.");
        } catch (Exception ex) {
            redirectAttributes.addFlashAttribute("error", ex.getMessage());
        }
        return "redirect:/profile";
    }

    @PostMapping("/profile/change-password")
    public String changePassword(
            @RequestParam String oldPassword,
            @RequestParam String newPassword,
            @RequestParam String confirmNewPassword,
            RedirectAttributes redirectAttributes) {

        if (!newPassword.equals(confirmNewPassword)) {
            redirectAttributes.addFlashAttribute("pwdError", "New passwords do not match");
            return "redirect:/profile";
        }
        if (newPassword.length() < 6) {
            redirectAttributes.addFlashAttribute("pwdError", "Password must be at least 6 characters");
            return "redirect:/profile";
        }

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            userService.changePassword(username, oldPassword, newPassword);
            redirectAttributes.addFlashAttribute("success", "Password changed successfully. Please log in again.");
        } catch (IllegalArgumentException ex) {
            redirectAttributes.addFlashAttribute("pwdError", ex.getMessage());
        }
        return "redirect:/profile";
    }

    // ── Misc ──────────────────────────────────────────────────────────────────

    @GetMapping("/assets")
    public String assets(Model model) {
        addCurrentUserToModel(model);
        return "assets";
    }

    @GetMapping("/access-denied")
    public String accessDenied() {
        return "access-denied";
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void addCurrentUserToModel(Model model) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            userRepository.findByUsername(auth.getName()).ifPresent(u -> model.addAttribute("currentUser", u));
        }
    }
}
