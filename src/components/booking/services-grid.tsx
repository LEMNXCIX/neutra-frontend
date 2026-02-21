'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Service } from '@/services/booking.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, DollarSign, CalendarSearch } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface ServicesGridProps {
    services: Service[];
}

export function ServicesGrid({ services }: ServicesGridProps) {
    const router = useRouter();

    const handleBookService = (serviceId: string) => {
        router.push(`/book?serviceId=${serviceId}`);
    };

    if (!services || services.length === 0) {
        return (
            <EmptyState 
                icon={CalendarSearch}
                title="No services found"
                description="We couldn't find any services available at the moment. Please check back later."
            />
        );
    }

    // Group services by category
    const groupedServices = services.reduce((acc, service) => {
        const categoryName = service.category?.name || 'Uncategorized';
        if (!acc[categoryName]) acc[categoryName] = [];
        acc[categoryName].push(service);
        return acc;
    }, {} as Record<string, Service[]>);

    return (
        <div className="space-y-24">
            {Object.entries(groupedServices).map(([categoryName, categoryServices], categoryIndex) => (
                <div 
                    key={categoryName} 
                    className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
                    style={{ animationDelay: `${categoryIndex * 100}ms` }}
                >
                    <div className="flex items-center gap-6">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                            {categoryName} Catalog
                        </h2>
                        <div className="h-px flex-1 bg-border/50" />
                        <Badge variant="secondary" className="h-8 w-8 flex items-center justify-center font-bold rounded-full">
                            {categoryServices.length}
                        </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {categoryServices.map((service, index) => (
                            <Card
                                key={service.id}
                                className="group relative flex flex-col t-card border-none shadow-xl hover:-translate-y-1 overflow-hidden"
                            >
                                <div className="h-1.5 bg-primary w-full" />
                                
                                <CardHeader className="p-8 space-y-6">
                                    <div className="flex items-start justify-between">
                                        <Badge variant="secondary" className="font-bold uppercase tracking-wider text-[9px] px-3 py-1 rounded-full">
                                            {service.duration} MIN SESSION
                                        </Badge>
                                        {!service.active && (
                                            <Badge variant="destructive" className="font-bold uppercase tracking-wider text-[9px] rounded-full">INACTIVE</Badge>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <CardTitle className="text-2xl font-bold tracking-tight group-hover:text-primary transition-colors leading-tight">
                                            {service.name}
                                        </CardTitle>
                                        {service.description && (
                                            <CardDescription className="line-clamp-2 text-sm leading-relaxed font-medium text-muted-foreground italic border-l-2 border-primary/30 pl-4">
                                                {service.description}
                                            </CardDescription>
                                        )}
                                    </div>
                                </CardHeader>
                                
                                <CardContent className="flex-1 flex items-end px-8 pt-4 pb-8">
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Rate</p>
                                        <span className="text-4xl font-bold tracking-tighter text-foreground">${service.price}</span>
                                    </div>
                                </CardContent>
                                
                                <CardFooter className="p-8 pt-0">
                                    <Button
                                        onClick={() => handleBookService(service.id)}
                                        className="w-full h-12 rounded-xl font-bold text-sm shadow-lg shadow-primary/10 transition-all hover:opacity-90 active:scale-95"
                                        size="lg"
                                        disabled={!service.active}
                                    >
                                        Book Now
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
