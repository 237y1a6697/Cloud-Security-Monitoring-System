package com.prashanth.dashboard.dto;

import java.util.List;

public record AIChatResponse(
    String text,
    String timestamp,
    List<String> suggestions,
    String intent,
    Integer step,
    Integer totalSteps
) {
    public AIChatResponse(String text, String timestamp) {
        this(text, timestamp, List.of(), null, null, null);
    }
    public AIChatResponse(String text, String timestamp, List<String> suggestions) {
        this(text, timestamp, suggestions, null, null, null);
    }
}

