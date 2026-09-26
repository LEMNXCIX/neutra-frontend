"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type LeadingIcon = React.ComponentType<{
    className?: string;
    "aria-hidden"?: boolean | "true" | "false";
}>;

export interface PasswordInputProps
    extends Omit<React.ComponentProps<typeof Input>, "type"> {
    /** Leading icon, placed the way the login and register fields already place theirs. */
    icon?: LeadingIcon;
}

/**
 * A password field with a show/hide toggle.
 *
 * The toggle matters more than it looks: a typo in a password field is
 * indistinguishable from a wrong one, and the only way to tell them apart is to
 * read what was typed. It is also the one credential field where a sighted user
 * is expected to compare characters against a password manager.
 *
 * Built on the `relative group` pattern these forms already use for their
 * leading icon rather than on `InputGroup`. The input-group components exist in
 * this repo but are unused, and adopting them for six fields would introduce a
 * second field layout instead of finishing the one that is already there.
 *
 * The button is always `type="button"`. Five of the six call sites sit inside a
 * `<form>`, where a default submit button would post the form on every toggle
 * press.
 */
export function PasswordInput({
    className,
    icon: Icon,
    disabled,
    ...props
}: PasswordInputProps) {
    const [visible, setVisible] = React.useState(false);

    return (
        <div className="relative group">
            {Icon ? (
                <Icon
                    aria-hidden="true"
                    className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors"
                />
            ) : null}

            <Input
                type={visible ? "text" : "password"}
                className={cn("pr-11", className)}
                disabled={disabled}
                {...props}
            />

            <button
                type="button"
                onClick={() => setVisible((current) => !current)}
                disabled={disabled}
                aria-label={
                    visible ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                aria-pressed={visible}
                className="absolute right-3 top-1/2 -translate-y-1/2 grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
                {visible ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                    <Eye className="size-4" aria-hidden="true" />
                )}
            </button>
        </div>
    );
}
