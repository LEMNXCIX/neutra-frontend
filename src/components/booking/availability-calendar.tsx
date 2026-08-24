"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { normalizeWorkingHours, type WorkingHours } from "@/components/admin/booking/working-hours-editor";

const WEEKDAYS = ["D", "L", "M", "M", "J", "V", "S"];
const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const toISODate = (d: Date) =>
    `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;

/** Weekdays (0=Sun..6=Sat) the staff member works, from their workingHours. */
export function workingWeekdays(workingHours: unknown): Set<number> {
    const normalized: WorkingHours = normalizeWorkingHours(workingHours);
    const days = new Set<number>();
    const keys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    keys.forEach((key, index) => {
        if (normalized[key]?.length) days.add(index);
    });
    return days;
}

export function AvailabilityCalendar({
    value,
    onChange,
    workingDays,
    minDate,
}: {
    value: string;
    onChange: (date: string) => void;
    workingDays: Set<number>;
    minDate: string;
}) {
    const today = new Date();
    const [view, setView] = useState(() => {
        const [y, m] = (value || toISODate(today)).split("-").map(Number);
        return { year: y, month: m - 1 };
    });

    const shiftMonth = (delta: number) => {
        setView((v) => {
            const next = new Date(v.year, v.month + delta, 1);
            return { year: next.getFullYear(), month: next.getMonth() };
        });
    };

    const firstDay = new Date(view.year, view.month, 1).getDay();
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();

    const cells: Array<{ date: Date; iso: string } | null> = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(view.year, view.month, d);
        cells.push({ date, iso: toISODate(date) });
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => shiftMonth(-1)}
                >
                    <ChevronLeft className="size-4" />
                </Button>
                <span className="text-sm font-bold tracking-tight">
                    {MONTHS[view.month]} {view.year}
                </span>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => shiftMonth(1)}
                >
                    <ChevronRight className="size-4" />
                </Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
                {WEEKDAYS.map((d, i) => (
                    <span
                        key={i}
                        className="text-[10px] font-bold uppercase text-muted-foreground py-1"
                    >
                        {d}
                    </span>
                ))}
                {cells.map((cell, i) => {
                    if (!cell) return <span key={`empty-${i}`} />;
                    const iso = cell.iso;
                    const isPast = iso < minDate;
                    const isWorking = workingDays.size === 0 || workingDays.has(cell.date.getDay());
                    const disabled = isPast || !isWorking;
                    const selected = value === iso;
                    return (
                        <button
                            key={iso}
                            type="button"
                            disabled={disabled}
                            onClick={() => onChange(iso)}
                            className={cn(
                                "h-9 rounded-lg text-xs font-semibold transition-all",
                                selected
                                    ? "bg-primary text-primary-foreground shadow-md scale-105"
                                    : disabled
                                      ? "text-muted-foreground/30 cursor-not-allowed"
                                      : "hover:bg-muted hover:scale-105",
                            )}
                        >
                            {cell.date.getDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
