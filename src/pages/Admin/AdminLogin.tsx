import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { adminLoginSuccess, adminLoginFailure } from '../../store/authSlice';
import { adminAuthService } from '../../services/admin/adminAuthService';
import '../../styles/admin-variables.css';

const AdminLogin: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const result = await adminAuthService.login({ email, password });

            if (result.success && result.data) {
                // Store token for apiClient
                localStorage.setItem('admin_accessToken', result.data.accessToken);
                localStorage.setItem('admin_data', JSON.stringify(result.data.user));

                // Dispatch to Redux store using exact user info
                dispatch(adminLoginSuccess(result.data.user));

                toast.success('Login Successful!');
                const from = (location.state as any)?.from?.pathname || '/admin/dashboard';
                navigate(from, { replace: true });
            } else {
                dispatch(adminLoginFailure(result.message || 'Login Failed'));
                toast.error(result.message || 'Login Failed');
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to connect to the server';
            dispatch(adminLoginFailure(errorMsg));
            toast.error(errorMsg);
        }
    };

    return (
        <div className="page-content admin-body" style={{ backgroundColor: 'var(--admin-bg)', minHeight: '100vh' }}>
            <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="login-form" style={{ maxWidth: '400px', width: '100%', background: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid var(--admin-card-border)' }}>
                    <div className="section-head text-center">
                        <h2 className="title">Admin Login</h2>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div className="form-group mb-4">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                className="form-control"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group mb-4">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group mb-0">
                            <button type="submit" className="btn w-100" style={{ backgroundColor: 'var(--admin-primary-dark)', color: '#fff', borderRadius: '12px', fontWeight: '600', padding: '12px' }}>Login</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
