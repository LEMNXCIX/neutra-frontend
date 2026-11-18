/**
 * Convert the Start handler's Web `Headers` into an object accepted by Node's
 * `ServerResponse.writeHead`. `Object.fromEntries(Headers)` joins repeated
 * headers with commas, which collapses multiple Set-Cookie values into one
 * unusable string; Node requires an array for that header so it emits one
 * `Set-Cookie` line per value.
 */
export function webHeadersToNodeHeaders(headers) {
    const result = Object.fromEntries(headers);
    const setCookies = headers.getSetCookie();
    if (setCookies.length > 0) {
        result["set-cookie"] = setCookies;
    }
    return result;
}
