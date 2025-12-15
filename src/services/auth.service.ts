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
        return api.post<User>('/auth/signup', userData);
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
        return api.get<{ user: User }>('/auth/validate');
    },

    /**
     * Get current authenticated user
     */
    getCurrentUser: async (): Promise<User | null> => {
        try {
            const response = await authService.validate();
            return response.user;
        } catch (error) {
            return null;
        }
    },

    /**
     * Redirect to Google OAuth
     */
    googleLogin: () => {
        const apiUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4001/api';
        window.location.href = `${apiUrl}/auth/google`;
    },
};
