"use client";

import React, { Suspense, useReducer, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";
import {
    Table,
    TableHeader,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    CalendarDays,
    CalendarCheck,
    CalendarX,
    Eye,
    XCircle,
    CheckCircle2,
    Clock,
    User,
    Scissors,
    Tag,
    Trash2,
} from "lucide-react";
import {
    Appointment,
    type AppointmentStatus,
} from "@/services/booking.service";
import { StatusUpdateDialog } from "@/components/booking/status-update-dialog";
import { Spinner } from "@/components/ui/spinner";
import { format } from "date-fns";
import { useConfirm } from "@/hooks/use-confirm";

const getStatusBadge = (status: Appointment["status"]) => {
    switch (status) {
        case "PENDING":
            return (
                <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none shadow-none"
                >
                    Pendiente
                </Badge>
            );
        case "CONFIRMED":
            return (
                <Badge
                    variant="secondary"
                    className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none shadow-none"
                >
                    Confirmada
                </Badge>
            );
        case "IN_PROGRESS":
            return (
                <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none shadow-none"
                >
                    En curso
                </Badge>
            );
        case "NEEDS_REVIEW":
            return (
                <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none shadow-none"
                >
                    Requiere revisión
                </Badge>
            );
        case "COMPLETED":
            return (
                <Badge
                    variant="secondary"
                    className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none shadow-none"
                >
                    Completada
                </Badge>
            );
        case "CANCELLED":
            return (
                <Badge
                    variant="destructive"
                    className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none shadow-none"
                >
                    Cancelada
                </Badge>
            );
        case "NO_SHOW":
            return (
                <Badge
                    variant="secondary"
                    className="bg-muted text-muted-foreground hover:bg-muted border-none shadow-none"
                >
                    No asistió
                </Badge>
            );
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
};

type StatusAction = {
    status: AppointmentStatus;
    label: string;
    variant: "default" | "destructive";
};

const STATUS_ACTIONS: Record<AppointmentStatus, StatusAction[]> = {
    PENDING: [],
    CONFIRMED: [{ status: "IN_PROGRESS", label: "Iniciar", variant: "default" }],
    IN_PROGRESS: [{ status: "COMPLETED", label: "Completar", variant: "default" }],
    NEEDS_REVIEW: [
        { status: "COMPLETED", label: "Marcar completada", variant: "default" },
        { status: "NO_SHOW", label: "Marcar no asistió", variant: "destructive" },
    ],
    COMPLETED: [],
    CANCELLED: [],
    NO_SHOW: [],
};

const getStatusActions = (status: AppointmentStatus): StatusAction[] =>
    STATUS_ACTIONS[status] || [];

type Stats = {
    totalAppointments: number;
    pendingAppointments: number;
    confirmedAppointments: number;
    statusCounts: Record<string, number>;
};

type Props = {
    appointments: Appointment[];
    stats: Stats;
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        totalItemsPerPage: number;
    };
    isSuperAdmin?: boolean;
};

const StatCard = ({
  icon: Icon,
  title,
  value,
  color,
  description,
}: {
  icon: any;
  title: string;
  value: number;
  color: string;
  description: string;
}) => (
  <Card className="overflow-hidden">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="size-6 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

function AppointmentStatusActions({
  appointment,
  onStatusUpdated,
}: {
  appointment: Appointment;
  onStatusUpdated: () => void | Promise<void>;
}) {
  const actions = getStatusActions(appointment.status);
  if (actions.length === 0) return null;

  return (
    <div className="flex w-full min-w-0 flex-wrap gap-2 sm:w-auto">
      {actions.map((action) => (
        <StatusUpdateDialog
          key={action.status}
          appointmentId={appointment.id}
          currentStatus={appointment.status}
          newStatus={action.status}
          reason={`Resolved from booking admin as ${action.status}`}
          onStatusUpdated={onStatusUpdated}
          trigger={
            <Button
              type="button"
              size="sm"
              variant={action.variant}
              className="w-full sm:w-auto"
            >
              {action.label}
            </Button>
          }
        />
      ))}
    </div>
  );
}

function AppointmentDetailsDialog({
  appointment,
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  onDelete,
  onStatusUpdated,
  isConfirming,
  isCancelling,
  isDeleting,
}: {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusUpdated: () => void;
  isConfirming: string | null;
  isCancelling: string | null;
  isDeleting: string | null;
}) {
  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-background border-muted">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Clock className="size-5 text-blue-500" />
            Detalles de la cita
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Estado
              </p>
              <div>
                {getStatusBadge(appointment.status)}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Creada el
              </p>
              <p className="font-medium">
                {format(
                  new Date(appointment.createdAt),
                  "MMM dd, yyyy HH:mm",
                )}
              </p>
            </div>
            <div className="col-span-2 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Información del cliente
              </p>
              <div className="p-3 border rounded-lg bg-muted/30">
                <p className="font-bold flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  {appointment.user?.name || "Cliente Invitado"}
                </p>
                <p className="text-sm text-muted-foreground ml-6">
                  {appointment.user?.email || "Sin correo"}
                </p>
                <p className="text-xs text-muted-foreground ml-6 mt-1 italic">
                  ID: {appointment.userId}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Servicio
              </p>
              <p className="font-medium flex items-center gap-2">
                <Scissors className="size-4 text-muted-foreground" />
                {appointment.service?.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {appointment.service?.duration} min - ${appointment.service?.price}
              </p>
              {appointment.discountAmount > 0 && (
                <div className="mt-2 p-2 bg-green-50 rounded border border-green-100 dark:bg-green-900/20 dark:border-green-800">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Subtotal: </span>
                    <span>
                      ${appointment.subtotal > 0 ? appointment.subtotal : appointment.service?.price}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-green-600 dark:text-green-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Tag className="size-3" /> Descuento{" "}
                      {appointment.coupon ? `(${appointment.coupon.code})` : ""}:
                    </span>
                    <span>
                      -${appointment.discountAmount}
                    </span>
                  </div>
                  <div className="border-t border-green-200 dark:border-green-800 my-1"></div>
                  <div className="flex justify-between items-center font-bold">
                    <span>Total:</span>
                    <span>
                      ${appointment.total}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Miembro del equipo
              </p>
              <p className="font-medium">
                {appointment.staff?.name}
              </p>
            </div>
            <div className="col-span-2 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Agenda
              </p>
              <div className="p-3 border rounded-lg bg-blue-50/10 border-blue-500/20">
                <p className="font-bold text-blue-600 dark:text-blue-400">
                  {format(
                    new Date(appointment.startTime),
                    "EEEE, MMMM dd, yyyy",
                  )}
                </p>
                <p className="text-lg font-mono">
                  {format(new Date(appointment.startTime), "HH:mm")} -{" "}
                  {format(new Date(appointment.endTime), "HH:mm")}
                </p>
              </div>
            </div>
            {appointment.notes && (
              <div className="col-span-2 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Notas
                </p>
                <p className="text-sm p-3 bg-muted/50 rounded-lg italic">
                  "{appointment.notes}"
                </p>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="mt-8 flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full border-muted bg-background hover:bg-muted sm:w-auto"
          >
            Cerrar
          </Button>
          {appointment.status === "PENDING" && (
            <Button
              className="w-full bg-green-600 font-semibold text-white hover:bg-green-700 sm:w-auto"
              onClick={() => onConfirm(appointment.id)}
              disabled={isConfirming === appointment.id}
            >
              {isConfirming === appointment.id ? (
                <>
                  <Spinner className="mr-2" /> Confirmando…
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4 mr-2" />
                  Confirmar cita
                </>
              )}
            </Button>
          )}

          <AppointmentStatusActions
            appointment={appointment}
            onStatusUpdated={onStatusUpdated}
          />

          {(appointment.status === "PENDING" ||
            appointment.status === "CONFIRMED" ||
            appointment.status === "NEEDS_REVIEW") && (
            <Button
              variant="outline"
              onClick={() => onCancel(appointment.id)}
              disabled={isCancelling === appointment.id}
              className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 sm:w-auto"
            >
              {isCancelling === appointment.id ? (
                <Spinner className="mr-2" />
              ) : (
                <XCircle className="size-4 mr-2" />
              )}
              Cancelar
            </Button>
          )}

          <Button
            variant="destructive"
            onClick={() => onDelete(appointment.id)}
            disabled={isDeleting === appointment?.id}
            className="w-full bg-red-600 hover:bg-red-700 sm:w-auto"
          >
            {isDeleting === appointment?.id ? (
              <Spinner className="mr-2" />
            ) : (
              <Trash2 className="size-4 mr-2" />
            )}
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type AppointmentsDialogState = {
  selectedAppointment: Appointment | null;
  detailsOpen: boolean;
  isCancelling: string | null;
  isConfirming: string | null;
  isDeleting: string | null;
};

type AppointmentsDialogAction =
  | { type: "SET_SELECTED_APPOINTMENT"; payload: Appointment | null }
  | { type: "SET_DETAILS_OPEN"; payload: boolean }
  | { type: "SET_IS_CANCELLING"; payload: string | null }
  | { type: "SET_IS_CONFIRMING"; payload: string | null }
  | { type: "SET_IS_DELETING"; payload: string | null };

function appointmentsDialogReducer(
  state: AppointmentsDialogState,
  action: AppointmentsDialogAction,
): AppointmentsDialogState {
  switch (action.type) {
    case "SET_SELECTED_APPOINTMENT":
      return { ...state, selectedAppointment: action.payload };
    case "SET_DETAILS_OPEN":
      return { ...state, detailsOpen: action.payload };
    case "SET_IS_CANCELLING":
      return { ...state, isCancelling: action.payload };
    case "SET_IS_CONFIRMING":
      return { ...state, isConfirming: action.payload };
    case "SET_IS_DELETING":
      return { ...state, isDeleting: action.payload };
    default:
      return state;
  }
}

const emptySubscribe = () => () => {};

function AppointmentsMobileCards({
  appointments,
  dispatch,
  isCancelling,
  isDeleting,
  handleCancel,
  handleDelete,
  onStatusUpdated,
}: {
  appointments: Appointment[];
  dispatch: React.Dispatch<AppointmentsDialogAction>;
  isCancelling: string | null;
  isDeleting: string | null;
  handleCancel: (id: string) => void;
  handleDelete: (id: string) => void;
  onStatusUpdated: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:hidden">
      {appointments.length === 0 ? (
        <Card className="border-dashed t-card">
          <CardContent className="p-12 text-center">
            <CalendarX className="size-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-sm font-medium text-muted-foreground">
              No se encontraron citas
            </p>
          </CardContent>
        </Card>
      ) : (
        appointments.map((appointment) => (
          <Card
            key={appointment.id}
            className="t-card overflow-hidden"
          >
            <CardHeader className="pb-4 bg-muted/10 border-b border-border/50">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10 border border-border">
                      <AvatarImage
                        src={
                          appointment.user
                            ?.profilePic
                        }
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                        {(
                          appointment.user
                            ?.name || "G"
                        )
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-base font-bold">
                      {appointment.user?.name ||
                        "Cliente Invitado"}
                    </CardTitle>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground pl-[52px]">
                    {format(
                      new Date(appointment.startTime),
                      "MMM dd, yyyy",
                    )}{" "}
                    &bull;{" "}
                    {format(
                      new Date(appointment.startTime),
                      "HH:mm",
                    )}
                  </p>
                </div>
                {getStatusBadge(appointment.status)}
              </div>
            </CardHeader>
            <CardContent className="py-4 px-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Servicio
                  </p>
                  <div className="flex items-center gap-2">
                    <Scissors
                      size={12}
                      className="text-primary"
                    />
                    <span className="font-medium text-sm truncate">
                      {appointment.service?.name}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Personal
                  </p>
                  <div className="flex items-center gap-2">
                    <User
                      size={12}
                      className="text-primary"
                    />
                    <span className="font-medium text-sm truncate">
                      {appointment.staff?.name}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="px-6 pb-6 pt-2 grid grid-cols-2 gap-3 mt-auto">
              <Button
                variant="outline"
                className="w-full h-10 rounded-lg font-semibold text-xs"
                onClick={() => {
                  dispatch({ type: "SET_SELECTED_APPOINTMENT", payload: appointment });
                  dispatch({ type: "SET_DETAILS_OPEN", payload: true });
                }}
              >
                <Eye size={14} className="mr-2" /> Ver
              </Button>
              <div className="col-span-2">
                <AppointmentStatusActions
                  appointment={appointment}
                  onStatusUpdated={onStatusUpdated}
                />
              </div>
              {(appointment.status === "PENDING" ||
                appointment.status === "CONFIRMED" ||
                appointment.status === "NEEDS_REVIEW") ? (
                <Button
                  variant="outline"
                  className="w-full h-10 border-rose-200 text-rose-600 rounded-lg font-semibold text-xs hover:bg-rose-50 hover:border-rose-300"
                  disabled={
                    isCancelling === appointment.id
                  }
                  onClick={() =>
                    handleCancel(appointment.id)
                  }
                >
                  {isCancelling === appointment.id ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <XCircle
                        size={14}
                        className="mr-2"
                      />{" "}
                      Cancelar
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-10 border-rose-200 text-rose-600 rounded-lg font-semibold text-xs hover:bg-rose-50 hover:border-rose-300"
                  disabled={isDeleting === appointment.id}
                  onClick={() =>
                    handleDelete(appointment.id)
                  }
                >
                  {isDeleting === appointment.id ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <Trash2
                        size={14}
                        className="mr-2"
                      />{" "}
                      Eliminar
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

function AppointmentsDesktopTable({
  appointments,
  isSuperAdmin,
  dispatch,
  isCancelling,
  isDeleting,
  handleCancel,
  handleDelete,
  onStatusUpdated,
}: {
  appointments: Appointment[];
  isSuperAdmin: boolean;
  dispatch: React.Dispatch<AppointmentsDialogAction>;
  isCancelling: string | null;
  isDeleting: string | null;
  handleCancel: (id: string) => void;
  handleDelete: (id: string) => void;
  onStatusUpdated: () => void;
}) {
  return (
    <Card className="t-card border-none shadow-xl overflow-hidden hidden md:block">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent border-b border-border/50">
              <TableHead className="w-[180px] text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-4">
                Fecha y hora
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Cliente
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Servicio
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Personal
              </TableHead>
              {isSuperAdmin && (
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Organización
                </TableHead>
              )}
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Precio
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Estado
              </TableHead>
              <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isSuperAdmin ? 8 : 7}
                  className="h-32 text-center text-muted-foreground font-medium"
                >
                  No se encontraron citas en el sistema
                </TableCell>
              </TableRow>
            ) : (
              appointments.map((appointment) => (
                <TableRow
                  key={appointment.id}
                  className="group hover:bg-muted/30 transition-colors border-b border-border/50"
                >
                  <TableCell className="py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-sm text-foreground">
                        {format(
                          new Date(
                            appointment.startTime,
                          ),
                          "MMM dd, yyyy",
                        )}
                      </span>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {format(
                          new Date(
                            appointment.startTime,
                          ),
                          "HH:mm",
                        )}{" "}
                        -{" "}
                        {format(
                          new Date(
                            appointment.endTime,
                          ),
                          "HH:mm",
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8 border border-border">
                        <AvatarImage
                          src={
                            appointment.user
                              ?.profilePic
                          }
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                          {(
                            appointment.user
                              ?.name || "G"
                          )
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm truncate max-w-[120px]">
                          {appointment.user
                            ?.name || "Invitado"}
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[120px]">
                          {appointment.user
                            ?.email ||
                            "Sin correo"}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Scissors className="size-3.5 text-primary opacity-60" />
                      <span className="text-sm font-medium text-foreground">
                        {appointment.service
                          ?.name || "Servicio"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-muted-foreground">
                      {appointment.staff?.name ||
                        "Asignado"}
                    </span>
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="font-bold text-[9px] uppercase tracking-wider"
                      >
                        {appointment.tenant?.name || "—"}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-foreground">
                        $
                        {appointment.total > 0
                          ? appointment.total
                          : appointment.service
                            ?.price}
                      </span>
                      {appointment.discountAmount >
                        0 && (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                          <Tag className="size-2.5" />
                          -$
                          {
                            appointment.discountAmount
                          }
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(appointment.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 rounded-full hover:bg-primary/10 hover:text-primary transition-all"
                        onClick={() => {
                          dispatch({ type: "SET_SELECTED_APPOINTMENT", payload: appointment });
                          dispatch({ type: "SET_DETAILS_OPEN", payload: true });
                        }}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <AppointmentStatusActions
                        appointment={appointment}
                        onStatusUpdated={onStatusUpdated}
                      />
                      {(appointment.status === "PENDING" ||
                        appointment.status === "CONFIRMED" ||
                        appointment.status === "NEEDS_REVIEW") ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
                          disabled={
                            isCancelling ===
                            appointment.id
                          }
                          onClick={() =>
                            handleCancel(
                              appointment.id,
                            )
                          }
                        >
                          {isCancelling ===
                          appointment.id ? (
                            <Spinner size="sm" />
                          ) : (
                            <XCircle className="size-4" />
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 rounded-full text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-all"
                          disabled={
                            isDeleting ===
                            appointment.id
                          }
                          onClick={() =>
                            handleDelete(
                              appointment.id,
                            )
                          }
                        >
                          {isDeleting ===
                          appointment.id ? (
                            <Spinner size="sm" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function AppointmentsPagination({
  pagination,
  handlePageChange,
}: {
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    totalItemsPerPage: number;
  };
  handlePageChange: (page: number) => void;
}) {
  return (
    <Card className="border-none shadow-sm">
      <div className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/20 rounded-lg">
        <p className="text-sm text-muted-foreground order-2 sm:order-1">
          Mostrando{" "}
          <span className="font-medium text-foreground">
            {(pagination.currentPage - 1) *
              pagination.totalItemsPerPage +
              1}
          </span>{" "}
          a{" "}
          <span className="font-medium text-foreground">
            {Math.min(
              pagination.currentPage *
                pagination.totalItemsPerPage,
              pagination.totalItems,
            )}
          </span>{" "}
          de{" "}
          <span className="font-medium text-foreground">
            {pagination.totalItems}
          </span>{" "}
          citas
        </p>
        <div className="flex gap-2 order-1 sm:order-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handlePageChange(pagination.currentPage - 1)
            }
            disabled={pagination.currentPage === 1}
            className="bg-background"
          >
            Anterior
          </Button>
          <div className="flex items-center gap-1">
            {Array.from(
              {
                length: Math.min(
                  pagination.totalPages,
                  5,
                ),
              },
              (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={
                      pagination.currentPage ===
                      pageNum
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      handlePageChange(pageNum)
                    }
                    className={
                      pagination.currentPage ===
                      pageNum
                        ? ""
                        : "bg-background"
                    }
                  >
                    {pageNum}
                  </Button>
                );
              },
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handlePageChange(pagination.currentPage + 1)
            }
            disabled={
              pagination.currentPage ===
                pagination.totalPages ||
              pagination.totalPages === 0
            }
            className="bg-background"
          >
            Siguiente
          </Button>
        </div>
      </div>
    </Card>
  );
}

function AppointmentsFiltersBar({
  searchQuery,
  statusFilter,
  tenantFilter,
  isSuperAdmin,
  handleSearch,
  handleStatusFilterChange,
  handleTenantFilterChange,
}: {
  searchQuery: string;
  statusFilter: string;
  tenantFilter: string;
  isSuperAdmin: boolean;
  handleSearch: (term: string) => void;
  handleStatusFilterChange: (status: string) => void;
  handleTenantFilterChange: (tenant: string) => void;
}) {
  return (
    <Card className="border-none shadow-sm bg-muted/30">
      <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Input
            placeholder="Buscar por nombre o ID del cliente..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="bg-background border-muted-foreground/20"
          />
        </div>
        <div className="w-full md:w-[200px]">
          <Select
            value={statusFilter}
            onValueChange={handleStatusFilterChange}
          >
            <SelectTrigger className="bg-background border-muted-foreground/20 text-foreground">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent className="bg-background border-muted">
              <SelectItem value="all">
                Todos los estados
              </SelectItem>
              <SelectItem value="PENDING">Pendiente</SelectItem>
              <SelectItem value="CONFIRMED">
                Confirmada
              </SelectItem>
              <SelectItem value="IN_PROGRESS">
                En curso
              </SelectItem>
              <SelectItem value="NEEDS_REVIEW">
                Requiere revisión
              </SelectItem>
              <SelectItem value="COMPLETED">
                Completada
              </SelectItem>
              <SelectItem value="CANCELLED">
                Cancelada
              </SelectItem>
              <SelectItem value="NO_SHOW">No asistió</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isSuperAdmin && (
          <div className="w-full md:w-[200px]">
            <Select
              value={tenantFilter}
              onValueChange={handleTenantFilterChange}
            >
              <SelectTrigger className="bg-background border-muted-foreground/20 text-foreground">
                <SelectValue placeholder="Todos las organizaciones" />
              </SelectTrigger>
              <SelectContent className="bg-background border-muted">
                <SelectItem value="all">
                  Todas las organizaciones
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AppointmentsTableClient(props: Props) {
  return (
    <Suspense fallback={<div className="p-6" />}>
      <AppointmentsTableClientInner {...props} />
    </Suspense>
  );
}

function AppointmentsTableClientInner({
  appointments,
  stats,
  pagination,
  isSuperAdmin = false,
}: Props) {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [dialogState, dispatch] = useReducer(appointmentsDialogReducer, {
    selectedAppointment: null,
    detailsOpen: false,
    isCancelling: null,
    isConfirming: null,
    isDeleting: null,
  });
  const { confirm, ConfirmDialog } = useConfirm();

    // URL State
    const searchQuery = searchParams.get("search") || "";
    const statusFilter = searchParams.get("status") || "all";
    const tenantFilter = searchParams.get("tenantId") || "all";

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("search", term);
        } else {
            params.delete("search");
        }
        params.set("page", "1");
        router.push(`?${params.toString()}`);
    };

    const handleStatusFilterChange = (newStatus: string) => {
        const params = new URLSearchParams(searchParams);
        if (newStatus && newStatus !== "all") {
            params.set("status", newStatus);
        } else {
            params.delete("status");
        }
        params.set("page", "1");
        router.push(`?${params.toString()}`);
    };

    const handleTenantFilterChange = (newTenant: string) => {
        const params = new URLSearchParams(searchParams);
        if (newTenant && newTenant !== "all") {
            params.set("tenantId", newTenant);
        } else {
            params.delete("tenantId");
        }
        params.set("page", "1");
        router.push(`?${params.toString()}`);
    };

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", newPage.toString());
        router.push(`?${params.toString()}`);
    };

    const handleCancel = async (id: string) => {
        const confirmed = await confirm({
            title: "Cancelar Cita",
            description:
                "¿Seguro que querés cancelar esta cita? Esta acción no se puede deshacer.",
            confirmText: "Sí, Cancelar Cita",
            cancelText: "No, Conservarlo",
            variant: "destructive",
        });

        if (!confirmed) return;

    dispatch({ type: "SET_IS_CANCELLING", payload: id });
    try {
      const response = await fetch(`/api/appointments/${id}/cancel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Cancelled by administrator" }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Cita cancelada correctamente");
        router.refresh();
        dispatch({ type: "SET_DETAILS_OPEN", payload: false });
      } else {
        toast.error(data.message || "Error al cancelar la cita");
      }
    } catch (_error) {
      toast.error("Ocurrió un error al cancelar la cita");
    } finally {
      dispatch({ type: "SET_IS_CANCELLING", payload: null });
    }
    };

  const handleConfirm = async (id: string) => {
    dispatch({ type: "SET_IS_CONFIRMING", payload: id });
    try {
      const response = await fetch(`/api/appointments/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED" }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Cita confirmada correctamente");
        router.refresh();
        dispatch({ type: "SET_DETAILS_OPEN", payload: false });
      } else {
        toast.error(data.message || "Error al confirmar la cita");
      }
    } catch (_error) {
      toast.error("Ocurrió un error al confirmar la cita");
    } finally {
      dispatch({ type: "SET_IS_CONFIRMING", payload: null });
    }
    };

    const handleStatusUpdated = () => {
        router.refresh();
        dispatch({ type: "SET_DETAILS_OPEN", payload: false });
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: "Eliminar Cita",
            description:
                "¿Seguro que querés eliminar PERMANENTEMENTE esta cita? Esta acción no se puede deshacer.",
            confirmText: "Sí, Eliminar Permanentemente",
            cancelText: "Cancelar",
            variant: "destructive",
        });

        if (!confirmed) return;

    dispatch({ type: "SET_IS_DELETING", payload: id });
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Cita eliminada correctamente");
        router.refresh();
        dispatch({ type: "SET_DETAILS_OPEN", payload: false });
      } else {
        toast.error(data.message || "Error al eliminar la cita");
      }
    } catch (_error) {
      toast.error("Ocurrió un error al eliminar la cita");
    } finally {
      dispatch({ type: "SET_IS_DELETING", payload: null });
    }
};

  if (!isMounted) return null;

  return (
    <div className="space-y-6" suppressHydrationWarning>
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">
                    Gestión de citas
                </h1>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={CalendarDays}
                    title="Total de Citas"
                    value={stats?.totalAppointments || 0}
                    color="bg-blue-500"
                    description="En todos los estados"
                />
                <StatCard
                    icon={Clock}
                    title="Pendiente"
                    value={stats?.pendingAppointments || 0}
                    color="bg-yellow-500"
                    description="Esperando confirmación"
                />
                <StatCard
                    icon={CalendarCheck}
                    title="Confirmadas"
                    value={stats?.confirmedAppointments || 0}
                    color="bg-green-500"
                    description="Reservas próximas"
                />
                <StatCard
                    icon={CalendarX}
                    title="Canceladas / No Asistió"
                    value={
                        (stats?.statusCounts?.["CANCELLED"] || 0) +
                        (stats?.statusCounts?.["NO_SHOW"] || 0)
                    }
                    color="bg-red-500"
                    description="Visitas no completadas"
                />
            </div>

        <AppointmentsFiltersBar
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          tenantFilter={tenantFilter}
          isSuperAdmin={isSuperAdmin}
          handleSearch={handleSearch}
          handleStatusFilterChange={handleStatusFilterChange}
          handleTenantFilterChange={handleTenantFilterChange}
        />

        <AppointmentsMobileCards
          appointments={appointments}
          dispatch={dispatch}
          isCancelling={dialogState.isCancelling}
          isDeleting={dialogState.isDeleting}
          handleCancel={handleCancel}
          handleDelete={handleDelete}
          onStatusUpdated={handleStatusUpdated}
        />

        <AppointmentsDesktopTable
          appointments={appointments}
          isSuperAdmin={isSuperAdmin}
          dispatch={dispatch}
          isCancelling={dialogState.isCancelling}
          isDeleting={dialogState.isDeleting}
          handleCancel={handleCancel}
          handleDelete={handleDelete}
          onStatusUpdated={handleStatusUpdated}
        />

        {pagination.totalItems > 0 && (
          <AppointmentsPagination
            pagination={pagination}
            handlePageChange={handlePageChange}
          />
        )}

      <AppointmentDetailsDialog
        appointment={dialogState.selectedAppointment}
        open={dialogState.detailsOpen}
        onOpenChange={(open) => dispatch({ type: "SET_DETAILS_OPEN", payload: open })}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        onDelete={handleDelete}
        onStatusUpdated={handleStatusUpdated}
        isConfirming={dialogState.isConfirming}
        isCancelling={dialogState.isCancelling}
        isDeleting={dialogState.isDeleting}
      />
      <ConfirmDialog />
        </div>
    );
}
