/**
 * Booking Service
 * Handles all booking-related API calls
 */

export interface Service {
    id: string;
    name: string;
    description?: string;
    duration: number;
    price: number;
    category?: string;
    active: boolean;
    tenantId: string;
    createdAt: string;
    updatedAt: string;
}

export interface Staff {
    id: string;
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
}

class BookingService {
    private baseUrl = '/api';

    /**
     * Get all services
     */
    async getServices(activeOnly: boolean = true): Promise<Service[]> {
        const response = await fetch(`${this.baseUrl}/services?activeOnly=${activeOnly}`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch services');
        }

        return data.data || [];
    }

    /**
     * Get all staff members
     */
    async getStaff(activeOnly: boolean = true): Promise<Staff[]> {
        const response = await fetch(`${this.baseUrl}/staff?activeOnly=${activeOnly}`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch staff');
        }

        return data.data || [];
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

        const response = await fetch(`${this.baseUrl}/appointments?${params.toString()}`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch appointments');
        }

        return data.data || [];
    }

    async checkAvailability(staffId: string, serviceId: string, date: string): Promise<string[]> {
        const timezoneOffset = new Date().getTimezoneOffset();
        const params = new URLSearchParams({
            staffId,
            serviceId,
            date,
            timezoneOffset: timezoneOffset.toString()
        });

        const response = await fetch(`${this.baseUrl}/appointments/availability?${params.toString()}`);

        if (!response.ok) {
            console.error('Availability check failed', response.status, await response.text());
            throw new Error('Failed to check availability');
        }

        const data = await response.json();
        return data.data || [];
    }

    /**
     * Create a new appointment
     */
    async createAppointment(appointmentData: CreateAppointmentData): Promise<Appointment> {
        const response = await fetch(`${this.baseUrl}/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(appointmentData),
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to create appointment');
        }

        return data.data;
    }

    /**
     * Cancel an appointment
     */
    async cancelAppointment(appointmentId: string, reason?: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/appointments/${appointmentId}/cancel`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reason }),
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to cancel appointment');
        }
    }
}

export const bookingService = new BookingService();
