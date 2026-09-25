// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import type { ReactElement } from "react";

const { mockGetQueue, mockUpdateStatus, mockRouterRefresh } = vi.hoisted(() => ({
    mockGetQueue: vi.fn(),
    mockUpdateStatus: vi.fn(),
    mockRouterRefresh: vi.fn(),
}));

vi.mock("@/services/booking.service", async (importOriginal) => {
    const actual =
        await importOriginal<typeof import("@/services/booking.service")>();

    return {
        ...actual,
        bookingService: {
            getAppointmentsNeedingReview: mockGetQueue,
            updateAppointmentStatus: mockUpdateStatus,
        },
    };
});

vi.mock("next/navigation", () => ({
    useRouter: () => ({ refresh: mockRouterRefresh }),
}));

vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

import type {
    Appointment,
    AppointmentStatus,
} from "@/services/booking.service";
import AttentionQueue from "@/components/admin/appointments/AttentionQueue";
import { AppointmentsClient } from "@/components/booking/appointments-client";
import { AppointmentDetailActions } from "@/components/booking/appointment-detail-actions";
import { AppointmentHistory } from "@/components/profile/appointment-history";

const appointment: Appointment = {
    id: "appointment-1",
    userId: "user-1",
    serviceId: "service-1",
    staffId: "staff-1",
    startTime: "2030-01-01T10:00:00.000Z",
    endTime: "2030-01-01T11:00:00.000Z",
    status: "NEEDS_REVIEW",
    statusChangedAt: "2030-01-01T13:00:00.000Z",
    statusChangeReason: "Outcome unresolved after grace period",
    discountAmount: 0,
    subtotal: 10,
    total: 10,
    confirmationSent: true,
    reminderSent: false,
    tenantId: "tenant-1",
    user: { name: "Alex Customer" },
    service: {
        id: "service-1",
        name: "Facial",
        duration: 60,
        price: 10,
        active: true,
        tenantId: "tenant-1",
        createdAt: "2030-01-01T09:00:00.000Z",
        updatedAt: "2030-01-01T09:00:00.000Z",
    },
    createdAt: "2030-01-01T09:00:00.000Z",
    updatedAt: "2030-01-01T13:00:00.000Z",
};

const createAppointment = (
    status: AppointmentStatus,
    id = "appointment-1",
    customerName = "Alex Customer",
): Appointment => ({
    ...appointment,
    id,
    status,
    user: { name: customerName },
});

const customerCancellationSurfaces: {
    name: string;
    renderSurface: (status: AppointmentStatus) => ReactElement;
}[] = [
    {
        name: "appointment list",
        renderSurface: (status) => (
            <AppointmentsClient
                initialUserAppointments={[createAppointment(status)]}
                initialStaffAppointments={[]}
                staffProfile={null}
                isStaff={false}
            />
        ),
    },
    {
        name: "profile history",
        renderSurface: (status) => (
            <AppointmentHistory
                initialAppointments={[createAppointment(status)]}
            />
        ),
    },
    {
        name: "appointment detail",
        renderSurface: (status) => (
            <AppointmentDetailActions
                appointmentId="appointment-1"
                status={status}
            />
        ),
    },
];

beforeEach(() => {
    vi.clearAllMocks();
    mockGetQueue.mockResolvedValue({
        appointments: [appointment],
        total: 1,
        pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
        },
    });
    mockUpdateStatus.mockResolvedValue(appointment);
});

describe("customer cancellation surfaces", () => {
    it.each(customerCancellationSurfaces)(
        "$name allows CONFIRMED cancellation without exposing NEEDS_REVIEW",
        ({ renderSurface }) => {
            const { unmount } = render(renderSurface("CONFIRMED"));

            expect(
                screen.getByRole("button", { name: "Cancelar cita" }),
            ).toBeInTheDocument();

            unmount();
            render(renderSurface("NEEDS_REVIEW"));

            expect(
                screen.queryByRole("button", { name: "Cancelar cita" }),
            ).not.toBeInTheDocument();
        },
    );
});

