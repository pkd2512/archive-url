# How Archive URL Behavior Works

## Default Behavior: Use Existing Archives

**YES - By default, the library returns existing archive URLs without creating new snapshots.**

### How It Works

When you call `archiveUrl()`, here's what happens:

```typescript
// 1. First, check if URL is already archived
const existing = await checkArchived(url);

// 2. If existing archive found, return it immediately
if (existing) {
  return existing; // Returns old/existing archive URL
}

// 3. Only if NO existing archive, create a new one
const newArchive = await createNewSnapshot(url);
```

### Example Scenarios

#### Scenario 1: URL Already Archived (Default Behavior)

```typescript
const result = await archiveUrl('https://example.com');

// Result:
{
  originalUrl: 'https://example.com',
  archiveUrl: 'https://web.archive.org/web/20230115120000/https://example.com',
  timestamp: '20230115120000',
  isNewSnapshot: false,  // ← Indicates existing archive was used
  success: true
}
```

**Benefits:**

- ⚡ **Fast** - No need to wait for new snapshot (typically 30-60 seconds)
- 🚀 **Efficient** - Respects rate limits
- 💾 **Saves resources** - Doesn't create duplicate archives

#### Scenario 2: Force New Snapshot

```typescript
const result = await archiveUrl('https://example.com', {
  forceNew: true  // ← Force creating new snapshot
});

// Result:
{
  originalUrl: 'https://example.com',
  archiveUrl: 'https://web.archive.org/web/20260105134500/https://example.com',
  timestamp: '20260105134500',
  isNewSnapshot: true,  // ← New snapshot was created
  success: true
}
```

**Use when:**

- The webpage content has changed significantly
- You need a current snapshot
- You want to preserve today's version

#### Scenario 3: URL Never Archived Before

```typescript
const result = await archiveUrl('https://brand-new-site.com');

// Result:
{
  originalUrl: 'https://brand-new-site.com',
  archiveUrl: 'https://web.archive.org/web/20260105134500/https://brand-new-site.com',
  timestamp: '20260105134500',
  isNewSnapshot: true,  // ← New snapshot created (first time)
  success: true
}
```

## Understanding the Result

The `ArchiveResult` object tells you exactly what happened:

```typescript
interface ArchiveResult {
  originalUrl: string;      // The URL you submitted
  archiveUrl: string;       // The Wayback Machine URL
  timestamp?: string;       // When it was archived (YYYYMMDDHHmmss)
  isNewSnapshot: boolean;   // KEY: false = existing, true = new
  success: boolean;         // Whether operation succeeded
  error?: string;           // Error message if failed
}
```

### Check if Archive is Old or New

```typescript
const result = await archiveUrl('https://example.com');

if (result.success) {
  if (result.isNewSnapshot) {
    console.log('Created NEW archive:', result.archiveUrl);
  } else {
    console.log('Using EXISTING archive:', result.archiveUrl);
    console.log('Archived on:', result.timestamp);
  }
}
```

## CSV Processing Behavior

When processing a CSV file with `archiveUrls()` or the example script:

```typescript
const urls = [
  'https://already-archived.com',  // Will use existing
  'https://never-seen.com',        // Will create new
  'https://another-old-one.com'    // Will use existing
];

const results = await archiveUrls(urls);

// Results will be mixed:
// - URLs with existing archives: fast, uses old archive
// - URLs without archives: slow, creates new snapshot
```

### Example CSV Processing Output

```
[1/4] ✓ https://example.com
         → https://web.archive.org/web/20230115120000/... (existing)

[2/4] ✓ https://new-site.com
         → https://web.archive.org/web/20260105134500/... (NEW)

[3/4] ✓ https://another-site.com
         → https://web.archive.org/web/20220610093000/... (existing)
```

## When to Force New Snapshots

Use `forceNew: true` when:

1. **Content has changed** - The webpage has been updated
2. **Need current version** - Want to preserve today's state
3. **Archiving periodically** - Creating time-series snapshots

```typescript
// Archive URLs and force new snapshots for all
await archiveUrls(urls, { forceNew: true });
```

## Performance Comparison

| Scenario | Speed | Creates New Archive |
|----------|-------|---------------------|
| Existing archive (default) | ⚡ Fast (~1-2 sec) | No |
| Force new | 🐌 Slow (~30-60 sec) | Yes |
| Never archived | 🐌 Slow (~30-60 sec) | Yes |

## Best Practices

### For Large CSV Files

✅ **DO:** Use default behavior (existing archives)

```typescript
npx ts-node examples/process-csv.ts data.csv
// Fast - uses existing archives when available
```

❌ **DON'T:** Force new for everything

```typescript
await archiveUrls(urls, { forceNew: true });
// Slow - creates 100 new snapshots = 100+ minutes
```

### For Monitoring Changes

✅ **DO:** Check if archive exists first

```typescript
const existing = await checkArchived(url);
if (existing) {
  console.log('Last archived:', existing.timestamp);
  // Decide if you need a new snapshot
}
```

### For Batch Processing

✅ **DO:** Use rate limiting (automatic)

```typescript
await archiveUrls(urls); // 4 second delay between requests
```

## Summary

**Default Behavior:**

- ✓ Returns existing archive URL if available
- ✓ Only creates new snapshot if URL never archived
- ✓ Fast and efficient

**To Force New Snapshots:**

```typescript
await archiveUrl(url, { forceNew: true });
```

**To Check What Happened:**

```typescript
const result = await archiveUrl(url);
console.log(result.isNewSnapshot); // false = existing, true = new
