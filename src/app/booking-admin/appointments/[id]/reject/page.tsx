import { redirect } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reject Appointment",
  description: "Processing appointment rejection",
};

export default async function AppointmentRejectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    await apiClient(`/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'CANCELLED' }),
    });
  } catch (error) {
    console.error('Error rejecting appointment:', error);
  }

  redirect('/booking-admin/appointments');
}
