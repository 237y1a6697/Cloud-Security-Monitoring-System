package com.prashanth.dashboard.controller;

import com.prashanth.dashboard.model.Incident;
import com.prashanth.dashboard.service.IncidentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

  @Autowired
  private IncidentService incidentService;

  // Get all incidents — all authenticated roles with INCIDENT_VIEW
  @GetMapping
  @PreAuthorize("hasAuthority('INCIDENT_VIEW')")
  public List<Incident> getAllIncidents() {
    return incidentService.getAllIncidents();
  }

  // Create a new incident — roles that can create
  @PostMapping
  @PreAuthorize("hasAuthority('INCIDENT_CREATE')")
  public Incident createIncident(@RequestBody Incident incident) {
    return incidentService.createIncident(incident);
  }

  // Get incident by ID
  @GetMapping("/{id}")
  @PreAuthorize("hasAuthority('INCIDENT_VIEW')")
  public Incident getIncidentById(@PathVariable Long id) {
    return incidentService.getIncidentById(id);
  }

  // Update incident — roles that can manage/edit
  @PutMapping("/{id}")
  @PreAuthorize("hasAuthority('INCIDENT_MANAGE')")
  public Incident updateIncident(@PathVariable Long id,
                                 @RequestBody Incident incident) {
    return incidentService.updateIncident(id, incident);
  }

  // Delete incident — only roles with full delete permission
  @DeleteMapping("/{id}")
  @PreAuthorize("hasAuthority('INCIDENT_DELETE')")
  public void deleteIncident(@PathVariable Long id) {
    incidentService.deleteIncident(id);
  }

  // Dashboard stats — any role that can view incidents
  @GetMapping("/dashboard")
  @PreAuthorize("hasAuthority('INCIDENT_VIEW')")
  public com.prashanth.dashboard.dto.IncidentStatusDTO getIncidentDashboard() {
    java.util.List<com.prashanth.dashboard.dto.StatusCount> counts = incidentService.getIncidentStatusCounts();
    com.prashanth.dashboard.dto.IncidentStatusDTO dto = new com.prashanth.dashboard.dto.IncidentStatusDTO();
    dto.setStatusCounts(counts != null ? counts : java.util.List.of());
    return dto;
  }
}
