'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';

interface TenantContextType {
    tenantId: string | null;
    tenantSlug: string | null;
}

const TenantContext = createContext<TenantContextType>({ tenantId: null, tenantSlug: null });

export const TenantProvider = ({ children }: { children: React.ReactNode }) => {
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [tenantSlug, setTenantSlug] = useState<string | null>(null);

    useEffect(() => {
        // Read from cookies set by middleware
        const storedId = Cookies.get('tenant-id');
        const storedSlug = Cookies.get('tenant-slug');

        if (storedId) setTenantId(storedId);
        if (storedSlug) setTenantSlug(storedSlug);
    }, []);

    return (
        <TenantContext.Provider value={{ tenantId, tenantSlug }}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => useContext(TenantContext);
