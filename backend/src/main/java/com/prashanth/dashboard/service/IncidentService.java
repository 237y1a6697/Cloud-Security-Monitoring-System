package com.prashanth.dashboard.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.prashanth.dashboard.model.Incident;
import com.prashanth.dashboard.repository.IncidentRepository;

@Service
public class IncidentService {

  private final IncidentRepository incidentRepository;

  public IncidentService(IncidentRepository incidentRepository) {
    this.incidentRepository = incidentRepository;
  }

  // Create incident
  public Incident createIncident(Incident incident) {
 if (incident.getIncidentId() == null || incident.getIncidentId().trim().isEmpty()) {
 incident.setIncidentId("INC-" + System.currentTimeMillis());
 }
 incident.setCreatedAt(LocalDateTime.now());
 return incidentRepository.save(incident);
  }

  // Get incident by ID
  public Incident getIncidentById(Long id) {
    return incidentRepository.findById(id)
      .orElseThrow(() -> new RuntimeException("Incident not found"));
  }

  // Update incident
  public Incident updateIncident(Long id, Incident updatedIncident) {

    Incident incident = incidentRepository.findById(id)
      .orElseThrow(() -> new RuntimeException("Incident not found"));

    incident.setTitle(updatedIncident.getTitle());
    incident.setDescription(updatedIncident.getDescription());
    incident.setSeverity(updatedIncident.getSeverity());
    incident.setStatus(updatedIncident.getStatus());
    incident.setAssignedTeam(updatedIncident.getAssignedTeam());
    incident.setAssignedTo(updatedIncident.getAssignedTo());
    incident.setSlaHours(updatedIncident.getSlaHours());
    incident.setResolvedAt(updatedIncident.getResolvedAt());

    return incidentRepository.save(incident);
  }

  // Get all incidents
  public List<Incident> getAllIncidents() {
    return incidentRepository.findAll();
  }

  // Delete incident
  public void deleteIncident(Long id) {
    incidentRepository.deleteById(id);
  }

  // Get incident status counts for dashboard
  public List<com.prashanth.dashboard.dto.StatusCount> getIncidentStatusCounts() {
    return incidentRepository.getIncidentStatusCounts();
  }
}


