package com.prashanth.dashboard.dto;

import java.time.LocalDateTime;
import java.util.List;

public class IncidentTrendDTO {
    private List<TrendPoint> trendPoints;

    public IncidentTrendDTO() {}

    public IncidentTrendDTO(List<TrendPoint> trendPoints) {
        this.trendPoints = trendPoints;
    }

    public List<TrendPoint> getTrendPoints() { return trendPoints; }
    public void setTrendPoints(List<TrendPoint> trendPoints) { this.trendPoints = trendPoints; }

}