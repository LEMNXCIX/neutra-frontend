'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { tenantService } from '@/services/tenant.service';
import { TenantFeatures } from '@/types/tenant';
// Assuming we have a way to get current tenant ID, possibly from another context or prop
// For now, let's assume it's passed as a prop or we get it from an authentication context if available there.
// Or effectively, this runs in layout where tenant data might be available.

interface FeatureContextType {
    features: TenantFeatures;
    isLoading: boolean;
    error: string | null;
    isFeatureEnabled: (featureName: string) => boolean;
    refreshFeatures: () => Promise<void>;
}

export const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

import { useTenant } from '@/context/tenant-context';

export function FeatureProvider({ children }: { children: ReactNode }) {
    const { tenantId } = useTenant();
    const [features, setFeatures] = useState<TenantFeatures>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFeatures = async () => {
        if (!tenantId) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const response = await tenantService.getFeatures(tenantId);
            // apiClient already returns the data payload
            setFeatures(response || {});
            setError(null);
        } catch (err: any) {
            console.error('Failed to fetch tenant features:', err);
            setError(err.message || 'Failed to load features');
            // Don't crash app, just empty features
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFeatures();
    }, [tenantId]);

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
        refreshFeatures
    };

    return (
        <FeatureContext.Provider value={value}>
            {children}
        </FeatureContext.Provider>
    );
}
