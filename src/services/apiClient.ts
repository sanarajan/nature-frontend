import axios, {
    AxiosError,
} from "axios";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from '../constants/apiConstants';
import { getRoleFromPath } from "../utils/RoleHelper";
import { getRedirectPathFromCurrentRoute } from "../utils/AuthRedirection";

const getAccessToken = (): string | null => {
    const role = 'admin';
    return role ? localStorage.getItem(`${role}_accessToken`) : null;
};

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

// ✅ Request Interceptor
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getAccessToken();
        const role = getRoleFromPath();

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (role) {
            config.headers['role'] = role;
        }

        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

// ✅ Response Interceptor
apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const userRole = getRoleFromPath();
                const refreshUrl = userRole === 'admin' ? '/admin/auth/refresh' : '/auth/refresh';

                const refreshResponse = await axios.post(
                    `${API_BASE_URL}${refreshUrl}`,
                    { userRole },
                    { withCredentials: true }
                );

                const { accessToken, role } = refreshResponse.data.data;

                if (accessToken && role) {
                    // Update the role-specific token based on what the server returned
                    localStorage.setItem(`${role}_accessToken`, accessToken);

                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return apiClient(originalRequest);
                } else {
                    throw new Error("Invalid refresh response");
                }
            } catch (refreshError) {
                const path = getRedirectPathFromCurrentRoute();
                window.location.href = path;
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
