package com.prashanth.dashboard.controller;

import java.net.InetAddress;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/admin/diagnostics", produces = MediaType.APPLICATION_JSON_VALUE)
public class AdminDiagnosticsController {

    private static final Logger log = LoggerFactory.getLogger(AdminDiagnosticsController.class);

    // TODO: Temporary diagnostic endpoint — remove after operators finish troubleshooting DNS from Render.
    @GetMapping("/smtp-dns")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public Map<String, Object> smtpDnsCheck() {
        String host = "smtp.gmail.com";
        try {
            InetAddress[] addrs = InetAddress.getAllByName(host);
            List<String> ips = Arrays.stream(addrs)
                .map(InetAddress::getHostAddress)
                .toList();
            return Map.of(
                "hostname", host,
                "dnsResolved", true,
                "resolvedAddresses", ips
            );
        } catch (Exception e) {
            // Log minimal info for operators; do NOT expose exception details in the response.
            log.warn("SMTP DNS diagnostic: resolution failed for {}", host);
            return Map.of(
                "hostname", host,
                "dnsResolved", false,
                "resolvedAddresses", Collections.emptyList()
            );
        }
    }
}
