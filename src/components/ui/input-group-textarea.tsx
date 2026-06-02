"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

function InputGroupTextarea({
    className,
    ...props
}: React.ComponentProps<"textarea">) {
    return (
        <Textarea
            data-slot="input-group-control"
            className={cn(
                "flex-1 resize-none rounded-none border-0 bg-transparent py-3 shadow-none focus-visible:ring-0 dark:bg-transparent",
                className,
            )}
            {...props}
        />
    );
}

export { InputGroupTextarea };
