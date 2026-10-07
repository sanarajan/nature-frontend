import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import userApiClient from '../../services/userApiClient';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
const NaturePoints: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useSelector((state: RootState) => state.auth.user);
    const [availablePoints, setAvailablePoints] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated) {
            fetchPoints();
        } else {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    const fetchPoints = async () => {
        try {
            const res = await userApiClient.get('/user/loyalty/points');
            if (res.data.success) {
                setAvailablePoints(res.data.data.points || 0);
            }
        } catch (err) {
            console.error('Error fetching points:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-content bg-light">
            <div className="dz-bnr-inr bg-secondary overlay-black-light" style={{ backgroundImage: "url('/images/background/bg1.jpg')" }}>
                <div className="container">
                    <div className="dz-bnr-inr-entry">
                        <h1>Nature Points</h1>
                        <nav aria-label="breadcrumb" className="breadcrumb-row">
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                                <li className="breadcrumb-item">Account</li>
                                <li className="breadcrumb-item">Nature Points</li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>

            <div className="content-inner-1">
                <div className="container">
                    <div className="row">
                        {/* Sidebar */}
                        <AccountSidebar activePage="nature-points" />

                        {/* Main Content */}
                        <section className="col-xl-9 account-wrapper mt-4 mt-xl-0">
                            <div className="account-card">
                                <div className="m-b30">
                                    <h4 className="title mb-3">Your Nature Points</h4>
                                </div>
                                <div className="row">
                                    <div className="col-md-6 mb-4">
                                        <div className="total-contain border rounded p-4 text-center" style={{ background: '#f5fff5', borderColor: '#c3e6cb' }}>
                                            <div className="total-icon mb-3">
                                                <i className="fas fa-leaf text-success" style={{ fontSize: '40px' }}></i>
                                            </div>
                                            <div className="total-detail">
                                                <span className="text text-muted">Available Balance</span>
                                                <h2 className="title text-success mt-2 mb-0" style={{ fontSize: '3rem' }}>
                                                    {loading ? '...' : availablePoints}
                                                </h2>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6 mb-4">
                                        <div className="card h-100 border-0 bg-light p-4">
                                            <h5 className="mb-3">How to earn & use points?</h5>
                                            <ul className="list-unstyled mb-0">
                                                <li className="mb-2"><i className="fas fa-check-circle text-success me-2"></i>Earn points on every successful order</li>
                                                <li className="mb-2"><i className="fas fa-check-circle text-success me-2"></i>Redeem points during checkout for discounts</li>
                                                <li className="mb-2"><i className="fas fa-check-circle text-success me-2"></i>Win points by spinning the Wheel of Fortune</li>
                                                <li><i className="fas fa-check-circle text-success me-2"></i>Points expire based on our loyalty validity period</li>
                                            </ul>
                                            <div className="mt-4">
                                                <Link to="/offers" className="btn btn-outline-success btn-sm me-2">Spin Wheel</Link>
                                                <Link to="/shop" className="btn btn-success btn-sm">Shop Now</Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NaturePoints;
