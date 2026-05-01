/**
 * Validate if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Normalize URL by removing trailing slashes and fragments
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove hash/fragment
    urlObj.hash = '';
    let normalized = urlObj.toString();
    // Remove trailing slash
    if (normalized.endsWith('/') && urlObj.pathname === '/') {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return url;
  }
}

/**
 * Extract timestamp from Wayback Machine URL
 */
export function extractTimestamp(waybackUrl: string): string | undefined {
  const match = waybackUrl.match(/\/(\d{14})\//);
  return match ? match[1] : undefined;
}

/**
 * Format Wayback timestamp to human-readable date
 */
export function formatTimestamp(timestamp: string): string {
  if (timestamp.length !== 14) return timestamp;

  const year = timestamp.substring(0, 4);
  const month = timestamp.substring(4, 6);
  const day = timestamp.substring(6, 8);
  const hour = timestamp.substring(8, 10);
  const minute = timestamp.substring(10, 12);
  const second = timestamp.substring(12, 14);

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}
