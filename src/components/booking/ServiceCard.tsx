"use client";

import { Service } from "@/services/booking.service";

interface ServiceCardProps {
    service: Service;
    onBook?: (service: Service) => void;
}

export default function ServiceCard({ service, onBook }: ServiceCardProps) {
    return (
        <div className="bg-background border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">
                        {service.name}
                    </h3>
                    {service.category && (
                        <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            {service.category.name}
                        </span>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">
                        ${service.price}
                    </p>
                </div>
            </div>

            {service.description && (
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {service.description}
                </p>
            )}

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
                <div className="flex items-center text-sm text-muted-foreground">
                    <svg
                        className="size-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    {service.duration} min
                </div>

                <button
                    type="button"
                    onClick={() => onBook?.(service)}
                    className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
                >
                    Book Now
                </button>
            </div>
        </div>
    );
}
