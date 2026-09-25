import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockApiClient } = vi.hoisted(() => ({
    mockApiClient: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
    apiClient: mockApiClient,
}));

import {
    APPOINTMENT_STATUS_LABELS,
    bookingService,
    type Appointment,
} from "@/services/booking.service";

const appointment = {
    id: "appointment-1",
    userId: "user-1",
    serviceId: "service-1",
    staffId: "staff-1",
    startTime: "2030-01-01T10:00:00.000Z",
    endTime: "2030-01-01T11:00:00.000Z",
    status: "NEEDS_REVIEW",
    statusChangedAt: "2030-01-01T13:00:00.000Z",
    statusChangeReason: "Outcome unresolved after grace period",
    statusChangedById: null,
    discountAmount: 0,
    subtotal: 10,
    total: 10,
    confirmationSent: true,
    reminderSent: false,
    tenantId: "tenant-1",
    createdAt: "2030-01-01T09:00:00.000Z",
    updatedAt: "2030-01-01T13:00:00.000Z",
} satisfies Appointment;

beforeEach(() => {
    vi.clearAllMocks();
});

describe("bookingService.getAppointmentsNeedingReview", () => {
    it("requests the attention endpoint with pagination and preserves its total", async () => {
        mockApiClient.mockResolvedValueOnce({
            data: [appointment],
            meta: {
                pagination: {
                    page: 2,
                    limit: 5,
                    total: 11,
                    totalPages: 3,
                },
            },
        });

        const result = await bookingService.getAppointmentsNeedingReview(2, 5);

        expect(mockApiClient).toHaveBeenCalledWith(
            "/appointments/attention?page=2&limit=5",
            { method: "GET" },
            true,
        );
        expect(result).toEqual({
            appointments: [appointment],
            total: 11,
            pagination: {
                page: 2,
                limit: 5,
                total: 11,
                totalPages: 3,
            },
        });
    });

    it("uses the requested page when response pagination is missing", async () => {
        mockApiClient.mockResolvedValueOnce({ data: [] });

        const result = await bookingService.getAppointmentsNeedingReview(3, 20);

        expect(result).toEqual({
            appointments: [],
            total: 0,
            pagination: {
                page: 3,
                limit: 20,
                total: 0,
                totalPages: 0,
            },
        });
    });
});

describe("bookingService.updateAppointmentStatus", () => {
    it("sends an optional status reason", async () => {
        mockApiClient.mockResolvedValueOnce(appointment);

        await bookingService.updateAppointmentStatus(
            appointment.id,
            "COMPLETED",
            "Resolved by staff",
        );

        expect(mockApiClient).toHaveBeenCalledWith(
            "/appointments/appointment-1/status",
            {
                method: "PUT",
                body: JSON.stringify({
                    status: "COMPLETED",
                    reason: "Resolved by staff",
                }),
            },
        );
    });

    it("exposes the neutral customer label for NEEDS_REVIEW", () => {
        expect(APPOINTMENT_STATUS_LABELS.NEEDS_REVIEW).toBe(
            "Pendiente de actualización",
        );
    });
});
