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

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

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
            if (isRefreshing) {
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = 'Bearer ' + token;
                    return apiClient(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const userRole = getRoleFromPath();
                const refreshUrl = userRole === 'admin' ? '/admin/auth/refresh' : '/user/auth/refresh';

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
                    processQueue(null, accessToken);
                    return apiClient(originalRequest);
                } else {
                    throw new Error("Invalid refresh response");
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                const path = getRedirectPathFromCurrentRoute();
                window.location.href = path;
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
