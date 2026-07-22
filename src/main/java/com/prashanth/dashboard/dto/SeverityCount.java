package com.prashanth.dashboard.dto;

public class SeverityCount {
    private String severity;
    private long count;

    public SeverityCount() {}
    public SeverityCount(String severity, long count) {
        this.severity = severity;
        this.count = count;
    }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public long getCount() { return count; }
    public void setCount(long count) { this.count = count; }
}
