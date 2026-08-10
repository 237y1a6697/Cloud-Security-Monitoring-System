import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import Loader from '../../components/common/Loader/Loader.jsx';
import { useToast } from '../../components/common/Toast/Toast.jsx';
import userService from '../../services/userService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Swal from 'sweetalert2';

export default function UsersPage() {
    const showToast = useToast();
    const { hasPermission } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    async function fetchUsers() {
        try {
            const res = await userService.getAll();
            setUsers(res.data || []);
        } catch {
            showToast('Failed to load user administration list', 'error');
        }
    }

    useEffect(() => {
        fetchUsers().then(() => setLoading(false));
    }, []);

    async function handleRoleChange(id, username, currentRole, newRole) {
        if (!hasPermission('ROLE_ASSIGN')) {
            Swal.fire('Access Denied', 'You do not have permission to assign roles.', 'error');
            return;
        }

        try {
            await userService.assignRole(id, newRole);
            showToast(`Assigned role ${newRole} to ${username}`, 'success');
            fetchUsers();
        } catch {
            showToast('Failed to update user role', 'error');
        }
    }

    async function handleToggleStatus(id, username, currentEnabled) {
        if (!hasPermission('USER_MANAGE')) {
            Swal.fire('Access Denied', 'You do not have permission to manage users.', 'error');
            return;
        }

        const stateStr = currentEnabled ? 'disable' : 'enable';
        const confirm = await Swal.fire({
            title: `${currentEnabled ? 'Disable' : 'Enable'} User?`,
            text: `Are you sure you want to ${stateStr} ${username}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3a7bd5',
            cancelButtonColor: '#d53a3a',
        });

        if (confirm.isConfirmed) {
            try {
                await userService.setEnabled(id, !currentEnabled);
                showToast(`User ${username} ${currentEnabled ? 'disabled' : 'enabled'} successfully`, 'success');
                fetchUsers();
            } catch {
                showToast('Failed to update user status', 'error');
            }
        }
    }

    async function handleResetPassword(id, username) {
        if (!hasPermission('USER_MANAGE')) {
            Swal.fire('Access Denied', 'You do not have permission to manage users.', 'error');
            return;
        }

        const { value: password } = await Swal.fire({
            title: 'Reset Password',
            input: 'password',
            inputLabel: `Enter new password for ${username}`,
            inputPlaceholder: 'New password',
            showCancelButton: true,
            confirmButtonColor: '#3a7bd5',
            inputValidator: (value) => {
                if (!value) {
                    return 'Password cannot be empty!';
                }
                if (value.length < 6) {
                    return 'Password must be at least 6 characters long!';
                }
            }
        });

        if (password) {
            try {
                await userService.resetPassword(id, password);
                Swal.fire('Success', `Password for ${username} has been reset.`, 'success');
            } catch {
                showToast('Failed to reset password', 'error');
            }
        }
    }

    async function handleDelete(id, username) {
        if (!hasPermission('USER_MANAGE')) {
            Swal.fire('Access Denied', 'You do not have permission to manage users.', 'error');
            return;
        }

        const confirm = await Swal.fire({
            title: 'Delete User?',
            text: `Are you sure you want to permanently delete user ${username}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d53a3a',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete!'
        });

        if (confirm.isConfirmed) {
            try {
                await userService.delete(id);
                showToast(`User ${username} deleted successfully`, 'success');
                fetchUsers();
            } catch {
                showToast('Failed to delete user', 'error');
            }
        }
    }

    const roleOptions = [
        'ROLE_SUPER_ADMIN',
        'ROLE_ADMIN',
        'ROLE_SOC_MANAGER',
        'ROLE_SECURITY_ANALYST',
        'ROLE_INCIDENT_RESPONDER',
        'ROLE_INFRA_ENGINEER',
        'ROLE_DEVSECOPS',
        'ROLE_AUDITOR',
        'ROLE_VIEWER'
    ];

    return (
        <DashboardLayout>
            <section className="content-header" style={{ marginBottom: 20 }}>
                <h1>User Administration &amp; Identity <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>RBAC configuration</span></h1>
            </section>

            {loading ? <Loader /> : (
                <div className="panel-card">
                    <h2 className="panel-title" style={{ marginBottom: 15 }}>Managed Security Identities</h2>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No user records found.</td>
                                    </tr>
                                ) : (
                                    users.map((user) => {
                                        const role =
                                            user.primaryRoleName ||
                                            user.roles?.[0] ||
                                            "No Role";
                                        return (
                                            <tr key={user.id}>
                                                <td>{user.id}</td>
                                                <td><strong>{user.username}</strong></td>
                                                <td>{user.email || '—'}</td>
                                                <td>
                                                    {hasPermission('ROLE_ASSIGN') ? (
                                                        <select
                                                            value={role}
                                                            onChange={(e) => handleRoleChange(user.id, user.username, role, e.target.value)}
                                                            style={{ padding: '4px 8px', border: '1px solid var(--border-color)', borderRadius: 4, background: 'var(--bg-inset)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                                                        >
                                                            {role === "No Role" && <option value="No Role">No Role</option>}
                                                            {roleOptions.map((opt) => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <span className="badge badge-info">{role}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`badge badge-status ${user.enabled ? 'ok' : 'alert'}`}>
                                                        {user.enabled ? 'Enabled' : 'Disabled'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <button
                                                            className="btn btn-warning"
                                                            style={{ width: 'auto', padding: '3px 8px', fontSize: '0.75rem', background: '#FFB300', border: 'none', color: '#000' }}
                                                            onClick={() => handleResetPassword(user.id, user.username)}
                                                        >
                                                            Reset PW
                                                        </button>
                                                        <button
                                                            className="btn"
                                                            style={{ width: 'auto', padding: '3px 8px', fontSize: '0.75rem', background: user.enabled ? '#E53935' : '#43A047', border: 'none' }}
                                                            onClick={() => handleToggleStatus(user.id, user.username, user.enabled)}
                                                        >
                                                            {user.enabled ? 'Disable' : 'Enable'}
                                                        </button>
                                                        <button
                                                            className="btn btn-red"
                                                            style={{ width: 'auto', padding: '3px 8px', fontSize: '0.75rem', background: 'linear-gradient(135deg, var(--danger-red), #EF5350)', border: 'none' }}
                                                            onClick={() => handleDelete(user.id, user.username)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
