import { readFile } from "node:fs/promises";
import {
    buildSnapshot,
    DEFAULT_BASE_URL,
    fixturePath,
    loadRoutes,
    requestRoute,
} from "../../scripts/capture-parity.mjs";

const FIELDS = ["status", "hasTraceId", "hrefs", "envelopeKeys"];

function describe(value) {
    return JSON.stringify(value);
}

async function readFixture(route) {
    try {
        return JSON.parse(await readFile(fixturePath(route), "utf8"));
    } catch (error) {
        if (error.code === "ENOENT") return null;
        throw error;
    }
}

async function compare() {
    const baseUrl = process.argv[2] || process.env.BASE_URL || DEFAULT_BASE_URL;
    const routes = await loadRoutes();
    let matched = 0;
    const allDiffs = [];

    for (const route of routes) {
        const label = `${route.tenant} ${route.path}`;
        const fixture = await readFixture(route);
        if (!fixture) {
            allDiffs.push(
                `${label}: no fixture (run npm run parity:capture first)`,
            );
            console.log(`MISSING ${label}`);
            continue;
        }

        let actual;
        try {
            actual = await requestRoute(baseUrl, route);
        } catch (error) {
            actual = { status: 0, body: `Error: ${error.message}` };
        }

        const expected = buildSnapshot(fixture);
        const received = buildSnapshot(actual);
        const diffs = [];
        for (const field of FIELDS) {
            if (describe(expected[field]) !== describe(received[field])) {
                diffs.push(
                    `  ${field}: expected ${describe(expected[field])}, got ${describe(received[field])}`,
                );
            }
        }

        if (diffs.length) {
            allDiffs.push(`${label}:\n${diffs.join("\n")}`);
            console.log(`MISMATCH ${label}`);
            for (const diff of diffs) console.log(diff);
        } else {
            matched += 1;
            console.log(`OK ${label}`);
        }
    }

    console.log(`\n${matched}/${routes.length} route(s) matched.`);
    if (allDiffs.length) {
        console.error(`\n${allDiffs.length} route(s) differ:`);
        for (const diff of allDiffs) console.error(diff);
        process.exitCode = 1;
    }
}

compare().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
