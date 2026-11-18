import {
    createFileRoute,
    Link,
    notFound,
    redirect,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    Clock,
    CreditCard,
    FileText,
    MapPin,
    User,
} from "lucide-react";
import { AppointmentDetailActions } from "@/components/booking/appointment-detail-actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    APPOINTMENT_STATUS_LABELS,
    type AppointmentStatus,
} from "@/services/booking.service";

const getAppointmentData = createServerFn({ method: "GET" })
    .validator((data: { id: string }) => data)
    .handler(async ({ data }) => {
        const [{ api }, { authService }] = await Promise.all([
            import("@/lib/api-client"),
            import("@/services/auth.service"),
        ]);

        try {
            const authRes = await authService.validate();
            const user = authRes?.user;
            if (!user) return { error: "unauthorized" as const };

            const appointment = await api.get<any>(`/appointments/${data.id}`);
            if (!appointment) return { error: "not_found" as const };

            if (
                appointment.userId !== user.id &&
                user.role?.name !== "ADMIN" &&
                user.role?.name !== "SUPER_ADMIN"
            ) {
                return { error: "forbidden" as const };
            }

            return { appointment, user };
        } catch (error) {
            console.error(
                "Error fetching appointment detail on server:",
                error,
            );
            return { error: "internal_error" as const };
        }
    });

export const Route = createFileRoute("/_booking/appointments/$id/")({
    loader: async ({ params }) => {
        const result = await getAppointmentData({ data: { id: params.id } });
        if ("error" in result) {
            if (result.error === "unauthorized") {
                throw redirect({ to: "/login" });
            }
            if (result.error === "not_found") {
                throw notFound();
            }
        }
        return result;
    },
    head: () => ({
        meta: [
            { title: "Detalles de la cita" },
            { name: "description", content: "Mira los detalles de tu cita" },
        ],
    }),
    component: AppointmentDetailRoute,
});

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

function AppointmentHeaderCard({ appointment }: { appointment: any }) {
    return (
        <Card className="overflow-hidden border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <div className="bg-primary h-2" />
            <CardHeader className="pb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge
                                variant={getStatusVariant(appointment.status)}
                                className="text-xs uppercase tracking-wider"
                            >
                                {getStatusLabel(appointment.status)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                                #{appointment.id.split("-")[0]}
                            </span>
                        </div>
                        <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
                            {appointment.service?.name || "Cita de servicio"}
                        </CardTitle>
                        <CardDescription className="text-lg">
                            Sesión profesional agendada con nuestro equipo de
                            expertos
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
                                ).toLocaleTimeString("es-ES", {
                                    timeZone: "UTC",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                                <span className="text-muted-foreground font-normal ml-2 text-base">
                                    ({appointment.service?.duration || 30} min)
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
                                {appointment.staff?.name || "Personal asignado"}
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
                                ${appointment.service?.price || "0.00"}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function AppointmentDetails({ appointment }: { appointment: any }) {
    return (
        <div className="grid md:grid-cols-2 gap-8">
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
                            Llegá 5-10 minutos antes a tu cita para que el
                            registro se realice sin demoras.
                        </p>
                    </div>
                    <AppointmentDetailActions
                        appointmentId={appointment.id}
                        status={appointment.status}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

function AppointmentDetailRoute() {
    const data = Route.useLoaderData();

    if ("error" in data) {
        return (
            <div className="container mx-auto px-4 py-12 max-w-2xl">
                <Link
                    to="/appointments"
                    className="flex items-center gap-2 text-primary hover:underline mb-8"
                >
                    <ArrowLeft className="size-4" />
                    Volver a mis citas
                </Link>
                <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertDescription>
                        {data.error === "forbidden"
                            ? "No tienes permiso para ver esta cita"
                            : "No se pudieron cargar los detalles de la cita"}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const { appointment } = data;
    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-12 max-w-3xl">
                <Link
                    to="/appointments"
                    className="flex items-center gap-2 text-primary hover:underline mb-8"
                >
                    <ArrowLeft className="size-4" />
                    Volver a mis citas
                </Link>
                <div className="grid gap-8">
                    <AppointmentHeaderCard appointment={appointment} />
                    <AppointmentDetails appointment={appointment} />
                </div>
            </div>
        </div>
    );
}
