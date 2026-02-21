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
        <div className="space-y-16">
            {Object.entries(groupedServices).map(([categoryName, categoryServices], categoryIndex) => (
                <div 
                    key={categoryName} 
                    className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
                    style={{ animationDelay: `${categoryIndex * 100}ms` }}
                >
                    <div className="flex items-center gap-4 border-b pb-4">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">
                            {categoryName}
                        </h2>
                        <Badge variant="secondary" className="h-6 px-2 text-xs font-medium rounded-full">
                            {categoryServices.length}
                        </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {categoryServices.map((service, index) => (
                            <Card
                                key={service.id}
                                className="group flex flex-col border-none shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card overflow-hidden ring-1 ring-border/50"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary transition-all duration-300" />
                                
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <Badge variant="outline" className="bg-background/50 backdrop-blur-sm">
                                            {service.duration} min
                                        </Badge>
                                        {!service.active && (
                                            <Badge variant="destructive">Unavailable</Badge>
                                        )}
                                    </div>
                                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                                        {service.name}
                                    </CardTitle>
                                    {service.description && (
                                        <CardDescription className="line-clamp-2 mt-2 text-sm leading-relaxed">
                                            {service.description}
                                        </CardDescription>
                                    )}
                                </CardHeader>
                                
                                <CardContent className="flex-1">
                                    <div className="flex items-end gap-1 mt-auto pt-4">
                                        <span className="text-3xl font-bold text-foreground">${service.price}</span>
                                        <span className="text-sm text-muted-foreground mb-1">/ session</span>
                                    </div>
                                </CardContent>
                                
                                <CardFooter className="pt-0">
                                    <Button
                                        onClick={() => handleBookService(service.id)}
                                        className="w-full h-12 text-base font-medium shadow-sm group-hover:shadow-md transition-all"
                                        size="lg"
                                        disabled={!service.active}
                                    >
                                        Book Appointment
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
