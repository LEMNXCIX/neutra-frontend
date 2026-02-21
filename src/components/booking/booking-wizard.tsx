'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Service, Staff, CreateAppointmentData, bookingService } from '@/services/booking.service';
import { couponsService } from '@/services/coupons.service';
import { CouponValidationResult } from '@/types/coupon.types';
import { useAuthStore } from '@/store/auth-store';
import { useFeatures } from '@/hooks/useFeatures';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, Clock, User, ChevronLeft, Check, AlertCircle, Info, Tag, Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';

interface BookingWizardProps {
    initialServices: Service[];
    initialStaff: Staff[];
    preSelectedServiceId?: string | null;
}

export function BookingWizard({ initialServices, initialStaff, preSelectedServiceId }: BookingWizardProps) {
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const { isFeatureEnabled } = useFeatures();

    // Step state
    const [step, setStep] = useState(1);
    const [selectedService, setSelectedService] = useState<Service | null>(
        initialServices.find(s => s.id === preSelectedServiceId) || null
    );
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [notes, setNotes] = useState('');
    
    // UI State
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loadingAvailability, setLoadingAvailability] = useState(false);

    // Coupon state
    const [couponCode, setCouponCode] = useState('');
    const [couponResult, setCouponResult] = useState<CouponValidationResult | null>(null);
    const [validatingCoupon, setValidatingCoupon] = useState(false);
    const [couponError, setCouponError] = useState<string | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Auto-advance to step 2 if service is pre-selected
    useEffect(() => {
        if (preSelectedServiceId && selectedService && step === 1) {
            setStep(2);
        }
    }, [preSelectedServiceId, selectedService]);

    // Check availability when date or staff changes
    useEffect(() => {
        if (selectedDate && selectedStaff && selectedService && step === 3) {
            checkAvailability();
        } else {
            setAvailableSlots([]);
        }
    }, [selectedDate, selectedStaff, selectedService, step]);

    const checkAvailability = async () => {
        if (!selectedStaff || !selectedDate || !selectedService) return;
        try {
            setLoadingAvailability(true);
            const slots = await bookingService.checkAvailability(
                selectedStaff.id,
                selectedService.id,
                selectedDate
            );
            setAvailableSlots(slots);
        } catch (err) {
            console.error('Failed to check availability', err);
        } finally {
            setLoadingAvailability(false);
        }
    };

    const validateCoupon = async () => {
        if (!couponCode.trim() || !selectedService) return;
        try {
            setValidatingCoupon(true);
            setCouponError(null);
            const result = await couponsService.validate(
                couponCode,
                selectedService.price,
                undefined,
                undefined,
                [selectedService.id]
            );
            if (result.valid) {
                setCouponResult(result);
            } else {
                setCouponError(result.message || 'Invalid coupon code');
                setCouponResult(null);
            }
        } catch (err: any) {
            setCouponError(err.message || 'Failed to validate coupon');
        } finally {
            setValidatingCoupon(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedService || !selectedStaff || !selectedDate || !selectedTime) {
            setError('Please complete all required fields');
            return;
        }
        if (!user) {
            router.push(`/login?redirect=/book`);
            return;
        }

        try {
            setSubmitting(true);
            setError(null);
            const startTime = new Date(`${selectedDate}T${selectedTime}`);
            const appointmentData: CreateAppointmentData = {
                userId: user.id,
                serviceId: selectedService.id,
                staffId: selectedStaff.id,
                startTime: startTime.toISOString(),
                notes,
                couponCode: couponResult?.valid ? couponResult.coupon?.code : undefined
            };
            await bookingService.createAppointment(appointmentData);
            router.push('/appointments?success=true');
        } catch (err: any) {
            setError(err.message || 'Failed to create appointment');
        } finally {
            setSubmitting(false);
        }
    };

    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 9; hour <= 17; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                if (hour === 17 && minute > 0) break;
                slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
            }
        }
        return slots;
    };

    const steps = [
        { number: 1, label: 'SERVICE', icon: <Scissors className="h-5 w-5" /> },
        { number: 2, label: 'EXPERT', icon: <User className="h-5 w-5" /> },
        { number: 3, label: 'SCHEDULE', icon: <Clock className="h-5 w-5" /> },
        { number: 4, label: 'REVIEW', icon: <Check className="h-5 w-5" /> },
    ];

    if (!isMounted) return null;

    return (
        <div className="space-y-10 animate-slide-up">
            {/* Progress Steps - Brutalist / Precision System */}
            <div className="relative mb-12">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 z-0" />
                <div className="relative z-10 flex justify-between">
                    {steps.map((s, index) => {
                        const isCurrent = step === s.number;
                        const isDone = step > s.number;
                        
                        return (
                            <div key={s.number} className="flex flex-col items-center">
                                <div 
                                    className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 border-2",
                                        isCurrent ? "bg-primary text-primary-foreground border-primary shadow-lg scale-110" : 
                                        isDone ? "bg-emerald-500 text-white border-emerald-500 shadow-none" : 
                                        "bg-background text-muted-foreground border-border shadow-none"
                                    )}
                                >
                                    {isDone ? <Check className="h-5 w-5 stroke-[2.5px]" /> : s.icon}
                                </div>
                                <span className={cn(
                                    "mt-3 text-[10px] font-bold uppercase tracking-wider transition-colors duration-300",
                                    isCurrent ? "text-primary" : "text-muted-foreground"
                                )}>
                                    {s.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {error && (
                <Alert variant="destructive" className="border-none bg-rose-50 text-rose-700 rounded-xl animate-in shake-1">
                    <AlertCircle className="h-5 w-5" />
                    <AlertDescription className="font-semibold text-sm">{error}</AlertDescription>
                </Alert>
            )}

            {/* Step 1: Select Service */}
            {step === 1 && (
                <div className="space-y-8">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Select Service</h2>
                        <p className="text-muted-foreground font-medium text-sm">Choose the session that best fits your needs</p>
                    </div>
                    {initialServices.length === 0 ? (
                        <EmptyState 
                            icon={Info}
                            title="Registry empty"
                            description="No services are currently available for booking."
                        />
                    ) : (
                        Object.entries(initialServices.reduce((acc, s) => {
                            const cat = s.category?.name || 'Uncategorized';
                            if (!acc[cat]) acc[cat] = [];
                            acc[cat].push(s);
                            return acc;
                        }, {} as Record<string, Service[]>)).map(([cat, svcs]) => (
                            <div key={cat} className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{cat}</h3>
                                    <div className="h-px flex-1 bg-border/50" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {svcs.map(s => (
                                        <Card 
                                            key={s.id} 
                                            className={cn(
                                                "cursor-pointer group transition-all duration-300 t-card",
                                                selectedService?.id === s.id ? "ring-2 ring-primary border-primary bg-primary/5" : "border-border/50 hover:border-primary/20"
                                            )}
                                            onClick={() => { setSelectedService(s); setStep(2); }}
                                        >
                                            <CardHeader className="p-6">
                                                <div className="flex justify-between items-start mb-4">
                                                    <Badge className={cn(
                                                        "font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow-sm",
                                                        selectedService?.id === s.id ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                                                    )}>
                                                        ${s.price}
                                                    </Badge>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider opacity-60">
                                                        <Clock className="h-3 w-3" /> {s.duration} MIN
                                                    </div>
                                                </div>
                                                <CardTitle className="text-xl font-bold tracking-tight text-foreground">{s.name}</CardTitle>
                                                {s.description && <CardDescription className={cn(
                                                    "line-clamp-2 mt-2 font-medium text-sm leading-relaxed",
                                                    selectedService?.id === s.id ? "text-foreground/70" : "text-muted-foreground"
                                                )}>{s.description}</CardDescription>}
                                            </CardHeader>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Step 2: Select Staff */}
            {step === 2 && (
                <div className="space-y-8">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Expert Match</h2>
                        <p className="text-muted-foreground font-medium text-sm">Select your assigned professional</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {initialStaff.filter(m => !m.serviceIds || !selectedService || m.serviceIds.includes(selectedService.id)).map(member => (
                            <Card 
                                key={member.id} 
                                className={cn(
                                    "cursor-pointer group transition-all duration-300 t-card overflow-hidden",
                                    selectedStaff?.id === member.id ? "ring-2 ring-primary border-primary bg-primary/5" : "border-border/50 hover:border-primary/20"
                                )}
                                onClick={() => { setSelectedStaff(member); setStep(3); }}
                            >
                                <CardHeader className="p-6">
                                    <div className="flex items-center gap-5">
                                        <div className={cn(
                                            "w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-500",
                                            selectedStaff?.id === member.id ? "bg-primary text-primary-foreground" : "bg-muted"
                                        )}>
                                            <User className="h-7 w-7" />
                                        </div>
                                        <div className="space-y-1">
                                            <CardTitle className="text-xl font-bold tracking-tight text-foreground">{member.name}</CardTitle>
                                            {member.bio && <CardDescription className={cn(
                                                "line-clamp-1 font-semibold text-[10px] uppercase tracking-wider",
                                                selectedStaff?.id === member.id ? "text-primary" : "text-muted-foreground"
                                            )}>{member.bio}</CardDescription>}
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                    <div className="pt-4">
                        <Button variant="ghost" onClick={() => setStep(1)} className="font-semibold text-xs h-10 px-4">
                            <ChevronLeft className="h-4 w-4 mr-2" /> Change Service
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 3: Date & Time */}
            {step === 3 && (
                <div className="space-y-8">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Schedule</h2>
                        <p className="text-muted-foreground font-medium text-sm">Pick your preferred temporal window</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="t-card border-none shadow-xl overflow-hidden">
                            <CardHeader className="bg-muted/30 border-b border-border/50">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Calendar Target</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 pb-8">
                                <Input 
                                    type="date" 
                                    value={selectedDate} 
                                    onChange={e => setSelectedDate(e.target.value)} 
                                    min={new Date().toISOString().split('T')[0]} 
                                    className="h-12 border-border focus:border-primary transition-all rounded-xl font-medium"
                                />
                            </CardContent>
                        </Card>
                        
                        {selectedDate && (
                            <Card className="t-card border-none shadow-xl overflow-hidden animate-in fade-in slide-in-from-right-4">
                                <CardHeader className="bg-muted/30 border-b border-border/50">
                                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        {loadingAvailability ? "Searching Registry..." : "Available Windows"}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 pb-8">
                                    {loadingAvailability ? (
                                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Querying availability...</p>
                                        </div>
                                    ) : availableSlots.length === 0 ? (
                                        <div className="text-center py-10 space-y-2">
                                            <AlertCircle className="h-8 w-8 mx-auto text-rose-500 opacity-50" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">No windows available for this date</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                            {generateTimeSlots().map(time => {
                                                const isAvail = availableSlots.includes(time);
                                                if (!isAvail) return null;
                                                return (
                                                    <Button 
                                                        key={time} 
                                                        variant={selectedTime === time ? 'default' : 'outline'}
                                                        onClick={() => setSelectedTime(time)}
                                                        className={cn(
                                                            "h-10 rounded-lg text-xs font-semibold transition-all",
                                                            selectedTime === time ? "shadow-md scale-105" : "border-border/50 hover:border-primary/30"
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
                        <Button variant="ghost" onClick={() => setStep(2)} className="font-semibold text-xs h-10">
                            <ChevronLeft className="h-4 w-4 mr-2" /> Back to Expert
                        </Button>
                        {selectedDate && selectedTime && (
                            <Button onClick={() => setStep(4)} className="rounded-xl font-bold h-12 px-8 shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all">
                                Review Details <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Step 4: Confirm */}
            {step === 4 && (
                <div className="space-y-8">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Review Details</h2>
                        <p className="text-muted-foreground font-medium text-sm">Validate your reservation details</p>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="t-card border-none shadow-xl overflow-hidden">
                                <CardHeader className="bg-muted/30 border-b border-border/50 p-6">
                                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reservation Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Service</p>
                                            <p className="text-lg font-bold text-foreground">{selectedService?.name}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Expert</p>
                                            <p className="text-lg font-bold text-foreground">{selectedStaff?.name}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Date</p>
                                            <p className="text-lg font-bold text-foreground">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Time</p>
                                            <p className="text-lg font-bold text-foreground">{selectedTime}</p>
                                        </div>
                                    </div>
                                    
                                    <Separator className="bg-border/50" />
                                    
                                    <div className="space-y-3">
                                        <Label className="text-xs font-semibold ml-1">Additional Notes</Label>
                                        <Textarea 
                                            value={notes} 
                                            onChange={e => setNotes(e.target.value)} 
                                            rows={4} 
                                            placeholder="Tell us anything we should know..." 
                                            className="rounded-xl border-border focus:border-primary transition-all bg-muted/10 font-medium"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-1 space-y-6">
                            {isFeatureEnabled('COUPONS') && (
                                <Card className="t-card border-none shadow-lg p-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest">
                                            <Tag size={12} /> Discount Code
                                        </div>
                                        <div className="flex gap-2">
                                            <Input 
                                                placeholder="CODE" 
                                                value={couponCode} 
                                                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                                                className="h-11 rounded-xl font-bold uppercase text-xs"
                                                disabled={!!couponResult}
                                            />
                                            <Button 
                                                variant="outline" 
                                                onClick={validateCoupon} 
                                                disabled={!couponCode || validatingCoupon}
                                                className="h-11 px-4 rounded-xl font-bold text-xs"
                                            >
                                                {validatingCoupon ? <Loader2 className="animate-spin h-4 w-4" /> : couponResult ? "Active" : "Apply"}
                                            </Button>
                                        </div>
                                        {couponError && <p className="text-[10px] font-semibold text-rose-500">{couponError}</p>}
                                    </div>
                                </Card>
                            )}

                            <Card className="t-card border-none bg-primary text-primary-foreground shadow-2xl overflow-hidden p-8 space-y-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-70">
                                        <span>Standard Rate</span>
                                        <span>${selectedService?.price}</span>
                                    </div>
                                    {couponResult?.discountAmount && (
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-emerald-200">
                                            <span>Coupon Applied</span>
                                            <span>-${couponResult.discountAmount}</span>
                                        </div>
                                    )}
                                    <div className="h-px bg-white/10" />
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Total Fee</span>
                                        <span className="text-5xl font-bold tracking-tighter">${Math.max(0, (selectedService?.price || 0) - (couponResult?.discountAmount || 0))}</span>
                                    </div>
                                </div>
                                
                                <Button 
                                    className="w-full h-14 bg-white text-primary hover:bg-white/90 rounded-xl font-bold shadow-lg transition-all hover:-translate-y-0.5 active:scale-95" 
                                    onClick={handleSubmit} 
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="animate-spin mr-2 h-5 w-5" />
                                            Booking...
                                        </>
                                    ) : (
                                        "Confirm Reservation"
                                    )}
                                </Button>
                            </Card>
                            
                            <div className="text-center">
                                <button 
                                    onClick={() => setStep(3)} 
                                    disabled={submitting} 
                                    className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                                >
                                    ← Modify Schedule
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
