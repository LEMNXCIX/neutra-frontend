import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type SpinnerProps = React.ComponentProps<"svg"> & { size?: number | string };

function Spinner({ className, size, ...props }: SpinnerProps) {
  return (
    <Loader2
      role="status"
      aria-label="Loading"
      size={size}
      className={cn("h-4 w-4 animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
