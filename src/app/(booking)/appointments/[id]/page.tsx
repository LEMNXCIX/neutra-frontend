import React from "react";
import { redirect, notFound } from "next/navigation";
import { authService } from "@/services/auth.service";
import { api } from '@/lib/api-client';
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Detalles de la cita",
    description: "Mirá los detalles de tu cita",
};
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Calendar,
    Clock,
    User,
    FileText,
    AlertCircle,
    ArrowLeft,
    MapPin,
    CreditCard,
} from "lucide-react";
import Link from "next/link";
import { AppointmentDetailActions } from "@/components/booking/appointment-detail-actions";
import {
    APPOINTMENT_STATUS_LABELS,
    type AppointmentStatus,
} from "@/services/booking.service";

export const dynamic = "force-dynamic";

async function getAppointmentData(id: string) {
    try {
        const authRes = await authService.validate();
        const user = authRes?.user;
        if (!user) return { error: "unauthorized" };

        const appointment = await api.get<any>(`/appointments/${id}`);
        if (!appointment) return { error: "not_found" };

        if (
            appointment.userId !== user.id &&
            user.role?.name !== "ADMIN" &&
            user.role?.name !== "SUPER_ADMIN"
        ) {
            return { error: "forbidden" };
        }

        return { appointment, user };
    } catch (error) {
        console.error("Error fetching appointment detail on server:", error);
        return { error: "internal_error" };
    }
}

const getStatusVariant = (
    status: string,
): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<
        string,
        "default" | "secondary" | "destructive" | "outline"
    > = {
        PENDING: "outline",
        CONFIRMED: "default",
        IN_PROGRESS: "secondary",
        NEEDS_REVIEW: "outline",
        COMPLETED: "secondary",
        CANCELLED: "destructive",
        NO_SHOW: "outline",
    };
    return variants[status] || "outline";
};

const getStatusLabel = (status: AppointmentStatus): string =>
    APPOINTMENT_STATUS_LABELS[status] || status;

export default async function AppointmentDetailPage(props: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await props.params;
    const { appointment, error } = await getAppointmentData(id);

    if (error === "unauthorized") redirect("/login");
    if (error === "not_found") notFound();

    if (error || !appointment) {
        return (
            <div className="container mx-auto px-4 py-12 max-w-2xl">
                <Link
                    href="/appointments"
                    className="flex items-center gap-2 text-primary hover:underline mb-8"
                >
                    <ArrowLeft className="size-4" />
                    Volver a mis citas
                </Link>
                <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertDescription>
                        {error === "forbidden"
                            ? "No tenés permiso para ver esta cita"
                            : "No se pudieron cargar los detalles de la cita"}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-12 max-w-3xl">
                {/* Navigation */}
                <Link
                    href="/appointments"
                    className="flex items-center gap-2 text-primary hover:underline mb-8"
                >
                    <ArrowLeft className="size-4" />
                    Volver a mis citas
                </Link>

                <div className="grid gap-8">
                    {/* Header Card */}
                    <Card className="overflow-hidden border-none shadow-xl bg-card/50 backdrop-blur-sm">
                        <div className="bg-primary h-2" />
                        <CardHeader className="pb-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge
                                            variant={getStatusVariant(
                                                appointment.status,
                                            )}
                                            className="text-xs uppercase tracking-wider"
                                        >
                                            {getStatusLabel(appointment.status)}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            #{appointment.id.split("-")[0]}
                                        </span>
                                    </div>
                                    <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
                                        {appointment.service?.name ||
                                            "Cita de servicio"}
                                    </CardTitle>
                                    <CardDescription className="text-lg">
                                        Sesión profesional agendada con nuestro
                                        equipo de expertos
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-8 border-t pt-8">
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 bg-primary/10 p-2 rounded-full">
                                        <Calendar className="size-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Fecha
                                        </p>
                                        <p className="text-lg font-semibold">
                                            {new Date(
                                                appointment.startTime,
                                            ).toLocaleDateString("es-ES", {
                                                weekday: "long",
                                                month: "long",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="mt-1 bg-primary/10 p-2 rounded-full">
                                        <Clock className="size-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Hora y duración
                                        </p>
                                        <p className="text-lg font-semibold">
                                            {new Date(
                                                appointment.startTime,
                                            ).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                            <span className="text-muted-foreground font-normal ml-2 text-base">
                                                (
                                                {appointment.service
                                                    ?.duration || 30}{" "}
                                                min)
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 bg-primary/10 p-2 rounded-full">
                                        <User className="size-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Profesional
                                        </p>
                                        <p className="text-lg font-semibold">
                                            {appointment.staff?.name ||
                                                "Personal asignado"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="mt-1 bg-primary/10 p-2 rounded-full">
                                        <CreditCard className="size-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Precio del servicio
                                        </p>
                                        <p className="text-lg font-semibold">
                                            $
                                            {appointment.service?.price ||
                                                "0.00"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Details Grid */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* More Info */}
                        <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="size-5 text-primary" />
                                    Detalles de la cita
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 rounded-lg bg-muted/50">
                                    <p className="text-sm font-medium mb-1">
                                        Información del estado
                                    </p>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {appointment.status === "PENDING" &&
                                            "Tu cita está pendiente de confirmación. Te enviaremos un correo cuando la revisemos."}
                                        {appointment.status === "CONFIRMED" &&
                                            "¡Tu cita está confirmada! Esperamos verte pronto."}
                                        {appointment.status === "CANCELLED" &&
                                            "Esta cita fue cancelada."}
                                        {appointment.status === "COMPLETED" &&
                                            "La sesión se completó. ¡Esperamos que hayas enjoyed el servicio!"}
                                        {appointment.status === "NEEDS_REVIEW" &&
                                            "Tu cita está pendiente de actualización."}
                                    </p>
                                </div>
                                {appointment.notes && (
                                    <div>
                                        <p className="text-sm font-medium mb-1">
                                            Tus notas
                                        </p>
                                        <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg italic">
                                            "{appointment.notes}"
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Location/Action Card */}
                        <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <MapPin className="size-5 text-primary" />
                                    Ubicación
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-4 rounded-lg bg-muted/50">
                                    <p className="text-sm font-medium mb-1 tracking-tight">
                                        Información de llegada
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Llegá 5-10 minutos antes a tu cita para
                                        que el registro se realice sin
                                        demoras.
                                    </p>
                                </div>

                                <AppointmentDetailActions
                                    appointmentId={appointment.id}
                                    status={appointment.status}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
