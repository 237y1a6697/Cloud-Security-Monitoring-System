package com.prashanth.dashboard.dto;

import java.util.List;

public class IncidentStatusDTO {
    private List<StatusCount> statusCounts;

    public IncidentStatusDTO() {}

    public IncidentStatusDTO(List<StatusCount> statusCounts) {
        this.statusCounts = statusCounts;
    }

    public List<StatusCount> getStatusCounts() { return statusCounts; }
    public void setStatusCounts(List<StatusCount> statusCounts) { this.statusCounts = statusCounts; }

}