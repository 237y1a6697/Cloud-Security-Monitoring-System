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

@Configuration
public class OAuth2ClientRegistrationConfig {
    private static final Logger logger = LoggerFactory.getLogger(OAuth2ClientRegistrationConfig.class);

    @Bean
    @ConditionalOnMissingBean(ClientRegistrationRepository.class)
    public ClientRegistrationRepository clientRegistrationRepository(Environment env) {
        // Support both Spring-style env names and short GOOGLE_* names for operator convenience
        // Check Spring property-style keys first (dot-separated), then env-style uppercase keys, then short GOOGLE_* fallbacks.
        String clientId = env.getProperty("spring.security.oauth2.client.registration.google.client-id");
        String clientSecret = env.getProperty("spring.security.oauth2.client.registration.google.client-secret");

        if ((clientId == null || clientId.isBlank())) {
            clientId = env.getProperty("SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID");
        }
        if ((clientSecret == null || clientSecret.isBlank())) {
            clientSecret = env.getProperty("SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET");
        }

        if ((clientId == null || clientId.isBlank()) && env.getProperty("GOOGLE_CLIENT_ID") != null) {
            clientId = env.getProperty("GOOGLE_CLIENT_ID");
        }
        if ((clientSecret == null || clientSecret.isBlank()) && env.getProperty("GOOGLE_CLIENT_SECRET") != null) {
            clientSecret = env.getProperty("GOOGLE_CLIENT_SECRET");
        }

        if (clientId != null && !clientId.isBlank() && clientSecret != null && !clientSecret.isBlank()) {
            logger.info("Found Google OAuth2 client credentials in environment; creating ClientRegistrationRepository.");
            ClientRegistration googleRegistration = CommonOAuth2Provider.GOOGLE
                    .getBuilder("google")
                    .clientId(clientId)
                    .clientSecret(clientSecret)
                    .scope("openid", "profile", "email")
                    .build();
            return new InMemoryClientRegistrationRepository(googleRegistration);
        }

        StringBuilder sb = new StringBuilder();
        sb.append("Google OAuth2 client credentials are not configured. Set environment variables:\n");
        sb.append("  SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID\n");
        sb.append("  SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET\n");
        sb.append("Or set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET as shortcuts.\n");
        logger.error(sb.toString());

        // Fail fast with a clear error so operators add the missing secrets. SecurityConfig requires this bean.
        throw new IllegalStateException(sb.toString());
    }
}
