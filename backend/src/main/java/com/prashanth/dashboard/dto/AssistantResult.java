package com.prashanth.dashboard.dto;

import java.util.List;

/**
 * Result returned by the SentinelCoreAssistantService containing both
 * the answered text, dynamic context-aware suggestions, and guided workflow status.
 */
public record AssistantResult(
    String text,
    List<String> suggestions,
    String intent,
    Integer step,
    Integer totalSteps
) {
    public AssistantResult(String text, List<String> suggestions) {
        this(text, suggestions, null, null, null);
    }
}

