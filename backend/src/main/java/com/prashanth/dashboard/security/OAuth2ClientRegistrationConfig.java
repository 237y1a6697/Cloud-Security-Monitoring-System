package com.prashanth.dashboard.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;

/**
 * OAuth2ClientRegistrationConfig
 *
 * Registers a ClientRegistrationRepository bean for Google OAuth2 login.
 *
 * DESIGN: Google credentials are OPTIONAL.
 *  - When GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are present → Google OAuth2 is enabled.
 *  - When credentials are absent → a null bean is registered so that SecurityConfig can
 *    detect this and skip the .oauth2Login() configuration entirely, allowing the app to
 *    start normally using username/password login only.
 *
 * This prevents startup crashes when operators have not configured OAuth2.
 */
@Configuration
public class OAuth2ClientRegistrationConfig {

    private static final Logger logger = LoggerFactory.getLogger(OAuth2ClientRegistrationConfig.class);

    /**
     * Returns a ClientRegistrationRepository if Google credentials are present,
     * or null if they are not. SecurityConfig checks for null to decide whether
     * to enable oauth2Login.
     *
     * NOTE: This bean is nullable — callers must null-check it.
     */
    @Bean(name = "googleClientRegistrationRepository")
    public ClientRegistrationRepository clientRegistrationRepository(Environment env) {

        // Support both Spring-style property names and short GOOGLE_* shortcut names
        String clientId = env.getProperty("spring.security.oauth2.client.registration.google.client-id");
        String clientSecret = env.getProperty("spring.security.oauth2.client.registration.google.client-secret");

        if (clientId == null || clientId.isBlank()) {
            clientId = env.getProperty("SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID");
        }
        if (clientSecret == null || clientSecret.isBlank()) {
            clientSecret = env.getProperty("SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET");
        }
        if (clientId == null || clientId.isBlank()) {
            clientId = env.getProperty("GOOGLE_CLIENT_ID");
        }
        if (clientSecret == null || clientSecret.isBlank()) {
            clientSecret = env.getProperty("GOOGLE_CLIENT_SECRET");
        }

        boolean configured = clientId != null && !clientId.isBlank()
                          && clientSecret != null && !clientSecret.isBlank();

        if (configured) {
            logger.info("Google OAuth2 credentials found — Google login is ENABLED.");
            ClientRegistration googleRegistration = CommonOAuth2Provider.GOOGLE
                    .getBuilder("google")
                    .clientId(clientId)
                    .clientSecret(clientSecret)
                    .scope("openid", "profile", "email")
                    .build();
            return new InMemoryClientRegistrationRepository(googleRegistration);
        }

        // Credentials not set — Google login disabled.
        // Returns an empty repository instead of null. Spring Security's OAuth2 AuthorizedClientManager
        // strictly requires a bean of this type to be present, otherwise application startup crashes.
        logger.warn("Google OAuth2 credentials are NOT configured. "
            + "Google login is DISABLED. Application will start with username/password login only. "
            + "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on Render to enable Google login.");
        
        return new ClientRegistrationRepository() {
            @Override
            public ClientRegistration findByRegistrationId(String registrationId) {
                return null;
            }
        };
    }

    /**
     * Convenience flag for SecurityConfig to check whether to enable oauth2Login.
     * @return true if Google credentials are configured
     */
    public boolean isGoogleConfigured(Environment env) {
        ClientRegistrationRepository repo = clientRegistrationRepository(env);
        return repo.findByRegistrationId("google") != null;
    }
}
