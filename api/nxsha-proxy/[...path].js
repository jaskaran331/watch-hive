// Vercel Serverless Function — Reverse proxy for web.nxsha.app
// Bypasses carrier-level DNS blocking (e.g. Airtel) by routing
// requests through Vercel's edge servers.

const UPSTREAM = "https://web.nxsha.app";
const PROXY_PREFIX = "/api/nxsha-proxy";

export default async function handler(req, res) {
  // ── CORS preflight ──────────────────────────────────────────────
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    return res.status(200).end();
  }

  // ── Build target URL ───────────────────────────────────────────
  const pathSegments = req.query.path || [];
  const targetPath = Array.isArray(pathSegments)
    ? pathSegments.join("/")
    : pathSegments;

  // Forward any extra query params (not the catch-all "path")
  const incomingUrl = new URL(req.url, `https://${req.headers.host}`);
  const forwardParams = new URLSearchParams();
  for (const [key, val] of incomingUrl.searchParams.entries()) {
    if (key !== "path") forwardParams.set(key, val);
  }
  const qs = forwardParams.toString();
  const targetUrl = `${UPSTREAM}/${targetPath}${qs ? "?" + qs : ""}`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "User-Agent":
          req.headers["user-agent"] ||
          "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36",
        Accept: req.headers["accept"] || "*/*",
        "Accept-Language":
          req.headers["accept-language"] || "en-US,en;q=0.9",
        Referer: `${UPSTREAM}/`,
        Origin: UPSTREAM,
      },
    });

    const ct =
      upstreamRes.headers.get("content-type") || "application/octet-stream";

    // ── Response headers ───────────────────────────────────────
    res.setHeader("Content-Type", ct);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("X-Frame-Options", "ALLOWALL");

    // Aggressive caching for immutable static assets
    if (/\.(js|css|woff2?|ttf|eot|svg|png|jpe?g|gif|ico|webp|avif)(\?|$)/i.test(targetPath)) {
      res.setHeader("Cache-Control", "public, max-age=604800, immutable");
    }

    // ── HTML: rewrite all internal URLs ────────────────────────
    if (ct.includes("text/html")) {
      let html = await upstreamRes.text();
      html = rewriteContent(html, "html");
      return res.send(html);
    }

    // ── JavaScript: rewrite absolute domain references ─────────
    if (ct.includes("javascript") || ct.includes("ecmascript")) {
      let js = await upstreamRes.text();
      js = rewriteContent(js, "js");
      return res.send(js);
    }

    // ── CSS: rewrite url() references ──────────────────────────
    if (ct.includes("text/css")) {
      let css = await upstreamRes.text();
      css = rewriteContent(css, "css");
      return res.send(css);
    }

    // ── Binary pass-through (images, fonts, video chunks) ──────
    const buffer = Buffer.from(await upstreamRes.arrayBuffer());
    return res.send(buffer);
  } catch (err) {
    console.error("[nxsha-proxy] upstream error:", err.message);
    return res
      .status(502)
      .json({ error: "Upstream unreachable", detail: err.message });
  }
}

// ── URL rewriting ──────────────────────────────────────────────────
function rewriteContent(content, type) {
  // 1. Absolute URLs  →  proxy path
  content = content.replace(
    /https?:\/\/web\.nxsha\.app\//g,
    `${PROXY_PREFIX}/`
  );
  content = content.replace(
    /https?:\/\/web\.nxsha\.app(?=["'\s\`\);,}])/g,
    PROXY_PREFIX
  );

  // 2. Protocol-relative URLs
  content = content.replace(
    /\/\/web\.nxsha\.app\//g,
    `${PROXY_PREFIX}/`
  );

  // 3. HTML-specific: rewrite root-relative src/href/action/poster
  if (type === "html") {
    content = content.replace(
      /((?:src|href|action|poster)\s*=\s*)(["'])\/(?!\/|api\/nxsha-proxy)/g,
      `$1$2${PROXY_PREFIX}/`
    );
  }

  // 4. CSS-specific: rewrite url() with root-relative paths
  if (type === "css") {
    content = content.replace(
      /url\(\s*(["']?)\/(?!\/|api\/nxsha-proxy|data:)/g,
      `url($1${PROXY_PREFIX}/`
    );
  }

  return content;
}
