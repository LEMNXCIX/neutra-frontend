import { redirect } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aprobar cita",
  description: "Procesando la aprobación de la cita",
};

export default async function AppointmentApprovePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    await apiClient(`/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'CONFIRMED' }),
    });
  } catch (error) {
    console.error('Error approving appointment:', error);
  }

  redirect('/booking-admin/appointments');
}
