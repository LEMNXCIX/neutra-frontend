import {
    type AuthActions,
    type AuthData,
    type AuthState,
    authStore,
    type User,
} from "./tanstack/auth-store";
import { createStoreHook } from "./tanstack/create-store-hook";

export const useAuthStore = createStoreHook<AuthData, AuthActions>(authStore);

export type { AuthState, User };
