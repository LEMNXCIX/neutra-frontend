import { api } from '@/lib/api-client';
import { User, LoginDto, CreateUserDto } from '@/types/frontend-api';

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
export const authService = {
    /**
     * Login with email and password
     */
    login: async (credentials: LoginDto): Promise<User> => {
        return api.post<User>('/auth/login', credentials);
    },

    /**
     * Register a new user
     */
    signup: async (userData: CreateUserDto): Promise<User> => {
        return api.post<User>('/auth/register', userData);
    },

    /**
     * Logout current user (clears HttpOnly cookie)
     */
    logout: async (): Promise<void> => {
        return api.post<void>('/auth/logout', {});
    },

    /**
     * Validate current session and get user data
     */
    validate: async (): Promise<{ user: User }> => {
        return api.get<{ user: User }>('/auth/validate', {
            headers: { 'x-suppress-unauthorized': 'true' }
        });
    },

    /**
     * Get current authenticated user
     */
    getCurrentUser: async (): Promise<User | null> => {
        try {
            const response = await authService.validate();
            return response.user;
        } catch {
            return null;
        }
    },

    /**
     * Redirect to Google OAuth
     */
    googleLogin: () => {
        // Browser must hit the backend directly so the OAuth session cookie
        // is set on the shared domain before the redirect back to the app.
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        window.location.href = `${apiUrl}/auth/google`;
    },

    /**
     * Request password reset link
     */
    forgotPassword: async (email: string): Promise<any> => {
        return api.post('/auth/forgot-password', { email });
    },

    /**
     * Reset password using token
     */
    resetPassword: async (data: any): Promise<any> => {
        return api.post('/auth/reset-password', data);
    },
};
