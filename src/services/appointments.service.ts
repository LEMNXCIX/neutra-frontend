import { api } from '@/lib/api-client';

export interface Appointment {
    id: string;
    userId: string;
    serviceId: string;
    staffId: string;
    startTime: string;
    endTime: string;
    status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
    notes?: string;
    cancellationReason?: string;
    couponId?: string;
    discountAmount: number;
    subtotal: number;
    total: number;
    tenantId: string;
    createdAt: string;
    updatedAt: string;
    user?: { id: string; name: string; email: string };
    service?: { id: string; name: string };
    staff?: { id: string; name: string };
}

export interface CreateAppointmentDTO {
    userId: string;
    serviceId: string;
    staffId: string;
    startTime: string;
    notes?: string;
    couponCode?: string;
}

export const appointmentsService = {
    getAll: async (filters?: {
        userId?: string;
        staffId?: string;
        serviceId?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    }): Promise<Appointment[]> => {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) params.append(key, String(value));
            });
        }
        return api.get<Appointment[]>(`/appointments?${params.toString()}`);
    },

    getById: async (id: string): Promise<Appointment> => {
        return api.get<Appointment>(`/appointments/${id}`);
    },

    create: async (data: CreateAppointmentDTO): Promise<Appointment> => {
        return api.post<Appointment>('/appointments', data);
    },

    updateStatus: async (id: string, status: Appointment['status']): Promise<Appointment> => {
        return api.put<Appointment>(`/appointments/${id}/status`, { status });
    },

    cancel: async (id: string, reason?: string): Promise<void> => {
        return api.put(`/appointments/${id}/cancel`, { reason });
    },

    checkAvailability: async (staffId: string, serviceId: string, date: string): Promise<string[]> => {
        const timezoneOffset = new Date().getTimezoneOffset();
        const params = new URLSearchParams({ staffId, serviceId, date, timezoneOffset: String(timezoneOffset) });
        return api.get<string[]>(`/appointments/availability?${params.toString()}`);
    },
};