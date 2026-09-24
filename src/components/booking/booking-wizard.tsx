"use client";

import React, {
    useReducer,
    useCallback,
    useEffect,
    useMemo,
    useState,
    useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import {
    Service,
    Staff,
    CreateAppointmentData,
    bookingService,
} from "@/services/booking.service";
import { couponsService } from "@/services/coupons.service";
import { CouponValidationResult } from "@/types/coupon.types";
import { useAuthStore } from "@/store/auth-store";
import { useFeatures } from "@/hooks/useFeatures";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
    Loader2,
    Clock,
    User,
    ChevronLeft,
    Check,
    AlertCircle,
    Info,
    Tag,
    Scissors,
    ArrowRight,
    CalendarOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { filterFutureSlots, isFutureSlot } from "@/lib/appointment-time";
import { EmptyState } from "@/components/ui/empty-state";
import {
    AvailabilityCalendar,
    workingWeekdays,
} from "@/components/booking/availability-calendar";

interface BookingWizardProps {
    initialServices: Service[];
    initialStaff: Staff[];
    preSelectedServiceId?: string | null;
}

type BookingWizardState = {
    step: number;
    selectedService: Service | null;
    selectedStaff: Staff | null;
    selectedDate: string;
    selectedTime: string;
    notes: string;
    submitting: boolean;
    error: string | null;
    availableSlots: string[];
    loadingAvailability: boolean;
    couponCode: string;
    couponResult: CouponValidationResult | null;
    validatingCoupon: boolean;
    couponError: string | null;
};

type BookingWizardAction =
    | { type: "SET_STEP"; payload: number }
    | { type: "SET_SELECTED_SERVICE"; payload: Service | null }
    | { type: "SET_SELECTED_STAFF"; payload: Staff | null }
    | { type: "SET_SELECTED_DATE"; payload: string }
    | { type: "SET_SELECTED_TIME"; payload: string }
    | { type: "SET_NOTES"; payload: string }
    | { type: "SET_SUBMITTING"; payload: boolean }
    | { type: "SET_ERROR"; payload: string | null }
    | { type: "SET_AVAILABLE_SLOTS"; payload: string[] }
    | { type: "SET_LOADING_AVAILABILITY"; payload: boolean }
    | { type: "SET_COUPON_CODE"; payload: string }
    | { type: "SET_COUPON_RESULT"; payload: CouponValidationResult | null }
    | { type: "SET_VALIDATING_COUPON"; payload: boolean }
    | { type: "SET_COUPON_ERROR"; payload: string | null };

function bookingWizardReducer(
    state: BookingWizardState,
    action: BookingWizardAction,
): BookingWizardState {
    switch (action.type) {
        case "SET_STEP":
            return { ...state, step: action.payload };
        case "SET_SELECTED_SERVICE":
            return {
                ...state,
                selectedService: action.payload,
                availableSlots: [],
            };
        case "SET_SELECTED_STAFF":
            return {
                ...state,
                selectedStaff: action.payload,
                selectedTime: "",
                availableSlots: [],
            };
        case "SET_SELECTED_DATE":
            return {
                ...state,
                selectedDate: action.payload,
                selectedTime: "",
                availableSlots: [],
            };
        case "SET_SELECTED_TIME":
            return { ...state, selectedTime: action.payload };
        case "SET_NOTES":
            return { ...state, notes: action.payload };
        case "SET_SUBMITTING":
            return { ...state, submitting: action.payload };
        case "SET_ERROR":
            return { ...state, error: action.payload };
        case "SET_AVAILABLE_SLOTS":
            return { ...state, availableSlots: action.payload };
        case "SET_LOADING_AVAILABILITY":
            return { ...state, loadingAvailability: action.payload };
        case "SET_COUPON_CODE":
            return { ...state, couponCode: action.payload };
        case "SET_COUPON_RESULT":
            return { ...state, couponResult: action.payload };
        case "SET_VALIDATING_COUPON":
            return { ...state, validatingCoupon: action.payload };
        case "SET_COUPON_ERROR":
            return { ...state, couponError: action.payload };
        default:
            return state;
    }
}

const BOOKING_STEPS = [
    { number: 1, label: "SERVICIO", icon: <Scissors className="size-5" /> },
    { number: 2, label: "PROFESIONAL", icon: <User className="size-5" /> },
    { number: 3, label: "AGENDA", icon: <Clock className="size-5" /> },
    { number: 4, label: "REVISAR", icon: <Check className="size-5" /> },
];

const emptySubscribe = () => () => {};

type DispatchFn = (action: BookingWizardAction) => void;

interface ServiceStepProps {
    services: Service[];
    selectedService: Service | null;
    dispatch: DispatchFn;
}

function ServiceStep({
    services,
    selectedService,
    dispatch,
}: ServiceStepProps) {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                    Elegí un servicio
                </h2>
                <p className="text-muted-foreground font-medium text-sm">
                    Elegí la sesión que mejor se adapte a tus necesidades
                </p>
            </div>
            {services.length === 0 ? (
                <EmptyState
                    icon={Info}
                    title="Sin servicios registrados"
                    description="No hay servicios disponibles para reservar."
                />
            ) : (
                Object.entries(
                    services.reduce(
                        (acc, s) => {
                            const cat = s.category?.name || "Sin categoría";
                            if (!acc[cat]) acc[cat] = [];
                            acc[cat].push(s);
                            return acc;
                        },
                        {} as Record<string, Service[]>,
                    ),
                ).map(([cat, svcs]) => (
                    <div key={cat} className="space-y-4">
                        <div className="flex items-center gap-4">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                                {cat}
                            </h3>
                            <div className="h-px flex-1 bg-border/50" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {svcs.map((s) => (
                                <Card
                                    key={s.id}
                                    className={cn(
                                        "cursor-pointer group transition-all duration-300 t-card",
                                        selectedService?.id === s.id
                                            ? "ring-2 ring-primary border-primary bg-primary/5"
                                            : "border-border/50 hover:border-primary/20",
                                    )}
                                    onClick={() => {
                                        dispatch({
                                            type: "SET_SELECTED_SERVICE",
                                            payload: s,
                                        });
                                        dispatch({
                                            type: "SET_STEP",
                                            payload: 2,
                                        });
                                    }}
                                >
                                    <CardHeader className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <Badge
                                                className={cn(
                                                    "font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow-sm",
                                                    selectedService?.id === s.id
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-primary/10 text-primary",
                                                )}
                                            >
                                                ${s.price}
                                            </Badge>
                                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider opacity-60">
                                                <Clock className="size-3" />{" "}
                                                {s.duration} MIN
                                            </div>
                                        </div>
                                        <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                                            {s.name}
                                        </CardTitle>
                                        {s.description && (
                                            <CardDescription
                                                className={cn(
                                                    "line-clamp-2 mt-2 font-medium text-sm leading-relaxed",
                                                    selectedService?.id === s.id
                                                        ? "text-foreground/70"
                                                        : "text-muted-foreground",
                                                )}
                                            >
                                                {s.description}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

interface StaffStepProps {
    staff: Staff[];
    selectedService: Service | null;
    selectedStaff: Staff | null;
    dispatch: DispatchFn;
}

function StaffStep({
    staff,
    selectedService,
    selectedStaff,
    dispatch,
}: StaffStepProps) {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                    Profesional asignado
                </h2>
                <p className="text-muted-foreground font-medium text-sm">
                    Elegí el profesional asignado
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staff.reduce<React.ReactNode[]>((acc, member) => {
                    if (
                        member.serviceIds &&
                        selectedService &&
                        !member.serviceIds.includes(selectedService.id)
                    )
                        return acc;
                    acc.push(
                        <Card
                            key={member.id}
                            className={cn(
                                "cursor-pointer group transition-all duration-300 t-card overflow-hidden",
                                selectedStaff?.id === member.id
                                    ? "ring-2 ring-primary border-primary bg-primary/5"
                                    : "border-border/50 hover:border-primary/20",
                            )}
                            onClick={() => {
                                dispatch({
                                    type: "SET_SELECTED_STAFF",
                                    payload: member,
                                });
                                dispatch({ type: "SET_STEP", payload: 3 });
                            }}
                        >
                            <CardHeader className="p-6">
                                <div className="flex items-center gap-5">
                                    <div
                                        className={cn(
                                            "size-14 rounded-xl flex items-center justify-center transition-all duration-500",
                                            selectedStaff?.id === member.id
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted",
                                        )}
                                    >
                                        <User className="size-7" />
                                    </div>
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                                            {member.name}
                                        </CardTitle>
                                        {member.bio && (
                                            <CardDescription
                                                className={cn(
                                                    "line-clamp-1 font-semibold text-[10px] uppercase tracking-wider",
                                                    selectedStaff?.id ===
                                                        member.id
                                                        ? "text-primary"
                                                        : "text-muted-foreground",
                                                )}
                                            >
                                                {member.bio}
                                            </CardDescription>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>,
                    );
                    return acc;
                }, [])}
            </div>
            <div className="pt-4">
                <Button
                    variant="ghost"
                    onClick={() => dispatch({ type: "SET_STEP", payload: 1 })}
                    className="font-semibold text-xs h-10 px-4"
                >
                    <ChevronLeft className="size-4 mr-2" /> Cambiar servicio
                </Button>
            </div>
        </div>
    );
}

interface ScheduleStepProps {
    today: string;
    selectedDate: string;
    selectedTime: string;
    availableSlots: string[];
    currentInstant: Date;
    loadingAvailability: boolean;
    selectedStaff: Staff | null;
    dispatch: DispatchFn;
}

function ScheduleStep({
    today,
    selectedDate,
    selectedTime,
    availableSlots,
    currentInstant,
    loadingAvailability,
    selectedStaff,
    dispatch,
}: ScheduleStepProps) {
    const workingDays = useMemo(
        () => workingWeekdays(selectedStaff?.workingHours),
        [selectedStaff],
    );
    const selectableSlots = useMemo(
        () => filterFutureSlots(selectedDate, availableSlots, currentInstant),
        [availableSlots, currentInstant, selectedDate],
    );
    const isDayOff =
        selectedDate &&
        workingDays.size > 0 &&
        !workingDays.has(new Date(`${selectedDate}T12:00:00`).getDay());

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                    Agenda
                </h2>
                <p className="text-muted-foreground font-medium text-sm">
                    Elegí el horario que prefieras
                </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="t-card border-none shadow-xl overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-border/50">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Fecha objetivo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 pb-8">
                        <AvailabilityCalendar
                            value={selectedDate}
                            onChange={(payload) =>
                                dispatch({
                                    type: "SET_SELECTED_DATE",
                                    payload,
                                })
                            }
                            workingDays={workingDays}
                            minDate={today}
                        />
                    </CardContent>
                </Card>

                {selectedDate && (
                    <Card className="t-card border-none shadow-xl overflow-hidden animate-in fade-in slide-in-from-right-4">
                        <CardHeader className="bg-muted/30 border-b border-border/50">
                            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                {loadingAvailability
                                    ? "Buscando..."
                                    : "Horarios Disponibles"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 pb-8">
                            {loadingAvailability ? (
                                <div className="flex flex-col items-center justify-center py-10 gap-3">
                                    <Loader2 className="size-8 animate-spin text-primary" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        Consultando disponibilidad…
                                    </p>
                                </div>
                            ) : isDayOff ? (
                                <div className="text-center py-10 space-y-2">
                                    <CalendarOff className="size-8 mx-auto text-muted-foreground opacity-60" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        {selectedStaff?.name} no labora este día
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Elige otro día en el calendario
                                    </p>
                                </div>
                            ) : selectableSlots.length === 0 ? (
                                <div className="text-center py-10 space-y-2">
                                    <AlertCircle className="size-8 mx-auto text-rose-500 opacity-50" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">
                                        Sin horarios disponibles para esta fecha
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                    {selectableSlots.map((time) => {
                                        return (
                                            <Button
                                                key={time}
                                                variant={
                                                    selectedTime === time
                                                        ? "default"
                                                        : "outline"
                                                }
                                                onClick={() =>
                                                    dispatch({
                                                        type: "SET_SELECTED_TIME",
                                                        payload: time,
                                                    })
                                                }
                                                className={cn(
                                                    "h-10 rounded-lg text-xs font-semibold transition-all",
                                                    selectedTime === time
                                                        ? "shadow-md scale-105"
                                                        : "border-border/50 hover:border-primary/30",
                                                )}
                                            >
                                                {time}
                                            </Button>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
            <div className="flex items-center justify-between pt-4">
                <Button
                    variant="ghost"
                    onClick={() => dispatch({ type: "SET_STEP", payload: 2 })}
                    className="font-semibold text-xs h-10"
                >
                    <ChevronLeft className="size-4 mr-2" /> Volver al profesional
                </Button>
                {selectedDate && selectedTime && (
                    <Button
                        onClick={() =>
                            dispatch({ type: "SET_STEP", payload: 4 })
                        }
                        className="rounded-xl font-bold h-12 px-8 shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
                    >
                        Revisar detalles <ArrowRight className="ml-2 size-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}

interface ReviewStepProps {
    selectedService: Service | null;
    selectedStaff: Staff | null;
    selectedDate: string;
    selectedTime: string;
    notes: string;
    submitting: boolean;
    couponCode: string;
    couponResult: CouponValidationResult | null;
    validatingCoupon: boolean;
    couponError: string | null;
    isFeatureEnabled: (feature: string) => boolean;
    dispatch: DispatchFn;
    validateCoupon: () => Promise<void>;
    handleSubmit: () => Promise<void>;
}

function ReviewStep({
    selectedService,
    selectedStaff,
    selectedDate,
    selectedTime,
    notes,
    submitting,
    couponCode,
    couponResult,
    validatingCoupon,
    couponError,
    isFeatureEnabled,
    dispatch,
    validateCoupon,
    handleSubmit,
}: ReviewStepProps) {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                    Revisar detalles
                </h2>
                <p className="text-muted-foreground font-medium text-sm">
                    Revisá los datos de tu reserva
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="t-card border-none shadow-xl overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b border-border/50 p-6">
                            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                Resumen de la reserva
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                                        Servicio
                                    </p>
                                    <p className="text-lg font-bold text-foreground">
                                        {selectedService?.name}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                                        Profesional
                                    </p>
                                    <p className="text-lg font-bold text-foreground">
                                        {selectedStaff?.name}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                                        Fecha
                                    </p>
                                    <p className="text-lg font-bold text-foreground">
                                        {new Date(
                                            selectedDate,
                                        ).toLocaleDateString("es-ES", {
                                            weekday: "long",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                                        Hora
                                    </p>
                                    <p className="text-lg font-bold text-foreground">
                                        {selectedTime}
                                    </p>
                                </div>
                            </div>

                            <Separator className="bg-border/50" />

                            <div className="space-y-3">
                                <Label className="text-xs font-semibold ml-1">
                                    Notas adicionales
                                </Label>
                                <Textarea
                                    value={notes}
                                    onChange={(e) =>
                                        dispatch({
                                            type: "SET_NOTES",
                                            payload: e.target.value,
                                        })
                                    }
                                    rows={4}
                                    placeholder="Contanos cualquier cosa que debamos saber..."
                                    className="rounded-xl border-border focus:border-primary transition-all bg-muted/10 font-medium"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    {isFeatureEnabled("COUPONS") && (
                        <Card className="t-card border-none shadow-lg p-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest">
                                    <Tag size={12} /> Código de descuento
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="CÓDIGO"
                                        value={couponCode}
                                        onChange={(e) =>
                                            dispatch({
                                                type: "SET_COUPON_CODE",
                                                payload:
                                                    e.target.value.toUpperCase(),
                                            })
                                        }
                                        className="h-11 rounded-xl font-bold uppercase text-xs"
                                        disabled={!!couponResult}
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={validateCoupon}
                                        disabled={
                                            !couponCode || validatingCoupon
                                        }
                                        className="h-11 px-4 rounded-xl font-bold text-xs"
                                    >
                                        {validatingCoupon ? (
                                            <Loader2 className="animate-spin size-4" />
                                        ) : couponResult ? (
                                            "Activo"
                                        ) : (
                                            "Aplicar"
                                        )}
                                    </Button>
                                </div>
                                {couponError && (
                                    <p className="text-[10px] font-semibold text-rose-500">
                                        {couponError}
                                    </p>
                                )}
                            </div>
                        </Card>
                    )}

                    <Card className="t-card border-none bg-card text-foreground shadow-2xl overflow-hidden p-8 space-y-8">
                        <div className="space-y-4">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-70">
                                <span>Tarifa estándar</span>
                                <span>${selectedService?.price}</span>
                            </div>
                            {couponResult?.discountAmount && (
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                    <span>Cupón aplicado</span>
                                    <span>-${couponResult.discountAmount}</span>
                                </div>
                            )}
                            <div className="h-px bg-border" />
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                                    Total a pagar
                                </span>
                                <span className="text-5xl font-bold tracking-tighter">
                                    ${" "}
                                    {Math.max(
                                        0,
                                        (selectedService?.price || 0) -
                                            (couponResult?.discountAmount || 0),
                                    )}
                                </span>
                            </div>
                        </div>

                        <Button
                            className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold shadow-lg transition-all hover:-translate-y-0.5 active:scale-95"
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="animate-spin mr-2 size-5" />
                                    Reservando…
                                </>
                            ) : (
                                "Confirmar Reserva"
                            )}
                        </Button>
                    </Card>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() =>
                                dispatch({ type: "SET_STEP", payload: 3 })
                            }
                            disabled={submitting}
                            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                        >
                            ← Modificar agenda
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function BookingWizard({
    initialServices,
    initialStaff,
    preSelectedServiceId,
}: BookingWizardProps) {
    const isMounted = useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false,
    );
    const today = useMemo(() => new Date().toISOString().split("T")[0], []);
    const [currentInstant, setCurrentInstant] = useState(() => new Date());
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const { isFeatureEnabled } = useFeatures();

    const [state, dispatch] = useReducer(bookingWizardReducer, {
        step:
            preSelectedServiceId &&
            initialServices.find((s) => s.id === preSelectedServiceId)
                ? 2
                : 1,
        selectedService:
            initialServices.find((s) => s.id === preSelectedServiceId) || null,
        selectedStaff: null,
        selectedDate: "",
        selectedTime: "",
        notes: "",
        submitting: false,
        error: null,
        availableSlots: [],
        loadingAvailability: false,
        couponCode: "",
        couponResult: null,
        validatingCoupon: false,
        couponError: null,
    });
    const {
        step,
        selectedService,
        selectedStaff,
        selectedDate,
        selectedTime,
        notes,
        submitting,
        error,
        availableSlots,
        loadingAvailability,
        couponCode,
        couponResult,
        validatingCoupon,
        couponError,
    } = state;

    useEffect(() => {
        const interval = window.setInterval(
            () => setCurrentInstant(new Date()),
            30_000,
        );
        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        if (
            selectedTime &&
            !isFutureSlot(selectedDate, selectedTime, currentInstant)
        ) {
            dispatch({ type: "SET_SELECTED_TIME", payload: "" });
        }
    }, [currentInstant, dispatch, selectedDate, selectedTime]);

    const checkAvailability = useCallback(async () => {
        if (
            !state.selectedStaff ||
            !state.selectedDate ||
            !state.selectedService
        )
            return;
        try {
            dispatch({ type: "SET_LOADING_AVAILABILITY", payload: true });
            const slots = await bookingService.checkAvailability(
                state.selectedStaff.id,
                state.selectedService.id,
                state.selectedDate,
            );
            dispatch({ type: "SET_AVAILABLE_SLOTS", payload: slots });
        } catch (err) {
            console.error("Error al verificar disponibilidad", err);
        } finally {
            dispatch({ type: "SET_LOADING_AVAILABILITY", payload: false });
        }
    }, [state.selectedStaff, state.selectedDate, state.selectedService]);

    useEffect(() => {
        checkAvailability();
    }, [checkAvailability]);

    const validateCoupon = async () => {
        if (!state.couponCode.trim() || !state.selectedService) return;
        try {
            dispatch({ type: "SET_VALIDATING_COUPON", payload: true });
            dispatch({ type: "SET_COUPON_ERROR", payload: null });
            const result = await couponsService.validate(
                state.couponCode,
                state.selectedService.price,
                undefined,
                undefined,
                [state.selectedService.id],
            );
            if (result.valid) {
                dispatch({ type: "SET_COUPON_RESULT", payload: result });
            } else {
                dispatch({
                    type: "SET_COUPON_ERROR",
                    payload: result.message || "Código de cupón inválido",
                });
                dispatch({ type: "SET_COUPON_RESULT", payload: null });
            }
        } catch (err: any) {
            dispatch({
                type: "SET_COUPON_ERROR",
                payload: err.message || "Error al validar el cupón",
            });
        } finally {
            dispatch({ type: "SET_VALIDATING_COUPON", payload: false });
        }
    };

    const handleSubmit = async () => {
        if (
            !state.selectedService ||
            !state.selectedStaff ||
            !state.selectedDate ||
            !state.selectedTime
        ) {
            dispatch({
                type: "SET_ERROR",
                payload: "Por favor completa todos los campos obligatorios",
            });
            return;
        }
        if (!user) {
            router.push(`/login?redirect=/book`);
            return;
        }

        const now = new Date();
        if (!isFutureSlot(state.selectedDate, state.selectedTime, now)) {
            setCurrentInstant(now);
            dispatch({ type: "SET_SELECTED_TIME", payload: "" });
            dispatch({
                type: "SET_ERROR",
                payload: "El horario seleccionado ya no está disponible",
            });
            dispatch({ type: "SET_STEP", payload: 3 });
            return;
        }

        try {
            dispatch({ type: "SET_SUBMITTING", payload: true });
            dispatch({ type: "SET_ERROR", payload: null });
            const startTime = new Date(
                `${state.selectedDate}T${state.selectedTime}`,
            );
            const appointmentData: CreateAppointmentData = {
                userId: user.id,
                serviceId: state.selectedService.id,
                staffId: state.selectedStaff.id,
                startTime: startTime.toISOString(),
                notes: state.notes,
                couponCode: state.couponResult?.valid
                    ? state.couponResult.coupon?.code
                    : undefined,
            };
            await bookingService.createAppointment(appointmentData);
            router.push("/appointments?success=true");
        } catch (err: any) {
            dispatch({
                type: "SET_ERROR",
                payload: err.message || "Error al crear la cita",
            });
        } finally {
            dispatch({ type: "SET_SUBMITTING", payload: false });
        }
    };

    if (!isMounted) return null;

    return (
        <div className="space-y-10 animate-slide-up" suppressHydrationWarning>
            <div className="relative mb-12">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 z-0" />
                <div className="relative z-10 flex justify-between">
                    {BOOKING_STEPS.map((s, _index) => {
                        const isCurrent = step === s.number;
                        const isDone = step > s.number;

                        return (
                            <div
                                key={s.number}
                                className="flex flex-col items-center"
                            >
                                <div
                                    className={cn(
                                        "size-12 rounded-full flex items-center justify-center transition-all duration-500 border-2",
                                        isCurrent
                                            ? "bg-primary text-primary-foreground border-primary shadow-lg scale-110"
                                            : isDone
                                              ? "bg-emerald-500 text-white border-emerald-500 shadow-none"
                                              : "bg-background text-muted-foreground border-border shadow-none",
                                    )}
                                >
                                    {isDone ? (
                                        <Check className="size-5 stroke-[2.5px]" />
                                    ) : (
                                        s.icon
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        "mt-3 text-[10px] font-bold uppercase tracking-wider transition-colors duration-300",
                                        isCurrent
                                            ? "text-primary"
                                            : "text-muted-foreground",
                                    )}
                                >
                                    {s.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {error && (
                <Alert
                    variant="destructive"
                    className="border-none bg-rose-50 text-rose-700 rounded-xl animate-in shake-1"
                >
                    <AlertCircle className="size-5" />
                    <AlertDescription className="font-semibold text-sm">
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            {step === 1 && (
                <ServiceStep
                    services={initialServices}
                    selectedService={selectedService}
                    dispatch={dispatch}
                />
            )}

            {step === 2 && (
                <StaffStep
                    staff={initialStaff}
                    selectedService={selectedService}
                    selectedStaff={selectedStaff}
                    dispatch={dispatch}
                />
            )}

            {step === 3 && (
                <ScheduleStep
                    today={today}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    availableSlots={availableSlots}
                    currentInstant={currentInstant}
                    loadingAvailability={loadingAvailability}
                    selectedStaff={selectedStaff}
                    dispatch={dispatch}
                />
            )}

            {step === 4 && (
                <ReviewStep
                    selectedService={selectedService}
                    selectedStaff={selectedStaff}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    notes={notes}
                    submitting={submitting}
                    couponCode={couponCode}
                    couponResult={couponResult}
                    validatingCoupon={validatingCoupon}
                    couponError={couponError}
                    isFeatureEnabled={isFeatureEnabled}
                    dispatch={dispatch}
                    validateCoupon={validateCoupon}
                    handleSubmit={handleSubmit}
                />
            )}
        </div>
    );
}
