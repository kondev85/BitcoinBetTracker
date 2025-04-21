# Bitcoin Block Betting Platform Scripts

This directory contains utility scripts for the Bitcoin Block Betting Platform.

## Available Scripts

### Database Setup Scripts

- `push-db.ts`: Initial database setup and historical data import from CSV
  ```
  npx tsx scripts/push-db.ts
  ```

### Data Fetching Scripts

- `fetch-blocks.ts`: Fetches and stores recent blocks from the Mempool.space API
  ```
  # Fetch the default 50 most recent blocks
  npx tsx scripts/fetch-blocks.ts
  
  # Fetch a specific number of blocks (e.g., 100)
  npx tsx scripts/fetch-blocks.ts 100
  ```

## How Block Fetching Works

The `fetch-blocks.ts` script automatically syncs your database with the Bitcoin blockchain by:

1. Finding the most recent block height in your database
2. Determining the current blockchain height from the Mempool.space API
3. Fetching data for all missing blocks in efficient batches
4. Calculating accurate time differences between blocks
5. Storing properly formatted data in your database

The script includes:
- Intelligent batching to avoid API rate limits
- Proper error handling to continue even if individual blocks fail
- Automatic conversion of block size from bytes to MB
- Calculation of block subsidy + fees for total output amount
- Pool slug normalization for consistency with Mempool.space data

## Setting Up Automated Block Fetching

To keep your database up-to-date with the latest blockchain data, you can set up automated block fetching using a cron job or a scheduled task. The average time between Bitcoin blocks is approximately 10 minutes, so running the script every 5-10 minutes is recommended.

### Example Cron Job (Linux/Mac)

```bash
# Edit the crontab
crontab -e

# Add a line to run the script every 5 minutes
*/5 * * * * cd /path/to/your/app && npx tsx scripts/fetch-blocks.ts 10
```

### Using with a Process Manager

If you're using a process manager like PM2, you can set up the script as a scheduled job:

```bash
# Install PM2 if not already installed
npm install -g pm2

# Set up the script to run every 5 minutes
pm2 start scripts/fetch-blocks.ts --name "block-fetcher" --cron "*/5 * * * *" -- 10
```

### Running Manually

You can also run the script manually whenever you want to update the database with the latest blocks:

```bash
npx tsx scripts/fetch-blocks.ts
```

### Catching Up with the Blockchain

If your database is far behind the current blockchain height, you can use the provided catch-up script to automatically process blocks in batches:

```bash
# Make the script executable (if not already)
chmod +x scripts/catch-up.sh

# Run the catch-up process with default settings (100 blocks per batch, 800 total)
./scripts/catch-up.sh

# Customize batch size and total blocks
./scripts/catch-up.sh 50 400  # Process 400 blocks in batches of 50
```

This script will automatically run the `fetch-blocks.ts` script multiple times to catch up with the blockchain, waiting between batches to avoid rate limiting issues.

## Troubleshooting

If you encounter issues with the block fetching:

1. **Rate limiting**: The script includes delays between API calls, but you may need to increase the `API_RATE_LIMIT_DELAY` constant if you encounter rate limiting from Mempool.space
2. **Missing data**: Some blocks may have incomplete data from the API; the script handles this gracefully and inserts what's available
3. **Duplicate blocks**: The script uses `onConflictDoNothing()` to safely ignore blocks that already exist