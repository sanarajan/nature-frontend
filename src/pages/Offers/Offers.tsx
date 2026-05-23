
import React, { useState, useRef } from 'react';
import './Offers.css';
import { Star } from 'lucide-react';

// The user requested only 4 offers to enter
const uniqueOffers = [
    { label: '10% OFF', code: 'SAVE10', desc: 'Get 10% Off on your next order!' },
    { label: 'Free Shipping', code: 'SHIPFREE', desc: 'Enjoy Free Shipping on your next order!' },
    { label: '20% OFF', code: 'NATURAL20', desc: 'Huge 20% discount just for you!' },
    { label: 'Buy 1 Get 1', code: 'BOGO', desc: 'Buy 1 Get 1 Free on select items!' },
];

// Repeat 4 offers twice to fill 8 segments for a better aesthetic (like the reference image)
const options = [
    uniqueOffers[0],
    uniqueOffers[1],
    uniqueOffers[2],
    uniqueOffers[3],
    uniqueOffers[0],
    uniqueOffers[1],
    uniqueOffers[2],
    uniqueOffers[3],
];

const Offers: React.FC = () => {
    const [spinning, setSpinning] = useState(false);
    const [initialBlink, setInitialBlink] = useState(true); // Added for first load
    const [rotation, setRotation] = useState(0);
    const [result, setResult] = useState<typeof options[0] | null>(null);
    const [copied, setCopied] = useState(false);
    const resultRef = useRef<HTMLDivElement>(null);

    // Stop initial blink after 2.5 seconds
    React.useEffect(() => {
        const timer = setTimeout(() => setInitialBlink(false), 2500);
        return () => clearTimeout(timer);
    }, []);

    // Reduced to 12 lights like the reference screenshot for exact matching
    const lights = Array.from({ length: 12 });

    const spinWheel = () => {
        if (spinning) return;
        
        setSpinning(true);
        setResult(null);
        setCopied(false);

        // Random degrees: at least 10 full spins (3600 deg) + random 0-360
        const randomDeg = Math.floor(Math.random() * 360);
        const newRotation = rotation + (3600 + randomDeg);
        
        setRotation(newRotation);

        setTimeout(() => {
            setSpinning(false);
            const actualDeg = newRotation % 360;
            
            // Pointer is at RIGHT (90 deg). 
            // We want to know which segment is at 90 deg.
            // S = (90 - rotation % 360 + 360) % 360
            const winningDegree = (90 - actualDeg + 360) % 360;
            const segmentIndex = Math.floor(winningDegree / 45); // 8 segments, 45 deg each
            
            setResult(options[segmentIndex % 8]);
            createConfetti();
            
            setTimeout(() => {
                resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }, 4000);
    };

    const copyCoupon = (code: string) => {
        if (code && code !== '') {
            navigator.clipboard.writeText(code).then(() => {
                setCopied(true);
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

    return (
        <div className="page-content bg-white">
            <div className="wheel-container">
                <div className="text-center mb-5">
                    <h2 className="title mb-3" style={{ color: '#0D775E', fontWeight: 800, fontSize: '2.5rem' }}>Spin the Wheel of Fortune!</h2>
                    <p className="text-secondary" style={{ fontSize: '1.1rem' }}>Test your luck and win one of our 4 amazing offers!</p>
                </div>

                <div className="wheel-wrapper">
                    {/* Brighter glowing lights around the rim with extra glow classes */}
                    <div className={`wheel-rim-lights ${(spinning || initialBlink) ? 'is-spinning' : ''}`}>
                        {lights.map((_, i) => (
                            <div key={i} className="rim-light" style={{ transform: `rotate(${i * (360 / lights.length)}deg) translateY(-202px)` }}></div>
                        ))}
                    </div>

                    <div id="spin-arrow"></div>
                    
                    <div id="wheel" style={{ transform: `rotate(${rotation}deg)` }}>
                        <div className="wheel-segments">
                            <div className="wheel-labels">
                                {options.map((opt, i) => (
                                    <span key={i} className={`wheel-label label-${i + 1}`} style={{ transform: `rotate(${i * 45 + 22.5}deg) translate(0, -50%)` }}>
                                        <span className="label-text">{opt.label}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Center point with Star as shown in image */}
                    <div className="wheel-center">
                        <div className="center-star">
                            <Star size={24} fill="#FFD700" color="#FFD700" />
                        </div>
                        <button id="spin-btn" onClick={spinWheel} disabled={spinning}>
                            {spinning ? '...' : 'SPIN'}
                        </button>
                    </div>
                </div>

                {result && (
                    <div className="offer-result" ref={resultRef}>
                        <h3 className="title mb-2" style={{ color: '#0D775E', fontWeight: 700 }}>
                            🎉 Congratulations!
                        </h3>
                        <p style={{ color: '#64748b' }}>{result.desc}</p>
                        
                        <div className="coupon-box">
                            <span className="coupon-code">{result.code}</span>
                            <button className="copy-btn" onClick={() => copyCoupon(result.code)}>
                                {copied ? 'COPIED!' : 'COPY'}
                            </button>
                        </div>
                        <p className="mt-3 text-muted small" style={{ fontSize: '11px' }}>
                            *Terms and conditions apply. Use this code at checkout to claim your offer.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Offers;
