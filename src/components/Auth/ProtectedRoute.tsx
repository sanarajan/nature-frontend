import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

interface ProtectedRouteProps {
    children: React.ReactNode;
    type: 'user' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, type }) => {
    const { user, admin } = useSelector((state: RootState) => state.auth);
    const location = useLocation();

    if (type === 'admin') {
        if (!admin.isAuthenticated && !localStorage.getItem('admin_accessToken')) {
            return <Navigate to="/admin" state={{ from: location }} replace />;
        }
    } else {
        if (!user.isAuthenticated && !localStorage.getItem('user_accessToken')) {
            return <Navigate to="/login" state={{ from: location }} replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
