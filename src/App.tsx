import AdminLayout from './layouts/AdminLayout/AdminLayout'
import Dashboard from './pages/Admin/Dashboard/Dashboard'
import AdminProducts from './pages/Admin/Products/AdminProducts'
import AddProduct from './pages/Admin/Products/AddProduct'
import EditProduct from './pages/Admin/Products/EditProduct'
import AdminCategories from './pages/Admin/Categories/AdminCategories'
import AdminSubcategories from './pages/Admin/Categories/AdminSubcategories'
import AdminCustomers from './pages/Admin/Customers/AdminCustomers'
import AdminOrders from './pages/Admin/Orders/AdminOrders'
import AdminOrderDetails from './pages/Admin/Orders/AdminOrderDetails'
import AdminCoupons from './pages/Admin/Coupons/AdminCoupons'
import AddCoupon from './pages/Admin/Coupons/AddCoupon'
import AgencyList from './pages/Admin/ShippingAgencies/AgencyList'
import AgencyForm from './pages/Admin/ShippingAgencies/AgencyForm'
import ShippingCharges from './pages/Admin/ShippingCharges/ShippingCharges'
import AdminProfile from './pages/Admin/Profile/AdminProfile'

import Header from './components/Header/Header'
import Footer from './components/Footer/Footer'
import Home from './pages/Home/Home'
import Shop from './pages/Shop/Shop'
import ProductDetails from './pages/ProductDetails/ProductDetails'
import Cart from './pages/Cart/Cart'
import Checkout from './pages/Checkout/Checkout'
import OrderSuccess from './pages/Checkout/OrderSuccess'
import Login from './pages/Login/Login'
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
import AdminLogin from './pages/Admin/AdminLogin'

import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { adminAuthService } from './services/admin/adminAuthService';
import { userAuthService } from './services/user/userAuthService';
import { adminLoginSuccess, userLoginSuccess, adminLogout, userLogout } from './store/authSlice';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import GuestRoute from './components/Auth/GuestRoute';

function App() {
  const dispatch = useDispatch();

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

          <Route path="/admin/settings" element={<div className="p-4">Settings Page (Coming Soon)</div>} />
          <Route path="/admin/integrations" element={<div className="p-4">Integrations Page (Coming Soon)</div>} />
        </Route>

        {/* Public Routes */}
        <Route
          path="/*"
          element={
            <>
              <Header />
              <div className="page-content bg-white">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/product/:id" element={<ProductDetails />} />
                  <Route path="/shop-cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/checkout/success" element={<OrderSuccess />} />
                  <Route path="/login" element={
                    <GuestRoute type="user">
                      <Login />
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
