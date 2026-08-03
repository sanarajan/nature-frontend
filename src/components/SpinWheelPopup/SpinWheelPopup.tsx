import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import userApiClient from '../../services/userApiClient';
import { Gift, X, Sparkles } from 'lucide-react';
import './SpinWheelPopup.css';

const SpinWheelPopup: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const isUser = useSelector((state: RootState) => state.auth.user.isAuthenticated) && !!localStorage.getItem('user_accessToken');

    useEffect(() => {
        if (!isUser) return;
        const hasSeen = sessionStorage.getItem('has_seen_spin_popup');
        if (hasSeen) return;

        const checkEligibility = async () => {
            try {
                const res = await userApiClient.get('/user/spin-wheel/status');
                if (res.data.success) {
                    const data = res.data.data;
                    if (data.isCampaignActive && data.showPopupAfterLogin && data.isEligible) {
                        setIsOpen(true);
                        sessionStorage.setItem('has_seen_spin_popup', 'true');
                    }
                }
            } catch (err) {
                // Ignore popup error
            }
        };

        const timer = setTimeout(checkEligibility, 1500);
        return () => clearTimeout(timer);
    }, [isUser]);

    if (!isOpen) return null;

    return (
        <div className="spin-popup-overlay">
            <div className="spin-popup-card">
                <button className="close-popup-btn" onClick={() => setIsOpen(false)}>
                    <X size={20} />
                </button>
                <div className="spin-popup-badge mb-2">
                    <Sparkles size={16} className="me-1" /> EXCLUSIVE OFFER
                </div>
                <h3 className="spin-popup-title">Spin & Win Big Rewards!</h3>
                <p className="spin-popup-desc">
                    Test your luck on the Naturalayam Wheel of Fortune to win instant discount coupons!
                </p>
                <div className="spin-popup-icon my-3">
                    <Gift size={56} color="#0D775E" />
                </div>
                <div className="d-flex gap-2 justify-content-center">
                    <button
                        className="btn btn-success px-4 fw-bold"
                        onClick={() => {
                            setIsOpen(false);
                            navigate('/offers');
                        }}
                    >
                        SPIN NOW
                    </button>
                    <button className="btn btn-outline-secondary px-3" onClick={() => setIsOpen(false)}>
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SpinWheelPopup;
