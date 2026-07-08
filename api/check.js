export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    // If it's a 404, we know for sure the server doesn't have the media
    if (response.status === 404) {
      return res.status(200).json({ status: 404 });
    }
    
    // For 403 (Cloudflare), 200, 500, etc., we assume it's OK to avoid false positives
    return res.status(200).json({ status: response.status });
  } catch (error) {
    // DNS errors or timeouts (corsproxy / vercel edge might fail)
    return res.status(200).json({ error: error.message });
  }
}
