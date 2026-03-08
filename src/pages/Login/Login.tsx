import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { userAuthService } from '../../services/user/userAuthService';
import userApiClient from '../../services/userApiClient';
import { userLoginSuccess } from '../../store/authSlice';
import { useLocation } from 'react-router-dom';

// Asset Imports
import pic1 from '../../assets/images/registration/pic1.jpg';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Frontend Content Validation before hitting backend
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);

        try {
            const result = await userAuthService.login({ email, password });
            if (result.success) {
                if (result.data) {
                    localStorage.setItem('user_accessToken', result.data.accessToken);
                    localStorage.setItem('user_data', JSON.stringify(result.data.user));

                    dispatch(userLoginSuccess(result.data.user));

                    // Sync Offline Wishlist
                    const localWishlistStr = localStorage.getItem('offlineWishlist');
                    if (localWishlistStr) {
                        try {
                            const localItems = JSON.parse(localWishlistStr);
                            if (Array.isArray(localItems) && localItems.length > 0) {
                                const token = result.data.accessToken;
                                const pIds = localItems.map(i => i._id);

                                await userApiClient.post(
                                    '/user/wishlist/sync',
                                    { productIds: pIds },
                                    { headers: { 'Authorization': `Bearer ${token}` } }
                                ).catch(e => console.error("Wishlist sync failed", e));
                                localStorage.removeItem('offlineWishlist');
                            }
                        } catch (err) {
                            console.error('Error syncing offline wishlist:', err);
                        }
                    }

                    // Sync Offline Cart
                    const localCartStr = localStorage.getItem('offlineCart');
                    if (localCartStr) {
                        try {
                            const localCartItems = JSON.parse(localCartStr);
                            if (Array.isArray(localCartItems) && localCartItems.length > 0) {
                                const token = result.data.accessToken;
                                const formattedItems = localCartItems.map((item: any) => ({ product: item.product._id, quantity: item.quantity }));

                                await userApiClient.post(
                                    '/user/cart/sync',
                                    { cartItems: formattedItems },
                                    { headers: { 'Authorization': `Bearer ${token}` } }
                                ).catch(e => console.error("Cart sync failed", e));
                                localStorage.removeItem('offlineCart');
                                window.dispatchEvent(new Event('cart-updated'));
                            }
                        } catch (err) {
                            console.error('Error syncing offline cart:', err);
                        }
                    }
                }
                const from = (location.state as any)?.from?.pathname || '/account';
                navigate(from, { replace: true });
            } else {
                setError(result.message || 'Login failed.');
            }
        } catch (err: any) {
            console.error("Login API Error:", err);

            // Extract the most relevant error message exactly like the Registration form
            let errorMessage = 'Connection failed. Please try again.';
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            } else if (typeof err === 'string') {
                errorMessage = err;
            }

            setError(errorMessage);
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
                            <h2 className="login-head mb-1">Sign in</h2>
                            <p className="m-b25 fw-light">welcome please login to your account</p>

                            {error && <div className="alert alert-danger mb-4">{error}</div>}

                            <form onSubmit={handleLogin}>
                                <div className="mb-3">
                                    <label className="label-title">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        className="form-control"
                                        placeholder="Email Address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="label-title">Password</label>
                                    <div className="input-group">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            className="form-control"
                                            placeholder="Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button className="btn btn-outline-secondary" type="button" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? "Hide" : "Show"}
                                        </button>
                                    </div>
                                </div>
                                <div className="d-flex justify-content-between mb-4">
                                    <div className="form-check">
                                        <input className="form-check-input" type="checkbox" id="remember" />
                                        <label className="form-check-label" htmlFor="remember">Remember me</label>
                                    </div>
                                    <Link to="/login" className="text-secondary text-decoration-underline">Forgot Password?</Link>
                                </div>
                                <button type="submit" disabled={loading} className="btn btn-secondary btn-lg w-100 text-uppercase">
                                    {loading ? 'Signing In...' : 'Sign In'}
                                </button>
                                <p className="mt-3">Don't Have an Account? <Link to="/registration" className="text-primary fw-bold">Sign up For Free</Link></p>
                            </form>
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

export default Login;
