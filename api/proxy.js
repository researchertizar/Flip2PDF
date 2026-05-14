/**
 * Flip2PDF — Vercel Serverless Proxy
 * GET/HEAD /api/proxy?url=<encoded-url>
 */

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const { url } = req.query;

  if (!url) {
    res.status(400).json({ error: "Missing ?url= parameter" });
    return;
  }

  let targetUrl;
  try {
    targetUrl = decodeURIComponent(url);
    new URL(targetUrl);
  } catch {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }

  const parsed = new URL(targetUrl);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    res.status(403).json({ error: "Protocol not allowed" });
    return;
  }

  const blocked =
    /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i;
  if (blocked.test(parsed.hostname)) {
    res.status(403).json({ error: "Private addresses not allowed" });
    return;
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Flip2PDF-Proxy/1.0)",
        Accept: "image/jpeg,image/png,image/*,*/*",
      },
      signal: AbortSignal.timeout(15000),
    });

    res.status(upstream.status);
    const ct = upstream.headers.get("content-type");
    if (ct) res.setHeader("Content-Type", ct);
    res.setHeader("Cache-Control", "public, max-age=86400");

    if (req.method === "HEAD") {
      res.end();
      return;
    }

    const buffer = await upstream.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    const timedOut = err.name === "TimeoutError";
    res.status(timedOut ? 504 : 502).json({
      error: timedOut ? "Upstream timeout" : "Upstream fetch failed",
      detail: err.message,
    });
  }
}
