'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function AppointmentApprovePage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [processing, setProcessing] = useState(true);

    useEffect(() => {
        const approveAppointment = async () => {
            try {
                await apiClient(`/appointments/${id}/status`, {
                    method: 'PUT',
                    body: JSON.stringify({ status: 'CONFIRMED' }),
                });
                toast.success('Cita aprobada exitosamente');
                router.push('/booking-admin/appointments');
            } catch (error) {
                console.error('Error approving appointment:', error);
                toast.error('Error al aprobar la cita');
                router.push('/booking-admin/appointments');
            } finally {
                setProcessing(false);
            }
        };

        if (id) {
            approveAppointment();
        }
    }, [id, router]);

    return (
        <div className="flex flex-col items-center justify-center p-8 h-[50vh]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Procesando aprobación de cita...</p>
        </div>
    );
}
