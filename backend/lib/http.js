/**
 * lib/http.js
 * Small helpers shared across api/ route handlers.
 */

export function sendJSON(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(body));
}

export function sendError(res, status, code, message) {
  sendJSON(res, status, { error: { code, message } });
}

export function methodGuard(req, res, allowedMethods) {
  if (!allowedMethods.includes(req.method)) {
    sendError(res, 405, "method_not_allowed", `Allowed methods: ${allowedMethods.join(", ")}`);
    return false;
  }
  return true;
}

/** Extract and validate the X-Agent-Key header. Returns the raw key or null. */
export function getApiKey(req) {
  return req.headers["x-agent-key"] || null;
}

export async function readJSONBody(req) {
  if (req.body && typeof req.body === "object") return req.body; // Vercel auto-parses JSON bodies
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}