describe("AttentionQueue", () => {
    it("renders the review details and resolves an appointment after confirmation", async () => {
        const user = userEvent.setup();
        const onRefresh = vi.fn();
        mockGetQueue
            .mockResolvedValueOnce({
                appointments: [appointment],
                total: 1,
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 1,
                    totalPages: 1,
                },
            })
            .mockResolvedValueOnce({
                appointments: [],
                total: 0,
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 0,
                    totalPages: 0,
                },
            });

        render(<AttentionQueue onRefresh={onRefresh} />);

        expect(await screen.findByText("Alex Customer")).toBeInTheDocument();
        expect(screen.getByText("Facial")).toBeInTheDocument();
        expect(screen.getByText("1 cita requiere atención")).toBeInTheDocument();
        expect(
            screen.getByText("Outcome unresolved after grace period"),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Marcar completada" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Marcar no asistió" }),
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();

        await user.click(
            screen.getByRole("button", { name: "Marcar completada" }),
        );
        expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
        await user.click(
            screen.getByRole("button", { name: "Marcar completada" }),
        );

        await waitFor(() => {
            expect(mockUpdateStatus).toHaveBeenCalledWith(
                "appointment-1",
                "COMPLETED",
                "Resolved as completed from the booking admin attention queue",
            );
        });
        expect(onRefresh).toHaveBeenCalledTimes(1);
        expect(await screen.findByText("No hay citas que requieran atención")).toBeInTheDocument();
    });

    it("returns to page one and refreshes after resolving the last row", async () => {
        const user = userEvent.setup();
        const onRefresh = vi.fn();
        const firstPage = Array.from({ length: 10 }, (_, index) =>
            createAppointment(
                "NEEDS_REVIEW",
                `appointment-${index + 1}`,
                `Customer ${index + 1}`,
            ),
        );
        const finalPageAppointment = createAppointment(
            "NEEDS_REVIEW",
            "appointment-11",
            "Final Customer",
        );
        let resolved = false;

        mockUpdateStatus.mockImplementation(async () => {
            resolved = true;
            return { ...finalPageAppointment, status: "COMPLETED" };
        });
        mockGetQueue.mockImplementation(async (requestedPage: number) => {
            const total = resolved ? 10 : 11;
            const totalPages = resolved ? 1 : 2;

            if (requestedPage === 1) {
                return {
                    appointments: firstPage,
                    total,
                    pagination: {
                        page: 1,
                        limit: 10,
                        total,
                        totalPages,
                    },
                };
            }

            return {
                appointments: resolved ? [] : [finalPageAppointment],
                total,
                pagination: {
                    page: 2,
                    limit: 10,
                    total,
                    totalPages,
                },
            };
        });

        render(<AttentionQueue onRefresh={onRefresh} />);

        expect(await screen.findByText("Customer 1")).toBeInTheDocument();
        expect(screen.getByText("11 citas requieren atención")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Siguiente" }));
        expect(await screen.findByText("Final Customer")).toBeInTheDocument();
        expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();

        await user.click(
            screen.getByRole("button", { name: "Marcar completada" }),
        );
        expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
        await user.click(
            screen.getByRole("button", { name: "Marcar completada" }),
        );

        expect(await screen.findByText("Customer 1")).toBeInTheDocument();
        expect(screen.getByText("10 citas requieren atención")).toBeInTheDocument();
        expect(screen.queryByText("Final Customer")).not.toBeInTheDocument();
        expect(
            screen.queryByText("No hay citas que requieran atención"),
        ).not.toBeInTheDocument();
        expect(screen.queryByText("Página 2 de 2")).not.toBeInTheDocument();
        expect(mockGetQueue).toHaveBeenLastCalledWith(1, 10);
        expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it("shows an empty state when the queue is clear", async () => {
        mockGetQueue.mockResolvedValueOnce({
            appointments: [],
            total: 0,
            pagination: {
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0,
            },
        });

        render(<AttentionQueue />);

        expect(
            await screen.findByText("No hay citas que requieran atención"),
        ).toBeInTheDocument();
    });
});
