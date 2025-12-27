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
    coupon?: any; // Replace with proper Coupon type when available

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
    private baseUrl = '/api';

    /**
     * Get all services
     */
    async getServices(activeOnly: boolean = true, tenantId?: string): Promise<Service[]> {
        const params = new URLSearchParams();
        params.append('activeOnly', activeOnly.toString());
        if (tenantId) params.append('tenantId', tenantId);

        const response = await fetch(`${this.baseUrl}/services?${params.toString()}`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch services');
        }

        return data.data || [];
    }

    /**
     * Get all staff members
     */
    async getStaff(activeOnly: boolean = true, tenantId?: string): Promise<Staff[]> {
        const params = new URLSearchParams();
        params.append('activeOnly', activeOnly.toString());
        if (tenantId) params.append('tenantId', tenantId);

        const response = await fetch(`${this.baseUrl}/staff?${params.toString()}`);
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

    /**
     * Sync all services for a staff member
     */
    async syncStaffServices(staffId: string, serviceIds: string[]): Promise<void> {
        const response = await fetch(`${this.baseUrl}/staff/${staffId}/services`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ serviceIds }),
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to sync staff services');
        }
    }

    /**
     * Get a single appointment by ID
     */
    async getAppointmentById(id: string): Promise<Appointment> {
        const response = await fetch(`${this.baseUrl}/appointments/${id}`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch appointment details');
        }

        return data.data;
    }
}

export const bookingService = new BookingService();
