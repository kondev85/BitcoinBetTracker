import { db, pool } from '../server/db';
import * as schema from '../shared/schema';
import axios from 'axios';
import { eq, desc, sql } from 'drizzle-orm';

// Mempool.space API base URL
const MEMPOOL_API_BASE = 'https://mempool.space/api/v1';

// Function to fetch recent blocks from mempool.space API
async function fetchRecentBlocks(limit: number = 10): Promise<any[]> {
  try {
    console.log(`Fetching ${limit} recent blocks from mempool.space API...`);
    const response = await axios.get(`${MEMPOOL_API_BASE}/blocks`, { 
      params: { limit }
    });
    
    if (!Array.isArray(response.data)) {
      console.error('Invalid API response, expected array:', response.data);
      return [];
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching blocks from mempool.space:', error);
    return [];
  }
}

// Function to get block details with mining pool info from mempool.space API
async function fetchBlockDetails(hash: string): Promise<any> {
  try {
    console.log(`Fetching details for block ${hash}...`);
    const response = await axios.get(`${MEMPOOL_API_BASE}/block/${hash}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching details for block ${hash}:`, error);
    return null;
  }
}

// Function to get the last block in our database
async function getLatestBlockFromDb(): Promise<number | null> {
  try {
    const [latestBlock] = await db.select({
      number: schema.blocks.number
    })
    .from(schema.blocks)
    .orderBy(desc(schema.blocks.number))
    .limit(1);
    
    return latestBlock ? latestBlock.number : null;
  } catch (error) {
    console.error('Error getting latest block from database:', error);
    return null;
  }
}

// Function to calculate time difference in minutes between two blocks
function calculateTimeDifference(currentBlockTime: number, previousBlockTime: number): number {
  // Convert to minutes
  return (currentBlockTime - previousBlockTime) / 60;
}

// Function to store a block in the database
async function storeBlock(blockData: any, previousBlockTime: number | null = null): Promise<void> {
  try {
    const blockTime = blockData.timestamp;
    
    // Calculate time since last block if we have previous block data
    const foundInMinutes = previousBlockTime 
      ? calculateTimeDifference(blockTime, previousBlockTime)
      : null;
    
    // Prepare block data for insertion
    const blockToInsert = {
      number: blockData.height,
      poolSlug: blockData.extras?.pool_slug || blockData.pool?.slug || null,
      timestamp: new Date(blockTime * 1000), // Convert UNIX timestamp to Date
      status: 'completed',
      isPublished: false,
      foundInMinutes,
      // These fields might be null if not available in the API response
      totalOutputAmount: blockData.extras?.totalOutputAmount || blockData.reward || null,
      fees: blockData.extras?.fees || null,
      size: blockData.size ? blockData.size / 1000000 : null, // Convert bytes to MB
      txCount: blockData.tx_count || null,
    };
    
    // Insert the block, ignore if it already exists
    await db.insert(schema.blocks)
      .values(blockToInsert)
      .onConflictDoNothing();
    
    console.log(`Stored block ${blockData.height} in database`);
  } catch (error) {
    console.error(`Error storing block ${blockData.height}:`, error);
  }
}

// Main function to fetch and store blocks
async function syncRecentBlocks(blocksToFetch: number = 10): Promise<void> {
  try {
    // Get the latest block from our database
    const latestBlockInDb = await getLatestBlockFromDb();
    console.log(`Latest block in database: ${latestBlockInDb || 'None'}`);
    
    // Fetch recent blocks from mempool.space
    const recentBlocks = await fetchRecentBlocks(blocksToFetch);
    
    if (recentBlocks.length === 0) {
      console.log('No blocks fetched from API, exiting');
      return;
    }
    
    console.log(`Fetched ${recentBlocks.length} blocks from API`);
    
    // Filter out blocks we already have (if any)
    const newBlocks = latestBlockInDb 
      ? recentBlocks.filter(block => block.height > latestBlockInDb)
      : recentBlocks;
    
    console.log(`Found ${newBlocks.length} new blocks to add`);
    
    // Sort blocks by height (ascending) to process them in order
    newBlocks.sort((a, b) => a.height - b.height);
    
    // Fetch detailed information for each block and store it
    let previousBlockTime = null;
    
    for (const block of newBlocks) {
      // Fetch additional details if available
      const blockDetails = await fetchBlockDetails(block.id);
      
      // Merge basic and detailed information
      const enrichedBlock = { 
        ...block, 
        extras: blockDetails 
      };
      
      // Store the block in the database
      await storeBlock(enrichedBlock, previousBlockTime);
      
      // Update previous block time for next iteration
      previousBlockTime = block.timestamp;
    }
    
    console.log(`Successfully synced ${newBlocks.length} new blocks`);
  } catch (error) {
    console.error('Error syncing recent blocks:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the script
const blocksToFetch = process.argv[2] ? parseInt(process.argv[2]) : 10;
syncRecentBlocks(blocksToFetch)
  .then(() => {
    console.log('Block sync completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error running block sync:', error);
    process.exit(1);
  });