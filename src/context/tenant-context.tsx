"use client";

import React, { createContext, use, useMemo, useSyncExternalStore } from "react";
import Cookies from "js-cookie";

interface TenantContextType {
  tenantId: string | null;
  tenantSlug: string | null;
  moduleType: string | null;
}

const TenantContext = createContext<TenantContextType>({
  tenantId: null,
  tenantSlug: null,
  moduleType: null,
});

const emptySubscribe = () => () => {};

export const TenantProvider = ({ children }: { children: React.ReactNode }) => {
  const tenantId = useSyncExternalStore(
    emptySubscribe,
    () => Cookies.get("tenant-id") ?? null,
    () => null,
  );
  const tenantSlug = useSyncExternalStore(
    emptySubscribe,
    () => Cookies.get("tenant-slug") ?? null,
    () => null,
  );
  const moduleType = useSyncExternalStore(
    emptySubscribe,
    () => Cookies.get("module-type") ?? null,
    () => null,
  );

  const value = useMemo(() => ({ tenantId, tenantSlug, moduleType }), [tenantId, tenantSlug, moduleType]);

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => use(TenantContext);
