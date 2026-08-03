import AdminLayout from './layouts/AdminLayout/AdminLayout'
import Dashboard from './pages/Admin/Dashboard/Dashboard'
import AdminProducts from './pages/Admin/Products/AdminProducts'
import AddProduct from './pages/Admin/Products/AddProduct'
import EditProduct from './pages/Admin/Products/EditProduct'
import AdminCategories from './pages/Admin/Categories/AdminCategories'
import AdminSubcategories from './pages/Admin/Categories/AdminSubcategories'
import AdminCustomers from './pages/Admin/Customers/AdminCustomers'
import AdminInfluencers from './pages/Admin/Influencers/AdminInfluencers'
import AdminLoyaltySettings from './pages/Admin/LoyaltySettings/AdminLoyaltySettings'
import AdminOrders from './pages/Admin/Orders/AdminOrders'
import AdminOrderDetails from './pages/Admin/Orders/AdminOrderDetails'
import AdminCoupons from './pages/Admin/Coupons/AdminCoupons'
import AddCoupon from './pages/Admin/Coupons/AddCoupon'
import AgencyList from './pages/Admin/ShippingAgencies/AgencyList'
import AgencyForm from './pages/Admin/ShippingAgencies/AgencyForm'
import ShippingCharges from './pages/Admin/ShippingCharges/ShippingCharges'
import AdminProfile from './pages/Admin/Profile/AdminProfile'
import AdminStaff from './pages/Admin/Staff/AdminStaff'
import ProductCategoryOffers from './pages/Admin/Offers/ProductCategoryOffers'
import AdminComboOffers from './pages/Admin/Offers/ComboOffers'
import AdminSpinWheel from './pages/Admin/SpinWheel/AdminSpinWheel'
import MyRewards from './pages/Account/MyRewards'
import UserComboOffers from './pages/Shop/ComboOffers'


import Header from './components/Header/Header'
import SpinWheelPopup from './components/SpinWheelPopup/SpinWheelPopup'
import Footer from './components/Footer/Footer'

import Home from './pages/Home/Home'
import About from './pages/About/About'
import Contact from './pages/Contact/Contact'
import Shop from './pages/Shop/Shop'
import ProductDetails from './pages/ProductDetails/ProductDetails'
import Offers from './pages/Offers/Offers'
import Cart from './pages/Cart/Cart'
import Checkout from './pages/Checkout/Checkout'
import OrderSuccess from './pages/Checkout/OrderSuccess'
import Login from './pages/Login/Login'
import ForgotPassword from './pages/Login/ForgotPassword'
import ResetPassword from './pages/Login/ResetPassword'
import Registration from './pages/Registration/Registration'
import RegistrationSuccess from './pages/Registration/RegistrationSuccess'
import VerifyEmail from './pages/Registration/VerifyEmail'
import Wishlist from './pages/Wishlist/Wishlist'
import Account from './pages/Account/Account'
import Profile from './pages/Account/Profile'
import Address from './pages/Account/Address'
import ShippingAddress from './pages/Account/ShippingAddress'
import Orders from './pages/Account/Orders'
import OrderDetails from './pages/Account/OrderDetails'
import InfluencerDashboard from './pages/Account/InfluencerDashboard'
import WithdrawalHistory from './pages/Account/WithdrawalHistory'
import NaturePoints from './pages/Account/NaturePoints'
import AdminLogin from './pages/Admin/AdminLogin'

import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from './store';
import { adminAuthService } from './services/admin/adminAuthService';
import { userAuthService } from './services/user/userAuthService';
import { adminLoginSuccess, userLoginSuccess, adminLogout, userLogout } from './store/authSlice';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import GuestRoute from './components/Auth/GuestRoute';
import userApiClient from './services/userApiClient';

