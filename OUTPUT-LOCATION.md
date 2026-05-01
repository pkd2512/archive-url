# Where Output Files Are Saved

## CSV Processing Output Location

### Default Behavior

When you run the CSV processing script:

```bash
npx ts-node examples/process-csv.ts data.csv
```

**Output saved to:** `data-archived.csv` (same directory as input file)

### How It Works

The script automatically creates the output filename:

```
Input:  data.csv
Output: data-archived.csv
        ^^^^^^^^^^^^^ (adds "-archived" before .csv)
```

### Custom Output Location

You can specify a custom output path:

```bash
npx ts-node examples/process-csv.ts data.csv output/results.csv
```

**Output saved to:** `output/results.csv`

## Output File Structure

The output CSV includes ALL original columns PLUS a new `archive_url` column:

### Input CSV (data.csv)

```csv
date,place,topic,link
2021-12-17,DataJournalism Blog,Interview,https://example.com
```

### Output CSV (data-archived.csv)

```csv
date,place,topic,link,archive_url
2021-12-17,DataJournalism Blog,Interview,https://example.com,"https://web.archive.org/web/20230115120000/https://example.com"
```

## Complete Examples

### Example 1: Default Output

```bash
npx ts-node examples/process-csv.ts data.csv
```

- **Input:** `data.csv` (current directory)
- **Output:** `data-archived.csv` (current directory)
- **Result:** Original file unchanged, new file created with archive URLs

### Example 2: Custom Output Name

```bash
npx ts-node examples/process-csv.ts data.csv my-results.csv
```

- **Input:** `data.csv`
- **Output:** `my-results.csv` (current directory)

### Example 3: Different Directory

```bash
npx ts-node examples/process-csv.ts data.csv results/archived-data.csv
```

- **Input:** `data.csv` (current directory)
- **Output:** `results/archived-data.csv` (results folder)

### Example 4: Absolute Path

```bash
npx ts-node examples/process-csv.ts ~/Documents/urls.csv ~/Downloads/archived.csv
```

- **Input:** `~/Documents/urls.csv`
- **Output:** `~/Downloads/archived.csv`

## File Locations in Your Project

### Current Directory Structure

```
archive-url/
├── data.csv                    ← Your input file
├── data-archived.csv          ← Output will be created here
├── examples/
│   └── process-csv.ts         ← Processing script
└── ...
```

### After Running the Script

```
archive-url/
├── data.csv                    ← Original (unchanged)
├── data-archived.csv          ← NEW - with archive_url column
├── examples/
│   └── process-csv.ts
└── ...
```

## Script Output Messages

When you run the script, it will tell you where the file was saved:

```bash
$ npx ts-node examples/process-csv.ts data.csv

Reading CSV from: data.csv
Found 4 rows
Using column 'link' for URLs
Found 4 valid URLs to archive

Starting archival process...
[1/4] ✓ https://example.com
         → https://web.archive.org/web/...

[2/4] ✓ https://another.com
         → https://web.archive.org/web/...

============================================================
Summary:
============================================================
Total URLs processed: 4
Successful: 4
Failed: 0
Output saved to: data-archived.csv    ← TELLS YOU WHERE
============================================================
```

## Important Notes

### Original File Safety

✅ **Your original file is NEVER modified**

- Input file (`data.csv`) remains unchanged
- Only the output file is created/written

### Overwriting Behavior

⚠️ **If output file exists, it WILL be overwritten**

```bash
# First run
npx ts-node examples/process-csv.ts data.csv
# Creates: data-archived.csv

# Second run (overwrites!)
npx ts-node examples/process-csv.ts data.csv
# Overwrites: data-archived.csv
```

To avoid overwriting, use custom output names:

```bash
npx ts-node examples/process-csv.ts data.csv data-archived-2024-01-05.csv
```

### File Permissions

- Script needs **read** permission for input file
- Script needs **write** permission for output directory
- Creates parent directories if they don't exist (for absolute paths)

## .gitignore Settings

Output files are automatically ignored by git:

```gitignore
# From .gitignore
*-archived.csv    ← Output CSVs won't be committed
```

This prevents accidentally committing large result files to your repository.

## Quick Reference

| Scenario | Command | Output Location |
|----------|---------|----------------|
| Default | `process-csv.ts data.csv` | `data-archived.csv` |
| Custom name | `process-csv.ts data.csv out.csv` | `out.csv` |
| With path | `process-csv.ts data.csv results/data.csv` | `results/data.csv` |
| Absolute | `process-csv.ts data.csv /tmp/out.csv` | `/tmp/out.csv` |

## Programmatic Usage

If you're using the library directly in code:

```typescript
import { archiveUrls } from 'archive-url';
import fs from 'fs';

const results = await archiveUrls(urls);

// Save wherever you want
fs.writeFileSync('./my-custom-output.csv', csvContent);
fs.writeFileSync('/path/to/output.csv', csvContent);
fs.writeFileSync('../results/data.csv', csvContent);
```

You have complete control over the output location!
