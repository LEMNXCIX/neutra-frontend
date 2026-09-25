"use client";

import React, { useState } from "react";
import {
    APPOINTMENT_STATUS_LABELS,
    Appointment,
    Staff,
} from "@/services/booking.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Calendar,
    Clock,
    User as UserIcon,
    FileText,
    CheckCircle2,
    Briefcase,
    XCircle,
    AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { CancelAppointmentDialog } from "@/components/booking/cancel-appointment-dialog";
import { StatusUpdateDialog } from "@/components/booking/status-update-dialog";
import { bookingService } from "@/services/booking.service";

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

const getStatusLabel = (status: Appointment["status"]): string =>
    APPOINTMENT_STATUS_LABELS[status] || status;

interface AppointmentsClientProps {
    initialUserAppointments: Appointment[];
    initialStaffAppointments: Appointment[];
    staffProfile: Staff | null;
    isStaff: boolean;
    success?: string | null;
}

function AppointmentCardHeader({ appointment, type }: { appointment: Appointment; type: "user" | "staff" }) {
    return (
    <CardHeader className="pb-3">
      <div className="flex justify-between items-start">
        <Link
          href={`/appointments/${appointment.id}`}
          className="space-y-1 group flex-1"
        >
          <CardTitle className="text-xl group-hover:text-primary transition-colors">
            {appointment.service?.name || "Servicio"}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            {type === "user" ? (
              <>
                <Briefcase className="size-4" />
                <span>
                  Profesional:{" "}
                  {appointment.staff?.name || "Cualquiera"}
                </span>
              </>
            ) : (
              <>
                <UserIcon className="size-4" />
                <span>
                  Cliente:{" "}
                  {appointment.user?.name ||
                    appointment.userId ||
                    "Desconocido"}
                </span>
              </>
            )}
          </div>
        </Link>
        <Badge variant={getStatusVariant(appointment.status)}>
          {getStatusLabel(appointment.status)}
        </Badge>
      </div>
    </CardHeader>
    );
}

