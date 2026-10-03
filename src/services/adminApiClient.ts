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
            if (isRefreshing) {
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = 'Bearer ' + token;
                    return adminApiClient(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                console.log(API_BASE_URL,"constant api");
                const refreshResponse = await axios.post(
                    `${API_BASE_URL}/admin/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                const { accessToken } = refreshResponse.data.data;

                if (accessToken) {
                    localStorage.setItem('admin_accessToken', accessToken);
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    processQueue(null, accessToken);
                    return adminApiClient(originalRequest);
                } else {
                    throw new Error("Invalid refresh response");
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                if (window.location.pathname.startsWith('/admin')) {
                    window.location.href = '/admin';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default adminApiClient;
