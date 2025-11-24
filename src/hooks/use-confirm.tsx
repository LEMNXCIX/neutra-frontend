import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmOptions {
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
}

export function useConfirm() {
    const [promise, setPromise] = useState<{
        resolve: (value: boolean) => void;
    } | null>(null);
    const [options, setOptions] = useState<ConfirmOptions>({});

    const confirm = (opts?: ConfirmOptions): Promise<boolean> => {
        setOptions({
            title: opts?.title || "Are you sure?",
            description: opts?.description || "This action cannot be undone.",
            confirmText: opts?.confirmText || "Continue",
            cancelText: opts?.cancelText || "Cancel",
            variant: opts?.variant || "default",
        });

        return new Promise((resolve) => {
            setPromise({ resolve });
        });
    };

    const handleClose = () => {
        setPromise(null);
    };

    const handleConfirm = () => {
        promise?.resolve(true);
        handleClose();
    };

    const handleCancel = () => {
        promise?.resolve(false);
        handleClose();
    };

    const ConfirmDialog = () => (
        <AlertDialog open={promise !== null} onOpenChange={handleClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{options.title}</AlertDialogTitle>
                    <AlertDialogDescription>{options.description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleCancel}>
                        {options.cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        className={
                            options.variant === "destructive"
                                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                : ""
                        }
                    >
                        {options.confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );

    return { confirm, ConfirmDialog };
}
