import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    CheckCircle,
    CheckCircle2,
    Loader2,
    Play,
    UserX,
    XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import React, { useState } from "react";
import { bookingService } from "@/services/booking.service";
import type { AppointmentStatus } from "@/services/booking.service";
import { canTransitionAppointmentStatus } from "@/services/booking.service";
import { toast } from "sonner";

type StatusCopy = {
    label: string;
    englishLabel: string;
    title: string;
    description: string;
    success: string;
    icon: LucideIcon;
    destructive?: boolean;
};

const STATUS_COPY: Record<AppointmentStatus, StatusCopy> = {
    PENDING: {
        label: "Actualizar cita",
        englishLabel: "Actualizar cita",
        title: "Actualizar cita",
        description: "¿Seguro que quieres actualizar esta cita?",
        success: "Cita actualizada correctamente",
        icon: CheckCircle,
    },
    CONFIRMED: {
        label: "Confirmar cita",
        englishLabel: "Confirmar cita",
        title: "Confirmar cita",
        description: "¿Seguro que quieres confirmar esta cita?",
        success: "Cita confirmada correctamente",
        icon: CheckCircle2,
    },
    IN_PROGRESS: {
        label: "Iniciar cita",
        englishLabel: "Iniciar cita",
        title: "Iniciar cita",
        description: "¿Seguro que quieres iniciar esta cita?",
        success: "Cita iniciada correctamente",
        icon: Play,
    },
    NEEDS_REVIEW: {
        label: "Marcar para revisión",
        englishLabel: "Marcar para revisión",
        title: "Marcar para revisión",
        description: "¿Seguro que quieres marcar esta cita para revisión?",
        success: "Cita marcada para revisión",
        icon: CheckCircle,
    },
    COMPLETED: {
        label: "Completar cita",
        englishLabel: "Completar cita",
        title: "Completar cita",
        description: "¿Seguro que quieres marcar esta cita como completada?",
        success: "Cita completada correctamente",
        icon: CheckCircle2,
    },
    CANCELLED: {
        label: "Cancelar cita",
        englishLabel: "Cancelar cita",
        title: "Cancelar cita",
        description: "¿Seguro que quieres cancelar esta cita?",
        success: "Cita cancelada correctamente",
        icon: XCircle,
        destructive: true,
    },
    NO_SHOW: {
        label: "Marcar como no asistió",
        englishLabel: "Marcar como no asistió",
        title: "Marcar como no asistió",
        description: "¿Seguro que quieres registrar esta cita como no asistió?",
        success: "Cita marcada como no asistió",
        icon: UserX,
        destructive: true,
    },
};

interface StatusUpdateDialogProps {
    appointmentId: string;
    newStatus: AppointmentStatus;
    currentStatus?: AppointmentStatus;
    reason?: string;
    onStatusUpdated?: () => void | Promise<void>;
    trigger?: React.ReactNode;
}

export function StatusUpdateDialog({
    appointmentId,
    newStatus,
    currentStatus,
    reason,
    onStatusUpdated,
    trigger,
}: StatusUpdateDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const copy = STATUS_COPY[newStatus];
    const isValidTransition = currentStatus
        ? canTransitionAppointmentStatus(currentStatus, newStatus)
        : true;

    const handleUpdate = async () => {
        try {
            setLoading(true);
            await bookingService.updateAppointmentStatus(
                appointmentId,
                newStatus,
                reason,
            );
            setOpen(false);
            toast.success(copy.success);
            if (onStatusUpdated) {
                try {
                    await onStatusUpdated();
                } catch {
                    // The status was updated; a refresh failure is non-fatal.
                }
            }
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Error al actualizar el estado",
            );
        } finally {
            setLoading(false);
        }
    };

    if (!isValidTransition) return null;

    const Icon = copy.icon;
    const buttonVariant = copy.destructive ? "destructive" : "default";

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!loading) setOpen(nextOpen);
            }}
        >
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        type="button"
                        variant={buttonVariant}
                        size="sm"
                        aria-label={copy.englishLabel}
                    >
                        <Icon className="mr-2 size-4" />
                        {copy.label}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{copy.title}</DialogTitle>
                    <DialogDescription>{copy.description}</DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-row justify-end gap-2 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant={buttonVariant}
                        onClick={handleUpdate}
                        disabled={loading}
                    >
                        {loading && (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                        )}
                        Confirmar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
