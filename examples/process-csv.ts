#!/usr/bin/env node

/**
 * Example script to process a CSV file and add archive URLs
 *
 * Usage:
 *   npx ts-node examples/process-csv.ts <input.csv> <output.csv>
 *
 * Or after building:
 *   node dist/examples/process-csv.js <input.csv> <output.csv>
 */

import { archiveUrls } from '../src';
import fs from 'fs';
import path from 'path';

interface CSVRow {
  [key: string]: string;
}

/**
 * Simple CSV parser (handles quoted fields)
 */
function parseCSV(content: string): CSVRow[] {
  const lines = content.split('\n').filter((line) => line.trim());
  if (lines.length === 0) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const row: CSVRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Parse a single CSV line (handles quoted fields)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Convert rows back to CSV
 */
function rowsToCSV(rows: CSVRow[]): string {
  if (rows.length === 0) return '';

  const headers = Object.keys(rows[0]);
  const csvLines: string[] = [headers.join(',')];

  for (const row of rows) {
    const values = headers.map((header) => {
      const value = row[header] || '';
      // Quote if contains comma or quotes
      if (value.includes(',') || value.includes('"')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvLines.push(values.join(','));
  }

  return csvLines.join('\n');
}

/**
 * Find the URL column in the CSV
 */
function findUrlColumn(headers: string[]): string | null {
  const urlPatterns = ['url', 'link', 'uri', 'href', 'website'];

  for (const pattern of urlPatterns) {
    const found = headers.find((h) => h.toLowerCase().includes(pattern));
    if (found) return found;
  }

  return null;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: process-csv <input.csv> [output.csv]');
    console.error('Example: process-csv data.csv data-archived.csv');
    process.exit(1);
  }

  const inputPath = args[0];
  const outputPath = args[1] || inputPath.replace('.csv', '-archived.csv');

  // Check if input file exists
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: File not found: ${inputPath}`);
    process.exit(1);
  }

  console.log(`Reading CSV from: ${inputPath}`);
  const csvContent = fs.readFileSync(inputPath, 'utf-8');
  const rows = parseCSV(csvContent);

  if (rows.length === 0) {
    console.error('Error: CSV file is empty or invalid');
    process.exit(1);
  }

  console.log(`Found ${rows.length} rows`);

  // Find URL column
  const headers = Object.keys(rows[0]);
  const urlColumn = findUrlColumn(headers);

  if (!urlColumn) {
    console.error('Error: Could not find URL column in CSV');
    console.error('Available columns:', headers.join(', '));
    console.error(
      'Please ensure your CSV has a column named: url, link, uri, or href'
    );
    process.exit(1);
  }

  console.log(`Using column '${urlColumn}' for URLs`);

  // Extract URLs
  const urls = rows
    .map((row) => row[urlColumn])
    .filter((url) => url && url.trim());
  console.log(`Found ${urls.length} valid URLs to archive`);
  console.log('');

  // Archive URLs
  console.log('Starting archival process...');
  console.log(
    'Note: This may take a while due to rate limiting (4 seconds per URL)'
  );
  console.log('');

  const results = await archiveUrls(urls, {}, (completed, total, result) => {
    const status = result.success ? '✓' : '✗';
    console.log(`[${completed}/${total}] ${status} ${result.originalUrl}`);
    if (result.success) {
      console.log(`         → ${result.archiveUrl}`);
    } else {
      console.log(`         → Error: ${result.error}`);
    }
    console.log('');
  });

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
  console.log('='.repeat(60));
  console.log('Summary:');
  console.log('='.repeat(60));
  console.log(`Total URLs processed: ${results.length}`);
  console.log(`Successful: ${results.filter((r) => r.success).length}`);
  console.log(`Failed: ${results.filter((r) => !r.success).length}`);
  console.log(`Output saved to: ${outputPath}`);
  console.log('='.repeat(60));
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
