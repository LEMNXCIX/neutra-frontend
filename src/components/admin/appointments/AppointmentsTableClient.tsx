"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from "@/components/ui/card";
import {
    Table,
    TableHeader,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from "@/components/ui/table";
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
    Trash2
} from "lucide-react";
import { Appointment } from "@/services/booking.service";
import { Spinner } from "@/components/ui/spinner";
import { format } from "date-fns";
import { useConfirm } from "@/hooks/use-confirm";

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

export default function AppointmentsTableClient({ appointments, stats, pagination, isSuperAdmin = false }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const { confirm, ConfirmDialog } = useConfirm();
    const [isCancelling, setIsCancelling] = useState<string | null>(null);
    const [isConfirming, setIsConfirming] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

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
            title: "Cancel Appointment",
            description: "Are you sure you want to cancel this appointment? This action cannot be undone.",
            confirmText: "Yes, Cancel Appointment",
            cancelText: "No, Keep It",
            variant: "destructive",
        });

        if (!confirmed) return;

        setIsCancelling(id);
        try {
            const response = await fetch(`/api/appointments/${id}/cancel`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: "Cancelled by administrator" }),
            });

            const data = await response.json();
            if (data.success) {
                toast.success("Appointment cancelled successfully");
                router.refresh();
                setDetailsOpen(false);
            } else {
                toast.error(data.message || "Failed to cancel appointment");
            }
        } catch (error) {
            toast.error("An error occurred while cancelling the appointment");
        } finally {
            setIsCancelling(null);
        }
    };

    const handleConfirm = async (id: string) => {
        setIsConfirming(id);
        try {
            const response = await fetch(`/api/appointments/${id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "CONFIRMED" }),
            });

            const data = await response.json();
            if (data.success) {
                toast.success("Appointment confirmed successfully");
                router.refresh();
                setDetailsOpen(false);
            } else {
                toast.error(data.message || "Failed to confirm appointment");
            }
        } catch (error) {
            toast.error("An error occurred while confirming the appointment");
        } finally {
            setIsConfirming(null);
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: "Delete Appointment",
            description: "Are you sure you want to PERMANENTLY delete this appointment? This action cannot be undone.",
            confirmText: "Yes, Delete Permanently",
            cancelText: "Cancel",
            variant: "destructive",
        });

        if (!confirmed) return;

        setIsDeleting(id);
        try {
            const response = await fetch(`/api/appointments/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });

            const data = await response.json();
            if (data.success) {
                toast.success("Appointment deleted successfully");
                router.refresh();
                setDetailsOpen(false);
            } else {
                toast.error(data.message || "Failed to delete appointment");
            }
        } catch (error) {
            toast.error("An error occurred while deleting the appointment");
        } finally {
            setIsDeleting(null);
        }
    };

    const getStatusBadge = (status: Appointment['status']) => {
        switch (status) {
            case 'PENDING':
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
            case 'CONFIRMED':
                return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">Confirmed</Badge>;
            case 'IN_PROGRESS':
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>;
            case 'COMPLETED':
                return <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">Completed</Badge>;
            case 'CANCELLED':
                return <Badge variant="destructive">Cancelled</Badge>;
            case 'NO_SHOW':
                return <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">No Show</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const StatCard = ({ icon: Icon, title, value, color, description }: { icon: any, title: string, value: number, color: string, description: string }) => (
        <Card className="overflow-hidden">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <h3 className="text-2xl font-bold mt-1">{value}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{description}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${color}`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">Appointments Management</h1>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={CalendarDays}
                    title="Total Appointments"
                    value={stats.totalAppointments}
                    color="bg-blue-500"
                    description="Across all statuses"
                />
                <StatCard
                    icon={Clock}
                    title="Pending"
                    value={stats.pendingAppointments}
                    color="bg-yellow-500"
                    description="Awaiting confirmation"
                />
                <StatCard
                    icon={CalendarCheck}
                    title="Confirmed"
                    value={stats.confirmedAppointments}
                    color="bg-green-500"
                    description="Upcoming bookings"
                />
                <StatCard
                    icon={CalendarX}
                    title="Cancelled/No-Show"
                    value={(stats.statusCounts['CANCELLED'] || 0) + (stats.statusCounts['NO_SHOW'] || 0)}
                    color="bg-red-500"
                    description="Non-completed visits"
                />
            </div>

            {/* Filters and Search */}
            <Card className="border-none shadow-sm bg-muted/30">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Input
                            placeholder="Search by client name or ID..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="bg-background border-muted-foreground/20"
                        />
                    </div>
                    <div className="w-full md:w-[200px]">
                        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                            <SelectTrigger className="bg-background border-muted-foreground/20 text-foreground">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border-muted">
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                <SelectItem value="NO_SHOW">No Show</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {isSuperAdmin && (
                        <div className="w-full md:w-[200px]">
                            <Select value={tenantFilter} onValueChange={handleTenantFilterChange}>
                                <SelectTrigger className="bg-background border-muted-foreground/20 text-foreground">
                                    <SelectValue placeholder="All Tenants" />
                                </SelectTrigger>
                                <SelectContent className="bg-background border-muted">
                                    <SelectItem value="all">All Tenants</SelectItem>
                                    {/* These should ideally be fetched from an API, but for now we list placeholders or just allow 'all' */}
                                    {/* For a complete implementation, we'd fetch the list of tenants */}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Mobile View (Cards) */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {appointments.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            No appointments found
                        </CardContent>
                    </Card>
                ) : (
                    appointments.map((appointment) => (
                        <Card key={appointment.id} className="overflow-hidden">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-base font-bold flex items-center gap-2">
                                            {appointment.user?.name || "Guest Client"}
                                        </CardTitle>
                                        <CardDescription className="text-xs mt-1">
                                            {format(new Date(appointment.startTime), "MMM dd, yyyy")} • {format(new Date(appointment.startTime), "HH:mm")}
                                        </CardDescription>
                                    </div>
                                    {getStatusBadge(appointment.status)}
                                </div>
                            </CardHeader>
                            <CardContent className="pb-2 space-y-2 text-sm">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground flex items-center gap-1"><Scissors className="w-3 h-3" /> Service</span>
                                    <span className="font-medium">{appointment.service?.name}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> Staff</span>
                                    <span className="font-medium">{appointment.staff?.name}</span>
                                </div>
                            </CardContent>
                            <div className="p-4 pt-0 grid grid-cols-2 gap-2 mt-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                        setSelectedAppointment(appointment);
                                        setDetailsOpen(true);
                                    }}
                                >
                                    <Eye className="h-4 w-4 mr-2" /> Details
                                </Button>
                                {appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' ? (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full text-red-500 border-red-200 hover:bg-red-50"
                                        disabled={isCancelling === appointment.id}
                                        onClick={() => handleCancel(appointment.id)}
                                    >
                                        {isCancelling === appointment.id ? <Spinner size="sm" /> : <><XCircle className="h-4 w-4 mr-2" /> Cancel</>}
                                    </Button>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full text-red-600 border-red-200 hover:bg-red-100"
                                        disabled={isDeleting === appointment.id}
                                        onClick={() => handleDelete(appointment.id)}
                                    >
                                        {isDeleting === appointment.id ? <Spinner size="sm" /> : <><Trash2 className="h-4 w-4 mr-2" /> Delete</>}
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Desktop View (Table) */}
            <Card className="border-none shadow-sm overflow-hidden hidden md:block">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[180px]">Date & Time</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Service</TableHead>
                                <TableHead>Staff</TableHead>
                                {isSuperAdmin && <TableHead>Tenant</TableHead>}
                                <TableHead>Price</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {appointments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                        No appointments found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                appointments.map((appointment) => (
                                    <TableRow key={appointment.id} className="group hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-medium whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span>{format(new Date(appointment.startTime), "MMM dd, yyyy")}</span>
                                                <span className="text-xs text-muted-foreground">{format(new Date(appointment.startTime), "HH:mm")} - {format(new Date(appointment.endTime), "HH:mm")}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <User className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{appointment.user?.name || "Guest"}</span>
                                                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">{appointment.user?.email || "No email"}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Scissors className="w-4 h-4 text-muted-foreground" />
                                                <span>{appointment.service?.name || "Service"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium">{appointment.staff?.name || "Assigned"}</span>
                                        </TableCell>
                                        {isSuperAdmin && (
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono text-[10px]">
                                                    {appointment.tenantId}
                                                </Badge>
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">${appointment.total > 0 ? appointment.total : appointment.service?.price}</span>
                                                {appointment.discountAmount > 0 && (
                                                    <span className="text-xs text-green-600 flex items-center gap-1">
                                                        <Tag className="w-3 h-3" />
                                                        -${appointment.discountAmount}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(appointment.status)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => {
                                                        setSelectedAppointment(appointment);
                                                        setDetailsOpen(true);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' ? (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                        disabled={isCancelling === appointment.id}
                                                        onClick={() => handleCancel(appointment.id)}
                                                    >
                                                        {isCancelling === appointment.id ? (
                                                            <Spinner size="sm" className="text-red-500" />
                                                        ) : (
                                                            <XCircle className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                                                        disabled={isDeleting === appointment.id}
                                                        onClick={() => handleDelete(appointment.id)}
                                                    >
                                                        {isDeleting === appointment.id ? (
                                                            <Spinner size="sm" className="text-red-600" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
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

            {/* Pagination (Shared) */}
            {pagination.totalItems > 0 && (
                <Card className="border-none shadow-sm">
                    <div className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/20 rounded-lg">
                        <p className="text-sm text-muted-foreground order-2 sm:order-1">
                            Showing <span className="font-medium text-foreground">{((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}</span> to <span className="font-medium text-foreground">{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}</span> of <span className="font-medium text-foreground">{pagination.totalItems}</span> appointments
                        </p>
                        <div className="flex gap-2 order-1 sm:order-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 1}
                                className="bg-background"
                            >
                                Previous
                            </Button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                                    // Simple pagination logic, ideally should handle ellipsis
                                    const pageNum = i + 1;
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={pagination.currentPage === pageNum ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handlePageChange(pageNum)}
                                            className={pagination.currentPage === pageNum ? "" : "bg-background"}
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage === pagination.totalPages || pagination.totalPages === 0}
                                className="bg-background"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </Card>
            )
            }

            {/* Appointment Details Dialog */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-lg bg-background border-muted">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-500" />
                            Appointment Details
                        </DialogTitle>
                    </DialogHeader>
                    {selectedAppointment && (
                        <div className="space-y-6 pt-4">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</p>
                                    <div>{getStatusBadge(selectedAppointment.status)}</div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created At</p>
                                    <p className="font-medium">{format(new Date(selectedAppointment.createdAt), "MMM dd, yyyy HH:mm")}</p>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client Information</p>
                                    <div className="p-3 border rounded-lg bg-muted/30">
                                        <p className="font-bold flex items-center gap-2">
                                            <User className="w-4 h-4 text-muted-foreground" />
                                            {selectedAppointment.user?.name || "Guest Client"}
                                        </p>
                                        <p className="text-sm text-muted-foreground ml-6">{selectedAppointment.user?.email || "No email provided"}</p>
                                        <p className="text-xs text-muted-foreground ml-6 mt-1 italic">ID: {selectedAppointment.userId}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Service</p>
                                    <p className="font-medium flex items-center gap-2">
                                        <Scissors className="w-4 h-4 text-muted-foreground" />
                                        {selectedAppointment.service?.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{selectedAppointment.service?.duration} minutes - ${selectedAppointment.service?.price}</p>
                                    {selectedAppointment.discountAmount > 0 && (
                                        <div className="mt-2 p-2 bg-green-50 rounded border border-green-100 dark:bg-green-900/20 dark:border-green-800">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground">Subtotal:</span>
                                                <span>${selectedAppointment.subtotal > 0 ? selectedAppointment.subtotal : selectedAppointment.service?.price}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm text-green-600 dark:text-green-400 font-medium">
                                                <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Discount {selectedAppointment.coupon ? `(${selectedAppointment.coupon.code})` : ''}:</span>
                                                <span>-${selectedAppointment.discountAmount}</span>
                                            </div>
                                            <div className="border-t border-green-200 dark:border-green-800 my-1"></div>
                                            <div className="flex justify-between items-center font-bold">
                                                <span>Total:</span>
                                                <span>${selectedAppointment.total}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Staff Member</p>
                                    <p className="font-medium">{selectedAppointment.staff?.name}</p>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Schedule</p>
                                    <div className="p-3 border rounded-lg bg-blue-50/10 border-blue-500/20">
                                        <p className="font-bold text-blue-600 dark:text-blue-400">
                                            {format(new Date(selectedAppointment.startTime), "EEEE, MMMM dd, yyyy")}
                                        </p>
                                        <p className="text-lg font-mono">
                                            {format(new Date(selectedAppointment.startTime), "HH:mm")} - {format(new Date(selectedAppointment.endTime), "HH:mm")}
                                        </p>
                                    </div>
                                </div>
                                {selectedAppointment.notes && (
                                    <div className="col-span-2 space-y-1">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</p>
                                        <p className="text-sm p-3 bg-muted/50 rounded-lg italic">"{selectedAppointment.notes}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter className="mt-8">
                        <Button variant="outline" onClick={() => setDetailsOpen(false)} className="bg-background border-muted hover:bg-muted">Close</Button>
                        {selectedAppointment?.status === 'PENDING' && (
                            <Button
                                className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                                onClick={() => handleConfirm(selectedAppointment.id)}
                                disabled={isConfirming === selectedAppointment.id}
                            >
                                {isConfirming === selectedAppointment.id ? (
                                    <><Spinner className="mr-2" /> Confirming...</>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Confirm Appointment
                                    </>
                                )}
                            </Button>
                        )}

                        <Button
                            variant="destructive"
                            onClick={() => selectedAppointment && handleDelete(selectedAppointment.id)}
                            disabled={isDeleting === selectedAppointment?.id}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting === selectedAppointment?.id ? <Spinner className="mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <ConfirmDialog />
        </div>
    );
}
