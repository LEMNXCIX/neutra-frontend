import { describe, expect, it } from "vitest";
import { filterFutureSlots } from "@/lib/appointment-time";

describe("filterFutureSlots", () => {
    it("excludes past and exact-current slots using local time", () => {
        const now = new Date(2025, 0, 15, 10, 0);

        expect(
            filterFutureSlots(
                "2025-01-15",
                ["09:00", "09:30", "10:00", "10:30"],
                now,
            ),
        ).toEqual(["10:30"]);
    });

    it("keeps every slot on a future date", () => {
        const now = new Date(2025, 0, 15, 23, 59);
        const slots = ["00:00", "09:00", "17:30"];

        expect(filterFutureSlots("2025-01-16", slots, now)).toEqual(slots);
    });
});
