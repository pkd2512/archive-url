#!/usr/bin/env node

/**
 * Quick demo to test the library with data.csv
 */

import { archiveUrl, checkArchived } from './src';

import fs from 'fs';

async function demo() {
  console.log('='.repeat(60));
  console.log('Archive URL Library - Quick Demo');
  console.log('='.repeat(60));
  console.log('');

  // Read the data.csv file
  const csvContent = fs.readFileSync('data.csv', 'utf-8');
  const lines = csvContent.split('\n');

  // Get the first URL from the data (line 2, column 4)
  const firstDataLine = lines[1];
  const columns = firstDataLine.split(',');
  const testUrl = columns[3].trim().replace(/"/g, '');

  console.log('Test URL from data.csv:');
  console.log(testUrl);
  console.log('');

  // Test 1: Check if already archived
  console.log('Test 1: Checking for existing archive...');
  const existing = await checkArchived(testUrl);

  if (existing) {
    console.log('✓ Found existing archive!');
    console.log(`  Archive URL: ${existing.archiveUrl}`);
    console.log(`  Timestamp: ${existing.timestamp}`);
  } else {
    console.log('  No existing archive found');
  }
  console.log('');

  // Test 2: Archive the URL (will use existing if found)
  console.log('Test 2: Archiving URL...');
  const result = await archiveUrl(testUrl);

  if (result.success) {
    console.log('✓ Success!');
    console.log(`  Original URL: ${result.originalUrl}`);
    console.log(`  Archive URL: ${result.archiveUrl}`);
    console.log(`  Is new snapshot: ${result.isNewSnapshot}`);
    console.log(`  Timestamp: ${result.timestamp}`);
  } else {
    console.log('✗ Failed');
    console.log(`  Error: ${result.error}`);
  }
  console.log('');

  console.log('='.repeat(60));
  console.log('Demo completed!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Run full CSV processing:');
  console.log('   npx ts-node examples/process-csv.ts data.csv');
  console.log('');
  console.log('2. Run tests:');
  console.log('   npm test');
  console.log('');
  console.log('3. Build the library:');
  console.log('   npm run build');
  console.log('='.repeat(60));
}

demo().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
