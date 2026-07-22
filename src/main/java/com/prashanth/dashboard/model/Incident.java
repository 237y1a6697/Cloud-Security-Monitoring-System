package com.prashanth.dashboard.model;
import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Table;

@Entity
@Table(name = "incidents")
public class Incident {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private String incidentId;
  private String title;
  private String description;
  private String severity;
  private String status;
  private String assignedTeam;
  private String assignedTo;
  private Integer slaHours;
  private LocalDateTime createdAt;
  private LocalDateTime resolvedAt;

  public Incident(Long id, String incidentId, String title, String description, String severity, String status, String assignedTeam, String assignedTo, Integer slaHours, LocalDateTime createdAt, LocalDateTime resolvedAt) {
    this.id = id;
    this.incidentId = incidentId;
    this.title = title;
    this.description = description;
    this.severity = severity;
    this.status = status;
    this.assignedTeam = assignedTeam;
    this.assignedTo = assignedTo;
    this.slaHours = slaHours;
    this.createdAt = createdAt;
    this.resolvedAt = resolvedAt;
  }
  public Incident() {
  }
  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getIncidentId() {
    return incidentId;
  }

  public void setIncidentId(String incidentId) {
    this.incidentId = incidentId;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getSeverity() {
    return severity;
  }

  public void setSeverity(String severity) {
    this.severity = severity;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public String getAssignedTeam() {
    return assignedTeam;
  }

  public void setAssignedTeam(String assignedTeam) {
    this.assignedTeam = assignedTeam;
  }

  public String getAssignedTo() {
    return assignedTo;
  }

  public void setAssignedTo(String assignedTo) {
    this.assignedTo = assignedTo;
  }

  public Integer getSlaHours() {
    return slaHours;
  }

  public void setSlaHours(Integer slaHours) {
    this.slaHours = slaHours;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public LocalDateTime getResolvedAt() {
    return resolvedAt;
  }

  public void setResolvedAt(LocalDateTime resolvedAt) {
    this.resolvedAt = resolvedAt;
  }
}
