/**
 * DashboardLayout.jsx
 *
 * Replaces: The overall layout wrapper from dashboard.html (lines 586-1555)
 * Purpose : Renders the top Navbar and left Sidebar, wrapping the page-specific
 *           main content area. Integrates the ToastProvider.
 *
 * State   : Manages the `collapsed` sidebar state, allowing it to be shared/synchronized.
 */

import { useState } from 'react';
import Navbar from '../components/common/Navbar/Navbar.jsx';
import Sidebar from '../components/common/Sidebar/Sidebar.jsx';

export default function DashboardLayout({ children }) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="app-container" id="appBody">
            {/* Navbar */}
            <Navbar />

            {/* Dashboard body grid */}
            <div className="dashboard-body">
                {/* Sidebar */}
                <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

                {/* Main content viewport */}
                <main className="main-content">
                    {children}
                </main>
            </div>
        </div>
    );
}
