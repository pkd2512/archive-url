# archive-url

[![npm version](https://img.shields.io/npm/v/archive-url.svg)](https://www.npmjs.com/package/archive-url)
[![npm downloads](https://img.shields.io/npm/dm/archive-url.svg)](https://www.npmjs.com/package/archive-url)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/pkd2512/archive-url/actions/workflows/ci.yml/badge.svg)](https://github.com/pkd2512/archive-url/actions/workflows/ci.yml)

A TypeScript/JavaScript library and CLI tool for archiving URLs using the Internet Archive's Wayback Machine.

## Features

- 📦 Archive URLs using the Wayback Machine
- 💻 Use as a CLI tool or Node.js library
- 📄 Process CSV and TXT files with URLs
- 🔄 Automatic retry logic and rate limiting
- ⚡ Batch processing with progress tracking
- 📝 Full TypeScript support
- 🚀 Simple and intuitive API

## Table of Contents

- [Installation](#installation)
- [CLI Usage](#cli-usage)
- [Library Usage](#library-usage)
- [API Reference](#api-reference)
- [Examples](#examples)
- [How Archiving Works](#how-archiving-works)
- [Advanced Topics](#advanced-topics)

---

## Installation

### As a Global CLI Tool

```bash
npm install -g archive-url
```

### In Your Project

```bash
npm install archive-url
```

---

## CLI Usage

### Archive a Single URL

```bash
npm run archive https://example.com
```

Output:

```
🔍 Archiving URL: https://example.com

✅ Success!

📦 Archive URL:
https://web.archive.org/web/20260501135114/https://example.com

ℹ️  Details:
  • Original URL: https://example.com
  • Timestamp: 20260501135114
  • New snapshot: Yes
```

### Process CSV Files

```bash
npm run archive data.csv
```

**Expected CSV format:** Any CSV with a column named `url`, `link`, `uri`, `href`, or `website`

**Output:** Creates `data_archived.csv` with an additional `archive_url` column

Example:

```csv
# Input: data.csv
date,topic,link
2024-01-01,Example,https://example.com

# Output: data_archived.csv
date,topic,link,archive_url
2024-01-01,Example,https://example.com,https://web.archive.org/web/...
```

### Process Text Files

```bash
npm run archive urls.txt
```

**Text file format:** One URL per line, or comma-separated:

```text
https://example.com
https://github.com
https://stackoverflow.com
```

Or:

```text
https://example.com, https://github.com, https://stackoverflow.com
```

**Output:** Creates `urls_archived.csv` with `url` and `archive_url` columns

### CLI Options

```bash
# Force new snapshot (don't reuse existing archives)
npm run archive data.csv --force-new

# Custom timeout (milliseconds)
npm run archive data.csv --timeout 60000

# Custom retry attempts
npm run archive data.csv --retries 5

# Custom output file
npm run archive data.csv --output results.csv

# Combine options
npm run archive data.csv -f -t 60000 -r 5 -o output.csv
```

**Available options:**

- `-f, --force-new` - Force new snapshot
- `-t, --timeout <ms>` - Request timeout (default: 30000)
- `-r, --retries <n>` - Retry attempts (default: 3)
- `-o, --output <path>` - Custom output path
- `-h, --help` - Show help

### Get Help

```bash
npm run archive --help
```

---

## Library Usage

### Basic Import

```javascript
// CommonJS
const { archiveUrl, archiveUrls } = require('archive-url');

// ES Modules
import { archiveUrl, archiveUrls } from 'archive-url';

// TypeScript
import { archiveUrl, archiveUrls, ArchiveResult } from 'archive-url';
```

### Archive a Single URL

```javascript
const { archiveUrl } = require('archive-url');

async function main() {
  const result = await archiveUrl('https://example.com');
  
  if (result.success) {
    console.log('Archive URL:', result.archiveUrl);
    console.log('Is new snapshot:', result.isNewSnapshot);
    console.log('Timestamp:', result.timestamp);
  } else {
    console.error('Error:', result.error);
  }
}

main();
```

### Archive Multiple URLs

```javascript
const { archiveUrls } = require('archive-url');

async function main() {
  const urls = [
    'https://example.com',
    'https://github.com',
    'https://stackoverflow.com'
  ];
  
  const results = await archiveUrls(urls, {}, (completed, total, result) => {
    console.log(`[${completed}/${total}] ${result.originalUrl}`);
    console.log(`Archive: ${result.archiveUrl}`);
  });
  
  // Summary
  const successful = results.filter(r => r.success).length;
  console.log(`Successful: ${successful}/${results.length}`);
}

main();
```

### With Options

```javascript
const result = await archiveUrl('https://example.com', {
  forceNew: true,    // Force new snapshot
  timeout: 60000,    // 60 second timeout
  retries: 5         // Retry 5 times on failure
});
```

### Check if Already Archived

```javascript
const { checkArchived } = require('archive-url');

const existing = await checkArchived('https://example.com');

if (existing) {
  console.log('Already archived:', existing.archiveUrl);
} else {
  console.log('Not archived yet');
}
```

---

## API Reference

### `archiveUrl(url, options?)`

Archive a single URL.

**Parameters:**

- `url` (string): URL to archive
- `options` (object, optional):
  - `forceNew` (boolean): Force new snapshot (default: false)
  - `timeout` (number): Timeout in milliseconds (default: 30000)
  - `retries` (number): Retry attempts (default: 3)
  - `retryDelay` (number): Delay between retries in ms (default: 1000)

**Returns:** `Promise<ArchiveResult>`

```typescript
interface ArchiveResult {
  originalUrl: string;      // Original URL
  archiveUrl: string;       // Wayback Machine URL
  timestamp?: string;       // Archive timestamp (e.g., "20240101120000")
  isNewSnapshot: boolean;   // Whether a new snapshot was created
  success: boolean;         // Success status
  error?: string;           // Error message if failed
}
```

### `archiveUrls(urls, options?, onProgress?)`

Archive multiple URLs with automatic rate limiting.

**Parameters:**

- `urls` (string[]): Array of URLs
- `options` (object, optional): Same as `archiveUrl`
- `onProgress` (function, optional): `(completed, total, result) => void`

**Returns:** `Promise<ArchiveResult[]>`

**Note:** Automatically applies 4-second delay between requests (rate limiting)

### `checkArchived(url)`

Check if URL has existing archive.

**Parameters:**

- `url` (string): URL to check

**Returns:** `Promise<ArchiveResult | null>`

### `getLatestArchive(url)`

Get most recent archive URL.

**Parameters:**

- `url` (string): URL to look up

**Returns:** `Promise<string | null>`

---

## Examples

### Example 1: Simple Archiving

```javascript
const { archiveUrl } = require('archive-url');

const result = await archiveUrl('https://example.com');
console.log(result.archiveUrl);
// Output: https://web.archive.org/web/20260501135114/https://example.com
```

### Example 2: Force New Snapshot

```javascript
const result = await archiveUrl('https://example.com', { forceNew: true });
console.log('New archive created:', result.archiveUrl);
```

### Example 3: Process CSV Data

```javascript
const { archiveUrls } = require('archive-url');
const fs = require('fs');

// Read CSV
const csvContent = fs.readFileSync('urls.csv', 'utf-8');
const lines = csvContent.split('\n');
const urls = lines.slice(1).map(line => line.split(',')[0]);

// Archive URLs
const results = await archiveUrls(urls);

// Create output CSV
const output = lines.map((line, i) => {
  if (i === 0) return line + ',archive_url';
  const archiveUrl = results[i-1]?.archiveUrl || 'ERROR';
  return `${line},"${archiveUrl}"`;
}).join('\n');

fs.writeFileSync('output.csv', output);
```

### Example 4: Smart Archiving (Check First)

```javascript
const { checkArchived, archiveUrl } = require('archive-url');

async function smartArchive(url) {
  // Check if already archived
  const existing = await checkArchived(url);
  
  if (existing) {
    console.log('Using existing archive:', existing.archiveUrl);
    return existing;
  }
  
  // Create new archive
  const result = await archiveUrl(url);
  console.log('Created new archive:', result.archiveUrl);
  return result;
}

await smartArchive('https://example.com');
```

### Example 5: Batch Processing with Progress

```javascript
const { archiveUrls } = require('archive-url');

const urls = ['https://example.com', 'https://github.com'];

const results = await archiveUrls(urls, {}, (completed, total, result) => {
  console.log(`\n[${completed}/${total}] Processing: ${result.originalUrl}`);
  
  if (result.success) {
    console.log(`✅ Archived: ${result.archiveUrl}`);
    console.log(`   New snapshot: ${result.isNewSnapshot ? 'Yes' : 'No'}`);
  } else {
    console.log(`❌ Failed: ${result.error}`);
  }
});
```

### Example 6: Express.js Integration

```javascript
const express = require('express');
const { archiveUrl } = require('archive-url');

const app = express();
app.use(express.json());

app.post('/api/archive', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL required' });
  }
  
  const result = await archiveUrl(url);
  
  if (result.success) {
    res.json({
      archiveUrl: result.archiveUrl,
      timestamp: result.timestamp,
      isNew: result.isNewSnapshot
    });
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.listen(3000);
```

### Example 7: Error Handling

```javascript
const { archiveUrl } = require('archive-url');

async function safeArchive(url) {
  try {
    const result = await archiveUrl(url, {
      timeout: 30000,
      retries: 3
    });
    
    if (result.success) {
      return { success: true, url: result.archiveUrl };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
}

const result = await safeArchive('https://example.com');
console.log(result);
```

---

## How Archiving Works

### Understanding the Wayback Machine

The Internet Archive's Wayback Machine saves snapshots of web pages over time. This library interacts with their Save API.

### Two Archiving Modes

**1. Reuse Existing Archives (Default)**

```javascript
const result = await archiveUrl('https://example.com');
// May return existing archive if available
```

- Checks if URL is already archived
- Returns existing archive if found (faster)
- Creates new snapshot only if needed
- `result.isNewSnapshot` will be `false`

**2. Force New Snapshot**

```javascript
const result = await archiveUrl('https://example.com', { forceNew: true });
// Always creates new snapshot
```

- Always requests new snapshot
- Takes longer (4-10 seconds)
- `result.isNewSnapshot` will be `true`
- Use when you need current content

### Archive URL Format

Archive URLs follow this pattern:

```
https://web.archive.org/web/[TIMESTAMP]/[ORIGINAL_URL]

Example:
https://web.archive.org/web/20260501135114/https://example.com
                              └─timestamp─┘
```

**Timestamp format:** `YYYYMMDDHHmmss`

- `20260501135114` = May 1, 2026 at 13:51:14 UTC

### Rate Limiting

The library automatically handles rate limiting:

- **Single URL:** No delay
- **Multiple URLs:** 4-second delay between requests
- **Recommended:** ~15 URLs per minute
- **Built-in retries:** 3 attempts by default

### Output File Locations

**CSV files:**

- Input: `data.csv`
- Output: `data_archived.csv` (same directory)

**Text files:**

- Input: `urls.txt`
- Output: `urls_archived.csv` (same directory)

**Custom output:**

```bash
npm run archive data.csv --output /custom/path/result.csv
```

### Important Notes

1. **URL Normalization:** URLs are normalized (fragments removed, trailing slashes handled)
2. **Error Handling:** Failed URLs are marked with `ERROR:` in CSV output
3. **Progress Tracking:** Use progress callbacks for long-running operations
4. **Timeouts:** Default 30-second timeout per request
5. **Success Rate:** Check `result.success` before using archive URLs

---

## Advanced Topics

### TypeScript Usage

Full TypeScript support with type definitions:

```typescript
import { 
  archiveUrl, 
  archiveUrls,
  checkArchived,
  ArchiveOptions,
  ArchiveResult 
} from 'archive-url';

// Type-safe options
const options: ArchiveOptions = {
  forceNew: true,
  timeout: 60000,
  retries: 5
};

// Type-safe result
const result: ArchiveResult = await archiveUrl('https://example.com', options);

// Type-safe progress callback
await archiveUrls(
  urls,
  options,
  (completed: number, total: number, result: ArchiveResult) => {
    console.log(`${completed}/${total}`);
  }
);
```

### Utility Functions

```javascript
import { isValidUrl, normalizeUrl, formatTimestamp } from 'archive-url';

// Validate URL
const valid = isValidUrl('https://example.com');  // true

// Normalize URL
const normalized = normalizeUrl('https://example.com/#section');
// Returns: https://example.com

// Format timestamp
const date = formatTimestamp('20260501135114');
// Returns: "2026-05-01 13:51:14"
```

### Custom Delays for Batch Processing

```javascript
const { archiveUrl } = require('archive-url');

async function batchWithCustomDelay(urls, delayMs = 5000) {
  const results = [];
  
  for (let i = 0; i < urls.length; i++) {
    const result = await archiveUrl(urls[i]);
    results.push(result);
    
    if (i < urls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}
```

### Next.js Integration

```typescript
// pages/api/archive.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { archiveUrl, ArchiveResult } from 'archive-url';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { url } = req.body;
  const result: ArchiveResult = await archiveUrl(url);
  
  if (result.success) {
    res.status(200).json({ archiveUrl: result.archiveUrl });
  } else {
    res.status(500).json({ error: result.error });
  }
}
```

---

## Troubleshooting

### Issue: Rate limiting errors

Increase timeout and retries:

```javascript
await archiveUrl(url, {
  timeout: 60000,
  retries: 5
});
```

### Issue: CSV not processed

Ensure your CSV has a column named one of: `url`, `link`, `uri`, `href`, `website`

### Issue: TypeScript errors

Ensure proper TypeScript configuration:

```json
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

---

## Common Use Cases

### 1. Backup Important Links

```javascript
const urls = [
  'https://important-article.com',
  'https://research-paper.com'
];
const results = await archiveUrls(urls);
```

### 2. Research Paper Citations

```javascript
async function archiveCitations(citations) {
  const results = {};
  for (const citation of citations) {
    if (citation.url) {
      const result = await archiveUrl(citation.url);
      results[citation.id] = result.archiveUrl;
    }
  }
  return results;
}
```

### 3. News Article Preservation

```javascript
async function preserveArticles(articles) {
  const urls = articles.map(a => a.url);
  const results = await archiveUrls(urls);
  
  return articles.map((article, i) => ({
    ...article,
    archiveUrl: results[i].archiveUrl
  }));
}
```

---

## License

MIT

## Contributing

Contributions welcome! Please submit a Pull Request.

## Support

For bugs and feature requests, create an issue on GitHub.
