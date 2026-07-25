/**
 * complianceService.js
 *
 * Replaces: dashboard.js → loadCompliance
 * Purpose : Retrieve regulatory compliance standards and per-control check results.
 * API     : /api/compliance  (ComplianceController.java)
 * RBAC    : COMPLIANCE_VIEW
 */

import axiosInstance from '../api/axios.js';

const complianceService = {
    /**
     * Fetch regulatory standards (ISO 27001, SOC 2, PCI DSS) with compliance scores.
     */
    getStandards: () => axiosInstance.get('/api/compliance/standards'),

    /**
     * Fetch the mapped policy control checks with PASS / WARNING status.
     */
    getControls: () => axiosInstance.get('/api/compliance/controls'),
};

export default complianceService;
