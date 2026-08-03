import apiClient from '../userApiClient';
import type { ApiResponse, User } from '../../interfaces';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';

export const userAuthService = {
    login: async (credentials: any): Promise<ApiResponse<{ user: User, accessToken: string }>> => {
        const response = await apiClient.post(API_ENDPOINTS.USER.AUTH.LOGIN, credentials, { skipAuthInterceptor: true } as any);
        return response.data;
    },
    googleLogin: async (credential: string): Promise<ApiResponse<{ user: User, accessToken: string }>> => {
        const response = await apiClient.post(API_ENDPOINTS.USER.AUTH.GOOGLE, { credential }, { skipAuthInterceptor: true } as any);
        return response.data;
    },
    register: async (data: any): Promise<ApiResponse<{ user: User, message?: string }>> => {
        const response = await apiClient.post(API_ENDPOINTS.USER.AUTH.REGISTER, data, { skipAuthInterceptor: true } as any);
        return response.data;
    },
    verifyEmail: async (email: string, token: string): Promise<ApiResponse<void>> => {
        const response = await apiClient.post(API_ENDPOINTS.USER.AUTH.VERIFY_EMAIL, { email, token }, { skipAuthInterceptor: true } as any);
        return response.data;
    },
    forgotPassword: async (email: string): Promise<ApiResponse<void>> => {
        const response = await apiClient.post(API_ENDPOINTS.USER.AUTH.FORGOT_PASSWORD, { email }, { skipAuthInterceptor: true } as any);
        return response.data;
    },
    resetPassword: async (token: string, newPassword: string): Promise<ApiResponse<void>> => {
        const response = await apiClient.post(API_ENDPOINTS.USER.AUTH.RESET_PASSWORD, { token, newPassword }, { skipAuthInterceptor: true } as any);
        return response.data;
    },
    logout: async (): Promise<ApiResponse<void>> => {
        const response = await apiClient.post(API_ENDPOINTS.USER.AUTH.LOGOUT, {}, { skipAuthInterceptor: true } as any);
        return response.data;
    },
    getMe: async (): Promise<ApiResponse<{ user: User }>> => {
        const response = await apiClient.get(API_ENDPOINTS.USER.AUTH.ME);
        return response.data;
    }
};
