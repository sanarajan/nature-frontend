import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { userAuthService } from '../../services/user/userAuthService';

// Asset Imports
import pic1 from '../../assets/images/registration/pic1.jpg';

const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [invalidToken, setInvalidToken] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            setInvalidToken(true);
            setError("This password reset link is invalid or has expired. Please request a new password reset link.");
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!token) {
            setInvalidToken(true);
            setError("This password reset link is invalid or has expired. Please request a new password reset link.");
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Confirm Password does not match New Password.');
            return;
        }

        setLoading(true);

        try {
            const res = await userAuthService.resetPassword(token, newPassword);
            if (res.success) {
                setSuccessMessage(res.message || "Your password has been reset successfully.");
                setTimeout(() => {
                    navigate('/login', { replace: true });
                }, 3000);
            } else {
                setInvalidToken(true);
                setError(res.message || "This password reset link is invalid or has expired. Please request a new password reset link.");
            }
        } catch (err: any) {
            setInvalidToken(true);
            let message = "This password reset link is invalid or has expired. Please request a new password reset link.";
            if (err.response?.data?.message) {
                message = err.response.data.message;
            }
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-content bg-light">
            <section className="px-3">
                <div className="row align-items-center justify-content-center min-vh-100">
                    <div className="col-xxl-6 col-xl-6 col-lg-6">
                        <div className="login-area p-4">
                            <h2 className="login-head mb-1">Reset Password</h2>
                            <p className="m-b25 fw-light">Please enter your new password below.</p>

                            {error && <div className="alert alert-danger mb-4">{error}</div>}

                            {successMessage ? (
                                <div>
                                    <div className="alert alert-success mb-4" role="alert">
                                        {successMessage}
                                    </div>
                                    <p className="mb-3 text-muted">Redirecting to login page in 3 seconds...</p>
                                    <Link to="/login" className="btn btn-secondary btn-lg w-100 text-uppercase text-center">
                                        Login Now
                                    </Link>
                                </div>
                            ) : invalidToken ? (
                                <div>
                                    <Link to="/forgot-password" className="btn btn-secondary btn-lg w-100 text-uppercase text-center">
                                        Forgot Password
                                    </Link>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="label-title">New Password</label>
                                        <div className="input-group">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                required
                                                className="form-control"
                                                placeholder="New Password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                            />
                                            <button className="btn btn-outline-secondary" type="button" onClick={() => setShowPassword(!showPassword)}>
                                                {showPassword ? "Hide" : "Show"}
                                            </button>
                                        </div>
                                        <small className="form-text text-muted">Must be at least 8 characters long.</small>
                                    </div>
                                    <div className="mb-4">
                                        <label className="label-title">Confirm Password</label>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            className="form-control"
                                            placeholder="Confirm Password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                    <button type="submit" disabled={loading} className="btn btn-secondary btn-lg w-100 text-uppercase mb-3">
                                        {loading ? 'Resetting...' : 'Reset Password'}
                                    </button>
                                    <div className="text-center mt-3">
                                        <Link to="/login" className="text-primary fw-bold">Back to Login</Link>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                    <div className="col-xxl-6 col-xl-6 col-lg-6 d-none d-lg-block p-0">
                        <div className="banner-login min-vh-100 d-flex align-items-end" style={{ backgroundImage: `url(${pic1})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                            <div className="banner-content p-5 text-white bg-dark bg-opacity-50 w-100">
                                <h2 className="title mb-3">Skin, a canvas of life's journey, bears the marks of resilience and the glow of inner vitality.</h2>
                                <div className="rating-box">
                                    <h4 className="rating-title">Sophie Hall</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ResetPassword;
