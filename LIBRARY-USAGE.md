# Using archive-url in Your Node.js Project

This guide shows you how to use the `archive-url` library in your own Node.js applications.

## Installation

### Option 1: From npm (After Publishing)

```bash
npm install archive-url
```

### Option 2: Local Development (Before Publishing)

```bash
# In this project directory
npm run build
npm link

# In your project directory
npm link archive-url
```

### Option 3: From Local Path

```bash
npm install /path/to/archive-url
```

## Basic Usage

### JavaScript (CommonJS)

```javascript
const { archiveUrl, archiveUrls } = require('archive-url');

async function main() {
  // Archive a single URL
  const result = await archiveUrl('https://example.com');
  
  if (result.success) {
    console.log('Archive URL:', result.archiveUrl);
  } else {
    console.error('Error:', result.error);
  }
}

main();
```

### JavaScript (ES Modules)

```javascript
import { archiveUrl, archiveUrls } from 'archive-url';

async function main() {
  const result = await archiveUrl('https://example.com');
  console.log(result.archiveUrl);
}

main();
```

### TypeScript

```typescript
import { archiveUrl, archiveUrls, ArchiveResult } from 'archive-url';

async function main(): Promise<void> {
  const result: ArchiveResult = await archiveUrl('https://example.com');
  
  if (result.success) {
    console.log('Archived:', result.archiveUrl);
  }
}

main();
```

## Complete Examples

### Example 1: Archive a Single URL

```javascript
const { archiveUrl } = require('archive-url');

async function archiveSingleUrl() {
  const url = 'https://example.com';
  const result = await archiveUrl(url);
  
  if (result.success) {
    console.log('✅ Success!');
    console.log('Original URL:', result.originalUrl);
    console.log('Archive URL:', result.archiveUrl);
    console.log('Timestamp:', result.timestamp);
    console.log('New snapshot:', result.isNewSnapshot);
  } else {
    console.error('❌ Failed:', result.error);
  }
}

archiveSingleUrl();
```

### Example 2: Archive Multiple URLs

```javascript
const { archiveUrls } = require('archive-url');

async function archiveMultipleUrls() {
  const urls = [
    'https://example.com',
    'https://github.com',
    'https://stackoverflow.com'
  ];
  
  const results = await archiveUrls(urls, {}, (completed, total, result) => {
    console.log(`Progress: ${completed}/${total}`);
    console.log(`Current: ${result.originalUrl}`);
    console.log(`Archive: ${result.archiveUrl}`);
    console.log('---');
  });
  
  // Summary
  const successful = results.filter(r => r.success).length;
  console.log(`Total: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${results.length - successful}`);
}

archiveMultipleUrls();
```

### Example 3: Force New Snapshots

```javascript
const { archiveUrl } = require('archive-url');

async function forceNewSnapshot() {
  const result = await archiveUrl('https://example.com', {
    forceNew: true,  // Always create new snapshot
    timeout: 60000,  // 60 second timeout
    retries: 5       // Retry 5 times on failure
  });
  
  console.log('New archive:', result.archiveUrl);
}

forceNewSnapshot();
```

### Example 4: Check if Already Archived

```javascript
const { checkArchived, archiveUrl } = require('archive-url');

async function smartArchive(url) {
  // First check if already archived
  const existing = await checkArchived(url);
  
  if (existing) {
    console.log('Already archived:', existing.archiveUrl);
    return existing;
  }
  
  // If not, create new archive
  console.log('Creating new archive...');
  const result = await archiveUrl(url);
  return result;
}

smartArchive('https://example.com');
```

### Example 5: Process CSV Data

```javascript
const { archiveUrls } = require('archive-url');
const fs = require('fs');

async function processCsvData() {
  // Read your CSV file
  const csvContent = fs.readFileSync('data.csv', 'utf-8');
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  
  // Extract URLs (assuming they're in a 'link' column)
  const urlColumnIndex = headers.findIndex(h => h.toLowerCase().includes('link'));
  const urls = lines.slice(1).map(line => {
    const cols = line.split(',');
    return cols[urlColumnIndex];
  }).filter(url => url && url.trim());
  
  // Archive all URLs
  const results = await archiveUrls(urls);
  
  // Add archive URLs back to your data
  const outputLines = [headers.join(',') + ',archive_url'];
  lines.slice(1).forEach((line, index) => {
    const archiveUrl = results[index]?.archiveUrl || 'ERROR';
    outputLines.push(`${line},${archiveUrl}`);
  });
  
  // Save result
  fs.writeFileSync('data_archived.csv', outputLines.join('\n'));
  console.log('Saved to data_archived.csv');
}

processCsvData();
```

### Example 6: Error Handling

