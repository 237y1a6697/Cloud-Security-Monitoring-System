package com.prashanth.dashboard.aop;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prashanth.dashboard.model.AuditLog;
import com.prashanth.dashboard.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.stream.Collectors;

@Aspect
@Component
public class AuditAspect {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper = new ObjectMapper(); // if needed

    public AuditAspect(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Around("@annotation(auditable)")
    public Object logAuditActivity(ProceedingJoinPoint joinPoint, Auditable auditable) throws Throwable {
        String username = "system";
        String roles = "NONE";
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            username = auth.getName();
            roles = auth.getAuthorities().stream()
                        .map(a -> a.getAuthority())
                        .collect(Collectors.joining(","));
        }

        String ipAddress = "unknown";
        String userAgent = "unknown";
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            HttpServletRequest request = attrs.getRequest();
            ipAddress = request.getRemoteAddr();
            userAgent = request.getHeader("User-Agent");
        }

        // We can capture arguments for prev/new values if needed, simpler version captures action name.
        Object result = null;
        String outcome = "SUCCESS";
        try {
            result = joinPoint.proceed();
            return result;
        } catch (Throwable e) {
            outcome = "FAILED: " + e.getMessage();
            throw e;
        } finally {
            AuditLog log = new AuditLog();
            log.setUsername(username);
            log.setRole(roles);
            log.setIpAddress(ipAddress);
            log.setDeviceBrowser(userAgent.length() > 255 ? userAgent.substring(0, 255) : userAgent);
            log.setAction(auditable.action());
            log.setResult(outcome);
            
            // In a full implementation, you could use ObjectMapper to jsonify joinPoint.getArgs() for prev/new values.
            
            auditLogRepository.save(log);
        }
    }
}
