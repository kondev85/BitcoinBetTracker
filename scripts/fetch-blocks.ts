import { db, pool } from '../server/db';
import * as schema from '../shared/schema';
import axios from 'axios';
import { eq, desc, sql } from 'drizzle-orm';
import { type InsertBlock } from '../shared/schema';

// Constants
const MEMPOOL_API_BASE = 'https://mempool.space/api/v1';
const BATCH_SIZE = 15; // Number of blocks to process in one batch
const API_RATE_LIMIT_DELAY = 2000; // Delay between API calls in ms to avoid rate limiting

// Interface for block data from mempool.space API
interface MempoolBlock {
  height: number;
  size: number;
  tx_count: number;
  id: string;  // block hash
  extras?: {
    pool?: {
      name?: string;
      slug?: string;
    };
    totalFees?: number;
  };
  timestamp: number;
  reward?: number;
}

// Function to fetch tip height (current blockchain height)
async function getCurrentBlockHeight(): Promise<number> {
  try {
    console.log('[mempool] Fetching current block height...');
    const response = await axios.get(`${MEMPOOL_API_BASE}/blocks/tip/height`);
    const height = response.data;
    console.log(`[mempool] Current blockchain height: ${height}`);
    return height;
  } catch (error) {
    console.error('[mempool] Error fetching current block height:', error);
    throw error;
  }
}

// Function to fetch blocks at a specific height
async function getBlocksAtHeight(height: number): Promise<MempoolBlock[]> {
  try {
    const url = `${MEMPOOL_API_BASE}/blocks/${height}`;
    console.log(`[mempool] Fetching blocks at height: ${height}`);
    
    const response = await axios.get(url);
    const blocks = response.data;
    
    if (!Array.isArray(blocks)) {
      throw new Error(`Invalid response format from ${url}`);
    }
    
    // Sort blocks by height to ensure consistent processing
    blocks.sort((a, b) => a.height - b.height);
    console.log(`[mempool] Found ${blocks.length} blocks at height ${height}`);
    
    return blocks;
  } catch (error) {
    console.error(`[mempool] Error fetching blocks at height ${height}:`, error);
    throw error;
  }
}

// Function to fetch block details with mining pool info
async function fetchBlockDetails(hash: string): Promise<any> {
  try {
    console.log(`[mempool] Fetching details for block ${hash}...`);
    const response = await axios.get(`${MEMPOOL_API_BASE}/block/${hash}`);
    return response.data;
  } catch (error) {
    console.error(`[mempool] Error fetching details for block ${hash}:`, error);
    return null;
  }
}

// Function to get the latest block in our database
async function getLatestBlockFromDb(): Promise<number | null> {
  try {
    const [latestBlock] = await db.select({
      number: schema.blocks.number
    })
    .from(schema.blocks)
    .orderBy(desc(schema.blocks.number))
    .limit(1);
    
    console.log(`[mempool] Latest block in database: ${latestBlock?.number || 'None'}`);
    return latestBlock ? latestBlock.number : null;
  } catch (error) {
    console.error('[mempool] Error getting latest block from database:', error);
    return null;
  }
}

// Process a single mempool block and store it in the database
async function processBlock(block: MempoolBlock): Promise<void> {
  try {
    console.log(`[mempool] Processing block ${block.height}...`);
    
    // Get the previous block's timestamp for time difference calculation
    const [previousBlock] = await db
      .select({ timestamp: schema.blocks.timestamp })
      .from(schema.blocks)
      .where(eq(schema.blocks.number, block.height - 1))
      .limit(1);
    
    // Calculate time since previous block (in minutes)
    const blockTimestamp = new Date(block.timestamp * 1000);
    const previousTimestamp = previousBlock?.timestamp;
    const foundInMinutes = previousTimestamp 
      ? (blockTimestamp.getTime() - previousTimestamp.getTime()) / (1000 * 60)
      : null;
    
    // Normalize pool slug
    const poolSlug = block.extras?.pool?.slug || 
                     (block.extras?.pool?.name || 'unknown')
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, '');
    
    // Convert subsidy amount (block reward) plus fees to total output
    const blockSubsidy = 3.125; // Current block subsidy as of April 2024 halving
    const fees = block.extras?.totalFees ? block.extras.totalFees / 100000000 : 0; // Convert sats to BTC
    const totalOutput = blockSubsidy + fees;
    
    // Create block data for insertion
    const blockData: InsertBlock = {
      number: block.height,
      poolSlug,
      timestamp: blockTimestamp,
      status: 'completed',
      isPublished: false,
      foundInMinutes,
      totalOutputAmount: totalOutput || block.reward || 0,
      totalInputAmount: null, // Typically calculated elsewhere
      fees,
      size: block.size ? block.size / 1000000 : null, // Convert bytes to MB
      txCount: block.tx_count
    };
    
    // Insert the block, ignore if it already exists
    await db.insert(schema.blocks)
      .values(blockData)
      .onConflictDoNothing();
    
    console.log(`[mempool] Successfully stored block ${block.height}`);
  } catch (error) {
    // Check for duplicate key error (block already exists)
    if (error instanceof Error && error.message.includes('duplicate key')) {
      console.log(`[mempool] Block ${block.height} already exists, skipping`);
    } else {
      console.error(`[mempool] Error processing block ${block.height}:`, error);
      throw error;
    }
  }
}

