"use client";
import { create } from "zustand";
import Cookies from "js-cookie";

type TenantState = {
  tenantId: string | null;
  tenantSlug: string | null;
  moduleType: string | null;
  /** Re-read tenant cookies set by the proxy (e.g. after first navigation). */
  syncFromCookies: () => void;
};

const getTenantFromCookies = () => ({
  tenantId: Cookies.get("tenant-id") ?? null,
  tenantSlug: Cookies.get("tenant-slug") ?? null,
  moduleType: Cookies.get("module-type") ?? null,
});

export const useTenantStore = create<TenantState>()((set) => ({
  ...getTenantFromCookies(),
  syncFromCookies: () => set(getTenantFromCookies()),
}));
