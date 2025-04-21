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
  # Fetch the default 10 most recent blocks
  npx tsx scripts/fetch-blocks.ts
  
  # Fetch a specific number of blocks (e.g., 25)
  npx tsx scripts/fetch-blocks.ts 25
  ```

## Setting Up Automated Block Fetching

To keep your database up-to-date with the latest blockchain data, you can set up automated block fetching using a cron job or a scheduled task. The average time between Bitcoin blocks is approximately 10 minutes, so running the script every 5-10 minutes is recommended.

### Example Cron Job (Linux/Mac)

```bash
# Edit the crontab
crontab -e

# Add a line to run the script every 5 minutes
*/5 * * * * cd /path/to/your/app && npx tsx scripts/fetch-blocks.ts 5
```

### Using with a Process Manager

If you're using a process manager like PM2, you can set up the script as a scheduled job:

```bash
# Install PM2 if not already installed
npm install -g pm2

# Set up the script to run every 5 minutes
pm2 start scripts/fetch-blocks.ts --name "block-fetcher" --cron "*/5 * * * *" -- 5
```

### Running Manually

You can also run the script manually whenever you want to update the database with the latest blocks:

```bash
npx tsx scripts/fetch-blocks.ts
```