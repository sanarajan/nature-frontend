import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Admin/Sidebar/Sidebar';
import Topbar from '../../components/Admin/Topbar/Topbar';
import '../../styles/admin-variables.css';
import './AdminLayout.css';

const AdminLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className={`admin-layout ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            <div className="admin-main-wrapper">
                <Topbar />
                <main className="admin-content">
                    <Outlet />
                </main>
                <footer className="admin-footer">
                    <p>&copy; 2024 Nature Admin Dashboard. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
};

export default AdminLayout;
