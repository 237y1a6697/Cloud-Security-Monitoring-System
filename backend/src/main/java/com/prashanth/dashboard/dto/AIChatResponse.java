package com.prashanth.dashboard.dto;

import java.util.List;

public record AIChatResponse(
    String text,
    String timestamp,
    List<String> suggestions
) {
    public AIChatResponse(String text, String timestamp) {
        this(text, timestamp, List.of());
    }
}
