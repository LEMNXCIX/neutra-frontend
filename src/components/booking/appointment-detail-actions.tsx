'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { CancelAppointmentDialog } from '@/components/booking/cancel-appointment-dialog';
import { useRouter } from 'next/navigation';

interface AppointmentDetailActionsProps {
    appointmentId: string;
    status: string;
}

export function AppointmentDetailActions({ appointmentId, status }: AppointmentDetailActionsProps) {
    const router = useRouter();

    const handleRefresh = () => {
        router.refresh();
    };

    return (
        <div className="pt-2">
            <Button asChild variant="outline" className="w-full">
                <a href="/contact">View Location Map</a>
            </Button>
            {status === 'PENDING' && (
                <div className="mt-4 pt-2 border-t">
                    <p className="text-[10px] text-center mb-3 text-muted-foreground italic">
                        Need to reschedule? Please contact us directly.
                    </p>
                    <CancelAppointmentDialog
                        appointmentId={appointmentId}
                        onAppointmentCancelled={handleRefresh}
                        trigger={
                            <Button variant="destructive" className="w-full">
                                Cancel Appointment
                            </Button>
                        }
                    />
                </div>
            )}
        </div>
    );
}
