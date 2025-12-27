'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { bookingService, Appointment, Staff } from '@/services';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Calendar, Clock, User, FileText, AlertCircle, CheckCircle2, Briefcase, XCircle } from 'lucide-react';
import Link from 'next/link';
import { CancelAppointmentDialog } from '@/components/booking/cancel-appointment-dialog';
import { StatusUpdateDialog } from '@/components/booking/status-update-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AppointmentsPage() {
    const searchParams = useSearchParams();
    const success = searchParams.get('success');
    const user = useAuthStore((state) => state.user);

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [staffAppointments, setStaffAppointments] = useState<Appointment[]>([]);
    const [staffProfile, setStaffProfile] = useState<Staff | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isStaff = user?.roleName === 'STAFF' || user?.roleName === 'ADMIN' || user?.roleName === 'SUPER_ADMIN' || user?.isAdmin;

    useEffect(() => {
        if (user) {
            loadInitialData();
        } else if (!useAuthStore.getState().loading) {
            setLoading(false);
        }
    }, [user]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            // Fetch user's own bookings first
            const userApps = await bookingService.getAppointments({ userId: user?.id });
            setAppointments(userApps);

            // If user is staff, try to fetch their profile and assigned bookings
            if (isStaff) {
                try {
                    const staffProf = await bookingService.getMeStaff();
                    if (staffProf) {
                        setStaffProfile(staffProf);
                        const sApps = await bookingService.getAppointments({ staffId: staffProf.id });
                        setStaffAppointments(sApps);
                    }
                } catch (staffErr) {
                    console.error('Error loading staff profile:', staffErr);
                    // Don't fail the whole page if staff profile fails to load
                }
            }
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadUserAppointments = async () => {
        if (!user?.id) return;
        try {
            const data = await bookingService.getAppointments({ userId: user.id });
            setAppointments(data);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const loadStaffAppointments = async () => {
        if (!staffProfile?.id) return;
        try {
            const data = await bookingService.getAppointments({ staffId: staffProfile.id });
            setStaffAppointments(data);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            PENDING: 'outline',
            CONFIRMED: 'default',
            IN_PROGRESS: 'secondary',
            COMPLETED: 'secondary',
            CANCELLED: 'destructive',
            NO_SHOW: 'outline',
        };
        return variants[status] || 'outline';
    };

    const AppointmentCard = ({ appointment, type }: { appointment: Appointment, type: 'user' | 'staff' }) => (
        <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <Link
                        href={`/appointments/${appointment.id}`}
                        className="space-y-1 group flex-1"
                    >
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                            {appointment.service?.name || 'Service'}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                            {type === 'user' ? (
                                <>
                                    <Briefcase className="h-4 w-4" />
                                    <span>Staff: {appointment.staff?.name || 'Any'}</span>
                                </>
                            ) : (
                                <>
                                    <User className="h-4 w-4" />
                                    <span>Client: {appointment.user?.name || appointment.userId || 'Unknown'}</span>
                                </>
                            )}
                        </div>
                    </Link>
                    <Badge variant={getStatusVariant(appointment.status)}>
                        {appointment.status.replace('_', ' ')}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Date</p>
                            <p className="font-medium">
                                {new Date(appointment.startTime).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Time</p>
                            <p className="font-medium">
                                {new Date(appointment.startTime).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                {appointment.notes && (
                    <div className="flex items-start gap-2 text-sm p-3 bg-muted/50 rounded-lg">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Notes</p>
                            <p className="text-sm line-clamp-2">{appointment.notes}</p>
                        </div>
                    </div>
                )}

                {appointment.status === 'PENDING' && (
                    <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        {type === 'user' ? (
                            <CancelAppointmentDialog
                                appointmentId={appointment.id}
                                onAppointmentCancelled={loadUserAppointments}
                                trigger={
                                    <Button variant="destructive" size="sm" className="w-full sm:w-auto">
                                        Cancel Appointment
                                    </Button>
                                }
                            />
                        ) : (
                            <>
                                <StatusUpdateDialog
                                    appointmentId={appointment.id}
                                    newStatus="CONFIRMED"
                                    onStatusUpdated={loadStaffAppointments}
                                    trigger={
                                        <Button variant="default" size="sm" className="flex-1 sm:flex-none">
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            Aprobar
                                        </Button>
                                    }
                                />
                                <StatusUpdateDialog
                                    appointmentId={appointment.id}
                                    newStatus="CANCELLED"
                                    onStatusUpdated={loadStaffAppointments}
                                    trigger={
                                        <Button variant="destructive" size="sm" className="flex-1 sm:flex-none">
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Rechazar
                                        </Button>
                                    }
                                />
                            </>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">Loading appointments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
                        My <span className="text-primary">Appointments</span>
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        {isStaff ? 'Manage your schedule and bookings' : 'Manage your upcoming and past appointments'}
                    </p>
                </div>

                {/* Success Alert */}
                {success && (
                    <Alert className="mb-6 border-green-500/50 bg-green-50 dark:bg-green-950">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800 dark:text-green-200">
                            Appointment booked successfully! You'll receive a confirmation email shortly.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {isStaff && staffProfile ? (
                    <Tabs defaultValue="assigned" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                            <TabsTrigger value="assigned" className="gap-2">
                                <Briefcase className="h-4 w-4" />
                                My Schedule
                            </TabsTrigger>
                            <TabsTrigger value="my-bookings" className="gap-2">
                                <Calendar className="h-4 w-4" />
                                My Bookings
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="assigned" className="space-y-4">
                            {staffAppointments.length === 0 ? (
                                <Card className="text-center py-12">
                                    <CardContent className="pt-6">
                                        <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-lg font-medium">No assigned bookings yet</p>
                                        <p className="text-muted-foreground">You'll see customer bookings here when they scheduled with you.</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                staffAppointments.map((appointment) => (
                                    <AppointmentCard key={appointment.id} appointment={appointment} type="staff" />
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="my-bookings" className="space-y-4">
                            {appointments.length === 0 ? (
                                <Card className="text-center py-12">
                                    <CardContent className="pt-6">
                                        <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-lg font-medium">No personal bookings</p>
                                        <Button asChild variant="outline" className="mt-4">
                                            <Link href="/services">Book a Service</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                appointments.map((appointment) => (
                                    <AppointmentCard key={appointment.id} appointment={appointment} type="user" />
                                ))
                            )}
                        </TabsContent>
                    </Tabs>
                ) : (
                    /* Customer only view */
                    appointments.length === 0 ? (
                        <Card className="text-center py-12">
                            <CardContent className="pt-6 space-y-4">
                                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                    <Calendar className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-lg font-medium mb-2">No appointments yet</p>
                                    <p className="text-muted-foreground mb-6">
                                        Book your first appointment to get started
                                    </p>
                                </div>
                                <Button asChild size="lg">
                                    <Link href="/services">Browse Services</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {appointments.map((appointment) => (
                                <AppointmentCard key={appointment.id} appointment={appointment} type="user" />
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}


