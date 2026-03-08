import apiClient from '../userApiClient';
import type { ApiResponse, User } from '../../interfaces';

export const userAuthService = {
    login: async (credentials: any): Promise<ApiResponse<{ user: User, accessToken: string }>> => {
        const response = await apiClient.post('/user/auth/login', credentials, { skipAuthInterceptor: true } as any);
        return response.data;
    },
    register: async (data: any): Promise<ApiResponse<{ user: User, message?: string }>> => {
        const response = await apiClient.post('/user/auth/register', data, { skipAuthInterceptor: true } as any);
        return response.data;
    },
    verifyEmail: async (email: string, token: string): Promise<ApiResponse<void>> => {
        const response = await apiClient.post('/user/auth/verify-email', { email, token }, { skipAuthInterceptor: true } as any);
        return response.data;
    },
    logout: async (): Promise<ApiResponse<void>> => {
        const response = await apiClient.post('/user/auth/logout', {}, { skipAuthInterceptor: true } as any);
        return response.data;
    },
    getMe: async (): Promise<ApiResponse<{ user: User }>> => {
        const response = await apiClient.get('/user/auth/me');
        return response.data;
    }
};
