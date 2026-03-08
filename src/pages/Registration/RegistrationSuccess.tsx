import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import pic2 from '../../assets/images/registration/pic2.jpg';

const RegistrationSuccess: React.FC = () => {
    const location = useLocation();
    const email = location.state?.email || 'your email';

    return (
        <div className="page-content bg-light" style={{ position: 'relative' }}>
            <section className="px-3">
                <div className="row align-items-center justify-content-center min-vh-100">
                    <div className="col-xxl-6 col-xl-6 col-lg-6">
                        <div className="login-area p-5 text-center">
                            <i className="fa fa-envelope text-success mb-4" style={{ fontSize: '4rem' }}></i>
                            <h2 className="login-head mb-3">Registration Successful!</h2>
                            <p className="m-b25 fs-5">
                                We've sent a verification link to <strong>{email}</strong>.
                                Please check your inbox and click the link to verify your email address.
                            </p>
                            <p className="text-muted mb-4">
                                You won't be able to log in until your email is verified. If you don't see the email, please check your spam folder.
                            </p>
                            <Link to="/login" className="btn btn-secondary btn-lg text-uppercase">
                                Go to Login
                            </Link>
                        </div>
                    </div>
                    <div className="col-xxl-6 col-xl-6 col-lg-6 d-none d-lg-block p-0">
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

export default RegistrationSuccess;
