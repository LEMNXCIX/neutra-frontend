"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    UserX,
    XCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { bookingService } from "@/services/booking.service";
import type {
    Appointment,
    AppointmentStatus,
} from "@/services/booking.service";
import { useConfirm } from "@/hooks/use-confirm";
import { toast } from "sonner";

const PAGE_SIZE = 10;
type ResolutionStatus = Extract<
    AppointmentStatus,
    "COMPLETED" | "NO_SHOW" | "CANCELLED"
>;

type ResolutionAction = {
    status: ResolutionStatus;
    label: string;
    englishLabel: string;
    reason: string;
    variant: "default" | "destructive";
    icon: typeof CheckCircle2;
};

const RESOLUTION_ACTIONS: ResolutionAction[] = [
    {
        status: "COMPLETED",
        label: "Marcar completada",
        englishLabel: "Marcar completada",
        reason: "Resolved as completed from the booking admin attention queue",
        variant: "default",
        icon: CheckCircle2,
    },
    {
        status: "NO_SHOW",
        label: "Marcar no asistió",
        englishLabel: "Marcar no asistió",
        reason: "Resolved as no-show from the booking admin attention queue",
        variant: "destructive",
        icon: UserX,
    },
    {
        status: "CANCELLED",
        label: "Cancelar",
        englishLabel: "Cancelar",
        reason: "Cancelled from the booking admin attention queue",
        variant: "destructive",
        icon: XCircle,
    },
];

export type AttentionQueueProps = {
    onRefresh?: () => void | Promise<void>;
};

export function AttentionQueue({ onRefresh }: AttentionQueueProps) {
    const router = useRouter();
    const { confirm, ConfirmDialog } = useConfirm();
    const [page, setPage] = useState(1);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [resolving, setResolving] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadQueue = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await bookingService.getAppointmentsNeedingReview(
                page,
                PAGE_SIZE,
            );
            setAppointments(result.appointments);
            setTotal(result.total);
            setTotalPages(result.pagination.totalPages);
        } catch (loadError) {
            setError(
                loadError instanceof Error
                    ? loadError.message
                    : "No se pudo cargar la cola de revisión",
            );
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        void loadQueue();
    }, [loadQueue]);

    const refresh = async (targetPage = page) => {
        if (onRefresh) {
            await onRefresh();
        } else {
            router.refresh();
        }

        if (targetPage !== page) {
            setPage(targetPage);
            return;
        }

        await loadQueue();
    };

    const resolveAppointment = async (
        appointment: Appointment,
        action: ResolutionAction,
    ) => {
        const confirmed = await confirm({
            title: action.status === "CANCELLED" ? "Cancelar cita" : "Resolver cita",
            description: `Esta acción marcará la cita como ${action.status}.`,
            confirmText: action.label,
            cancelText: "Volver",
            variant: action.variant,
        });
        if (!confirmed) return;

        const actionKey = `${appointment.id}:${action.status}`;
        setResolving(actionKey);
        setError(null);
        try {
            await bookingService.updateAppointmentStatus(
                appointment.id,
                action.status,
                action.reason,
            );
            toast.success("Cita resuelta correctamente");
            await refresh(1);
        } catch (resolveError) {
            const message =
                resolveError instanceof Error
                    ? resolveError.message
                    : "No se pudo resolver la cita";
            setError(message);
            toast.error(message);
        } finally {
            setResolving(null);
        }
    };

    return (
        <Card aria-busy={loading} data-slot="attention-queue">
            <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle
                        className="text-sm font-bold uppercase tracking-widest"
                        aria-label="Requiere revisión"
                    >
                        Requiere revisión
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {total === 0
                            ? "No hay citas pendientes de revisión"
                            : `${total} ${total === 1 ? "cita requiere" : "citas requieren"} atención`}
                    </p>
                </div>
                <Badge variant="outline">{total}</Badge>
            </CardHeader>
            <CardContent>
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                        <Spinner size="sm" />
                        Cargando citas...
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="py-8 text-center">
                        <CheckCircle2 className="mx-auto mb-3 size-8 text-emerald-500/60" />
                        <p className="font-medium">No hay citas que requieran atención</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Las citas pendientes de actualización aparecerán aquí.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {appointments.map((appointment) => (
                            <div
                                key={appointment.id}
                                className="space-y-4 py-4 first:pt-0 last:pb-0"
                            >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <p className="font-semibold">
                                            {appointment.user?.name || "Cliente"}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {appointment.service?.name || "Servicio"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Clock className="size-3.5" />
                                        {format(
                                            new Date(appointment.startTime),
                                            "MMM d, yyyy · HH:mm",
                                        )}
                                    </div>
                                </div>

                                {(appointment.statusChangeReason ||
                                    appointment.statusChangedAt) && (
                                    <div className="rounded-lg bg-muted/40 p-3 text-sm">
                                        {appointment.statusChangeReason && (
                                            <p>{appointment.statusChangeReason}</p>
                                        )}
                                        {appointment.statusChangedAt && (
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Marcada para revisión: {" "}
                                                {format(
                                                    new Date(appointment.statusChangedAt),
                                                    "MMM d, yyyy · HH:mm",
                                                )}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2">
                                    {RESOLUTION_ACTIONS.map((action) => {
                                        const actionKey = `${appointment.id}:${action.status}`;
                                        const Icon = action.icon;
                                        const isResolving = resolving === actionKey;
                                        return (
                                            <Button
                                                key={action.status}
                                                type="button"
                                                size="sm"
                                                variant={action.variant}
                                                aria-label={action.englishLabel}
                                                disabled={resolving !== null}
                                                onClick={() =>
                                                    void resolveAppointment(appointment, action)
                                                }
                                            >
                                                {isResolving ? (
                                                    <Spinner className="mr-2" size="sm" />
                                                ) : (
                                                    <Icon className="mr-2 size-4" />
                                                )}
                                                {action.label}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between border-t pt-4">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={page === 1 || loading}
                            onClick={() => setPage((current) => current - 1)}
                        >
                            <ChevronLeft className="mr-1 size-4" />
                            Anterior
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Página {page} de {totalPages}
                        </span>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={page === totalPages || loading}
                            onClick={() => setPage((current) => current + 1)}
                        >
                            Siguiente
                            <ChevronRight className="ml-1 size-4" />
                        </Button>
                    </div>
                )}
            </CardContent>
            <ConfirmDialog />
        </Card>
    );
}

export default AttentionQueue;
