import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { userAuthService } from '../../services/user/userAuthService';

// Asset Imports
import pic2 from '../../assets/images/registration/pic2.jpg';

const Registration: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phoneNumber: '',
        password: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validateForm = () => {
        if (!formData.username || !formData.email || !formData.phoneNumber || !formData.password) {
            toast.error("Please fill in all fields.");
            return false;
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            toast.error("Please enter a valid email address.");
            return false;
        }

        // Mobile Number format validation (10 digits minimum, integers only)
        const phoneRegex = /^[0-9]{10,15}$/;
        if (!phoneRegex.test(formData.phoneNumber)) {
            toast.error("Please enter a valid mobile number (digits only, 10-15 digits).");
            return false;
        }

        if (formData.password.length < 8) {
            toast.error("Password must be at least 8 characters long.");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!validateForm()) return;

        setLoading(true);
        try {
            const res = await userAuthService.register(formData);
            if (res.success) {
                // Navigate to Success Page with email state for context
                navigate('/registration-success', { state: { email: formData.email } });
            } else {
                setErrorMsg(res.message || 'Registration failed');
            }
        } catch (error: any) {
            console.error("API Error details:", error);

            // Extract the most relevant error message
            let errorMessage = 'Registration failed. Please try again.';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }

            setErrorMsg(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-content bg-light" style={{ position: 'relative' }}>
            <section className="px-3">
                <div className="row align-items-center justify-content-center min-vh-100">
                    <div className="col-xxl-6 col-xl-6 col-lg-6">
                        <div className="login-area p-4">
                            <h2 className="login-head mb-1">Sign Up</h2>
                            <p className="m-b25 fw-light">welcome please create your account</p>

                            {/* Inline Error Message */}
                            {errorMsg && (
                                <div className="alert alert-danger" role="alert">
                                    {errorMsg}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="label-title">Username</label>
                                    <input type="text" name="username" value={formData.username} onChange={handleChange} required className="form-control" placeholder="Username" />
                                </div>
                                <div className="mb-3">
                                    <label className="label-title">Email Address</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className="form-control" placeholder="Email Address" />
                                </div>
                                <div className="mb-3">
                                    <label className="label-title">Mobile Number</label>
                                    <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required className="form-control" placeholder="Mobile Number" />
                                </div>
                                <div className="mb-3">
                                    <label className="label-title">Password</label>
                                    <div className="input-group">
                                        <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} required className="form-control" placeholder="Password" />
                                        <button className="btn btn-outline-secondary" type="button" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? "Hide" : "Show"}
                                        </button>
                                    </div>
                                    <small className="form-text text-muted">Must be at least 8 Characters.</small>
                                </div>

                                <button type="submit" disabled={loading} className="btn btn-secondary btn-lg w-100 text-uppercase">
                                    {loading ? 'Signing Up...' : 'Sign Up'}
                                </button>
                                <p className="mt-3">Already have an Account? <Link to="/login" className="text-primary fw-bold">Log in</Link></p>
                            </form>
                        </div>
                    </div>
                    <div className="col-xxl-6 col-xl-6 col-lg-6 d-none d-lg-block p-0">
                        {/* Simple Slide Simulation or Static Image */}
                        <div className="banner-login min-vh-100 d-flex align-items-end" style={{ backgroundImage: `url(${pic2})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                            <div className="banner-content p-5 text-white bg-dark bg-opacity-50 w-100">
                                <h2 className="title mb-3">Serums, the alchemy of skincare, unlock the secrets of radiant beauty with every drop.</h2>
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

export default Registration;
