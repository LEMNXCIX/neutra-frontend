"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, X } from "lucide-react";

export type TimeRange = { start: string; end: string };
export type WorkingHours = { [day: string]: TimeRange[] | null };

const DAYS: Array<{ key: string; label: string }> = [
    { key: "monday", label: "Lun" },
    { key: "tuesday", label: "Mar" },
    { key: "wednesday", label: "Mié" },
    { key: "thursday", label: "Jue" },
    { key: "friday", label: "Vie" },
    { key: "saturday", label: "Sáb" },
    { key: "sunday", label: "Dom" },
];

export const DEFAULT_WORKING_HOURS: WorkingHours = {
    monday: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "17:00" }],
    tuesday: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "17:00" }],
    wednesday: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "17:00" }],
    thursday: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "17:00" }],
    friday: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "17:00" }],
    saturday: null,
    sunday: null,
};

const isRange = (v: unknown): v is TimeRange =>
    !!v && typeof v === "object" && typeof (v as TimeRange).start === "string";

/** Accepts legacy {monday: {start,end}} and multi-range {monday: [{start,end}]}. */
export function normalizeWorkingHours(raw: unknown): WorkingHours {
    const result: WorkingHours = {};
    for (const { key } of DAYS) {
        const value = (raw as WorkingHours)?.[key];
        if (!value) {
            result[key] = null;
        } else if (Array.isArray(value)) {
            result[key] = value.filter(isRange);
        } else if (isRange(value)) {
            result[key] = [value];
        } else {
            result[key] = null;
        }
    }
    return result;
}

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
        <div className="space-y-2">
            {DAYS.map(({ key, label }) => {
                const ranges = value[key] || null;
                const works = !!ranges?.length;
                return (
                    <div
                        key={key}
                        className="flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-muted/20"
                    >
                        <div className="flex items-center gap-2 pt-1 w-16 shrink-0">
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
                            <div className="flex-1 space-y-2">
                                {ranges.map((range, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2"
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
                                            className="h-8 w-[110px] text-sm"
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
                                            className="h-8 w-[110px] text-sm"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-7 shrink-0"
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
                                    className="h-7 text-xs"
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
            <div className="flex items-center gap-2">
                <Input
                    type="date"
                    className="h-9 w-[160px] text-sm"
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
