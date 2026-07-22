package com.prashanth.dashboard.controller;

import com.prashanth.dashboard.model.Incident;
import com.prashanth.dashboard.service.IncidentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

  @Autowired
  private IncidentService incidentService;

  // Get all incidents
  @GetMapping
  public List<Incident> getAllIncidents() {
    return incidentService.getAllIncidents();
  }

  // Create a new incident
  @PostMapping
  public Incident createIncident(@RequestBody Incident incident) {
    return incidentService.createIncident(incident);
  }

  // Get incident by ID
  @GetMapping("/{id}")
  public Incident getIncidentById(@PathVariable Long id) {
    return incidentService.getIncidentById(id);
  }

  // Update incident
  @PutMapping("/{id}")
  public Incident updateIncident(@PathVariable Long id,
                                 @RequestBody Incident incident) {
    return incidentService.updateIncident(id, incident);
  }

  // Delete incident
  @DeleteMapping("/{id}")
  public void deleteIncident(@PathVariable Long id) {
    incidentService.deleteIncident(id);
  }

  // Get incident status counts for dashboard chart
  @GetMapping("/dashboard")
  public com.prashanth.dashboard.dto.IncidentStatusDTO getIncidentDashboard() {
    java.util.List<com.prashanth.dashboard.dto.StatusCount> counts = incidentService.getIncidentStatusCounts();
    com.prashanth.dashboard.dto.IncidentStatusDTO dto = new com.prashanth.dashboard.dto.IncidentStatusDTO();
    dto.setStatusCounts(counts != null ? counts : java.util.List.of());
    return dto;
  }
}

