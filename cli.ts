#!/usr/bin/env node

/**
 * Archive CLI - Unified command for archiving URLs or CSV files
 *
 * Usage:
 *   npm run archive <url>           # Archive single URL
 *   npm run archive <file.csv>      # Process CSV file
 */

import { archiveUrl, archiveUrls } from './src';

import fs from 'fs';
import { isValidUrl } from './src/utils';
import path from 'path';

// Parse comma-separated URLs from text file
function parseTextFileUrls(content: string): string[] {
  // Split by commas and/or newlines
  const urls = content
    .split(/[,\n]/)
    .map((url) => url.trim())
    .filter((url) => url && isValidUrl(url));

  return urls;
}

// Simple CSV parser
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n').filter((line) => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}

// Find URL column in CSV
function findUrlColumn(headers: string[]): string | null {
  const urlFields = ['url', 'link', 'uri', 'href', 'website'];
  return headers.find((h) => urlFields.includes(h.toLowerCase())) || null;
}

// Convert rows back to CSV
function rowsToCSV(rows: Record<string, string>[]): string {
  if (rows.length === 0) return '';

  const headers = Object.keys(rows[0]);
  const headerLine = headers.map((h) => `"${h}"`).join(',');
  const dataLines = rows.map((row) =>
    headers.map((h) => `"${row[h] || ''}"`).join(',')
  );

  return [headerLine, ...dataLines].join('\n');
}

async function archiveSingleUrl(
  url: string,
  options: { forceNew: boolean; timeout: number; retries: number }
) {
  console.log('🔍 Archiving URL:', url);
  console.log('');

  if (options.forceNew) {
    console.log('⚠️  Force new snapshot: enabled');
    console.log('');
  }

  const result = await archiveUrl(url, {
    forceNew: options.forceNew,
    timeout: options.timeout,
    retries: options.retries,
  });

  if (result.success) {
    console.log('✅ Success!');
    console.log('');
    console.log('📦 Archive URL:');
    console.log(result.archiveUrl);
    console.log('');
    console.log('ℹ️  Details:');
    console.log('  • Original URL:', result.originalUrl);
    console.log('  • Timestamp:', result.timestamp || 'N/A');
    console.log(
      '  • New snapshot:',
      result.isNewSnapshot ? 'Yes' : 'No (using existing)'
    );
  } else {
    console.log('❌ Failed');
    console.log('');
    console.log('Error:', result.error);
    process.exit(1);
  }
}

