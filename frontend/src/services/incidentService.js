/**
 * incidentService.js
 *
 * Replaces: dashboard.js → loadIncidents, saveIncident, deleteIncident, filterIncidents
 * Purpose : Full CRUD operations for security incidents.
 * API     : /api/incidents  (IncidentController.java)
 * RBAC    : INCIDENT_VIEW / INCIDENT_CREATE / INCIDENT_MANAGE / INCIDENT_DELETE
 */

import axiosInstance from '../api/axios.js';

const incidentService = {
    /** Fetch all incidents (INCIDENT_VIEW) */
    getAll: () => axiosInstance.get('/api/incidents'),

    /** Fetch single incident by database ID */
    getById: (id) => axiosInstance.get(`/api/incidents/${id}`),

    /** Create new incident (INCIDENT_CREATE) */
    create: (data) => axiosInstance.post('/api/incidents', data),

    /** Update existing incident (INCIDENT_MANAGE) */
    update: (id, data) => axiosInstance.put(`/api/incidents/${id}`, data),

    /** Delete incident (INCIDENT_DELETE) */
    delete: (id) => axiosInstance.delete(`/api/incidents/${id}`),
};

export default incidentService;
