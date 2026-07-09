"use client";

import React, { useState, useEffect, ReactNode, useCallback } from "react";
import { tenantService } from "@/services/tenant.service";
import { FeatureContext } from "@/providers/feature-context";
import { TenantFeatures } from "@/types/tenant";

import { useTenantStore } from "@/store/tenant-store";

export function FeatureProvider({ children }: { children: ReactNode }) {
    const { tenantId } = useTenantStore();
    const [features, setFeatures] = useState<TenantFeatures>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFeatures = useCallback(async () => {
        if (!tenantId) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const response = await tenantService.getFeatures(tenantId);
            setFeatures(response || {});
            setError(null);
        } catch (err: any) {
            console.error("Failed to fetch tenant features:", err);
            setError(err.message || "Failed to load features");
        } finally {
            setIsLoading(false);
        }
    }, [tenantId]);

    useEffect(() => {
        fetchFeatures();
    }, [fetchFeatures]);

    const isFeatureEnabled = (featureName: string): boolean => {
        // Default to false if not found
        // If features object has the key, return value.
        // We can also check explicit false vs undefined.
        // For now, truthy check.
        return !!features[featureName];
    };

    const refreshFeatures = async () => {
        await fetchFeatures();
    };

    const value = {
        features,
        isLoading,
        error,
        isFeatureEnabled,
        refreshFeatures,
    };

    return (
        <FeatureContext.Provider value={value}>
            {children}
        </FeatureContext.Provider>
    );
}
