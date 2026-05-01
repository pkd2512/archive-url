# archive-url

A TypeScript/JavaScript library for archiving URLs using the Internet Archive's Wayback Machine.

## Features

- 📦 Archive URLs using the Wayback Machine
- 🔍 Check if URLs are already archived
- ⚡ Batch processing with automatic rate limiting
- 🔄 Automatic retry logic for failed requests
- 📝 TypeScript support with full type definitions
- 🚀 Simple and intuitive API

## Installation

```bash
npm install archive-url
```

## Quick Start

```typescript
import { archiveUrl } from 'archive-url';

// Archive a single URL
const result = await archiveUrl('https://example.com');

if (result.success) {
  console.log('Archive URL:', result.archiveUrl);
  console.log('Is new snapshot:', result.isNewSnapshot);
} else {
  console.error('Error:', result.error);
}
```

## API Reference

### `archiveUrl(url, options?)`

Archive a single URL.

**Parameters:**

- `url` (string): The URL to archive
- `options` (ArchiveOptions, optional):
  - `forceNew` (boolean): Force creating a new snapshot even if one exists (default: `false`)
  - `timeout` (number): Request timeout in milliseconds (default: `30000`)
  - `retries` (number): Number of retry attempts on failure (default: `3`)
  - `retryDelay` (number): Delay between retries in milliseconds (default: `1000`)
  - `userAgent` (string): Custom user agent string

**Returns:** `Promise<ArchiveResult>`

```typescript
interface ArchiveResult {
  originalUrl: string;      // Original URL
  archiveUrl: string;       // Wayback Machine URL
  timestamp?: string;       // Archive timestamp
  isNewSnapshot: boolean;   // Whether a new snapshot was created
  success: boolean;         // Success status
  error?: string;           // Error message if failed
}
```

**Example:**

```typescript
import { archiveUrl } from 'archive-url';

// Basic usage
const result = await archiveUrl('https://example.com');

// With options
const result = await archiveUrl('https://example.com', {
  forceNew: true,
  timeout: 60000,
  retries: 5
});
```

### `archiveUrls(urls, options?, onProgress?)`

Archive multiple URLs with automatic rate limiting.

**Parameters:**

- `urls` (string[]): Array of URLs to archive
- `options` (ArchiveOptions, optional): Same as `archiveUrl`
- `onProgress` (function, optional): Progress callback `(completed, total, result) => void`

**Returns:** `Promise<ArchiveResult[]>`

**Example:**

```typescript
import { archiveUrls } from 'archive-url';

const urls = [
  'https://example.com',
  'https://github.com',
  'https://stackoverflow.com'
];

const results = await archiveUrls(urls, {}, (completed, total, result) => {
  console.log(`Progress: ${completed}/${total}`);
  console.log(`Latest: ${result.archiveUrl}`);
});
```

### `checkArchived(url)`

Check if a URL has an existing archive.

**Parameters:**

- `url` (string): The URL to check

**Returns:** `Promise<ArchiveResult | null>`

**Example:**

```typescript
import { checkArchived } from 'archive-url';

const existing = await checkArchived('https://example.com');

if (existing) {
  console.log('Already archived:', existing.archiveUrl);
} else {
  console.log('Not archived yet');
}
```

### `getLatestArchive(url)`

Get the most recent archive URL for a given URL.

**Parameters:**

- `url` (string): The URL to look up

**Returns:** `Promise<string | null>`

**Example:**

```typescript
import { getLatestArchive } from 'archive-url';

const archiveUrl = await getLatestArchive('https://example.com');
console.log('Latest archive:', archiveUrl);
```

## CSV Processing Example

Process a CSV file with URLs and add archive URLs:

```typescript
import { archiveUrls } from 'archive-url';
import fs from 'fs';

// Read CSV (simplified example)
const csvContent = fs.readFileSync('urls.csv', 'utf-8');
const lines = csvContent.split('\n');
const urls = lines.slice(1).map(line => {
  const columns = line.split(',');
  return columns[3]; // Assuming URL is in 4th column
}).filter(url => url && url.trim());

// Archive URLs
const results = await archiveUrls(urls, {}, (completed, total, result) => {
  console.log(`Processed ${completed}/${total}: ${result.originalUrl}`);
});

// Generate new CSV with archive URLs
const header = lines[0] + ',archive_url\n';
const rows = lines.slice(1).map((line, index) => {
  const result = results[index];
  const archiveUrl = result.success ? result.archiveUrl : 'ERROR: ' + result.error;
  return `${line},"${archiveUrl}"`;
}).join('\n');

fs.writeFileSync('urls_archived.csv', header + rows);
console.log('CSV with archive URLs saved!');
```

## Rate Limiting

The library automatically implements rate limiting when using `archiveUrls()`:

- 4 second delay between requests
- Respects Wayback Machine's informal limits (~15 requests/minute)
- Configurable retry logic for failed requests

## Error Handling

All functions return results with a `success` boolean flag. Always check this before using the archive URL:

```typescript
const result = await archiveUrl('https://example.com');

if (result.success) {
  // Use result.archiveUrl
} else {
  // Handle error: result.error
}
```

## TypeScript Support

The library is written in TypeScript and includes full type definitions:

```typescript
import type { ArchiveOptions, ArchiveResult } from 'archive-url';

const options: ArchiveOptions = {
  forceNew: true,
  timeout: 60000
};

const result: ArchiveResult = await archiveUrl('https://example.com', options);
```

## Utility Functions

### `isValidUrl(url: string): boolean`

Validate if a string is a valid HTTP/HTTPS URL.

### `normalizeUrl(url: string): string`

Normalize a URL by removing fragments and trailing slashes.

### `formatTimestamp(timestamp: string): string`

Format a Wayback Machine timestamp to human-readable date.

## Examples

### Archive a URL and force a new snapshot

```typescript
const result = await archiveUrl('https://example.com', { forceNew: true });
console.log('New archive created:', result.archiveUrl);
```

### Check if already archived before creating new snapshot

```typescript
const existing = await checkArchived('https://example.com');

if (existing) {
  console.log('Using existing archive:', existing.archiveUrl);
} else {
  const result = await archiveUrl('https://example.com');
  console.log('Created new archive:', result.archiveUrl);
}
```

### Process multiple URLs with progress tracking

```typescript
const urls = ['https://example.com', 'https://github.com'];

await archiveUrls(urls, {}, (completed, total, result) => {
  console.log(`[${completed}/${total}] ${result.originalUrl}`);
  if (result.success) {
    console.log(`  ✓ Archived: ${result.archiveUrl}`);
  } else {
    console.log(`  ✗ Failed: ${result.error}`);
  }
});
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For bugs and feature requests, please create an issue on GitHub.
