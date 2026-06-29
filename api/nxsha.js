// Vercel Serverless Function — Reverse proxy for web.nxsha.app
// Bypasses carrier-level DNS blocking (e.g. Airtel) by routing
// through Vercel's edge servers.

const UPSTREAM = "https://web.nxsha.app";

export const config = {
  maxDuration: 30,
};

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    return res.status(200).end();
  }

  // Get path from query param: /api/nxsha?path=embed/movie/550
  const targetPath = req.query.path || "";
  if (!targetPath) {
    return res.status(400).json({ error: "Missing ?path= parameter" });
  }

  const targetUrl = `${UPSTREAM}/${targetPath}`;

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

    // Response headers
    res.setHeader("Content-Type", ct);
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Cache static assets
    if (/\.(js|css|woff2?|ttf|eot|svg|png|jpe?g|gif|ico|webp|avif)(\?|$)/i.test(targetPath)) {
      res.setHeader("Cache-Control", "public, max-age=604800, immutable");
    }

    // HTML: rewrite URLs
    if (ct.includes("text/html")) {
      let html = await upstreamRes.text();
      html = rewriteContent(html, "html");
      return res.send(html);
    }

    // JavaScript: rewrite domain references
    if (ct.includes("javascript") || ct.includes("ecmascript")) {
      let js = await upstreamRes.text();
      js = rewriteContent(js, "js");
      return res.send(js);
    }

    // CSS: rewrite url() references
    if (ct.includes("text/css")) {
      let css = await upstreamRes.text();
      css = rewriteContent(css, "css");
      return res.send(css);
    }

    // Binary pass-through
    const buffer = Buffer.from(await upstreamRes.arrayBuffer());
    return res.send(buffer);
  } catch (err) {
    console.error("[nxsha-proxy]", err.message);
    return res.status(502).json({ error: "Upstream unreachable", detail: err.message });
  }
}

function rewriteContent(content, type) {
  const P = "/api/nxsha?path=";

  // Absolute nxsha URLs → proxy
  content = content.replace(/https?:\/\/web\.nxsha\.app\//g, P);
  content = content.replace(/https?:\/\/web\.nxsha\.app(?=["'\s`);,}])/g, "/api/nxsha?path=");

  // Protocol-relative
  content = content.replace(/\/\/web\.nxsha\.app\//g, P);

  if (type === "html") {
    // Root-relative src/href/action/poster → proxy
    content = content.replace(
      /((?:src|href|action|poster)\s*=\s*)(["'])\/(?!\/|api\/)/g,
      `$1$2${P}`
    );
  }

  if (type === "css") {
    content = content.replace(
      /url\(\s*(["']?)\/(?!\/|api\/|data:)/g,
      `url($1${P}`
    );
  }

  return content;
}
