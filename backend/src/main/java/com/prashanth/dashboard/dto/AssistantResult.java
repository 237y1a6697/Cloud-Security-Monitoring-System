package com.prashanth.dashboard.dto;

import java.util.List;

/**
 * Result returned by the SentinelCoreAssistantService containing both
 * the answered text and dynamic context-aware suggestions.
 */
public record AssistantResult(
    String text,
    List<String> suggestions
) {}
