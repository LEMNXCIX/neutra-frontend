import { createContext } from "react";
import type { TenantFeatures } from "@/types/tenant";

interface FeatureContextType {
    features: TenantFeatures;
    isLoading: boolean;
    error: string | null;
    isFeatureEnabled: (featureName: string) => boolean;
    refreshFeatures: () => Promise<void>;
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

export type { FeatureContextType };
export { FeatureContext };
