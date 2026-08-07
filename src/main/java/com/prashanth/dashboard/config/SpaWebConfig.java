package com.prashanth.dashboard.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

@Configuration
public class SpaWebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requestedResource = location.createRelative(resourcePath);
                        if (requestedResource.exists() && requestedResource.isReadable()) {
                            return requestedResource;
                        }
                        // Do not route API, Actuator, or Health endpoints to index.html
                        if (resourcePath.startsWith("api") || resourcePath.startsWith("actuator") || resourcePath.startsWith("health")) {
                            return null;
                        }
                        
                        Resource indexResource = new ClassPathResource("/static/index.html");
                        if (indexResource.exists() && indexResource.isReadable()) {
                            return indexResource;
                        }
                        return null;
                    }
                });
    }
}
