import { createContext } from "react";
import { TenantFeatures } from "@/types/tenant";

interface FeatureContextType {
    features: TenantFeatures;
    isLoading: boolean;
    error: string | null;
    isFeatureEnabled: (featureName: string) => boolean;
    refreshFeatures: () => Promise<void>;
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

export { FeatureContext };
export type { FeatureContextType };
