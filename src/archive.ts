import type {
  ArchiveOptions,
  ArchiveResult,
  WaybackAvailabilityResponse,
  WaybackSaveResponse,
} from './types';
import axios, { AxiosError } from 'axios';
import { extractTimestamp, isValidUrl, normalizeUrl, sleep } from './utils';

const WAYBACK_AVAILABILITY_API = 'https://archive.org/wayback/available';
const WAYBACK_SAVE_API = 'https://web.archive.org/save';

/**
 * Default options for archiving
 */
const DEFAULT_OPTIONS: Required<Omit<ArchiveOptions, 'userAgent'>> = {
  forceNew: false,
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
};

/**
 * Check if a URL has an existing archive
 */
export async function checkArchived(
  url: string
): Promise<ArchiveResult | null> {
  if (!isValidUrl(url)) {
    return null;
  }

  try {
    const normalizedUrl = normalizeUrl(url);
    const response = await axios.get<WaybackAvailabilityResponse>(
      WAYBACK_AVAILABILITY_API,
      {
        params: { url: normalizedUrl },
        timeout: 10000,
      }
    );

    const snapshot = response.data.archived_snapshots?.closest;

    if (snapshot && snapshot.available) {
      return {
        originalUrl: url,
        archiveUrl: snapshot.url,
        timestamp: snapshot.timestamp,
        isNewSnapshot: false,
        success: true,
      };
    }

    return null;
  } catch (error) {
    console.error('Error checking archive:', error);
    return null;
  }
}

/**
 * Get the latest archive for a URL
 */
export async function getLatestArchive(url: string): Promise<string | null> {
  const result = await checkArchived(url);
  return result?.archiveUrl || null;
}

/**
 * Create a new archive snapshot
 */
async function createNewSnapshot(
  url: string,
  options: Required<Omit<ArchiveOptions, 'userAgent'>> & { userAgent?: string }
): Promise<ArchiveResult> {
  const normalizedUrl = normalizeUrl(url);
  const headers: Record<string, string> = {};

  if (options.userAgent) {
    headers['User-Agent'] = options.userAgent;
  }

  try {
    // The Save API returns a redirect to the archived page
    const response = await axios.get(`${WAYBACK_SAVE_API}/${normalizedUrl}`, {
      headers,
      timeout: options.timeout,
      maxRedirects: 0,
      validateStatus: (status) => status === 302 || status === 200,
    });

    // Extract the archive URL from the response
    let archiveUrl: string;

    if (response.status === 302 && response.headers.location) {
      archiveUrl = response.headers.location;
    } else {
      // Fallback: construct the URL (this happens when save is successful)
      // The API may return the archived URL in different ways
      archiveUrl =
        response.headers['content-location'] ||
        `${WAYBACK_SAVE_API}/${normalizedUrl}`;
    }

    const timestamp = extractTimestamp(archiveUrl);

    return {
      originalUrl: url,
      archiveUrl,
      timestamp,
      isNewSnapshot: true,
      success: true,
    };
  } catch (error) {
    const axiosError = error as AxiosError;

    // Check if it's a redirect (which means success)
    if (axiosError.response?.status === 302) {
      const archiveUrl = axiosError.response.headers.location as string;
      const timestamp = extractTimestamp(archiveUrl);

      return {
        originalUrl: url,
        archiveUrl,
        timestamp,
        isNewSnapshot: true,
        success: true,
      };
    }

    throw error;
  }
}

/**
 * Archive a URL with retry logic
 */
async function archiveWithRetry(
  url: string,
  options: Required<Omit<ArchiveOptions, 'userAgent'>> & { userAgent?: string },
  attempt = 1
): Promise<ArchiveResult> {
  try {
    return await createNewSnapshot(url, options);
  } catch (error) {
    if (attempt < options.retries) {
      await sleep(options.retryDelay * attempt);
      return archiveWithRetry(url, options, attempt + 1);
    }

    const axiosError = error as AxiosError;
    const errorMessage = axiosError.response?.data
      ? JSON.stringify(axiosError.response.data)
      : axiosError.message || 'Unknown error';

    return {
      originalUrl: url,
      archiveUrl: '',
      isNewSnapshot: false,
      success: false,
      error: `Failed to archive after ${options.retries} attempts: ${errorMessage}`,
    };
  }
}

/**
 * Main function to archive a URL
 */
export async function archiveUrl(
  url: string,
  userOptions: ArchiveOptions = {}
): Promise<ArchiveResult> {
  // Validate URL
  if (!isValidUrl(url)) {
    return {
      originalUrl: url,
      archiveUrl: '',
      isNewSnapshot: false,
      success: false,
      error: 'Invalid URL format',
    };
  }

  // Merge options with defaults
  const options = {
    ...DEFAULT_OPTIONS,
    ...userOptions,
  };

  // Check for existing archive if not forcing new
  if (!options.forceNew) {
    const existing = await checkArchived(url);
    if (existing) {
      return existing;
    }
  }

  // Create new snapshot
  return archiveWithRetry(url, options);
}

/**
 * Archive multiple URLs with rate limiting
 */
export async function archiveUrls(
  urls: string[],
  options: ArchiveOptions = {},
  onProgress?: (completed: number, total: number, result: ArchiveResult) => void
): Promise<ArchiveResult[]> {
  const results: ArchiveResult[] = [];
  const delay = 4000; // 4 seconds between requests to respect rate limits

  for (let i = 0; i < urls.length; i++) {
    const result = await archiveUrl(urls[i], options);
    results.push(result);

    if (onProgress) {
      onProgress(i + 1, urls.length, result);
    }

    // Add delay between requests (except for the last one)
    if (i < urls.length - 1) {
      await sleep(delay);
    }
  }

  return results;
}
