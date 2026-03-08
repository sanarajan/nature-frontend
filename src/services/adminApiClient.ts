import axios, {
    AxiosError,
} from "axios";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from '../constants/apiConstants';

const getAccessToken = (): string | null => {
    return localStorage.getItem('admin_accessToken');
};

const adminApiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

// ✅ Request Interceptor
adminApiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        config.headers['role'] = 'admin';
        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

// ✅ Response Interceptor
adminApiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
            skipAuthInterceptor?: boolean;
        };

        // If the request explicitly asks to skip auth interception (e.g. login, register, logout),
        // we do not attempt to refresh tokens to avoid masking the real error.
        if (originalRequest.skipAuthInterceptor) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshResponse = await axios.post(
                    `${API_BASE_URL}/admin/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                const { accessToken } = refreshResponse.data.data;

                if (accessToken) {
                    localStorage.setItem('admin_accessToken', accessToken);
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return adminApiClient(originalRequest);
                } else {
                    throw new Error("Invalid refresh response");
                }
            } catch (refreshError) {
                if (window.location.pathname.startsWith('/admin')) {
                    window.location.href = '/admin';
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default adminApiClient;
