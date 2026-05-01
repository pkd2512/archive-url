# Usage Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Library

```bash
npm run build
```

### 3. Run the Demo

Test with a single URL from data.csv:

```bash
npm run demo
```

Or using the full command:

```bash
npx ts-node test-demo.ts
```

### 4. Process the Full CSV

Process all URLs in data.csv:

```bash
npm run csv data.csv
```

Or use the alias:

```bash
npm run process data.csv
```

Or using the full command:

```bash
npx ts-node examples/process-csv.ts data.csv
```

This will create `data-archived.csv` with an additional `archive_url` column.

## Using as a Library

### In Your TypeScript/JavaScript Project

```typescript
import { archiveUrl, archiveUrls } from 'archive-url';

// Archive a single URL
const result = await archiveUrl('https://example.com');
console.log(result.archiveUrl);

// Archive multiple URLs
const urls = ['https://example.com', 'https://github.com'];
const results = await archiveUrls(urls);
```

### Available Functions

- `archiveUrl(url, options?)` - Archive a single URL
- `archiveUrls(urls, options?, onProgress?)` - Archive multiple URLs with rate limiting
- `checkArchived(url)` - Check if URL is already archived
- `getLatestArchive(url)` - Get the latest archive URL
- `isValidUrl(url)` - Validate a URL
- `normalizeUrl(url)` - Normalize a URL

## CSV Processing

The `examples/process-csv.ts` script:

1. Reads a CSV file
2. Finds the URL column (looks for: url, link, uri, href, website)
3. Archives each URL using the Wayback Machine
4. Creates a new CSV with an `archive_url` column added

### Rate Limiting

- 4 seconds between each request
- ~15 URLs per minute
- Automatic retry on failures (3 attempts by default)

### Example Output

```
Reading CSV from: data.csv
Found 4 rows
Using column 'link' for URLs
Found 4 valid URLs to archive

Starting archival process...
Note: This may take a while due to rate limiting (4 seconds per URL)

[1/4] ✓ https://example.com
         → https://web.archive.org/web/20240101120000/https://example.com

[2/4] ✓ https://github.com
         → https://web.archive.org/web/20240101120100/https://github.com
```

## Testing

Run the test suite:

```bash
npm test
```

## Publishing to npm

1. Update version in `package.json`
2. Build the library: `npm run build`
3. Test locally: `npm link` then use in another project
4. Publish: `npm publish`

## API Rate Limits

The Internet Archive's Wayback Machine has informal rate limits:

- ~15 requests per minute for Save API
- Higher limits for Availability API (checking existing archives)

The library handles this automatically with:

- 4-second delays between requests
- Exponential backoff on retries
- Configurable timeout and retry settings

## Error Handling

All functions return a result object with a `success` flag:

```typescript
const result = await archiveUrl('https://example.com');

if (result.success) {
  console.log('Archive URL:', result.archiveUrl);
} else {
  console.error('Error:', result.error);
}
```

## Advanced Options

```typescript
const result = await archiveUrl('https://example.com', {
  forceNew: true,      // Force new snapshot even if archived
  timeout: 60000,      // 60 second timeout
  retries: 5,          // 5 retry attempts
  retryDelay: 2000,    // 2 second delay between retries
  userAgent: 'MyBot'   // Custom user agent
});
```

## Next Steps

1. **For Library Usage**: Read the [README.md](README.md) for complete API documentation
2. **For Web App**: The next phase is to create a Next.js web application for CSV upload/processing
3. **For Publishing**: Update `package.json` with author, repository, and keywords before publishing to npm
