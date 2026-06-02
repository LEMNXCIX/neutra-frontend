/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const routePath = path.join(
    process.cwd(),
    "src",
    "app",
    "api",
    "auth",
    "login",
    "route.ts",
);

const source = fs.readFileSync(routePath, "utf8");

if (!source.includes("response.status === 204")) {
    console.error(
        "Login proxy must handle 204/no-content backend responses without throwing.",
    );
    process.exit(2);
}

if (!source.includes("response.json().catch")) {
    console.error(
        "Login proxy must parse backend JSON defensively; raw response.json() turns malformed/empty backend responses into Next 500s.",
    );
    process.exit(2);
}

process.exit(0);
