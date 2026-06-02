import { use } from "react";
import { FeatureContext } from "@/providers/feature-context";

export function useFeatures() {
    const context = use(FeatureContext);

    if (context === undefined) {
        throw new Error("useFeatures must be used within a FeatureProvider");
    }

    return context;
}
