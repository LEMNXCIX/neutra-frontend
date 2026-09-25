import Link from "next/link";
import { api } from "@/lib/api-client";
import {
    APPOINTMENT_STATUS_LABELS,
    type Appointment,
} from "@/services/booking.service";
import AttentionQueue from "@/components/admin/appointments/AttentionQueue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    CalendarDays,
    Clock,
    Users,
    Scissors,
    ArrowRight,
    CalendarPlus,
} from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
    PENDING: "bg-yellow-500/15 text-yellow-600",
    CONFIRMED: "bg-emerald-500/15 text-emerald-600",
    IN_PROGRESS: "bg-blue-500/15 text-blue-600",
    NEEDS_REVIEW: "bg-amber-500/15 text-amber-600",
    COMPLETED: "bg-muted text-muted-foreground",
    CANCELLED: "bg-red-500/15 text-red-600",
    NO_SHOW: "bg-muted text-muted-foreground",
};

export default async function BookingDashboardPage() {
    // Fetch everything in parallel; each fails soft so one broken endpoint
    // doesn't blank the dashboard.
    const [appointments, staff, services] = await Promise.all([
        api
            .get<Appointment[]>(`/appointments?page=1&limit=100`)
            .then((data) => (Array.isArray(data) ? data : []))
            .catch(() => []),
        api.get<any[]>(`/staff?activeOnly=true`).catch(() => []),
        api.get<any[]>(`/services?activeOnly=true`).catch(() => []),
    ]);

    const now = new Date();
    const upcoming = appointments
        .filter(
            (a) =>
                new Date(a.startTime) >= now &&
                a.status !== "CANCELLED" &&
                a.status !== "NO_SHOW" &&
                a.status !== "NEEDS_REVIEW",
        )
        .sort(
            (a, b) =>
                new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        )
        .slice(0, 5);

    const pending = appointments.filter((a) => a.status === "PENDING").length;
    const confirmed = appointments.filter((a) => a.status === "CONFIRMED").length;

    const stats = [
        { label: "Pendientes", value: pending, icon: Clock, href: "/admin/appointments?status=PENDING" },
        { label: "Confirmadas", value: confirmed, icon: CalendarDays, href: "/admin/appointments?status=CONFIRMED" },
        { label: "Equipo", value: staff.length, icon: Users, href: "/admin/staff" },
        { label: "Servicios", value: services.length, icon: Scissors, href: "/admin/services" },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Panel de reservas
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Resumen de tu operación.
                    </p>
                </div>
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/admin/appointments">
                        Ver citas <ArrowRight className="size-4 ml-2" />
                    </Link>
                </Button>
            </div>

            {/* Stats — 2 cols on mobile, 4 on desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(({ label, value, icon: Icon, href }) => (
                    <Link key={label} href={href}>
                        <Card className="hover:border-primary/40 transition-colors">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                    <Icon className="size-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-2xl font-bold leading-none">
                                        {value}
                                    </p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                                        {label}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <AttentionQueue />

            {/* Upcoming appointments */}
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest">
                        Próximas citas
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {upcoming.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                            <CalendarPlus className="size-10 text-muted-foreground/40" />
                            <p className="font-semibold text-sm">
                                No hay citas próximas
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Las nuevas reservas aparecerán aquí.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {upcoming.map((a) => (
                                <div
                                    key={a.id}
                                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                            <CalendarDays className="size-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold truncate">
                                                {new Date(
                                                    a.startTime,
                                                ).toLocaleDateString("es-ES", { timeZone: "UTC",
                                                    weekday: "short",
                                                    day: "numeric",
                                                    month: "short",
                                                })}{" "}
                                                ·{" "}
                                                {new Date(
                                                    a.startTime,
                                                ).toLocaleTimeString("es-ES", { timeZone: "UTC",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {a.notes || a.serviceId}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge
                                        className={`border-none ${STATUS_STYLES[a.status] || ""}`}
                                    >
                                        {APPOINTMENT_STATUS_LABELS[a.status] || a.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
