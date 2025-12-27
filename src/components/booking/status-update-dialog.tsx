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
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import React, { useState } from "react";
import { bookingService } from '@/services';
import { toast } from "sonner";
import { Appointment } from "@/services/booking.service";

interface StatusUpdateDialogProps {
    appointmentId: string;
    newStatus: Appointment['status'];
    onStatusUpdated?: () => void;
    trigger?: React.ReactNode;
}

export function StatusUpdateDialog({
    appointmentId,
    newStatus,
    onStatusUpdated,
    trigger
}: StatusUpdateDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const isApprove = newStatus === 'CONFIRMED';
    const title = isApprove ? "Aprobar Cita" : "Rechazar Cita";
    const description = isApprove
        ? "¿Estás seguro de que quieres aprobar esta cita?"
        : "¿Estás seguro de que quieres rechazar esta cita?";

    const confirmButtonVariant = isApprove ? "default" : "destructive";

    const handleUpdate = async () => {
        try {
            setLoading(true);
            await bookingService.updateAppointmentStatus(appointmentId, newStatus);
            toast.success(isApprove ? "Cita aprobada correctamente" : "Cita rechazada");
            setOpen(false);
            if (onStatusUpdated) {
                onStatusUpdated();
            }
        } catch (err: any) {
            toast.error(err.message || "Error al actualizar el estado");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant={confirmButtonVariant} size="sm">
                        {isApprove ? <CheckCircle className="h-4 w-4 mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                        {isApprove ? "Aprobar" : "Rechazar"}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-row justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button variant={confirmButtonVariant} onClick={handleUpdate} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
