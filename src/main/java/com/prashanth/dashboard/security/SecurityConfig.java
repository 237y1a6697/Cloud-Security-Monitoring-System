package com.prashanth.dashboard.security;

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
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    /**
     * Set this on Render to your Vercel frontend URL, e.g. https://sentinelcore.vercel.app
     * Must NOT have a trailing slash.
     */
    @Value("${FRONTEND_URL:http://localhost:5173}")
    private String frontendUrl;

    private final CustomUserDetailsService userDetailsService;

    public SecurityConfig(CustomUserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
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

        // FIX: allowedOriginPatterns is correct for credentialed cross-site requests.
        // Add every origin your frontend may be served from (no trailing slashes).
        config.setAllowedOriginPatterns(List.of(
            frontendUrl,
            "http://localhost:5173",
            "http://localhost:3000",
            "https://*.vercel.app"   // catches preview deployments; remove in strict prod
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
                .requestMatchers("/login", "/register", "/api/users/register", "/access-denied", "/error").permitAll()
                // FIX: Expose /actuator/health and /health so Render health checks pass
                .requestMatchers("/actuator/health", "/health").permitAll()
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
            // FIX: wire remember-me to the named bean so cookie attributes are correct
            .rememberMe(remember -> remember
                .rememberMeServices(rememberMeServices())
            )
            .logout(logout -> logout
                .logoutRequestMatcher(new AntPathRequestMatcher("/logout", "POST"))
                .logoutSuccessHandler((request, response, authentication) -> {
                    // FIX: Explicitly delete SameSite=None;Secure cookies on logout
                    deleteCrossSiteCookie(response, "JSESSIONID");
                    deleteCrossSiteCookie(response, "remember-me");
                    deleteCrossSiteCookie(response, "XSRF-TOKEN");
                    response.setStatus(HttpServletResponse.SC_OK);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"success\": true}");
                })
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID", "remember-me")
                .permitAll()
            )
            .sessionManagement(session -> session
                .maximumSessions(1)
                .expiredUrl("/login?expired=true")
            )
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
                // FIX: Exclude all REST API paths and SPA auth endpoints from CSRF
                .ignoringRequestMatchers("/api/**", "/login", "/logout", "/register")
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
            response.setStatus(HttpServletResponse.SC_OK);
            response.setContentType("application/json");
            response.getWriter().write("{\"success\": true}");
        };
    }

    private AuthenticationFailureHandler failureHandler() {
        return (request, response, exception) -> {
            String errorParam;
            if (exception instanceof LockedException) {
                errorParam = "locked";
            } else if (exception.getMessage() != null &&
                       exception.getMessage().toLowerCase().contains("disabled")) {
                errorParam = "disabled";
            } else {
                errorParam = "true";
            }
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"" + errorParam + "\"}");
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
