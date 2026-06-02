"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function InputGroup({ className, ...props }: React.ComponentProps<"fieldset">) {
    return (
        <fieldset
            data-slot="input-group"
            className={cn(
                "group/input-group border-input dark:bg-input/30 relative flex w-full items-center rounded-md border shadow-xs transition-[color,box-shadow] outline-none",
                "h-9 has-[>textarea]:h-auto",

                "has-[>[data-align=inline-start]]:[&>input]:pl-2",
                "has-[>[data-align=inline-end]]:[&>input]:pr-2",
                "has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-start]]:[&>input]:pb-3",
                "has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-end]]:[&>input]:pt-3",

                "has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 has-[[data-slot=input-group-control]:focus-visible]:ring-[3px]",

                "has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[[data-slot][aria-invalid=true]]:border-destructive dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40",

                className,
            )}
            {...props}
        />
    );
}

export { InputGroup };
export { InputGroupAddon } from "./input-group-addon";
export { InputGroupButton } from "./input-group-button";
export { InputGroupText } from "./input-group-text";
export { InputGroupInput } from "./input-group-input";
export { InputGroupTextarea } from "./input-group-textarea";
