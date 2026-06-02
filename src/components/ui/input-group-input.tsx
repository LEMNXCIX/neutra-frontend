"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

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
