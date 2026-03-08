export interface User {
    id: string;
    username?: string;
    displayName?: string;
    name?: string;
    email: string;
    phoneNumber?: string;
    phone?: string;
    mobile?: string;
    role?: string;
    token?: string;
    imageUrl?: string;
    referralId?: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data: T;
    statusCode: number;
}

export interface AuthState {
    user: {
        data: User | null;
        isAuthenticated: boolean;
        loading: boolean;
        error: string | null;
    };
    admin: {
        data: User | null;
        isAuthenticated: boolean;
        loading: boolean;
        error: string | null;
    };
}
