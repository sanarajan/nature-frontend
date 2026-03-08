import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

interface GuestRouteProps {
    children: React.ReactNode;
    type: 'user' | 'admin';
}

const GuestRoute: React.FC<GuestRouteProps> = ({ children, type }) => {
    const { user, admin } = useSelector((state: RootState) => state.auth);
    const location = useLocation();

    if (type === 'admin') {
        if (admin.isAuthenticated || localStorage.getItem('admin_accessToken')) {
            return <Navigate to="/admin/dashboard" replace />;
        }
    } else {
        if (user.isAuthenticated || localStorage.getItem('user_accessToken')) {
            // Check if there's a specific page to redirect back to, e.g., checkout
            const from = (location.state as any)?.from?.pathname || "/";
            return <Navigate to={from} replace />;
        }
    }

    return <>{children}</>;
};

export default GuestRoute;