// Process a batch of blocks
async function processBatch(startHeight: number, endHeight: number): Promise<number> {
  let processedCount = 0;
  const totalHeights = endHeight - startHeight + 1;
  
  // Process blocks in sequence from start to end height
  for (let i = 0; i <= totalHeights - 1; i++) {
    const height = startHeight + i;
    const progress = Math.round((i / totalHeights) * 100);
    
    // Create a progress bar
    const progressBar = Array(20).fill('▯');
    const filledCount = Math.floor(progress / 5);
    for (let j = 0; j < filledCount; j++) {
      progressBar[j] = '▮';
    }
    
    console.log(`[mempool] PROGRESS: ${progress}% |${progressBar.join('')}| Processing block height ${height} of ${endHeight} in current batch`);
    
    try {
      // Fetch blocks at current height
      const mempoolBlocks = await getBlocksAtHeight(height);
      
      // If no blocks found at this height, continue
      if (mempoolBlocks.length === 0) {
        console.log(`[mempool] No blocks found at height ${height}, skipping`);
        continue;
      }
      
      // Process each block at this height
      for (const block of mempoolBlocks) {
        await processBlock(block);
        processedCount++;
      }
      
      // Add small delay between API calls to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, API_RATE_LIMIT_DELAY));
    } catch (error) {
      console.error(`[mempool] Error processing height ${height}:`, error);
      // Continue with the next height rather than aborting the whole batch
    }
  }
  
  return processedCount;
}

// Function to print overall progress information
async function printOverallProgress(startHeight: number, currentBatchEnd: number, currentHeight: number): Promise<void> {
  try {
    // Calculate overall progress
    const totalToSync = currentHeight - startHeight + 1;
    const synced = currentBatchEnd - startHeight + 1;
    const overallProgress = Math.round((synced / totalToSync) * 100);
    
    // Get counts from database
    const [result] = await db.select({
      count: sql`count(*)`.as('count')
    }).from(schema.blocks);
    
    const databaseCount = result?.count || 0;
    
    // Create a progress bar
    const progressBar = Array(30).fill('▯');
    const filledCount = Math.floor(overallProgress / (100 / 30));
    for (let j = 0; j < filledCount; j++) {
      progressBar[j] = '▮';
    }
    
    console.log(`\n[mempool] OVERALL PROGRESS: ${overallProgress}% |${progressBar.join('')}|`);
    console.log(`[mempool] Blocks in database: ${databaseCount}`);
    console.log(`[mempool] Synced ${synced} out of ${totalToSync} blocks (${currentHeight - currentBatchEnd} blocks remaining)`);
    console.log(`[mempool] Current database height: ${currentBatchEnd}`);
    console.log(`[mempool] Current blockchain height: ${currentHeight}`);
    console.log(`[mempool] Gap remaining: ${currentHeight - currentBatchEnd} blocks\n`);
  } catch (error) {
    console.error('[mempool] Error printing progress:', error);
  }
}

// Main function to sync blocks
async function syncBlocks(blocksToProcess: number = 50): Promise<void> {
  console.log(`[mempool] Starting block sync process for up to ${blocksToProcess} blocks...`);
  
  try {
    // Get the latest block from our database
    const latestBlockInDb = await getLatestBlockFromDb();
    const startHeight = latestBlockInDb ? latestBlockInDb + 1 : 880000; // Start from a reasonable default if no blocks
    
    // Get current blockchain height
    const currentHeight = await getCurrentBlockHeight();
    
    if (currentHeight < startHeight) {
      console.log(`[mempool] Database appears to be ahead of blockchain, nothing to sync`);
      return;
    }
    
    // Calculate how many blocks we could process
    const totalBlocksToSync = Math.min(currentHeight - startHeight + 1, blocksToProcess);
    console.log(`[mempool] Need to sync ${totalBlocksToSync} blocks from ${startHeight} to ${startHeight + totalBlocksToSync - 1}`);
    
    // Calculate number of batches needed
    const batchCount = Math.ceil(totalBlocksToSync / BATCH_SIZE);
    console.log(`[mempool] Will process in ${batchCount} batches of ${BATCH_SIZE} blocks each`);
    
    let totalProcessed = 0;
    
    // Process blocks in batches to avoid overloading the API and database
    for (let i = 0; i < batchCount; i++) {
      const batchStartHeight = startHeight + (i * BATCH_SIZE);
      const batchEndHeight = Math.min(batchStartHeight + BATCH_SIZE - 1, startHeight + totalBlocksToSync - 1);
      
      console.log(`\n[mempool] ===== BATCH ${i + 1}/${batchCount} =====`);
      console.log(`[mempool] Processing heights ${batchStartHeight} to ${batchEndHeight}`);
      
      const processedInBatch = await processBatch(batchStartHeight, batchEndHeight);
      totalProcessed += processedInBatch;
      
      // Print overall progress after each batch
      await printOverallProgress(startHeight, batchEndHeight, currentHeight);
      
      console.log(`[mempool] Completed batch ${i + 1}/${batchCount}, processed ${processedInBatch} blocks`);
      
      // Add delay between batches
      if (i < batchCount - 1) {
        console.log(`[mempool] Waiting before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    console.log(`\n[mempool] Block sync completed. Total blocks processed: ${totalProcessed}`);
    // Final progress report
    await printOverallProgress(startHeight, startHeight + totalBlocksToSync - 1, currentHeight);
  } catch (error) {
    console.error('[mempool] Error during block sync:', error);
    throw error;
  }
}

// Run the script
const blocksToFetch = process.argv[2] ? parseInt(process.argv[2]) : 50;

console.log(`Starting block sync for up to ${blocksToFetch} blocks...`);
syncBlocks(blocksToFetch)
  .then(() => {
    console.log('Block sync completed successfully');
    pool.end().then(() => process.exit(0));
  })
  .catch(error => {
    console.error('Error during block sync:', error);
    pool.end().then(() => process.exit(1));
  });