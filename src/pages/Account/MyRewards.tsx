import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import userApiClient from '../../services/userApiClient';
import { toast } from 'react-toastify';
import { Gift, Copy, Check, Calendar, Tag, Clock } from 'lucide-react';
import './MyRewards.css';

interface RewardItem {
    id: string;
    rewardName: string;
    displayText: string;
    rewardType: string;
    rewardValue: number;
    couponCode: string;
    expiryDate: string | null;
    status: 'Active' | 'Used' | 'Expired' | 'No Reward';
    spunAt: string;
}

const MyRewards: React.FC = () => {
    const [rewards, setRewards] = useState<RewardItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    useEffect(() => {
        fetchRewards();
    }, []);

    const fetchRewards = async () => {
        setLoading(true);
        try {
            const res = await userApiClient.get('/user/spin-wheel/my-rewards');
            if (res.data.success && res.data.data.rewards) {
                setRewards(res.data.data.rewards);
            }
        } catch (error) {
            console.error('Failed to fetch rewards:', error);
            toast.error('Failed to load your rewards');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (code: string) => {
        if (!code) return;
        navigator.clipboard.writeText(code).then(() => {
            setCopiedCode(code);
            toast.success(`Coupon code "${code}" copied to clipboard!`);
            setTimeout(() => setCopiedCode(null), 2000);
        });
    };

    return (
        <div className="page-content bg-light">
            <div className="dz-bnr-inr bg-secondary overlay-black-light" style={{ backgroundImage: "url('/images/background/bg1.jpg')" }}>
                <div className="container">
                    <div className="dz-bnr-inr-entry">
                        <h1>My Rewards</h1>
                        <nav aria-label="breadcrumb" className="breadcrumb-row">
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                                <li className="breadcrumb-item"><Link to="/account">Account</Link></li>
                                <li className="breadcrumb-item">My Rewards</li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>

            <div className="content-inner-1">
                <div className="container">
                    <div className="row">
                        {/* Sidebar */}
                        <aside className="col-xl-3">
                            <div className="sticky-top account-sidebar-wrapper">
                                <div className="account-sidebar">
                                    <div className="account-nav">
                                        <div className="nav-title bg-light uppercase">DASHBOARD</div>
                                        <ul>
                                            <li><Link to="/account">Dashboard</Link></li>
                                            <li><Link to="/account/orders">Orders</Link></li>
                                            <li className="active"><Link to="/account/my-rewards">My Rewards</Link></li>
                                            <li><Link to="/account/nature-points">Nature Points</Link></li>
                                            <li><Link to="/account/return">Return request</Link></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Main Content */}
                        <section className="col-xl-9 account-wrapper mt-4 mt-xl-0">
                            <div className="account-card">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <div>
                                        <h3 className="title mb-1" style={{ color: '#0D775E' }}>Spin Wheel Rewards</h3>
                                        <p className="text-muted small mb-0">View all your won coupons and prizes from the Spin Wheel.</p>
                                    </div>
                                    <Link to="/offers" className="btn btn-outline-success btn-sm">
                                        <Gift size={16} className="me-1" /> Spin Again
                                    </Link>
                                </div>

                                {loading ? (
                                    <div className="text-center p-5">
                                        <div className="spinner-border text-success" role="status"></div>
                                    </div>
                                ) : rewards.length === 0 ? (
                                    <div className="empty-rewards-box text-center p-5">
                                        <Gift size={48} className="text-muted mb-3" />
                                        <h5>No Rewards Won Yet</h5>
                                        <p className="text-secondary small mb-4">Spin the Wheel of Fortune to win exciting discount coupons!</p>
                                        <Link to="/offers" className="btn btn-success px-4">
                                            Spin the Wheel
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="row g-3">
                                        {rewards.map(item => (
                                            <div className="col-md-6" key={item.id}>
                                                <div className={`reward-card status-${item.status.toLowerCase().replace(' ', '-')}`}>
                                                    <div className="reward-card-header d-flex justify-content-between align-items-start">
                                                        <div>
                                                            <span className="badge reward-badge mb-2">{item.rewardType}</span>
                                                            <h5 className="reward-title mb-1">{item.rewardName}</h5>
                                                            <p className="reward-desc text-muted mb-0">{item.displayText}</p>
                                                        </div>
                                                        <span className={`status-pill pill-${item.status.toLowerCase().replace(' ', '-')}`}>
                                                            {item.status}
                                                        </span>
                                                    </div>

                                                    {item.couponCode ? (
                                                        <div className="reward-coupon-box mt-3">
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <span className="coupon-code-text fw-bold">
                                                                    <Tag size={16} className="me-2 text-success" />
                                                                    {item.couponCode}
                                                                </span>
                                                                <button
                                                                    className="btn btn-sm btn-success px-3"
                                                                    onClick={() => handleCopy(item.couponCode)}
                                                                >
                                                                    {copiedCode === item.couponCode ? (
                                                                        <>
                                                                            <Check size={14} className="me-1" /> COPIED
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Copy size={14} className="me-1" /> COPY
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : null}

                                                    <div className="reward-card-footer mt-3 pt-2 border-top d-flex justify-content-between text-muted small">
                                                        <span>
                                                            <Clock size={14} className="me-1" />
                                                            Spun: {new Date(item.spunAt).toLocaleDateString()}
                                                        </span>
                                                        {item.expiryDate && (
                                                            <span>
                                                                <Calendar size={14} className="me-1" />
                                                                Expires: {new Date(item.expiryDate).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyRewards;
