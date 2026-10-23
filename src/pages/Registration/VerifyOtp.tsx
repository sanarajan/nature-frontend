import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { userAuthService } from '../../services/user/userAuthService';
import pic2 from '../../assets/images/registration/pic2.jpg';

const OTP_EXPIRY_SECONDS = 10 * 60; // 10 minutes
const RESEND_COOLDOWN_SECONDS = 60; // 60 seconds

const VerifyOtp: React.FC = () => {
    const location = useLocation();

    // Retrieve email and phone from state, query params, or fallback to sessionStorage
    const searchParams = new URLSearchParams(location.search);
    const queryEmail = searchParams.get('email') || '';
    const queryOtp = searchParams.get('otp') || searchParams.get('token') || '';

    const initialEmail = (location.state as any)?.email || queryEmail || sessionStorage.getItem('pending_verification_email') || '';
    const initialPhone = (location.state as any)?.phoneNumber || sessionStorage.getItem('pending_verification_phone') || '';

    const [email, setEmail] = useState<string>(initialEmail);
    const [phoneNumber] = useState<string>(initialPhone);
    const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [isVerified, setIsVerified] = useState(false);
    const [resendCount, setResendCount] = useState<number>(0);
    const [maxResendReached, setMaxResendReached] = useState(false);

    // Timers
    const [expirySeconds, setExpirySeconds] = useState<number>(OTP_EXPIRY_SECONDS);
    const [cooldownSeconds, setCooldownSeconds] = useState<number>(RESEND_COOLDOWN_SECONDS);

    // Input refs for the 6 boxes
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Initialize timers and session on mount
    useEffect(() => {
        if (email) {
            sessionStorage.setItem('pending_verification_email', email);
        }

        const now = Date.now();

        // 1. Expiry Timer Setup
        const storedExpiry = sessionStorage.getItem(`otp_expiry_${email}`);
        if (storedExpiry) {
            const remaining = Math.max(0, Math.floor((parseInt(storedExpiry, 10) - now) / 1000));
            setExpirySeconds(remaining);
        } else {
            const expiryTime = now + OTP_EXPIRY_SECONDS * 1000;
            sessionStorage.setItem(`otp_expiry_${email}`, expiryTime.toString());
            setExpirySeconds(OTP_EXPIRY_SECONDS);
        }

        // 2. Cooldown Timer Setup
        const storedCooldown = sessionStorage.getItem(`otp_cooldown_${email}`);
        if (storedCooldown) {
            const remainingCooldown = Math.max(0, Math.floor((parseInt(storedCooldown, 10) - now) / 1000));
            setCooldownSeconds(remainingCooldown);
        } else {
            const cooldownTime = now + RESEND_COOLDOWN_SECONDS * 1000;
            sessionStorage.setItem(`otp_cooldown_${email}`, cooldownTime.toString());
            setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
        }

        // Auto-populate and copy if queryOtp provided
        if (queryOtp && queryOtp.length === 6) {
            const digits = queryOtp.split('');
            setOtpDigits(digits);
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(queryOtp).catch(() => {});
            }
            toast.success('Verification code copied to clipboard!');
        }

        // Focus first box
        setTimeout(() => {
            inputRefs.current[0]?.focus();
        }, 100);
    }, [email, queryOtp]);

    // Expiry countdown tick
    useEffect(() => {
        if (expirySeconds <= 0) return;
        const interval = setInterval(() => {
            setExpirySeconds(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [expirySeconds]);

    // Resend cooldown countdown tick
    useEffect(() => {
        if (cooldownSeconds <= 0) return;
        const interval = setInterval(() => {
            setCooldownSeconds(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [cooldownSeconds]);

    const formatTimer = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Handle single digit input
    const handleDigitChange = (index: number, value: string) => {
        setErrorMsg(null);

        // Keep numeric characters only
        const cleaned = value.replace(/\D/g, '');
        if (!cleaned) {
            const updated = [...otpDigits];
            updated[index] = '';
            setOtpDigits(updated);
            return;
        }

        // If user pasted or typed multiple digits in a box
        if (cleaned.length > 1) {
            handlePasteData(cleaned);
            return;
        }

        const updated = [...otpDigits];
        updated[index] = cleaned;
        setOtpDigits(updated);

        // Auto-advance to next box
        if (cleaned && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // Handle backspace / left-right keys
    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!otpDigits[index] && index > 0) {
                const updated = [...otpDigits];
                updated[index - 1] = '';
                setOtpDigits(updated);
                inputRefs.current[index - 1]?.focus();
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // Handle paste event
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text');
        handlePasteData(pasteData);
    };

    const handlePasteData = (data: string) => {
        const numeric = data.replace(/\D/g, '').slice(0, 6);
        if (!numeric) return;

        const updated = [...otpDigits];
        for (let i = 0; i < 6; i++) {
            updated[i] = numeric[i] || '';
        }
        setOtpDigits(updated);

        // Focus appropriate box
        const nextIndex = Math.min(numeric.length, 5);
        inputRefs.current[nextIndex]?.focus();
    };

    // Submit OTP verification
    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setSuccessMsg(null);

        if (!email) {
            setErrorMsg('Email address is missing. Please enter your registered email.');
            return;
        }

        const otp = otpDigits.join('');
        if (otp.length !== 6) {
            setErrorMsg('Please enter the complete 6-digit verification code.');
            return;
        }

        if (expirySeconds <= 0) {
            setErrorMsg('Verification code has expired. Please click Resend OTP to get a new code.');
            return;
        }

        setLoading(true);

        try {
            const res = await userAuthService.verifyOtp(email, otp);
            if (res.success) {
                setIsVerified(true);
                setSuccessMsg(res.message || 'Account successfully verified!');
                toast.success('Account successfully verified!');
                // Cleanup session storage
                sessionStorage.removeItem('pending_verification_email');
                sessionStorage.removeItem('pending_verification_phone');
                sessionStorage.removeItem(`otp_expiry_${email}`);
                sessionStorage.removeItem(`otp_cooldown_${email}`);
            } else {
                setErrorMsg(res.message || 'Verification failed. Please try again.');
            }
        } catch (err: any) {
            console.error('Verification error:', err);
            let message = 'Verification failed. Please check the code and try again.';
            if (err.response?.data?.message) {
                message = err.response.data.message;
            } else if (err.message) {
                message = err.message;
            }
            setErrorMsg(message);
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResend = async () => {
        if (cooldownSeconds > 0 || resendLoading || maxResendReached) return;

        if (!email) {
            setErrorMsg('Please enter your email address to resend OTP.');
            return;
        }

        setResendLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        try {
            const res = await userAuthService.resendOtp(email);
            if (res.success) {
                const count = res.data?.resendCount || resendCount + 1;
                setResendCount(count);
                if (count >= 3) {
                    setMaxResendReached(true);
                }

                // Reset inputs and focus
                setOtpDigits(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();

                // Restart timers
                const now = Date.now();
                setExpirySeconds(OTP_EXPIRY_SECONDS);
                setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
                sessionStorage.setItem(`otp_expiry_${email}`, (now + OTP_EXPIRY_SECONDS * 1000).toString());
                sessionStorage.setItem(`otp_cooldown_${email}`, (now + RESEND_COOLDOWN_SECONDS * 1000).toString());

                setSuccessMsg('A new 6-digit OTP has been sent to your email and WhatsApp.');
                toast.success('A new 6-digit OTP has been sent.');
            } else {
                setErrorMsg(res.message || 'Failed to resend verification code.');
            }
        } catch (err: any) {
            console.error('Resend error:', err);
            let message = 'Failed to resend code. Please try again.';
            if (err.response?.data?.message) {
                message = err.response.data.message;
                if (message.toLowerCase().includes('maximum') || err.response.status === 429) {
                    setMaxResendReached(true);
                }
            } else if (err.message) {
                message = err.message;
            }
            setErrorMsg(message);
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="page-content bg-light" style={{ position: 'relative' }}>
            <section className="px-3">
                <div className="row align-items-center justify-content-center min-vh-100">
                    <div className="col-xxl-6 col-xl-6 col-lg-6">
                        <div className="login-area p-4 p-md-5">
                            {isVerified ? (
                                <div className="text-center py-4">
                                    <i className="fa fa-check-circle text-success mb-4" style={{ fontSize: '4.5rem' }}></i>
                                    <h2 className="login-head mb-3">Account Verified!</h2>
                                    <p className="m-b25 fs-5 text-muted">
                                        Your account has been successfully verified. You can now log in to explore Naturalayam.
                                    </p>
                                    <Link to="/login" className="btn btn-secondary btn-lg text-uppercase px-5">
                                        Log In Now
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <h2 className="login-head mb-1">Verify Your Account</h2>
                                    <p className="m-b20 fw-light text-muted">
                                        We have sent a single 6-digit verification code to your registered{' '}
                                        <strong>Email</strong>
                                        {email ? ` (${email})` : ''} and{' '}
                                        <strong>WhatsApp</strong>
                                        {phoneNumber ? ` (${phoneNumber})` : ''}.
                                    </p>

                                    {/* Inline Alerts */}
                                    {errorMsg && (
                                        <div className="alert alert-danger" role="alert">
                                            {errorMsg}
                                        </div>
                                    )}

                                    {successMsg && (
                                        <div className="alert alert-success" role="alert">
                                            {successMsg}
                                        </div>
                                    )}

                                    {/* Fallback Email Input if missing */}
                                    {!initialEmail && (
                                        <div className="mb-3">
                                            <label className="label-title">Registered Email Address</label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                className="form-control"
                                                placeholder="Enter your registered email"
                                                required
                                            />
                                        </div>
                                    )}

                                    <form onSubmit={handleVerify}>
                                        <div className="mb-4">
                                            <label className="label-title d-block mb-2 text-center text-uppercase fw-semibold" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>
                                                Enter 6-Digit OTP
                                            </label>

                                            {/* 6 Digit Input Boxes */}
                                            <div className="d-flex justify-content-center gap-2 gap-sm-3 mb-2">
                                                {otpDigits.map((digit, idx) => (
                                                    <input
                                                        key={idx}
                                                        ref={(el) => {inputRefs.current[idx] = el;}}
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9]*"
                                                        maxLength={1}
                                                        value={digit}
                                                        onChange={e => handleDigitChange(idx, e.target.value)}
                                                        onKeyDown={e => handleKeyDown(idx, e)}
                                                        onPaste={handlePaste}
                                                        className="form-control text-center fw-bold"
                                                        style={{
                                                            width: '48px',
                                                            height: '56px',
                                                            fontSize: '24px',
                                                            lineHeight: '1.2',
                                                            padding: '0',
                                                            boxSizing: 'border-box',
                                                            textAlign: 'center',
                                                            verticalAlign: 'middle',
                                                            borderRadius: '8px',
                                                            border: digit ? '2px solid #2e7d32' : '1px solid #ced4da',
                                                            backgroundColor: '#fff'
                                                        }}
                                                        disabled={loading}
                                                        autoFocus={idx === 0}
                                                    />
                                                ))}
                                            </div>

                                            {/* Expiry Timer Display */}
                                            <div className="text-center mt-3">
                                                {expirySeconds > 0 ? (
                                                    <span className="text-muted small">
                                                        <i className="fa fa-clock-o me-1"></i> Code expires in{' '}
                                                        <strong className="text-dark">{formatTimer(expirySeconds)}</strong>
                                                    </span>
                                                ) : (
                                                    <span className="text-danger small fw-semibold">
                                                        <i className="fa fa-exclamation-circle me-1"></i> Code has expired. Please request a new OTP.
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Verify Submit Button */}
                                        <button
                                            type="submit"
                                            disabled={loading || otpDigits.join('').length !== 6 || expirySeconds <= 0}
                                            className="btn btn-secondary btn-lg w-100 text-uppercase mb-3"
                                        >
                                            {loading ? 'Verifying...' : 'Verify & Proceed'}
                                        </button>

                                        {/* Resend OTP Section */}
                                        <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                                            <span className="text-muted small">Didn't receive the code?</span>
                                            {cooldownSeconds > 0 ? (
                                                <span className="text-muted small">
                                                    Resend in <strong>{cooldownSeconds}s</strong>
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleResend}
                                                    disabled={resendLoading || maxResendReached}
                                                    className="btn btn-link text-primary p-0 text-decoration-none fw-bold small"
                                                >
                                                    {resendLoading ? 'Sending...' : maxResendReached ? 'Resend limit reached' : 'Resend OTP'}
                                                </button>
                                            )}
                                        </div>

                                        <p className="mt-4 text-center mb-0">
                                            Already verified? <Link to="/login" className="text-primary fw-bold">Sign In</Link>
                                        </p>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right side banner matching existing login/registration design */}
                    <div className="col-xxl-6 col-xl-6 col-lg-6 d-none d-lg-block p-0">
                        <div
                            className="banner-login min-vh-100 d-flex align-items-end"
                            style={{ backgroundImage: `url(${pic2})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                        >
                            <div className="banner-content p-5 text-white bg-dark bg-opacity-50 w-100">
                                <h2 className="title mb-3">
                                    Serums, the alchemy of skincare, unlock the secrets of radiant beauty with every drop.
                                </h2>
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

export default VerifyOtp;
