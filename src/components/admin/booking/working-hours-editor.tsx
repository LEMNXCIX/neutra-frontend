"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, X } from "lucide-react";

import {
    WORKING_DAYS,
    type TimeRange,
    type WorkingHours,
} from "@/components/admin/booking/working-hours-utils";


export function WorkingHoursEditor({
    value,
    onChange,
}: {
    value: WorkingHours;
    onChange: (value: WorkingHours) => void;
}) {
    const setDay = (day: string, ranges: TimeRange[] | null) =>
        onChange({ ...value, [day]: ranges });

    return (
        <div className="min-w-0 space-y-2">
            {WORKING_DAYS.map(({ key, label }) => {
                const ranges = value[key] || null;
                const works = !!ranges?.length;
                return (
                    <div
                        key={key}
                        className="grid min-w-0 grid-cols-1 gap-3 rounded-xl border border-border/50 bg-muted/20 p-3 sm:grid-cols-[4rem_minmax(0,1fr)] sm:items-start"
                    >
                        <div className="flex items-center gap-2 sm:w-16 sm:shrink-0 sm:pt-1">
                            <Switch
                                checked={works}
                                onCheckedChange={(checked) =>
                                    setDay(
                                        key,
                                        checked
                                            ? [{ start: "09:00", end: "17:00" }]
                                            : null,
                                    )
                                }
                            />
                            <span className="text-xs font-bold uppercase tracking-wide">
                                {label}
                            </span>
                        </div>
                        {works && ranges && (
                            <div className="min-w-0 space-y-2">
                                {ranges.map((range, i) => (
                                    <div
                                        key={`${range.start}-${range.end}`}
                                        className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-2 sm:max-w-[270px]"
                                    >
                                        <Input
                                            type="time"
                                            value={range.start}
                                            onChange={(e) => {
                                                const next = [...ranges];
                                                next[i] = {
                                                    ...range,
                                                    start: e.target.value,
                                                };
                                                setDay(key, next);
                                            }}
                                            className="h-8 w-full min-w-0 px-2 text-sm"
                                        />
                                        <span className="text-xs text-muted-foreground">
                                            a
                                        </span>
                                        <Input
                                            type="time"
                                            value={range.end}
                                            onChange={(e) => {
                                                const next = [...ranges];
                                                next[i] = {
                                                    ...range,
                                                    end: e.target.value,
                                                };
                                                setDay(key, next);
                                            }}
                                            className="h-8 w-full min-w-0 px-2 text-sm"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon" aria-label="Eliminar rango horario"
                                            className="size-8 shrink-0 sm:size-7"
                                            onClick={() => {
                                                const next = ranges.filter(
                                                    (_, j) => j !== i,
                                                );
                                                setDay(
                                                    key,
                                                    next.length ? next : null,
                                                );
                                            }}
                                        >
                                            <X className="size-3.5" />
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-full text-xs sm:h-7 sm:w-auto"
                                    onClick={() =>
                                        setDay(key, [
                                            ...ranges,
                                            { start: "09:00", end: "17:00" },
                                        ])
                                    }
                                >
                                    <Plus className="size-3 mr-1" /> Rango
                                </Button>
                            </div>
                        )}
                        {!works && (
                            <span className="text-xs text-muted-foreground pt-1.5">
                                No trabaja
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export function HolidaysEditor({
    value,
    onChange,
}: {
    value: string[];
    onChange: (value: string[]) => void;
}) {
    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                {value.map((date) => (
                    <span
                        key={date}
                        className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-muted border border-border text-xs font-semibold"
                    >
                        {date}
                        <button
                            type="button"
                            aria-label="Eliminar feriado"
                            className="p-0.5 rounded-full hover:bg-destructive/10 text-destructive"
                            onClick={() =>
                                onChange(value.filter((d) => d !== date))
                            }
                        >
                            <X className="size-3" />
                        </button>
                    </span>
                ))}
                {!value.length && (
                    <span className="text-xs text-muted-foreground">
                        Sin feriados configurados
                    </span>
                )}
            </div>
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                <Input
                    type="date"
                    className="h-9 w-full text-sm sm:w-[160px]"
                    onChange={(e) => {
                        const date = e.target.value;
                        if (date && !value.includes(date)) {
                            onChange([...value, date]);
                        }
                        e.target.value = "";
                    }}
                />
                <Label className="text-xs text-muted-foreground">
                    El local cierra todo el día
                </Label>
            </div>
        </div>
    );
}
