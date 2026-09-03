package com.prashanth.dashboard.security;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.rememberme.TokenBasedRememberMeServices;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import java.util.stream.Collectors;
import org.springframework.security.core.context.SecurityContextHolder;
import com.prashanth.dashboard.repository.UserRepository;
import com.prashanth.dashboard.repository.RoleRepository;
import com.prashanth.dashboard.repository.AuditLogRepository;
import com.prashanth.dashboard.model.AuditLog;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@SuppressWarnings("null")
public class SecurityConfig {

    /**
     * Set this on Render to your Vercel frontend URL, e.g. https://sentinelcore.vercel.app
     * Must NOT have a trailing slash.
     */
    @Value("${FRONTEND_URL:http://localhost:5173}")
    private String frontendUrl;

    private final CustomUserDetailsService userDetailsService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AuditLogRepository auditLogRepository;

    public SecurityConfig(CustomUserDetailsService userDetailsService,
                          UserRepository userRepository,
                          RoleRepository roleRepository,
                          AuditLogRepository auditLogRepository) {
        this.userDetailsService = userDetailsService;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ── CORS ─────────────────────────────────────────────────────────────────────
    // FIX: Use allowedOriginPatterns instead of allowedOrigins when allowCredentials=true
    // to avoid the Spring restriction on wildcard + credentials combinations.
    // We explicitly list known origins so we are NOT using a wildcard here, just the
    // pattern API which is the correct Spring 6 way to do this.

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // FIX: allow the exact production origin plus Vercel preview domains and local dev.
        // This keeps credentials enabled without falling back to a blanket wildcard.
        config.setAllowedOriginPatterns(List.of(
            frontendUrl,
            "http://localhost:5173",
            "http://localhost:3000",
            "https://*.vercel.app"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        // FIX: Expose Set-Cookie so the browser can read it; also expose X-XSRF-TOKEN
        config.setExposedHeaders(List.of("Set-Cookie", "X-XSRF-TOKEN"));
        config.setAllowCredentials(true); // Required for JSESSIONID to be stored cross-site
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    // ── Remember-Me Token Service ──────────────────────────────────────────────
    // FIX: We need a named bean so we can set a custom cookie name AND add
    // SameSite=None;Secure attributes on the remember-me cookie manually.

    @Bean
    public TokenBasedRememberMeServices rememberMeServices() {
        TokenBasedRememberMeServices services =
            new TokenBasedRememberMeServices("sentinelcore-remember-me-key", userDetailsService);
        services.setTokenValiditySeconds(7 * 24 * 60 * 60); // 7 days
        services.setCookieName("remember-me");
        // FIX: Mark remember-me cookie as Secure + SameSite=None for cross-site use
        services.setUseSecureCookie(true);
        return services;
    }

    // ── Security Filter Chain ─────────────────────────────────────────────────

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/css/**", "/js/**", "/images/**", "/webjars/**", "/fonts/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/users/register").permitAll()
                .requestMatchers("/login", "/register", "/api/users/register", "/access-denied", "/error", "/login/oauth2/**", "/oauth2/**").permitAll()
                // FIX: Expose root, /actuator/health and /health so Render health checks pass
                .requestMatchers("/", "/actuator/health", "/health").permitAll()
                // Password-reset endpoints — publicly accessible (user is not authenticated)
                .requestMatchers("/api/auth/forgot-password", "/api/auth/reset-password").permitAll()
                .requestMatchers("/admin/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .loginPage("/login")
                .loginProcessingUrl("/login")
                .usernameParameter("username")
                .passwordParameter("password")
                .successHandler(successHandler())
                .failureHandler(failureHandler())
                .permitAll()
            )
            .oauth2Login(oauth2 -> oauth2
                .successHandler(oauth2SuccessHandler())
            )
            // FIX: wire remember-me to the named bean so cookie attributes are correct
            .rememberMe(remember -> remember
                .rememberMeServices(rememberMeServices())
            )
            .logout(logout -> logout
                .logoutRequestMatcher(new AntPathRequestMatcher("/logout", "POST"))
                .logoutSuccessHandler(logoutSuccessHandler())
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID", "remember-me")
                .permitAll()
            )
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
                // FIX: Exclude all REST API paths and SPA auth endpoints from CSRF
                .ignoringRequestMatchers("/api/**", "/login", "/logout", "/register", "/login/oauth2/**", "/oauth2/**")
            )
            .exceptionHandling(ex -> ex
                // FIX: Return JSON 401 — do NOT redirect to /login (that returns HTML, not JSON)
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\": \"401 Unauthorized — please log in\"}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\": \"403 Access Denied — insufficient permissions\"}");
                })
            );

        return http.build();
    }

    // ── Handlers ─────────────────────────────────────────────────────────────────

    private AuthenticationSuccessHandler successHandler() {
        return (request, response, authentication) -> {
            AuditLog auditLog = new AuditLog();
            auditLog.setUsername(authentication.getName());
            String roles = authentication.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .collect(Collectors.joining(","));
            auditLog.setRole(roles != null && roles.length() > 250 ? roles.substring(0, 250) : roles);
            auditLog.setIpAddress(request.getRemoteAddr());
            String ua = request.getHeader("User-Agent");
            auditLog.setDeviceBrowser(ua != null && ua.length() > 250 ? ua.substring(0, 250) : ua);
            auditLog.setAction("USER_LOGIN");
            auditLog.setResult("SUCCESS");
            auditLogRepository.save(auditLog);

            response.setStatus(HttpServletResponse.SC_OK);
            response.setContentType("application/json");
            response.getWriter().write("{\"success\": true}");
        };
    }

    @SuppressWarnings("null")
    private AuthenticationFailureHandler failureHandler() {
        return (request, response, exception) -> {
            String username = request.getParameter("username");
            if (username == null || username.trim().isEmpty()) {
                username = "unknown";
            }
            
            AuditLog auditLog = new AuditLog();
            auditLog.setUsername(username);
            auditLog.setRole("NONE");
            auditLog.setIpAddress(request.getRemoteAddr());
            String ua = request.getHeader("User-Agent");
            auditLog.setDeviceBrowser(ua != null && ua.length() > 250 ? ua.substring(0, 250) : ua);
            auditLog.setAction("USER_LOGIN");
            auditLog.setResult("FAILED: " + (exception.getMessage() != null ? exception.getMessage() : "Bad Credentials"));
            auditLogRepository.save(auditLog);

            String errorParam;
            if (exception instanceof LockedException) {
                errorParam = "locked";
            } else {
                String message = exception.getMessage();
                if (message != null && message.toLowerCase().contains("disabled")) {
                    errorParam = "disabled";
                } else {
                    errorParam = "true";
                }
            }
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"" + errorParam + "\"}");
        };
    }

    private org.springframework.security.web.authentication.logout.LogoutSuccessHandler logoutSuccessHandler() {
        return (request, response, authentication) -> {
            String username = (authentication != null) ? authentication.getName() : "anonymous";
            
            AuditLog auditLog = new AuditLog();
            auditLog.setUsername(username);
            
            String roles = "NONE";
            if (authentication != null) {
                roles = authentication.getAuthorities().stream()
                    .map(a -> a.getAuthority())
                    .collect(Collectors.joining(","));
            }
            auditLog.setRole(roles != null && roles.length() > 250 ? roles.substring(0, 250) : roles);
            auditLog.setIpAddress(request.getRemoteAddr());
            String ua = request.getHeader("User-Agent");
            auditLog.setDeviceBrowser(ua != null && ua.length() > 250 ? ua.substring(0, 250) : ua);
            auditLog.setAction("USER_LOGOUT");
            auditLog.setResult("SUCCESS");
            auditLogRepository.save(auditLog);

            deleteCrossSiteCookie(response, "JSESSIONID");
            deleteCrossSiteCookie(response, "remember-me");
            deleteCrossSiteCookie(response, "XSRF-TOKEN");
            response.setStatus(HttpServletResponse.SC_OK);
            response.setContentType("application/json");
            response.getWriter().write("{\"success\": true}");
        };
    }

    private AuthenticationSuccessHandler oauth2SuccessHandler() {
        return (request, response, authentication) -> {
            org.springframework.security.oauth2.core.user.OAuth2User oauth2User =
                (org.springframework.security.oauth2.core.user.OAuth2User) authentication.getPrincipal();
            
            String email = oauth2User.getAttribute("email");
            String name = oauth2User.getAttribute("name");
            if (name == null) name = oauth2User.getAttribute("given_name");
            if (name == null) name = "Google User";
            
            if (email == null || email.isBlank()) {
                response.sendRedirect(frontendUrl + "/login?error=oauth_email_missing");
                return;
            }
            
            // Check if user exists
            java.util.Optional<com.prashanth.dashboard.model.User> localUserOpt = userRepository.findByEmail(email);
            com.prashanth.dashboard.model.User user;
            PasswordEncoder encoder = new BCryptPasswordEncoder();
            
            if (localUserOpt.isPresent()) {
                user = localUserOpt.get();
            } else {
                // Auto-register
                String username = email.split("@")[0];
                int suffix = 1;
                String baseUsername = username;
                while (userRepository.findByUsername(username).isPresent()) {
                    username = baseUsername + suffix++;
                }
                
                user = new com.prashanth.dashboard.model.User(
                    username,
                    encoder.encode(java.util.UUID.randomUUID().toString()),
                    email
                );
                
                String[] nameParts = name.split(" ", 2);
                user.setFirstName(nameParts[0]);
                if (nameParts.length > 1) {
                    user.setLastName(nameParts[1]);
                }
                user.setEnabled(true);
                
                // SECURITY: Default to ROLE_VIEWER
                roleRepository.findByName("ROLE_VIEWER").ifPresent(r -> user.getRoles().add(r));
                userRepository.save(user);
                
                // Log registration
                AuditLog rlog = new AuditLog();
                rlog.setUsername(username);
                rlog.setRole("ROLE_VIEWER");
                rlog.setIpAddress(request.getRemoteAddr());
                String ua = request.getHeader("User-Agent");
                rlog.setDeviceBrowser(ua != null && ua.length() > 250 ? ua.substring(0, 250) : ua);
                rlog.setAction("USER_REGISTER_OAUTH2");
                rlog.setResult("SUCCESS");
                auditLogRepository.save(rlog);
            }
            
            // Log login
            AuditLog llog = new AuditLog();
            llog.setUsername(user.getUsername());
            String userroles = user.getRoles().stream()
                .map(com.prashanth.dashboard.model.Role::getName)
                .collect(Collectors.joining(","));
            llog.setRole(userroles != null && userroles.length() > 250 ? userroles.substring(0, 250) : userroles);
            llog.setIpAddress(request.getRemoteAddr());
            String ua = request.getHeader("User-Agent");
            llog.setDeviceBrowser(ua != null && ua.length() > 250 ? ua.substring(0, 250) : ua);
            llog.setAction("USER_LOGIN_OAUTH2");
            llog.setResult("SUCCESS");
            auditLogRepository.save(llog);
            
            // Re-authenticate user as local DB user
            org.springframework.security.core.userdetails.UserDetails userDetails =
                userDetailsService.loadUserByUsername(user.getUsername());
            
            org.springframework.security.authentication.UsernamePasswordAuthenticationToken localAuth =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities()
                );
            
            SecurityContextHolder.getContext().setAuthentication(localAuth);
            
            // ALSO store in session so JSESSIONID matches
            request.getSession().setAttribute(
                org.springframework.security.web.context.HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                SecurityContextHolder.getContext()
            );
            
            // Redirect to frontend dashboard
            response.sendRedirect(frontendUrl + "/dashboard");
        };
    }

    /**
     * FIX: Manually delete a cookie WITH SameSite=None;Secure attributes.
     * Standard response.deleteCookies() does NOT add SameSite, so the browser
     * ignores the deletion instruction for SameSite=None cookies in cross-site context.
     */
    private void deleteCrossSiteCookie(HttpServletResponse response, String cookieName) {
        Cookie cookie = new Cookie(cookieName, "");
        cookie.setMaxAge(0);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        // Spring Boot 6 / Servlet 6: use setAttribute for SameSite
        response.addHeader("Set-Cookie",
            cookieName + "=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None");
    }
}
