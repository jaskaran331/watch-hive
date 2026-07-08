export function isSafeUrl(url) {
  if (!url) return false;
  try {
    const parsedUrl = new URL(url);
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch (e) {
    // If URL parsing fails, it's not a valid URL, so it's unsafe
    return false;
  }
}

export function openExternalSafe(url) {
  if (isSafeUrl(url)) {
    window.electron?.openExternal(url);
  } else {
    console.warn('Blocked unsafe external URL:', url);
  }
}
