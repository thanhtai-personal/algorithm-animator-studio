const MEASUREMENT_ID = process.env.VITE_GA_MEASUREMENT_ID || "G-QRMY60H8GC";
const API_SECRET = process.env.GA_API_SECRET;

function json(res, status, body) {
  res.statusCode = status;
  if (status === 204) {
    res.end();
    return;
  }

  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    json(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  if (!API_SECRET) {
    json(res, 204, { ok: false, error: "GA_API_SECRET is not configured" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const clientId = String(body.clientId || "");
  const pageLocation = String(body.pageLocation || "");
  const pageTitle = String(body.pageTitle || "");
  const path = String(body.path || "/");

  if (!clientId || !pageLocation) {
    json(res, 400, { ok: false, error: "Missing clientId or pageLocation" });
    return;
  }

  const endpoint = new URL("https://www.google-analytics.com/mp/collect");
  endpoint.searchParams.set("measurement_id", MEASUREMENT_ID);
  endpoint.searchParams.set("api_secret", API_SECRET);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      events: [
        {
          name: "page_view",
          params: {
            page_location: pageLocation,
            page_path: path,
            page_title: pageTitle,
            engagement_time_msec: 1,
          },
        },
      ],
    }),
  });

  json(res, response.ok ? 204 : 502, { ok: response.ok });
}
