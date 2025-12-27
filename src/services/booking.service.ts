import { apiClient as api } from '@/lib/api-client';

export interface Service {
    id: string;
    name: string;
    description?: string;
    duration: number;
    price: number;
    categoryId?: string;
    category?: {
        id: string;
        name: string;
    };
    active: boolean;
    tenantId: string;
    createdAt: string;
    updatedAt: string;
}

export interface Staff {
    id: string;
    userId?: string;
    name: string;
    email?: string;
    phone?: string;
    avatar?: string;
    bio?: string;
    active: boolean;
    workingHours?: any;
    serviceIds?: string[];
    tenantId: string;
    createdAt: string;
    updatedAt: string;
}

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

    // Coupon Info
    couponId?: string;
    discountAmount: number;
    subtotal: number;
    total: number;
    coupon?: any;

    confirmationSent: boolean;
    reminderSent: boolean;
    tenantId: string;
    createdAt: string;
    updatedAt: string;
    user?: any;
    service?: Service;
    staff?: Staff;
}

export interface CreateAppointmentData {
    userId: string;
    serviceId: string;
    staffId: string;
    startTime: Date | string;
    notes?: string;
    couponCode?: string;
}

class BookingService {
    /**
     * Get all services
     */
    async getServices(activeOnly: boolean = true, tenantId?: string): Promise<Service[]> {
        const params = new URLSearchParams();
        params.append('activeOnly', activeOnly.toString());
        if (tenantId) params.append('tenantId', tenantId);

        return api<Service[]>(`/services?${params.toString()}`);
    }

    /**
     * Get all staff members
     */
    async getStaff(activeOnly: boolean = true, tenantId?: string): Promise<Staff[]> {
        const params = new URLSearchParams();
        params.append('activeOnly', activeOnly.toString());
        if (tenantId) params.append('tenantId', tenantId);

        return api<Staff[]>(`/staff?${params.toString()}`);
    }

    /**
     * Get current user's staff profile
     */
    async getMeStaff(): Promise<Staff> {
        return api<Staff>('/staff/me');
    }

    /**
     * Get user's appointments
     */
    async getAppointments(filters?: {
        userId?: string;
        staffId?: string;
        serviceId?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<Appointment[]> {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
        }

        return api<Appointment[]>(`/appointments?${params.toString()}`);
    }

    async checkAvailability(staffId: string, serviceId: string, date: string): Promise<string[]> {
        const timezoneOffset = new Date().getTimezoneOffset();
        const params = new URLSearchParams({
            staffId,
            serviceId,
            date,
            timezoneOffset: timezoneOffset.toString()
        });

        return api<string[]>(`/appointments/availability?${params.toString()}`);
    }

    /**
     * Create a new appointment
     */
    async createAppointment(appointmentData: CreateAppointmentData): Promise<Appointment> {
        return api<Appointment>('/appointments', {
            method: 'POST',
            body: JSON.stringify(appointmentData),
        });
    }

    /**
     * Cancel an appointment
     */
    async cancelAppointment(appointmentId: string, reason?: string): Promise<void> {
        return api<void>(`/appointments/${appointmentId}/cancel`, {
            method: 'PUT',
            body: JSON.stringify({ reason }),
        });
    }

    /**
     * Sync all services for a staff member
     */
    async syncStaffServices(staffId: string, serviceIds: string[]): Promise<void> {
        return api<void>(`/staff/${staffId}/services`, {
            method: 'PUT',
            body: JSON.stringify({ serviceIds }),
        });
    }

    /**
     * Get a single appointment by ID
     */
    async getAppointmentById(id: string): Promise<Appointment> {
        return api<Appointment>(`/appointments/${id}`);
    }

    /**
     * Update appointment status
     */
    async updateAppointmentStatus(id: string, status: Appointment['status']): Promise<Appointment> {
        return api<Appointment>(`/appointments/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    }
}

export const bookingService = new BookingService();
