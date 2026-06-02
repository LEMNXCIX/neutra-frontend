"use client";

import React, { Suspense, useReducer, useTransition, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type ProgressState = { navigating: boolean; pathname: string; searchParams: string };

type ProgressAction =
  | { type: "NAV_START"; pathname: string; searchParams: string }
  | { type: "NAV_END" };

function progressReducer(state: ProgressState, action: ProgressAction): ProgressState {
  switch (action.type) {
    case "NAV_START":
      return { navigating: true, pathname: action.pathname, searchParams: action.searchParams };
    case "NAV_END":
      return { ...state, navigating: false };
    default:
      return state;
  }
}

function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [state, dispatch] = useReducer(progressReducer, {
    navigating: false,
    pathname,
    searchParams: searchParams.toString(),
  });

  const prevRef = useRef({ pathname, searchParams: searchParams.toString() });

  useEffect(() => {
    const prev = prevRef.current;
    if (prev.pathname !== pathname || prev.searchParams !== searchParams.toString()) {
      dispatch({ type: "NAV_START", pathname, searchParams: searchParams.toString() });
      const timeout = setTimeout(() => {
        startTransition(() => {
          dispatch({ type: "NAV_END" });
        });
      }, 500);
      prevRef.current = { pathname, searchParams: searchParams.toString() };
      return () => clearTimeout(timeout);
    }
  }, [pathname, searchParams, startTransition]);

  const isLoading = state.navigating || isPending;

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-[100] bg-muted/20">
      <div className="h-full bg-primary animate-progress origin-left" />
      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .animate-progress {
          animation: progress 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export function ProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  );
}
