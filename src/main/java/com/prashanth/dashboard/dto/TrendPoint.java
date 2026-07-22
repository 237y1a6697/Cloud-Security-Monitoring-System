package com.prashanth.dashboard.dto;

import java.util.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class TrendPoint {
    private LocalDateTime date;
    private long count;

    public TrendPoint() {}

    public TrendPoint(LocalDateTime date, long count) {
        this.date = date;
        this.count = count;
    }

    public TrendPoint(LocalDate localDate, long count) {
        this.date = localDate != null ? localDate.atStartOfDay() : null;
        this.count = count;
    }

    public TrendPoint(Date date, long count) {
        this.date = date != null ? new java.sql.Timestamp(date.getTime()).toLocalDateTime() : null;
        this.count = count;
    }

    public LocalDateTime getDate() { return date; }
    public void setDate(LocalDateTime date) { this.date = date; }
    public long getCount() { return count; }
    public void setCount(long count) { this.count = count; }
}
