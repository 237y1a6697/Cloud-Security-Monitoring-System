/**
 * assetService.js
 *
 * Replaces: dashboard.js → loadAssets, renderAssetsTable, saveAsset, deleteAsset
 *           Thymeleaf: assets.html  → page-assets section inside dashboard.html
 * Purpose : Full CRUD operations for IT assets.
 * API     : /api/assets  (AssetController.java)
 * RBAC    : ASSET_VIEW / ASSET_CREATE / ASSET_EDIT / ASSET_DELETE
 */

import axiosInstance from '../api/axios.js';

const assetService = {
    /** Fetch all assets (ASSET_VIEW) */
    getAll: () => axiosInstance.get('/api/assets'),

    /** Fetch single asset by ID */
    getById: (id) => axiosInstance.get(`/api/assets/${id}`),

    /** Create new asset (ASSET_CREATE) */
    create: (data) => axiosInstance.post('/api/assets', data),

    /** Full update of existing asset (ASSET_EDIT) */
    update: (id, data) => axiosInstance.put(`/api/assets/${id}`, data),

    /** Delete asset by ID (ASSET_DELETE) */
    delete: (id) => axiosInstance.delete(`/api/assets/${id}`),

    /** Keyword search across name, type, location */
    search: (keyword) => axiosInstance.get('/api/assets/search', { params: { keyword } }),

    /** Filter by status: Healthy | Warning | Critical | Offline */
    byStatus: (status) => axiosInstance.get(`/api/assets/status/${status}`),
};

export default assetService;
