package com.prashanth.dashboard.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Auto-detects whether the configured AI API key belongs to OpenAI (sk-prefix)
 * or xAI Grok (xai-prefix) and overrides the base-url and model properties
 * accordingly before the Spring ApplicationContext starts.
 *
 * This means users can drop in either an OpenAI key or an xAI Grok key in
 * OPENAI_API_KEY without any other configuration changes.
 */
public class AiProviderAutoDetectPostProcessor implements EnvironmentPostProcessor {

    private static final Logger log = LoggerFactory.getLogger(AiProviderAutoDetectPostProcessor.class);

    private static final String SOURCE_NAME         = "aiProviderAutoDetect";
    private static final String PROP_BASE_URL       = "spring.ai.openai.base-url";
    private static final String PROP_MODEL          = "spring.ai.openai.chat.options.model";
    private static final String OPENAI_BASE_URL     = "https://api.openai.com";
    private static final String OPENAI_DEFAULT_MODEL = "gpt-4o";
    private static final String XAI_BASE_URL        = "https://api.x.ai";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String apiKey = environment.getProperty("spring.ai.openai.api-key", "");
        if (apiKey == null || apiKey.isBlank()) {
            return; // key not set; no-op
        }

        String currentBaseUrl = environment.getProperty(PROP_BASE_URL, XAI_BASE_URL);
        String currentModel   = environment.getProperty(PROP_MODEL,    "gpt-4o");

        Map<String, Object> overrides = new LinkedHashMap<>();

        if (apiKey.trim().startsWith("sk-")) {
            // OpenAI key detected
            if (currentBaseUrl.contains("api.x.ai")) {
                overrides.put(PROP_BASE_URL, OPENAI_BASE_URL);
                log.info("[AI Provider] OpenAI key detected (sk- prefix). " +
                         "Overriding base-url from '{}' → '{}'.", currentBaseUrl, OPENAI_BASE_URL);
            }
            if (currentModel.startsWith("grok")) {
                overrides.put(PROP_MODEL, OPENAI_DEFAULT_MODEL);
                log.info("[AI Provider] OpenAI key detected (sk- prefix). " +
                         "Overriding model from '{}' → '{}'.", currentModel, OPENAI_DEFAULT_MODEL);
            }
        } else if (apiKey.trim().startsWith("xai-")) {
            // xAI key detected
            if (!currentBaseUrl.contains("api.x.ai")) {
                overrides.put(PROP_BASE_URL, XAI_BASE_URL);
                log.info("[AI Provider] xAI Grok key detected (xai- prefix). " +
                         "Overriding base-url from '{}' → '{}'.", currentBaseUrl, XAI_BASE_URL);
            }
        } else {
            log.warn("[AI Provider] API key prefix '{}...' is not recognised. " +
                     "Expected 'xai-' (xAI Grok) or 'sk-' (OpenAI). " +
                     "Using configured base-url and model as-is.",
                     apiKey.length() > 6 ? apiKey.substring(0, 6) : apiKey);
        }

        if (!overrides.isEmpty()) {
            // Highest-priority property source so it beats application.properties
            environment.getPropertySources().addFirst(new MapPropertySource(SOURCE_NAME, overrides));
        }
    }
}
