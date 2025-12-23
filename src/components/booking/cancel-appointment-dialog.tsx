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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";
import { bookingService } from '@/services/booking.service';
import { toast } from "sonner";

interface CancelAppointmentDialogProps {
    appointmentId: string;
    onAppointmentCancelled?: () => void;
    trigger?: React.ReactNode;
}

export function CancelAppointmentDialog({
    appointmentId,
    onAppointmentCancelled,
    trigger
}: CancelAppointmentDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState("");

    const handleCancel = async () => {
        try {
            setLoading(true);
            await bookingService.cancelAppointment(appointmentId, reason || undefined);
            toast.success("Appointment cancelled successfully");
            setOpen(false);
            if (onAppointmentCancelled) {
                onAppointmentCancelled();
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to cancel appointment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="destructive">Cancel Appointment</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Cancel Appointment</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to cancel this appointment? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Textarea
                        placeholder="Reason for cancellation (optional)"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="resize-none"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Keep Appointment
                    </Button>
                    <Button variant="destructive" onClick={handleCancel} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Cancellation
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
