import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import userApiClient from '../../services/userApiClient';
import type { RootState } from '../../store';
import '../../styles/cart.css';

// Asset Imports
import bg1 from '../../assets/images/background/bg1.jpg';
import product1 from '../../assets/images/shop/product/1.png';
import iconPic2 from '../../assets/images/shop/shop-cart/icon-box/pic2.png';

interface CartItem {
    product: any;
    quantity: number;
}

const Cart: React.FC = () => {
    const isUser = useSelector((state: RootState) => state.auth.user.isAuthenticated) && !!localStorage.getItem('user_accessToken');
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const navigate = useNavigate();

    const fetchCart = async () => {
        setLoading(true);
        if (isUser) {
            try {
                const res = await userApiClient.get('/user/cart');
                if (res.data.success && res.data.data) {
                    setCartItems(res.data.data.products);
                }
            } catch (err) {
                console.error("Failed to fetch cart", err);
            }
        } else {
            const localCartStr = localStorage.getItem('offlineCart');
            if (localCartStr) {
                try {
                    const parsed = JSON.parse(localCartStr);
                    setCartItems(parsed);
                } catch (e) {
                    setCartItems([]);
                }
            } else {
                setCartItems([]);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCart();

        // Listen to storage changes from other tabs/pages (like Shop.tsx)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'offlineCart') {
                fetchCart();
            }
        };
        const handleCustomUpdate = () => {
            fetchCart();
        };
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('cart-updated', handleCustomUpdate);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('cart-updated', handleCustomUpdate);
        };
    }, [isUser]);

    const updateQty = async (productId: string, delta: number) => {
        const item = cartItems.find(i => i.product._id === productId);
        if (!item) return;
        const newQty = Math.max(1, item.quantity + delta);

        if (isUser) {
            try {
                await userApiClient.put('/user/cart/update', { productId, quantity: newQty });
                setCartItems(items => items.map(i => i.product._id === productId ? { ...i, quantity: newQty } : i));
            } catch (err) {
                toast.error('Failed to update quantity');
            }
        } else {
            const newItems = cartItems.map(i => i.product._id === productId ? { ...i, quantity: newQty } : i);
            setCartItems(newItems);
            localStorage.setItem('offlineCart', JSON.stringify(newItems));
        }
    };

    const performRemove = async (productId: string) => {
        if (isUser) {
            try {
                await userApiClient.delete(`/user/cart/${productId}`);
                setCartItems(items => items.filter(i => i.product._id !== productId));
                toast.success('Item removed');
            } catch (err) {
                toast.error('Failed to remove item');
            }
        } else {
            const newItems = cartItems.filter(i => i.product._id !== productId);
            setCartItems(newItems);
            localStorage.setItem('offlineCart', JSON.stringify(newItems));
            window.dispatchEvent(new Event('cart-updated'));
            toast.success('Item removed');
        }
        setItemToDelete(null);
    };

    const subtotal = cartItems.reduce((acc, item) => acc + ((item.product?.price || 0) * item.quantity), 0);

    return (
        <div className="page-content">
            <div className="dz-bnr-inr" style={{ backgroundImage: `url(${bg1})` }}>
                <div className="container">
                    <div className="dz-bnr-inr-entry">
                        <h1>Cart</h1>
                        <nav aria-label="breadcrumb" className="breadcrumb-row">
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item"><Link to="/shop-cart"> Cart</Link></li>
                                <li className="breadcrumb-item">Wish List</li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>

            <section className="content-inner shop-account bg-light">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-9">
                            <div className="table-responsive pe-2">
                                <table className="table check-tbl style-2 table-sm" style={{
                                    borderCollapse: 'separate',
                                    borderSpacing: '0 5px',
                                    tableLayout: 'fixed',   // IMPORTANT
                                    width: '100%',
                                }}>
                                    <thead>
                                        <tr>
                                            <th style={{ width: "80px", padding: "5px 3px" }}>Image</th>
                                            <th style={{ width: "28%" }}>Product Name</th>
                                            <th style={{ width: "100px" }}>Price</th>
                                            <th style={{ width: "100px" }}>Quantity</th>
                                            <th style={{ width: "100px" }}>Subtotal</th>
                                            <th style={{ width: "60px" }}></th>
                                        </tr>
                                    </thead>
                                    <tbody >
                                        {loading ? (
                                            <tr><td colSpan={6} className="text-center p-4">Loading cart...</td></tr>
                                        ) : cartItems.length === 0 ? (
                                            <tr><td colSpan={6} className="text-center p-4">Your cart is empty. <Link to="/shop" className="text-primary">Continue Shopping</Link></td></tr>
                                        ) : (
                                            cartItems.map((item) => {
                                                const prod = item.product;
                                                if (!prod) {
                                                    console.warn('Malformed cart item structure detected:', item);
                                                    return null; // Defensive check for malformed localStorage data
                                                }
                                                const imgUrl = prod.images && prod.images.length > 0 ? prod.images[0] : product1;
                                                return (
                                                    <tr key={prod._id || Math.random().toString()}>
                                                        <td className="product-item-img py-1 pe-1"><img src={imgUrl} alt={prod.productName} style={{ width: '60px', height: '60px' }} /></td>
                                                        <td className="product-item-name py-1 px-1" style={{ maxWidth: '250px', whiteSpace: 'normal', fontSize: '14px' }}>
                                                            <Link to={`/product/${prod._id}`}>{prod.productName}</Link>
                                                            <ul className="product-item-list">
                                                                <li>Category: {prod.categoryId?.categoryName || 'N/A'}</li>
                                                                {prod.subcategoryId && <li>Subcategory: {prod.subcategoryId.subcategoryName}</li>}
                                                            </ul>
                                                            <div className="d-block d-md-none mt-2">
                                                                {itemToDelete === prod._id ? (
                                                                    <div style={{ background: '#fff', border: '1px solid #ddd', padding: '8px', borderRadius: '4px', display: 'inline-block', marginTop: '5px' }}>
                                                                        <span style={{ fontSize: '12px', fontWeight: '500', color: '#333', display: 'block', marginBottom: '5px' }}>Remove item?</span>
                                                                        <div style={{ display: 'flex', gap: '5px' }}>
                                                                            <button onClick={() => performRemove(prod._id)} style={{ background: '#1a1a1a', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '3px', fontSize: '12px' }}>Yes</button>
                                                                            <button onClick={() => setItemToDelete(null)} style={{ background: '#d33', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '3px', fontSize: '12px' }}>No</button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => setItemToDelete(prod._id)}
                                                                        className="btn btn-sm text-danger p-0"
                                                                        style={{ textDecoration: 'underline', background: 'transparent', border: 'none' }}
                                                                    >
                                                                        <i className="fa fa-trash me-1"></i> Remove
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="product-item-price py-1 px-1" >₹{prod.price?.toFixed(2)}</td>
                                                        <td className="product-item-quantity py-1 px-1">
                                                            <div className="quantity btn-quantity style-1 me-1">
                                                                <div className="btn-quantity light quantity-sm" style={{ display: 'flex', alignItems: 'center' }}>
                                                                    <button
                                                                        className="btn btn-sm"
                                                                        onClick={() => updateQty(prod._id, -1)}
                                                                        style={{ background: '#1a1a1a', color: '#fff', border: 'none', width: '25px', height: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0' }}>
                                                                        <span style={{ fontSize: '18px', fontWeight: '500' }}>−</span>
                                                                    </button>
                                                                    <input
                                                                        type="text"
                                                                        value={item.quantity}
                                                                        readOnly
                                                                        style={{ width: '25px', height: '25px', textAlign: 'center', border: '1px solid #eee', color: '#1a1a1a', background: '#fff', margin: '0', borderRadius: '0', fontSize: '14px' }}
                                                                    />
                                                                    <button
                                                                        className="btn btn-sm"
                                                                        onClick={() => updateQty(prod._id, 1)}
                                                                        style={{ background: '#1a1a1a', color: '#fff', border: 'none', width: '25px', height: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0' }}>
                                                                        <span style={{ fontSize: '18px', fontWeight: '500' }}>+</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="product-item-totle py-1 px-1">₹{((prod.price || 0) * item.quantity).toFixed(2)}</td>
                                                        <td className="product-item-close py-1 px-1" style={{ position: 'relative' }}>
                                                            {itemToDelete === prod._id ? (
                                                                <div style={{ position: 'absolute', right: '100%', top: '50%', transform: 'translateY(-50%)', background: '#fff', border: '1px solid #ddd', padding: '10px', borderRadius: '4px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '130px', marginRight: '10px' }}>
                                                                    <span style={{ fontSize: '12px', fontWeight: '500', color: '#333', textAlign: 'center' }}>Remove item?</span>
                                                                    <div style={{ display: 'flex', gap: '5px' }}>
                                                                        <button onClick={() => performRemove(prod._id)} style={{ flex: 1, background: '#1a1a1a', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '3px', fontSize: '12px' }}>Yes</button>
                                                                        <button onClick={() => setItemToDelete(null)} style={{ flex: 1, background: '#d33', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '3px', fontSize: '12px' }}>No</button>
                                                                    </div>
                                                                    <div style={{ position: 'absolute', right: '-6px', top: '50%', transform: 'translateY(-50%)', width: '10px', height: '10px', background: '#fff', borderRight: '1px solid #ddd', borderBottom: '1px solid #ddd', rotate: '-45deg' }} />
                                                                </div>
                                                            ) : null}
                                                            <a href="#" onClick={(e) => { e.preventDefault(); setItemToDelete(prod._id); }}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                                    <path fillRule="evenodd" clipRule="evenodd" d="M9.42543 10.2537C9.83759 10.2125 10.2051 10.5132 10.2463 10.9254L10.7463 15.9254C10.7876 16.3375 10.4868 16.7051 10.0747 16.7463C9.66253 16.7875 9.29499 16.4868 9.25378 16.0746L8.75378 11.0746C8.71256 10.6625 9.01327 10.2949 9.42543 10.2537Z" fill="white" />
                                                                    <path fillRule="evenodd" clipRule="evenodd" d="M14.5747 10.2537C14.9868 10.2949 15.2875 10.6625 15.2463 11.0746L14.7463 16.0746C14.7051 16.4868 14.3376 16.7875 13.9254 16.7463C13.5133 16.7051 13.2126 16.3375 13.2538 15.9254L13.7538 10.9254C13.795 10.5132 14.1625 10.2125 14.5747 10.2537Z" fill="white" />
                                                                    <path fillRule="evenodd" clipRule="evenodd" d="M10.1238 1.25002H13.5053C13.7217 1.24988 13.9102 1.24976 14.0882 1.27819C14.7915 1.39049 15.4001 1.82915 15.729 2.46084C15.8123 2.62073 15.8718 2.79961 15.9401 3.00494L16.0517 3.33984C16.0706 3.39653 16.076 3.41258 16.0806 3.42522C16.2557 3.90933 16.7097 4.23659 17.2244 4.24964C17.2379 4.24998 17.2545 4.25004 17.3145 4.25004H20.3145C20.7288 4.25004 21.0645 4.58582 21.0645 5.00004C21.0645 5.41425 20.7288 5.75004 20.3145 5.75004H3.31445C2.90024 5.75004 2.56445 5.41425 2.56445 5.00004C2.56445 4.58582 2.90024 4.25004 3.31445 4.25004H6.31454C6.37458 4.25004 6.39115 4.24998 6.40469 4.24964C6.91934 4.23659 7.37336 3.90936 7.54848 3.42524C7.55308 3.41251 7.55838 3.39681 7.57737 3.33984L7.68897 3.00496C7.75727 2.79964 7.81678 2.62073 7.90004 2.46084C8.22898 1.82915 8.83758 1.39049 9.54088 1.27819C9.7189 1.24976 9.90742 1.24988 10.1238 1.25002ZM8.8226 4.25004C8.87411 4.14902 8.91976 4.04404 8.95903 3.93548C8.97095 3.90251 8.98265 3.86742 8.99767 3.82234L9.09748 3.52292C9.18865 3.24941 9.20964 3.19363 9.23046 3.15364C9.34011 2.94307 9.54298 2.79686 9.77741 2.75942C9.82194 2.75231 9.88148 2.75004 10.1698 2.75004H13.4593C13.7476 2.75004 13.8071 2.75231 13.8517 2.75942C14.0861 2.79686 14.289 2.94307 14.3986 3.15364C14.4194 3.19363 14.4404 3.2494 14.5316 3.52292L14.6313 3.82216L14.6701 3.9355C14.7093 4.04405 14.755 4.14902 14.8065 4.25004H8.8226Z" fill="white" />
                                                                    <path fillRule="evenodd" clipRule="evenodd" d="M5.11616 7.75169C5.52945 7.72414 5.88683 8.03684 5.91439 8.45014L6.37433 15.3492C6.46418 16.6971 6.52821 17.6349 6.66878 18.3405C6.80513 19.025 6.99546 19.3873 7.26888 19.6431C7.54229 19.8988 7.91645 20.0647 8.60845 20.1552C9.32185 20.2485 10.2619 20.25 11.6127 20.25H12.3861C13.7369 20.25 14.6769 20.2485 15.3903 20.1552C16.0823 20.0647 16.4565 19.8988 16.7299 19.6431C17.0033 19.3873 17.1937 19.025 17.33 18.3405C17.4706 17.6349 17.5346 16.6971 17.6245 15.3492L18.0844 8.45014C18.1119 8.03684 18.4693 7.72414 18.8826 7.75169C19.2959 7.77924 19.6086 8.13662 19.5811 8.54992L19.1176 15.5016C19.0321 16.7844 18.9631 17.8205 18.8011 18.6336C18.6327 19.4789 18.3463 20.185 17.7547 20.7384C17.1631 21.2919 16.4395 21.5307 15.5849 21.6425C14.7628 21.75 13.7244 21.75 12.4388 21.75H11.56C10.2744 21.75 9.23593 21.75 8.41389 21.6425C7.55924 21.5307 6.83569 21.2919 6.2441 20.7384C5.6525 20.185 5.36608 19.4789 5.19769 18.6336C5.03571 17.8205 4.96665 16.7844 4.88116 15.5016L4.41771 8.54992C4.39015 8.13662 4.70286 7.77924 5.11616 7.75169Z" fill="white" />
                                                                </svg>
                                                            </a>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="row shop-form m-t30">
                                <div className="col-md-12 text-end">
                                    <button className="btn btn-lg btn-outline-secondary" onClick={() => fetchCart()}>UPDATE CART</button>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3">
                            <h4 className="title mb15">Cart Total</h4>
                            <div className="cart-detail">
                                <a href="javascript:void(0);" className="btn btn-outline-secondary btn-lg w-100 m-b20">Bank Offer 5% Cashback</a>
                                <div className="icon-bx-wraper style-4 m-b15">
                                    <div className="icon-bx">
                                        <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" clipRule="evenodd" d="M35.1582 7.73438C36.3226 7.73438 37.2676 8.67937 37.2676 9.84375C37.2676 10.2319 37.5826 10.5469 37.9707 10.5469C38.3588 10.5469 38.6738 10.2319 38.6738 9.84375C38.6738 7.90313 37.0988 6.32812 35.1582 6.32812C34.7701 6.32812 34.4551 6.64312 34.4551 7.03125C34.4551 7.41937 34.7701 7.73438 35.1582 7.73438Z" fill="black" />
                                            <path fillRule="evenodd" clipRule="evenodd" d="M27.3004 35.8594H26.721C25.5559 35.8594 24.6116 36.8037 24.6116 37.9688V40.7813C24.6116 41.9464 25.5559 42.8907 26.721 42.8907H29.5335C30.0735 42.8907 30.5664 42.6875 30.9398 42.3535C31.3131 42.6875 31.806 42.8907 32.346 42.8907H40.7835C41.3235 42.8907 41.8164 42.6875 42.1898 42.3535C42.5631 42.0195 42.8913 41.5266 42.8913 40.9866L42.8913 37.9688C42.8913 36.8037 41.947 35.8594 40.7819 35.8594H27.3004ZM27.3004 37.9688H26.721V40.7813H29.5335L29.5335 37.9688H27.3004ZM31.6428 37.9688V40.7813H40.7835V37.9688H31.6428Z" fill="black" />
                                        </svg>
                                    </div>
                                    <div className="icon-content">
                                        <span className="font-13">FREE</span>
                                        <h6 className="dz-title">Shipping</h6>
                                    </div>
                                </div>
                                <div className="icon-bx-wraper style-4 m-b30">
                                    <div className="icon-bx">
                                        <img src={iconPic2} alt="Enjoy" />
                                    </div>
                                    <div className="icon-content">
                                        <h6 className="dz-title">Enjoy Your Products</h6>
                                    </div>
                                </div>
                                <div className="save-text" style={{ padding: '15px 0', display: 'flex', alignItems: 'center' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '10px' }}>
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span className="m-l10" style={{ fontSize: '14px' }}>Secure checkout</span>
                                </div>
                                <table>
                                    <tbody>
                                        <tr className="total">
                                            <td><h6 className="mb-0 title">Total Amount</h6></td>
                                            <td className="price">₹{subtotal.toFixed(2)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <button
                                    onClick={() => {
                                        if (isUser) {
                                            navigate('/checkout');
                                        } else {
                                            toast.info('Please login to continue to checkout');
                                            navigate('/login');
                                        }
                                    }}
                                    className="btn btn-outline-secondary btn-lg w-100"
                                >
                                    PLACE ORDER
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section >
        </div >
    );
};

export default Cart;
