/**
 * infrastructureService.js
 *
 * Replaces: dashboard.js → loadInfrastructure, initLiveChart, initLiveTelemetry
 * Purpose : Fetches real-time system telemetry (CPU, memory, network, DB connections)
 *           used by the live rolling charts on the Infrastructure page.
 * API     : /api/infrastructure/telemetry  (InfrastructureController.java)
 * RBAC    : ASSET_VIEW
 */

import axiosInstance from '../api/axios.js';

const infrastructureService = {
    /**
     * Fetch current system telemetry snapshot.
     * Returns: { cpuCount, memoryPoolInfo, networkIoRate, activeInstances,
     *            vaultHsmStatus, dbConnections }
     */
    getTelemetry: () => axiosInstance.get('/api/infrastructure/telemetry'),
};

export default infrastructureService;
