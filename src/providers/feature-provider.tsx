"use client";

import React, { useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import { tenantService } from "@/services/tenant.service";
import { FeatureContext } from "@/providers/feature-context";
import { TenantFeatures } from "@/types/tenant";

import { useTenantStore } from "@/store/tenant-store";

export function FeatureProvider({ children }: { children: ReactNode }) {
    const { tenantId, syncFromCookies } = useTenantStore();
    const [features, setFeatures] = useState<TenantFeatures>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Tenant cookies are set by the proxy on the first response and may not
    // exist when this store module initializes; re-read them on mount.
    useEffect(() => {
        syncFromCookies();
    }, [syncFromCookies]);

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

    const isFeatureEnabled = useCallback((featureName: string): boolean => {
        return !!features[featureName];
    }, [features]);

    const refreshFeatures = useCallback(async () => {
        await fetchFeatures();
    }, [fetchFeatures]);

    const value = useMemo(() => ({
        features,
        isLoading,
        error,
        isFeatureEnabled,
        refreshFeatures,
    }), [features, isLoading, error, isFeatureEnabled, refreshFeatures]);

    return (
        <FeatureContext.Provider value={value}>
            {children}
        </FeatureContext.Provider>
    );
}
