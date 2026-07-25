/**
 * userService.js
 *
 * Replaces: dashboard.js → loadUsers, deleteUser
 * Purpose : User administration — list users, assign roles, toggle enabled state,
 *           reset passwords, delete users.
 * API     : /api/users  (UserController.java)
 * RBAC    : USER_MANAGE / ROLE_ASSIGN
 */

import axiosInstance from '../api/axios.js';

const userService = {
    /** Fetch all users (USER_MANAGE) */
    getAll: () => axiosInstance.get('/api/users'),

    /**
     * Assign a new role to a user.
     * @param {number} id   - User DB ID
     * @param {string} role - e.g. 'ROLE_ANALYST'
     */
    assignRole: (id, role) =>
        axiosInstance.put(`/api/users/${id}/role`, null, { params: { role } }),

    /**
     * Enable or disable a user account.
     * @param {number}  id      - User DB ID
     * @param {boolean} enabled - true to enable, false to disable
     */
    setEnabled: (id, enabled) =>
        axiosInstance.put(`/api/users/${id}/disable`, null, { params: { enabled } }),

    /**
     * Force-reset a user's password.
     * @param {number} id          - User DB ID
     * @param {string} newPassword - New plaintext password (hashed server-side)
     */
    resetPassword: (id, newPassword) =>
        axiosInstance.put(`/api/users/${id}/reset-password`, null, { params: { newPassword } }),

    /** Permanently delete a user account (USER_MANAGE) */
    delete: (id) => axiosInstance.delete(`/api/users/${id}`),
};

export default userService;