async function archiveTextFile(
  inputPath: string,
  options: {
    forceNew: boolean;
    timeout: number;
    retries: number;
    output: string | null;
  }
) {
  // Check if file exists
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Error: File not found: ${inputPath}`);
    process.exit(1);
  }

  // Generate output filename (change .txt to .csv)
  const parsedPath = path.parse(inputPath);
  const defaultOutput = path.join(
    parsedPath.dir,
    `${parsedPath.name}_archived.csv`
  );
  const outputPath = options.output || defaultOutput;

  console.log('📄 Processing text file:', inputPath);
  console.log('');

  if (options.forceNew) {
    console.log('⚠️  Force new snapshot: enabled');
  }
  if (options.timeout !== 30000) {
    console.log(`⏱️  Timeout: ${options.timeout}ms`);
  }
  if (options.retries !== 3) {
    console.log(`🔄 Retries: ${options.retries}`);
  }
  if (options.output) {
    console.log(`📁 Custom output: ${options.output}`);
  }
  console.log('');

  // Read and parse text file
  const textContent = fs.readFileSync(inputPath, 'utf-8');
  const urls = parseTextFileUrls(textContent);

  if (urls.length === 0) {
    console.error('❌ Error: No valid URLs found in text file');
    console.error('');
    console.error('Expected format: comma-separated or newline-separated URLs');
    console.error('Example: https://example.com, https://github.com');
    process.exit(1);
  }

  console.log(`Found ${urls.length} valid URLs to archive`);
  console.log('');
  console.log('⏳ Starting archival process...');
  console.log('Note: Rate limited to ~15 URLs/minute (4 seconds per URL)');
  console.log('');

  // Archive URLs
  const results = await archiveUrls(
    urls,
    {
      forceNew: options.forceNew,
      timeout: options.timeout,
      retries: options.retries,
    },
    (completed, total, result) => {
      const status = result.success ? '✅' : '❌';
      const type = result.isNewSnapshot ? '(new)' : '(existing)';
      console.log(`[${completed}/${total}] ${status} ${result.originalUrl}`);
      if (result.success) {
        console.log(`         → ${result.archiveUrl} ${type}`);
      } else {
        console.log(`         → Error: ${result.error}`);
      }
      console.log('');
    }
  );

  // Create CSV rows
  const rows = results.map((result) => ({
    url: result.originalUrl,
    archive_url: result.success ? result.archiveUrl : `ERROR: ${result.error}`,
  }));

  // Write output CSV
  const outputCSV = rowsToCSV(rows);
  fs.writeFileSync(outputPath, outputCSV, 'utf-8');

  console.log('');
  console.log('═'.repeat(60));
  console.log('📊 Summary');
  console.log('═'.repeat(60));
  console.log(`Total URLs processed: ${results.length}`);
  console.log(`✅ Successful: ${results.filter((r) => r.success).length}`);
  console.log(`❌ Failed: ${results.filter((r) => !r.success).length}`);
  console.log('');
  console.log(`💾 Output saved to: ${outputPath}`);
  console.log('═'.repeat(60));
}

async function archiveCsvFile(
  inputPath: string,
  options: {
    forceNew: boolean;
    timeout: number;
    retries: number;
    output: string | null;
  }
) {
  // Check if file exists
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Error: File not found: ${inputPath}`);
    process.exit(1);
  }

  // Generate output filename
  const parsedPath = path.parse(inputPath);
  const outputPath =
    options.output ||
    path.join(parsedPath.dir, `${parsedPath.name}_archived${parsedPath.ext}`);

  console.log('📄 Processing CSV file:', inputPath);
  console.log('');

  if (options.forceNew) {
    console.log('⚠️  Force new snapshot: enabled');
  }
  if (options.timeout !== 30000) {
    console.log(`⏱️  Timeout: ${options.timeout}ms`);
  }
  if (options.retries !== 3) {
    console.log(`🔄 Retries: ${options.retries}`);
  }
  if (options.output) {
    console.log(`📁 Custom output: ${options.output}`);
  }
  console.log('');

  // Read and parse CSV
  const csvContent = fs.readFileSync(inputPath, 'utf-8');
  const rows = parseCSV(csvContent);

  if (rows.length === 0) {
    console.error('❌ Error: CSV file is empty or invalid');
    process.exit(1);
  }

  console.log(`Found ${rows.length} rows`);

  // Find URL column
  const headers = Object.keys(rows[0]);
  const urlColumn = findUrlColumn(headers);

  if (!urlColumn) {
    console.error('❌ Error: Could not find URL column in CSV');
    console.error('Available columns:', headers.join(', '));
    console.error('Expected one of: url, link, uri, href, website');
    process.exit(1);
  }

  console.log(`Using column '${urlColumn}' for URLs`);

  // Extract URLs
  const urls = rows
    .map((row) => row[urlColumn])
    .filter((url) => url && url.trim());

  console.log(`Found ${urls.length} valid URLs to archive`);
  console.log('');
  console.log('⏳ Starting archival process...');
  console.log('Note: Rate limited to ~15 URLs/minute (4 seconds per URL)');
  console.log('');

  // Archive URLs
  const results = await archiveUrls(
    urls,
    {
      forceNew: options.forceNew,
      timeout: options.timeout,
      retries: options.retries,
    },
    (completed, total, result) => {
      const status = result.success ? '✅' : '❌';
      const type = result.isNewSnapshot ? '(new)' : '(existing)';
      console.log(`[${completed}/${total}] ${status} ${result.originalUrl}`);
      if (result.success) {
        console.log(`         → ${result.archiveUrl} ${type}`);
      } else {
        console.log(`         → Error: ${result.error}`);
      }
      console.log('');
    }
  );

  // Add archive_url column to rows
  rows.forEach((row, index) => {
    const result = results[index];
    row['archive_url'] = result.success
      ? result.archiveUrl
      : `ERROR: ${result.error}`;
  });

  // Write output CSV
  const outputCSV = rowsToCSV(rows);
  fs.writeFileSync(outputPath, outputCSV, 'utf-8');

  console.log('');
  console.log('═'.repeat(60));
  console.log('📊 Summary');
  console.log('═'.repeat(60));
  console.log(`Total URLs processed: ${results.length}`);
  console.log(`✅ Successful: ${results.filter((r) => r.success).length}`);
  console.log(`❌ Failed: ${results.filter((r) => !r.success).length}`);
  console.log('');
  console.log(`💾 Output saved to: ${outputPath}`);
  console.log('═'.repeat(60));
}

