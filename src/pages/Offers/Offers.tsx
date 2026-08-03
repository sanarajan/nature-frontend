import React, { useState, useEffect, useRef } from 'react';
import './Offers.css';
import { Star } from 'lucide-react';
import userApiClient from '../../services/userApiClient';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';

interface WheelSegment {
    id: string;
    segmentName: string;
    displayText: string;
    rewardType: string;
    rewardValue: number;
    color: string;
    order: number;
}

const Offers: React.FC = () => {
    const navigate = useNavigate();
    const [spinning, setSpinning] = useState(false);
    const [initialBlink, setInitialBlink] = useState(true);
    const [rotation, setRotation] = useState(0);
    const [segments, setSegments] = useState<WheelSegment[]>([]);
    const [isEligible, setIsEligible] = useState(true);
    const [daysRemaining, setDaysRemaining] = useState(0);
    const [isCampaignActive, setIsCampaignActive] = useState(true);


    const [result, setResult] = useState<{
        segmentName: string;
        displayText: string;
        rewardType: string;
        rewardValue: number;
        couponCode?: string;
        expiryDate?: string;
    } | null>(null);

    const [copied, setCopied] = useState(false);
    const resultRef = useRef<HTMLDivElement>(null);

    const lights = Array.from({ length: 12 });
    const isUser = useSelector((state: RootState) => state.auth.user.isAuthenticated) && !!localStorage.getItem('user_accessToken');

    useEffect(() => {
        const timer = setTimeout(() => setInitialBlink(false), 2500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [isUser]);

    const fetchStatus = async () => {
        try {
            const res = await userApiClient.get('/user/spin-wheel/status');
            if (res.data.success) {
                const d = res.data.data;
                setSegments(d.segments || []);
                const eligible = d.canSpin ?? d.isEligible ?? true;
                setIsEligible(eligible);
                const remaining = d.remainingDays ?? d.daysRemaining ?? 0;
                setDaysRemaining(remaining);
                setIsCampaignActive(d.isCampaignActive ?? true);
            }
        } catch (err) {
            console.error('Failed to fetch spin wheel status:', err);
        }
    };


    const spinWheel = async () => {
        if (!isUser) {
            toast.error('Please login to spin the wheel!');
            navigate('/login');
            return;
        }

        if (!isCampaignActive) {
            toast.error('Spin Wheel campaign is not active at this time.');
            return;
        }

        if (!isEligible) {
            toast.error(`You have already spun the wheel. Next spin available in ${daysRemaining} day(s).`);
            return;
        }

        if (spinning || segments.length === 0) return;

        setSpinning(true);
        setResult(null);
        setCopied(false);

        try {
            const res = await userApiClient.post('/user/spin-wheel/spin');
            if (res.data.success) {
                const winData = res.data.data;
                const winningIndex = winData.winningSegment.index;

                const N = segments.length;
                const anglePerSeg = 360 / N;
                const centerAngle = winningIndex * anglePerSeg + anglePerSeg / 2;

                const currentMod = rotation % 360;
                const targetMod = (90 - centerAngle + 360) % 360;

                let additionalRotation = (targetMod - currentMod + 360) % 360;
                if (additionalRotation < 180) additionalRotation += 360; // Extra spin push

                const newRotation = rotation + 3600 + additionalRotation;
                setRotation(newRotation);

                setTimeout(() => {
                    setSpinning(false);
                    setIsEligible(false);
                    const remaining = winData.remainingDays ?? winData.daysRemaining ?? winData.spinIntervalDays ?? 0;
                    setDaysRemaining(remaining);

                    setResult({
                        segmentName: winData.winningSegment.segmentName,
                        displayText: winData.winningSegment.displayText,
                        rewardType: winData.winningSegment.rewardType,
                        rewardValue: winData.winningSegment.rewardValue,
                        couponCode: winData.coupon?.code,
                        expiryDate: winData.coupon?.expiryDate
                    });

                    createConfetti();

                    if (winData.winningSegment.rewardType !== 'Better Luck Next Time') {
                        toast.success(`🎉 Congratulations! You won ${winData.winningSegment.segmentName}!`);
                    } else {
                        toast.info(winData.winningSegment.displayText || 'Better luck next time!');
                    }

                    // Refetch status from backend to ensure state is synchronized with DB
                    fetchStatus();

                    setTimeout(() => {
                        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                }, 4000);
            }
        } catch (err: any) {
            setSpinning(false);
            toast.error(err.response?.data?.message || 'Failed to spin the wheel.');
        }
    };


    const copyCoupon = (code?: string) => {
        if (code) {
            navigator.clipboard.writeText(code).then(() => {
                setCopied(true);
                toast.success('Coupon code copied to clipboard!');
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

    const createConfetti = () => {
        for (let i = 0; i < 60; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti');
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
            confetti.style.animationDuration = Math.random() * 2 + 2 + 's';
            confetti.style.width = Math.random() * 8 + 6 + 'px';
            confetti.style.height = confetti.style.width;
            document.body.appendChild(confetti);

            setTimeout(() => confetti.remove(), 5000);
        }
    };

    const segCount = segments.length || 8;
    const angleStep = 360 / segCount;

    return (
        <div className="page-content bg-white">
            <div className="wheel-container">
                <div className="text-center mb-4">
                    <h2 className="title mb-2" style={{ color: '#0D775E', fontWeight: 800, fontSize: '2.5rem' }}>Spin the Wheel of Fortune!</h2>
                    <p className="text-secondary" style={{ fontSize: '1.1rem' }}>Test your luck and win exclusive discount coupons for your next purchase!</p>
                </div>

                {!isUser && (
                    <div className="alert alert-warning text-center mx-auto mb-4" style={{ maxWidth: '500px', borderRadius: '12px' }}>
                        🔒 <strong>Please login to spin the wheel</strong> and claim exclusive discount rewards.
                        <div className="mt-2">
                            <Link to="/login" className="btn btn-sm btn-success px-3 fw-bold">Login to Spin</Link>
                        </div>
                    </div>
                )}

                {!isEligible && isUser && !spinning && (
                    <div className="alert alert-info text-center mx-auto mb-4" style={{ maxWidth: '500px', borderRadius: '12px' }}>
                        🎉 You have already participated in the current spin round! You can spin again in <strong>{daysRemaining} day(s)</strong>.
                        <div className="mt-2">
                            <Link to="/account/my-rewards" className="fw-bold text-success text-decoration-underline">View My Won Rewards</Link>
                        </div>
                    </div>
                )}


                <div className="wheel-wrapper">
                    <div className={`wheel-rim-lights ${(spinning || initialBlink) ? 'is-spinning' : ''}`}>
                        {lights.map((_, i) => (
                            <div key={i} className="rim-light" style={{ transform: `rotate(${i * (360 / lights.length)}deg) translateY(-202px)` }}></div>
                        ))}
                    </div>

                    <div id="spin-arrow"></div>

                    <div id="wheel" style={{ transform: `rotate(${rotation}deg)` }}>
                        <div className="wheel-segments">
                            <div className="wheel-labels">
                                {segments.map((seg, i) => (
                                    <span key={seg.id || i} className={`wheel-label label-${i + 1}`} style={{ transform: `rotate(${i * angleStep + (angleStep / 2)}deg) translate(0, -50%)`, color: seg.color || '#0D775E' }}>
                                        <span className="label-text" style={{ color: seg.color }}>{seg.segmentName}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="wheel-center">
                        <div className="center-star">
                            <Star size={24} fill="#FFD700" color="#FFD700" />
                        </div>
                        <button id="spin-btn" onClick={spinWheel} disabled={spinning || !isEligible || !isCampaignActive}>
                            {spinning ? '...' : (isEligible ? 'SPIN' : 'USED')}
                        </button>
                    </div>
                </div>

                {result && (
                    <div className="offer-result" ref={resultRef}>
                        <h3 className="title mb-2" style={{ color: '#0D775E', fontWeight: 700 }}>
                            {result.rewardType !== 'Better Luck Next Time' ? '🎉 Congratulations!' : 'Better Luck Next Time!'}
                        </h3>
                        <p style={{ color: '#64748b' }}>{result.displayText}</p>

                        {result.couponCode && (
                            <div className="coupon-box">
                                <span className="coupon-code">{result.couponCode}</span>
                                <button className="copy-btn" onClick={() => copyCoupon(result.couponCode)}>
                                    {copied ? 'COPIED!' : 'COPY'}
                                </button>
                            </div>
                        )}

                        <div className="mt-3">
                            <Link to="/account/my-rewards" className="btn btn-sm btn-outline-success me-2">
                                View My Rewards
                            </Link>
                            <Link to="/shop" className="btn btn-sm btn-success">
                                Shop Now
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Offers;