function AppointmentCardBody({
    appointment,
    type,
    onUserCancelled,
    onStaffUpdated,
}: {
    appointment: Appointment;
    type: "user" | "staff";
    onUserCancelled: () => void;
    onStaffUpdated: () => void;
}) {
    return (
    <CardContent>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="size-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">
              Fecha
            </p>
            <p className="font-medium">
              {new Date(
                appointment.startTime,
              ).toLocaleDateString("es-ES", { timeZone: "UTC",
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="size-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">
              Hora
            </p>
            <p className="font-medium">
              {new Date(
                appointment.startTime,
              ).toLocaleTimeString("es-ES", { timeZone: "UTC",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>

      {appointment.notes && (
        <div className="flex items-start gap-2 text-sm p-3 bg-muted/50 rounded-lg">
          <FileText className="size-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Notas
            </p>
            <p className="text-sm line-clamp-2">
              {appointment.notes}
            </p>
          </div>
        </div>
      )}

      {type === "user" ? (
        (appointment.status === "PENDING" ||
          appointment.status === "CONFIRMED") && (
          <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
            <CancelAppointmentDialog
              appointmentId={appointment.id}
              onAppointmentCancelled={onUserCancelled}
              trigger={
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Cancelar cita
                </Button>
              }
            />
          </div>
        )
      ) : (
        <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
          {appointment.status === "PENDING" && (
            <StatusUpdateDialog
              appointmentId={appointment.id}
              currentStatus={appointment.status}
              newStatus="CONFIRMED"
              onStatusUpdated={onStaffUpdated}
              trigger={
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  <CheckCircle2 className="size-4 mr-2" />
                  Aprobar
                </Button>
              }
            />
          )}
          {appointment.status === "CONFIRMED" && (
            <StatusUpdateDialog
              appointmentId={appointment.id}
              currentStatus={appointment.status}
              newStatus="IN_PROGRESS"
              reason="Appointment started by staff"
              onStatusUpdated={onStaffUpdated}
              trigger={
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  Iniciar
                </Button>
              }
            />
          )}
          {appointment.status === "IN_PROGRESS" && (
            <StatusUpdateDialog
              appointmentId={appointment.id}
              currentStatus={appointment.status}
              newStatus="COMPLETED"
              reason="Appointment completed by staff"
              onStatusUpdated={onStaffUpdated}
              trigger={
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  Completar
                </Button>
              }
            />
          )}
          {appointment.status === "NEEDS_REVIEW" && (
            <>
              <StatusUpdateDialog
                appointmentId={appointment.id}
                currentStatus={appointment.status}
                newStatus="COMPLETED"
                reason="Resolved as completed by staff"
                onStatusUpdated={onStaffUpdated}
                trigger={
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 sm:flex-none"
                  >
                    Completar
                  </Button>
                }
              />
              <StatusUpdateDialog
                appointmentId={appointment.id}
                currentStatus={appointment.status}
                newStatus="NO_SHOW"
                reason="Resolved as no-show by staff"
                onStatusUpdated={onStaffUpdated}
                trigger={
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 sm:flex-none"
                  >
                    <XCircle className="size-4 mr-2" />
                    No asistió
                  </Button>
                }
              />
              <StatusUpdateDialog
                appointmentId={appointment.id}
                currentStatus={appointment.status}
                newStatus="CANCELLED"
                reason="Cancelled by staff"
                onStatusUpdated={onStaffUpdated}
                trigger={
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 sm:flex-none"
                  >
                    <XCircle className="size-4 mr-2" />
                    Cancelar
                  </Button>
                }
              />
            </>
          )}
          {(appointment.status === "PENDING" || appointment.status === "CONFIRMED") && (
            <StatusUpdateDialog
              appointmentId={appointment.id}
              currentStatus={appointment.status}
              newStatus="CANCELLED"
              onStatusUpdated={onStaffUpdated}
              trigger={
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  <XCircle className="size-4 mr-2" />
                  Rechazar
                </Button>
              }
            />
          )}
        </div>
      )}
    </CardContent>
    );
}

const AppointmentCard = ({
  appointment,
  type,
  onUserCancelled,
  onStaffUpdated,
}: {
  appointment: Appointment;
  type: "user" | "staff";
  onUserCancelled: () => void;
  onStaffUpdated: () => void;
}) => (
  <Card className="hover:shadow-lg transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-300">
    <AppointmentCardHeader appointment={appointment} type={type} />
    <AppointmentCardBody
      appointment={appointment}
      type={type}
      onUserCancelled={onUserCancelled}
      onStaffUpdated={onStaffUpdated}
    />
  </Card>
);

export function AppointmentsClient({
    initialUserAppointments,
    initialStaffAppointments,
    staffProfile,
    isStaff,
    success,
}: AppointmentsClientProps) {
    const [appointments, setAppointments] = useState<Appointment[]>(
        initialUserAppointments,
    );
    const [staffAppointments, setStaffAppointments] = useState<Appointment[]>(
        initialStaffAppointments,
    );
    const [error, setError] = useState<string | null>(null);

    const loadUserAppointments = async () => {
        try {
            const data = await bookingService.getAppointments();
            setAppointments(data);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const loadStaffAppointments = async () => {
        if (!staffProfile?.id) return;
        try {
            const data = await bookingService.getAppointments({
                staffId: staffProfile.id,
            });
            setStaffAppointments(data);
        } catch (err: any) {
            setError(err.message);
        }
    };

  return (
        <div className="space-y-6">
            {/* Success Alert */}
            {success && (
                <Alert className="mb-6 border-green-500/50 bg-green-50 dark:bg-green-950">
                    <CheckCircle2 className="size-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                        ¡Cita reservada correctamente! Pronto recibirás un
                        correo de confirmación.
                    </AlertDescription>
                </Alert>
            )}

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="size-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {isStaff && staffProfile ? (
                <Tabs defaultValue="assigned" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                        <TabsTrigger value="assigned" className="gap-2">
                            <Briefcase className="size-4" />
                            Mi agenda
                        </TabsTrigger>
                        <TabsTrigger value="my-bookings" className="gap-2">
                            <Calendar className="size-4" />
                            Mis reservas
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="assigned" className="space-y-4">
                        {staffAppointments.length === 0 ? (
                            <Card className="text-center py-12">
                                <CardContent className="pt-6">
                                    <Briefcase className="size-8 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-lg font-medium">
                                        Todavía no tenés reservas asignadas
                                    </p>
                                    <p className="text-muted-foreground">
                                        Aquí verás las reservas de los clientes
                                        cuando te agenden.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
          staffAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              type="staff"
              onUserCancelled={loadStaffAppointments}
              onStaffUpdated={loadStaffAppointments}
            />
          ))
                        )}
                    </TabsContent>

                    <TabsContent value="my-bookings" className="space-y-4">
                        {appointments.length === 0 ? (
                            <Card className="text-center py-12">
                                <CardContent className="pt-6">
                                    <Calendar className="size-8 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-lg font-medium">
                                        No tenés reservas propias
                                    </p>
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="mt-4"
                                    >
                                        <Link href="/services">
                                            Reservar un servicio
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
          appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              type="user"
              onUserCancelled={loadUserAppointments}
              onStaffUpdated={loadUserAppointments}
            />
          ))
                        )}
                    </TabsContent>
                </Tabs>
            ) : /* Customer only view */
            appointments.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent className="pt-6 space-y-4">
                        <div className="mx-auto size-16 rounded-full bg-muted flex items-center justify-center">
                            <Calendar className="size-8 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-lg font-medium mb-2">
                                Todavía no tenés citas
                            </p>
                            <p className="text-muted-foreground mb-6">
                                Reservá tu primera cita para comenzar
                            </p>
                        </div>
                        <Button asChild size="lg">
                            <Link href="/services">Ver Servicios</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
            {appointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                type="user"
                onUserCancelled={loadUserAppointments}
                onStaffUpdated={loadUserAppointments}
              />
            ))}
                </div>
            )}
        </div>
    );
}

