import apiClient from '../adminApiClient';
import type { ApiResponse, User } from '../../interfaces';

export const adminAuthService = {
    login: async (credentials: any): Promise<ApiResponse<{ user: User, accessToken: string }>> => {
        const response = await apiClient.post('/admin/auth/login', credentials, { skipAuthInterceptor: true } as any);
        return response.data;
    },
    logout: async (): Promise<ApiResponse<void>> => {
        const response = await apiClient.post('/admin/auth/logout', {}, { skipAuthInterceptor: true } as any);
        return response.data;
    },
    getMe: async (): Promise<ApiResponse<{ user: User }>> => {
        const response = await apiClient.get('/admin/auth/me');
        return response.data;
    },
    updateProfile: async (data: { username?: string, password?: string, avatar?: string }): Promise<ApiResponse<{ user: User }>> => {
        const response = await apiClient.put('/admin/auth/update-profile', data);
        return response.data;
    }
};