function App() {
  const dispatch = useDispatch();
  const { admin } = useSelector((state: RootState) => state.auth);
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);

    // Influencer Referral Tracking
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      // Set cookie for 30 days (preserves existing attribution logic unchanged)
      document.cookie = `influencer_ref=${refCode}; path=/; max-age=2592000`;

      // sessionStorage guard: only fire track-visit once per (refCode, browser session)
      const trackKey = `inf_tracked_${refCode.toUpperCase()}`;
      const alreadyTracked = sessionStorage.getItem(trackKey);

      if (!alreadyTracked) {
        // Generate or retrieve a stable session identifier for this browser tab session.
        // sessionStorage is cleared when the tab is closed, so new sessions get a new ID.
        let sessionId = sessionStorage.getItem('inf_session_id');
        if (!sessionId) {
          sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
          sessionStorage.setItem('inf_session_id', sessionId);
        }

        // Fire the backend visit record (backend also deduplicates via unique index)
        userApiClient
          .post('/user/influencer/track-visit', { code: refCode, sessionId })
          .then(() => {
            // Mark as tracked in this session so route changes don't re-fire
            sessionStorage.setItem(trackKey, '1');
          })
          .catch(() => {
            // Silently ignore — tracking must never block the user
          });
      }

      // Clean up URL without refreshing the page
      params.delete('ref');
      const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, [pathname, search]);

  useEffect(() => {
    const checkAuth = async () => {
      const adminToken = localStorage.getItem('admin_accessToken');
      if (adminToken) {
        try {
          const res = await adminAuthService.getMe();
          if (res.success && res.data) {
            dispatch(adminLoginSuccess(res.data.user));
          }
        } catch (err) {
          console.error("Admin auth check failed, clearing token", err);
          dispatch(adminLogout());
        }
      }

      const userToken = localStorage.getItem('user_accessToken');
      if (userToken) {
        try {
          const res = await userAuthService.getMe();
          if (res.success && res.data) {
            dispatch(userLoginSuccess(res.data.user));
          }
        } catch (err) {
          console.error("User auth check failed, clearing token", err);
          dispatch(userLogout());
        }
      }
    };
    checkAuth();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'admin_accessToken' && !e.newValue) {
        dispatch(adminLogout());
      }
      if (e.key === 'user_accessToken' && !e.newValue) {
        dispatch(userLogout());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [dispatch]);

  return (
    <div className="page-wraper" id="scroll-container">
      <Routes>
        {/* Admin Login - Explicitly just /admin */}
        <Route path="/admin" element={
          <GuestRoute type="admin">
            <AdminLogin />
          </GuestRoute>
        } />

        {/* Admin Layout - Uses explicit child paths so it doesn't conflict with exact /admin */}
        <Route element={
          <ProtectedRoute type="admin">
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/products/add" element={<AddProduct />} />
          <Route path="/admin/products/edit/:id" element={<EditProduct />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/subcategories" element={<AdminSubcategories />} />
          <Route path="/admin/coupons" element={<AdminCoupons />} />
          <Route path="/admin/coupons/add" element={<AddCoupon />} />
          <Route path="/admin/coupons/edit/:id" element={<AddCoupon />} />
          <Route path="/admin/influencers" element={<AdminInfluencers />} />
          <Route
            path="/admin/staff"
            element={
              admin.data?.role?.toUpperCase() === 'ADMIN' ? (
                <AdminStaff />
              ) : (
                <Navigate to="/admin/dashboard" replace />
              )
            }
          />
          <Route path="/admin/offers/product-category" element={<ProductCategoryOffers />} />
          <Route path="/admin/offers/combo" element={<AdminComboOffers />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/orders/all" element={<AdminOrders />} />
          <Route path="/admin/orders/:id" element={<AdminOrderDetails />} />
          <Route path="/admin/orders/completed" element={<AdminOrders />} />


          <Route path="/admin/finance/billing" element={<div className="p-4">Finance Billing (Coming Soon)</div>} />
          <Route path="/admin/finance/invoices" element={<div className="p-4">Finance Invoices (Coming Soon)</div>} />
          <Route path="/admin/finance/discount" element={<div className="p-4">Finance Discounts (Coming Soon)</div>} />

          <Route path="/admin/customers" element={<AdminCustomers />} />

          <Route path="/admin/shipping-agencies" element={<AgencyList />} />
          <Route path="/admin/shipping-agencies/add" element={<AgencyForm />} />
          <Route path="/admin/shipping-agencies/edit/:id" element={<AgencyForm />} />
          <Route path="/admin/shipping-charges" element={<ShippingCharges />} />
          <Route path="/admin/marketing/spin-wheel" element={<AdminSpinWheel />} />
          <Route path="/admin/loyalty-settings" element={<AdminLoyaltySettings />} />





          <Route path="/admin/settings" element={<div className="p-4">Settings Page (Coming Soon)</div>} />
          <Route path="/admin/integrations" element={<div className="p-4">Integrations Page (Coming Soon)</div>} />
        </Route>

        {/* Public Routes */}

        <Route
          path="/*"
          element={
            <>
              <Header />
              <SpinWheelPopup />
              <div className="page-content bg-white">

                <Routes>
                  <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/offers" element={<Offers />} />
                  <Route path="/combo-offers" element={<UserComboOffers />} />
                  <Route path="/product/:id" element={<ProductDetails />} />
                  <Route path="/shop-cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/checkout/success" element={<OrderSuccess />} />
                  <Route path="/login" element={
                    <GuestRoute type="user">
                      <Login />
                    </GuestRoute>
                  } />
                  <Route path="/forgot-password" element={
                    <GuestRoute type="user">
                      <ForgotPassword />
                    </GuestRoute>
                  } />
                  <Route path="/reset-password" element={
                    <GuestRoute type="user">
                      <ResetPassword />
                    </GuestRoute>
                  } />
                  <Route path="/registration" element={
                    <GuestRoute type="user">
                      <Registration />
                    </GuestRoute>
                  } />
                  <Route path="/registration-success" element={
                    <GuestRoute type="user">
                      <RegistrationSuccess />
                    </GuestRoute>
                  } />
                  <Route path="/verify-email" element={
                    <GuestRoute type="user">
                      <VerifyEmail />
                    </GuestRoute>
                  } />
                  <Route path="/wishlist" element={<Wishlist />} />

                  {/* Protected User Routes */}
                  <Route path="/account" element={
                    <ProtectedRoute type="user">
                      <Account />
                    </ProtectedRoute>
                  } />
                  <Route path="/account/profile" element={
                    <ProtectedRoute type="user">
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="/account/influencer" element={
                    <ProtectedRoute type="user">
                      <InfluencerDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/account/influencer/withdrawals" element={
                    <ProtectedRoute type="user">
                      <WithdrawalHistory />
                    </ProtectedRoute>
                  } />
                  <Route path="/account/address" element={
                    <ProtectedRoute type="user">
                      <Address />
                    </ProtectedRoute>
                  } />
                  <Route path="/account/address/add" element={
                    <ProtectedRoute type="user">
                      <ShippingAddress />
                    </ProtectedRoute>
                  } />
                  <Route path="/account/address/edit" element={
                    <ProtectedRoute type="user">
                      <ShippingAddress />
                    </ProtectedRoute>
                  } />
                  <Route path="/account/orders" element={
                    <ProtectedRoute type="user">
                      <Orders />
                    </ProtectedRoute>
                  } />
                  <Route path="/account/orders/:id" element={
                    <ProtectedRoute type="user">
                      <OrderDetails />
                    </ProtectedRoute>
                  } />
                  <Route path="/account/nature-points" element={
                    <ProtectedRoute type="user">
                      <NaturePoints />
                    </ProtectedRoute>
                  } />
                  <Route path="/account/my-rewards" element={
                    <ProtectedRoute type="user">
                      <MyRewards />
                    </ProtectedRoute>
                  } />

                </Routes>
              </div>
              <Footer />
            </>
          }
        />
      </Routes>
    </div>
  )
}

export default App
