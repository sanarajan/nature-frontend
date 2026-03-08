import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { userAuthService } from '../../services/user/userAuthService';
import pic2 from '../../assets/images/registration/pic2.jpg';

const VerifyEmail: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        const verify = async () => {
            const email = searchParams.get('email');
            const token = searchParams.get('token');

            if (!email || !token) {
                setStatus('error');
                setMessage('Invalid verification link.');
                return;
            }

            try {
                const res = await userAuthService.verifyEmail(email, token);
                if (res.success) {
                    setStatus('success');
                    setMessage('Your email has been successfully verified! You can now log in to your account.');
                } else {
                    setStatus('error');
                    setMessage(res.message || 'Verification failed. The link might be expired.');
                }
            } catch (error: any) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Verification failed. Please try again.');
            }
        };

        verify();
    }, [searchParams]);

    return (
        <div className="page-content bg-light" style={{ position: 'relative' }}>
            <section className="px-3">
                <div className="row align-items-center justify-content-center min-vh-100">
                    <div className="col-xxl-6 col-xl-6 col-lg-6">
                        <div className="login-area p-5 text-center">
                            {status === 'loading' && (
                                <>
                                    <div className="spinner-border text-primary mb-4" role="status" style={{ width: '3rem', height: '3rem' }}>
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <h2 className="login-head mb-3">Verifying Email</h2>
                                    <p className="m-b25 fs-5">{message}</p>
                                </>
                            )}

                            {status === 'success' && (
                                <>
                                    <i className="fa fa-check-circle text-success mb-4" style={{ fontSize: '4rem' }}></i>
                                    <h2 className="login-head mb-3">Email Verified!</h2>
                                    <p className="m-b25 fs-5">{message}</p>
                                    <Link to="/login" className="btn btn-secondary btn-lg text-uppercase">
                                        Login Now
                                    </Link>
                                </>
                            )}

                            {status === 'error' && (
                                <>
                                    <i className="fa fa-times-circle text-danger mb-4" style={{ fontSize: '4rem' }}></i>
                                    <h2 className="login-head mb-3">Verification Failed</h2>
                                    <p className="m-b25 fs-5 text-danger">{message}</p>
                                    <Link to="/login" className="btn btn-primary btn-lg text-uppercase mt-2">
                                        Back to Login
                                    </Link>
                                </>
                            )}
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

export default VerifyEmail;
