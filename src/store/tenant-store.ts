"use client";
import { create } from "zustand";
import Cookies from "js-cookie";

type TenantState = {
  tenantId: string | null;
  tenantSlug: string | null;
  moduleType: string | null;
};

const getTenantFromCookies = (): TenantState => ({
  tenantId: Cookies.get("tenant-id") ?? null,
  tenantSlug: Cookies.get("tenant-slug") ?? null,
  moduleType: Cookies.get("module-type") ?? null,
});

export const useTenantStore = create<TenantState>()(() => getTenantFromCookies());
