import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, User } from '../interfaces';

const initialState: AuthState = {
    user: {
        data: null,
        isAuthenticated: false,
        loading: false,
        error: null,
    },
    admin: {
        data: null,
        isAuthenticated: false,
        loading: false,
        error: null,
    }
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUserLoading: (state, action: PayloadAction<boolean>) => {
            state.user.loading = action.payload;
        },
        userLoginSuccess: (state, action: PayloadAction<User>) => {
            state.user.data = action.payload;
            state.user.isAuthenticated = true;
            state.user.loading = false;
            state.user.error = null;
        },
        userLoginFailure: (state, action: PayloadAction<string>) => {
            state.user.data = null;
            state.user.isAuthenticated = false;
            state.user.loading = false;
            state.user.error = action.payload;
        },
        userLogout: (state) => {
            state.user.data = null;
            state.user.isAuthenticated = false;
            state.user.loading = false;
            state.user.error = null;
            localStorage.removeItem('user_accessToken');
            localStorage.removeItem('user_data');
        },
        setAdminLoading: (state, action: PayloadAction<boolean>) => {
            state.admin.loading = action.payload;
        },
        adminLoginSuccess: (state, action: PayloadAction<User>) => {
            state.admin.data = action.payload;
            state.admin.isAuthenticated = true;
            state.admin.loading = false;
            state.admin.error = null;
        },
        adminLoginFailure: (state, action: PayloadAction<string>) => {
            state.admin.data = null;
            state.admin.isAuthenticated = false;
            state.admin.loading = false;
            state.admin.error = action.payload;
        },
        adminLogout: (state) => {
            state.admin.data = null;
            state.admin.isAuthenticated = false;
            state.admin.loading = false;
            state.admin.error = null;
            localStorage.removeItem('admin_accessToken');
            localStorage.removeItem('admin_data');
        },
    },
});

export const {
    setUserLoading, userLoginSuccess, userLoginFailure, userLogout,
    setAdminLoading, adminLoginSuccess, adminLoginFailure, adminLogout
} = authSlice.actions;
export default authSlice.reducer;
