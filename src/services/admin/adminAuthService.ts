import apiClient from '../adminApiClient';
import type { ApiResponse, User } from '../../interfaces';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';

export const adminAuthService = {
    login: async (credentials: any): Promise<ApiResponse<{ user: User, accessToken: string }>> => {
        const response = await apiClient.post(API_ENDPOINTS.ADMIN.AUTH.LOGIN, credentials, { skipAuthInterceptor: true } as any);
        return response.data;
    },
    logout: async (): Promise<ApiResponse<void>> => {
        const response = await apiClient.post(API_ENDPOINTS.ADMIN.AUTH.LOGOUT, {}, { skipAuthInterceptor: true } as any);
        return response.data;
    },
    getMe: async (): Promise<ApiResponse<{ user: User }>> => {
        const response = await apiClient.get(API_ENDPOINTS.ADMIN.AUTH.ME);
        return response.data;
    },
    updateProfile: async (data: { username?: string, password?: string, avatar?: string }): Promise<ApiResponse<{ user: User }>> => {
        const response = await apiClient.put(API_ENDPOINTS.ADMIN.AUTH.UPDATE_PROFILE, data);
        return response.data;
    }
};
