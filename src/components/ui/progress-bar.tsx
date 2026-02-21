"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Trigger loading state on route change
    setIsLoading(true);
    
    // Quick timeout to reset - in a real Next.js app with complex routing events 
    // we might use a more robust library, but this gives immediate feedback
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-[100] bg-muted/20">
      <div className="h-full bg-primary animate-progress origin-left" />
      <style jsx>{`
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
