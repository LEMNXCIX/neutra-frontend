export type TimeRange = { start: string; end: string };
export type WorkingHours = { [day: string]: TimeRange[] | null };

export const WORKING_DAYS: Array<{ key: string; label: string }> = [
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

const isRange = (value: unknown): value is TimeRange =>
    !!value &&
    typeof value === "object" &&
    typeof (value as TimeRange).start === "string" &&
    typeof (value as TimeRange).end === "string";

/** Accepts legacy {monday: {start,end}} and multi-range {monday: [{start,end}]}. */
export function normalizeWorkingHours(raw: unknown): WorkingHours {
    const result: WorkingHours = {};
    for (const { key } of WORKING_DAYS) {
        const value = (raw as WorkingHours | null)?.[key];
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
