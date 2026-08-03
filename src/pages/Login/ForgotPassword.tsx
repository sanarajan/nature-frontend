import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { userAuthService } from '../../services/user/userAuthService';

// Asset Imports
import pic1 from '../../assets/images/registration/pic1.jpg';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        setLoading(true);

        try {
            const res = await userAuthService.forgotPassword(email);
            setSubmitted(true);
            setMessage(res.message || 'If an account exists with this email address, a password reset link has been sent.');
        } catch (err: any) {
            // Even in case of network/API error handling, set submitted state or standard error
            setSubmitted(true);
            setMessage('If an account exists with this email address, a password reset link has been sent.');
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
                            <h2 className="login-head mb-1">Forgot Password</h2>
                            <p className="m-b25 fw-light">Enter your registered email address to receive a password reset link.</p>

                            {error && <div className="alert alert-danger mb-4">{error}</div>}

                            {submitted ? (
                                <div>
                                    <div className="alert alert-success mb-4" role="alert">
                                        {message}
                                    </div>
                                    <Link to="/login" className="btn btn-secondary btn-lg w-100 text-uppercase text-center">
                                        Back to Login
                                    </Link>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-4">
                                        <label className="label-title">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            className="form-control"
                                            placeholder="Enter your email address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <button type="submit" disabled={loading} className="btn btn-secondary btn-lg w-100 text-uppercase mb-3">
                                        {loading ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPassword;
