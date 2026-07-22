package com.prashanth.dashboard.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collection;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;

    public SecurityConfig(CustomUserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/css/**", "/js/**", "/images/**", "/webjars/**", "/fonts/**").permitAll()
                .requestMatchers("/login", "/register", "/access-denied").permitAll()
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
            .rememberMe(remember -> remember
                .key("sentinelcore-remember-me-key")
                .tokenValiditySeconds(7 * 24 * 60 * 60) // 7 days
                .userDetailsService(userDetailsService)
            )
            .logout(logout -> logout
                .logoutRequestMatcher(new AntPathRequestMatcher("/logout", "POST"))
                .logoutSuccessUrl("/login?logout=true")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID", "remember-me")
                .permitAll()
            )
            .sessionManagement(session -> session
                .maximumSessions(1)
                .expiredUrl("/login?expired=true")
            )
            .csrf(csrf -> csrf
                .ignoringRequestMatchers("/api/**") // Keep CSRF off for REST API
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    if (request.getRequestURI().startsWith("/api/")) {
                        response.setStatus(401);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"error\": \"401 Unauthorized — please log in\"}");
                    } else {
                        response.sendRedirect("/login");
                    }
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    if (request.getRequestURI().startsWith("/api/")) {
                        response.setStatus(403);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"error\": \"403 Access Denied — insufficient permissions\"}");
                    } else {
                        response.sendRedirect("/access-denied");
                    }
                })
            );

        return http.build();
    }

    /** Role-based redirect after successful login. */
    private AuthenticationSuccessHandler successHandler() {
        return (request, response, authentication) -> {
            String redirect = determineTargetUrl(authentication.getAuthorities());
            response.sendRedirect(redirect);
        };
    }

    private String determineTargetUrl(Collection<? extends GrantedAuthority> authorities) {
        for (GrantedAuthority auth : authorities) {
            switch (auth.getAuthority()) {
                case "ROLE_SUPER_ADMIN":
                case "ROLE_ADMIN":
                    return "/dashboard";
                case "ROLE_SOC_MANAGER":
                case "ROLE_SECURITY_ANALYST":
                case "ROLE_INCIDENT_RESPONDER":
                case "ROLE_DEVSECOPS":
                case "ROLE_INFRA_ENGINEER":
                    return "/dashboard";
                case "ROLE_AUDITOR":
                case "ROLE_VIEWER":
                    return "/dashboard";
            }
        }
        return "/dashboard";
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
            response.sendRedirect("/login?error=" + errorParam);
        };
    }
}
