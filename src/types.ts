/**
 * Options for archiving a URL
 */
export interface ArchiveOptions {
  /**
   * Force creating a new snapshot even if one exists
   * @default false
   */
  forceNew?: boolean;

  /**
   * Timeout in milliseconds for the archive request
   * @default 30000
   */
  timeout?: number;

  /**
   * Number of retry attempts on failure
   * @default 3
   */
  retries?: number;

  /**
   * Delay in milliseconds between retries
   * @default 1000
   */
  retryDelay?: number;

  /**
   * Custom user agent string
   */
  userAgent?: string;
}

/**
 * Result from archiving a URL
 */
export interface ArchiveResult {
  /**
   * Original URL that was archived
   */
  originalUrl: string;

  /**
   * Archive URL (Wayback Machine URL)
   */
  archiveUrl: string;

  /**
   * Timestamp of the archive
   */
  timestamp?: string;

  /**
   * Whether a new snapshot was created or existing one was used
   */
  isNewSnapshot: boolean;

  /**
   * Success status
   */
  success: boolean;

  /**
   * Error message if failed
   */
  error?: string;
}

/**
 * Response from Wayback Machine Availability API
 */
export interface WaybackAvailabilityResponse {
  url: string;
  archived_snapshots: {
    closest?: {
      available: boolean;
      url: string;
      timestamp: string;
      status: string;
    };
  };
}

/**
 * Response from Wayback Machine Save API
 */
export interface WaybackSaveResponse {
  url: string;
  job_id?: string;
  status?: string;
}
