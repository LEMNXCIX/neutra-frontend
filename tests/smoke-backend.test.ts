/**
 * The smoke backend must return a usable signed-in user, not an empty object.
 * An empty `data` made the app believe login succeeded while the navbar had
 * no user to render.
 */
import { type ChildProcess, spawn } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const PORT = 4111;
const BASE = `http://127.0.0.1:${PORT}`;
let child: ChildProcess;

async function waitForBackend() {
    for (let i = 0; i < 40; i++) {
        try {
            const response = await fetch(`${BASE}/api/tenants/config/demo`);
            if (response.ok) return;
        } catch {
            // not up yet
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error("smoke backend did not start");
}

describe("smoke backend auth fixtures", () => {
    beforeAll(async () => {
        child = spawn(process.execPath, ["scripts/smoke-backend.mjs"], {
            cwd: process.cwd(),
            env: { ...process.env, SMOKE_BACKEND_PORT: String(PORT) },
            stdio: "ignore",
        });
        await waitForBackend();
    });

    afterAll(() => {
        child?.kill();
    });

    it("returns a mapped user and token cookie on login", async () => {
        const response = await fetch(`${BASE}/api/auth/login`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: "demo@neutra.test", password: "x" }),
        });
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.name).toBe("Demo User");
        expect(body.data.role.name).toBe("ADMIN");
        expect(response.headers.get("set-cookie")).toContain(
            "token=smoke-token",
        );
    });

    it("returns the same user on validate", async () => {
        const response = await fetch(`${BASE}/api/auth/validate`);
        const body = await response.json();

        expect(body.data.id).toBe("smoke-user-1");
    });
});