```javascript
const { archiveUrl } = require('archive-url');

async function archiveWithErrorHandling(url) {
  try {
    const result = await archiveUrl(url, {
      timeout: 30000,
      retries: 3,
      retryDelay: 2000
    });
    
    if (result.success) {
      return {
        success: true,
        url: result.archiveUrl,
        isNew: result.isNewSnapshot
      };
    } else {
      return {
        success: false,
        error: result.error,
        originalUrl: url
      };
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: error.message,
      originalUrl: url
    };
  }
}

archiveWithErrorHandling('https://example.com').then(result => {
  console.log(result);
});
```

### Example 7: Batch Processing with Custom Delay

```javascript
const { archiveUrl } = require('archive-url');

async function batchArchive(urls, delayMs = 5000) {
  const results = [];
  
  for (let i = 0; i < urls.length; i++) {
    console.log(`[${i + 1}/${urls.length}] Processing: ${urls[i]}`);
    
    const result = await archiveUrl(urls[i]);
    results.push(result);
    
    // Wait before next request (except for last one)
    if (i < urls.length - 1) {
      console.log(`Waiting ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

const urls = ['https://example.com', 'https://github.com'];
batchArchive(urls).then(results => {
  console.log('All done!', results);
});
```

## API Reference

### archiveUrl(url, options?)

Archive a single URL.

**Parameters:**

- `url` (string): URL to archive
- `options` (object, optional):
  - `forceNew` (boolean): Force new snapshot (default: false)
  - `timeout` (number): Timeout in ms (default: 30000)
  - `retries` (number): Retry attempts (default: 3)
  - `retryDelay` (number): Delay between retries in ms (default: 1000)

**Returns:** Promise<ArchiveResult>

```typescript
interface ArchiveResult {
  originalUrl: string;
  archiveUrl: string;
  timestamp?: string;
  isNewSnapshot: boolean;
  success: boolean;
  error?: string;
}
```

### archiveUrls(urls, options?, onProgress?)

Archive multiple URLs with automatic rate limiting.

**Parameters:**

- `urls` (string[]): Array of URLs
- `options` (object, optional): Same as archiveUrl
- `onProgress` (function, optional): `(completed, total, result) => void`

**Returns:** Promise<ArchiveResult[]>

### checkArchived(url)

Check if URL has existing archive.

**Returns:** Promise<ArchiveResult | null>

### getLatestArchive(url)

Get the most recent archive URL.

**Returns:** Promise<string | null>

## TypeScript Support

The library includes full TypeScript definitions:

```typescript
import { 
  archiveUrl, 
  archiveUrls,
  checkArchived,
  getLatestArchive,
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

## Package.json Configuration

Add to your `package.json`:

```json
{
  "dependencies": {
    "archive-url": "^1.0.0"
  }
}
```

## Express.js Integration Example

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
      originalUrl: result.originalUrl,
      archiveUrl: result.archiveUrl,
      timestamp: result.timestamp
    });
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

## Next.js API Route Example

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
    res.status(200).json({
      archiveUrl: result.archiveUrl,
      timestamp: result.timestamp
    });
  } else {
    res.status(500).json({ error: result.error });
  }
}
```

## Common Use Cases

### 1. Backup Your Website Links

```javascript
const { archiveUrls } = require('archive-url');
const urls = require('./my-important-urls.json');

archiveUrls(urls).then(results => {
  const archived = results.filter(r => r.success);
  console.log(`Archived ${archived.length}/${urls.length} URLs`);
});
```

### 2. Research Paper Citations

```javascript
const { archiveUrl } = require('archive-url');

async function archiveCitations(citations) {
  const archives = {};
  
  for (const citation of citations) {
    if (citation.url) {
      const result = await archiveUrl(citation.url);
      archives[citation.id] = result.archiveUrl;
    }
  }
  
  return archives;
}
```

### 3. News Article Preservation

```javascript
const { archiveUrls } = require('archive-url');

async function preserveNewsArticles(articles) {
  const urls = articles.map(a => a.url);
  const results = await archiveUrls(urls);
  
  return articles.map((article, i) => ({
    ...article,
    archiveUrl: results[i].archiveUrl
  }));
}
```

## Troubleshooting

### Issue: Module not found

Make sure the library is built:

```bash
cd /path/to/archive-url
npm run build
```

### Issue: Rate limiting errors

The library auto-handles rate limiting. If you still get errors:

```javascript
await archiveUrls(urls, {
  timeout: 60000,  // Increase timeout
  retries: 5        // More retries
});
```

### Issue: TypeScript errors

Make sure TypeScript can find the types:

```json
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

## Support

For issues and questions, create an issue on GitHub or refer to the main README.md for more information.
