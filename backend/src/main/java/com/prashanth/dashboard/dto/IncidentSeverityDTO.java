package com.prashanth.dashboard.dto;

import java.util.List;

public class IncidentSeverityDTO {
    private List<SeverityCount> severityCounts;

    public IncidentSeverityDTO() {}

    public IncidentSeverityDTO(List<SeverityCount> severityCounts) {
        this.severityCounts = severityCounts;
    }

    public List<SeverityCount> getSeverityCounts() { return severityCounts; }
    public void setSeverityCounts(List<SeverityCount> severityCounts) { this.severityCounts = severityCounts; }

}