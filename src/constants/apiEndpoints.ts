export const API_ENDPOINTS = {
  USER: {
    AUTH: {
      LOGIN: '/user/auth/login',
      GOOGLE: '/user/auth/google',
      REGISTER: '/user/auth/register',
      VERIFY_EMAIL: '/user/auth/verify-email',
      FORGOT_PASSWORD: '/user/auth/forgot-password',
      RESET_PASSWORD: '/user/auth/reset-password',
      LOGOUT: '/user/auth/logout',
      ME: '/user/auth/me',
      REFRESH: '/user/auth/refresh',
      ADDRESS: '/user/auth/address',
      STATES: '/user/auth/states',
      PROFILE: '/user/auth/profile',
    },
    WISHLIST: {
      GET: '/user/wishlist',
      TOGGLE: '/user/wishlist/toggle',
      SYNC: '/user/wishlist/sync',
    },
    CART: {
      GET: '/user/cart',
      TOGGLE: '/user/cart/toggle',
      SYNC: '/user/cart/sync',
      CALCULATE: '/user/cart/calculate',
      UPDATE: '/user/cart/update',
      REMOVE: (productId: string) => `/user/cart/${productId}`,
    },
    PRODUCTS: {
      LIST: '/user/products',
      FEATURED: '/user/products/featured',
      COMBO_OFFERS: '/user/products/combo-offers',
      OFFER_PRODUCTS: '/user/products/offer-products',
      DETAILS: (id: string) => `/user/products/${id}`,
      CATEGORIES_HIERARCHY: '/user/categories/hierarchy',
    },
    CATEGORIES: {
      LIST: '/user/categories',
    },
    ORDERS: {
      LIST: '/user/order',
      DETAILS: (id: string) => `/user/order/${id}`,
      CREATE: '/user/order',
      VERIFY_PAYMENT: '/user/order/verify-payment',
      SHIPPING_CHARGE: (state: string) => `/user/order/shipping-charge/${state}`,
    },
    COUPONS: {
      ACTIVE: '/user/coupon/active',
      VALIDATE: '/user/coupon/validate',
    },
    WALLET: {
      GET: '/user/wallet',
    }
  },
  ADMIN: {
    AUTH: {
      LOGIN: '/admin/auth/login',
      LOGOUT: '/admin/auth/logout',
      ME: '/admin/auth/me',
      UPDATE_PROFILE: '/admin/auth/update-profile',
    },
    PRODUCTS: {
      LIST: '/admin/products',
      OPTIONS: '/admin/products/options',
      DETAILS: (id: string) => `/admin/products/${id}`,
      HIGHLIGHT: (productId: string) => `/admin/products/${productId}/highlight`,
    },
    ORDERS: {
      LIST: '/admin/orders',
      DETAILS: (id: string) => `/admin/orders/${id}`,
      STATUS: (id: string) => `/admin/orders/${id}/status`,
      PAYMENT_STATUS: (id: string) => `/admin/orders/${id}/payment-status`,
    },
    USERS: {
      LIST: '/admin/users',
      STATUS: (id: string) => `/admin/users/${id}/status`,
    },
    OFFERS: {
      LIST: '/admin/offers',
      DETAILS: (id: string) => `/admin/offers/${id}`,
      TOGGLE: (id: string) => `/admin/offers/${id}/toggle`,
    },
    COUPONS: {
      LIST: '/admin/coupon',
      ADD: '/admin/coupon/add',
      DETAILS: (id: string) => `/admin/coupon/${id}`,
      TOGGLE: (id: string) => `/admin/coupon/${id}/toggle-status`,
    },
    CATEGORIES: {
      LIST: '/admin/categories',
      DETAILS: (id: string) => `/admin/categories/${id}`,
    },
    SUBCATEGORIES: {
      LIST: '/admin/subcategories',
      DETAILS: (id: string) => `/admin/subcategories/${id}`,
    },
    SHIPPING_AGENCIES: '/admin/shipping-agencies',
  }
} as const;
