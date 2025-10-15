"use client";
import React, { createContext, useContext, useCallback, useState } from "react";

type Toast = { id: string; message: string; type?: "success" | "error" | "info" };

type ToastContextType = { showToast: (message: string, type?: Toast["type"]) => void };

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = String(Date.now()) + Math.random().toString(16).slice(2);
    const t: Toast = { id, message, type };
    setToasts((s) => [t, ...s]);
    setTimeout(() => remove(id), 3500);
  }, [remove]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div aria-live="polite" className="fixed top-4 right-4 z-60 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`max-w-sm w-full rounded-md px-3 py-2 shadow-md text-sm font-medium text-white ${
              t.type === "error" ? "bg-rose-600" : t.type === "success" ? "bg-emerald-600" : "bg-zinc-800"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
 
