"use client";

import type * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function InputGroupInput({
    className,
    ...props
}: React.ComponentProps<"input">) {
    return (
        <Input
            data-slot="input-group-control"
            className={cn(
                "flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent",
                className,
            )}
            {...props}
        />
    );
}

export { InputGroupInput };