// Parse command-line arguments
function parseArgs(args: string[]): {
  input: string | null;
  options: {
    forceNew: boolean;
    timeout: number;
    retries: number;
    output: string | null;
    help: boolean;
  };
} {
  const options = {
    forceNew: false,
    timeout: 30000,
    retries: 3,
    output: null as string | null,
    help: false,
  };

  let input: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--force-new' || arg === '-f') {
      options.forceNew = true;
    } else if (arg === '--timeout' || arg === '-t') {
      options.timeout = parseInt(args[++i], 10);
    } else if (arg === '--retries' || arg === '-r') {
      options.retries = parseInt(args[++i], 10);
    } else if (arg === '--output' || arg === '-o') {
      options.output = args[++i];
    } else if (!arg.startsWith('-')) {
      input = arg;
    }
  }

  return { input, options };
}

function showHelp() {
  console.log('Archive URL - CLI Tool');
  console.log('');
  console.log('Usage:');
  console.log('  npm run archive <url> [options]        Archive a single URL');
  console.log('  npm run archive <file.csv> [options]   Process CSV file');
  console.log(
    '  npm run archive <file.txt> [options]   Process text file with URLs'
  );
  console.log('');
  console.log('Options:');
  console.log(
    "  -f, --force-new          Force new snapshot (don't use existing)"
  );
  console.log(
    '  -t, --timeout <ms>       Request timeout in milliseconds (default: 30000)'
  );
  console.log(
    '  -r, --retries <n>        Number of retry attempts (default: 3)'
  );
  console.log(
    '  -o, --output <path>      Custom output path for CSV (default: auto)'
  );
  console.log('  -h, --help               Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  npm run archive https://example.com');
  console.log('  npm run archive https://example.com --force-new');
  console.log('  npm run archive data.csv');
  console.log('  npm run archive urls.txt');
  console.log('  npm run archive data.csv --force-new --timeout 60000');
  console.log('  npm run archive urls.txt -o results.csv');
  console.log('  npm run archive data.csv -f -t 60000 -r 5 -o output.csv');
  console.log('');
  console.log('Text file format:');
  console.log('  - One URL per line, or');
  console.log('  - Comma-separated URLs');
  console.log('  - Output will be a CSV with url and archive_url columns');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showHelp();
    process.exit(0);
  }

  const { input, options } = parseArgs(args);

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (!input) {
    console.error('❌ Error: No URL or CSV file provided');
    console.error('');
    console.error('Run with --help for usage information');
    process.exit(1);
  }

  // Check if input is a URL or file
  if (isValidUrl(input)) {
    // Archive single URL
    await archiveSingleUrl(input, options);
  } else if (input.endsWith('.csv')) {
    // Process CSV file
    await archiveCsvFile(input, options);
  } else if (input.endsWith('.txt')) {
    // Process text file
    await archiveTextFile(input, options);
  } else {
    console.error('❌ Error: Input must be a valid URL, CSV, or TXT file');
    console.error('');
    console.error('Examples:');
    console.error('  npm run archive https://example.com');
    console.error('  npm run archive data.csv');
    console.error('  npm run archive urls.txt');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
