package com.prashanth.dashboard.controller;

import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * AdminDiagnosticsController — administrative health/diagnostics endpoints.
 *
 * The former /api/admin/diagnostics/smtp-dns endpoint has been removed because
 * Gmail SMTP is no longer used. Email is now delivered via the Brevo HTTPS REST API.
 */
@RestController
@RequestMapping(path = "/api/admin/diagnostics", produces = MediaType.APPLICATION_JSON_VALUE)
public class AdminDiagnosticsController {

    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public Map<String, Object> status() {
        return Map.of(
            "emailProvider", "Brevo REST API",
            "smtpEnabled", false,
            "note", "Email is sent via POST https://api.brevo.com/v3/smtp/email"
        );
    }
}
