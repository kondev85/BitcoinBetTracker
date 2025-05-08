import { Router, type Express } from 'express';
import { repository } from './repository';
import { db } from './db';
import { z } from 'zod';
import { sql } from 'drizzle-orm';
import axios from 'axios';
import { getRedisClient } from './redis';
import { storage } from './storage';
import { registerRoutes } from './routes';
import { insertBlockMinerOddsSchema, insertPaymentAddressSchema, insertTimeBetsSchema } from '@shared/schema';

// Create the routers
const apiRouter = Router();
const adminRouter = Router();

// Flag to track Redis connection
let redisConnected = false;

// Helper function to standardize pool names for consistent display and coloring
function standardizePoolName(poolName: string): string {
  // Map of pool name variations to standard names
  const poolNameMap: Record<string, string> = {
    // Foundry variations
    'foundry-usa': 'Foundry USA',
    'foundryusa': 'Foundry USA',
    // MARA variations
    'mara-pool': 'MARA Pool',
    'marapool': 'MARA Pool',
    // Binance variations
    'binance-pool': 'Binance Pool',
    'binancepool': 'Binance Pool',
    // Carbon variations
    'carbon-neutral': 'Carbon Negative',
    'carbonneutral': 'Carbon Negative',
    'carbon-negative': 'Carbon Negative',
    'carbonnegative': 'Carbon Negative',
    // Spider variations
    'spider-pool': 'SpiderPool',
    'spiderpool': 'SpiderPool',
    // SBI variations
    'sbi-crypto': 'SBI Crypto',
    'sbicrypto': 'SBI Crypto',
    // Other common variations
    'btc.com': 'BTC.com',
    'btccom': 'BTC.com',
    'secpool': 'SECPOOL',
    'mining-squared': 'Mining Squared',
    'miningsquared': 'Mining Squared',
    'unknown': 'Unknown'
  };
  
  // Check if the pool name (lowercased) is in our map
  const normalizedName = poolName.toLowerCase().replace(/[\s\-\.]/g, '');
  if (poolNameMap[normalizedName]) {
    return poolNameMap[normalizedName];
  }
  
  // If not in our map, return the original name
  return poolName;
}

// Helper function to assign colors to mining pools
function getColorForPool(poolName: string): string {
  // First, standardize the pool name
  const standardizedName = standardizePoolName(poolName);
  
  const poolColors: Record<string, string> = {
    'Foundry USA': '#F7931A', // Bitcoin orange for Foundry
    'AntPool': '#3B82F6',     // Blue
    'F2Pool': '#10B981',      // Green
    'ViaBTC': '#6D28D9',      // Changed to deep purple to differentiate from Foundry
    'Binance Pool': '#6366F1', // Indigo
    'Luxor': '#EC4899',       // Pink
    'SBI Crypto': '#06B6D4',  // Cyan
    'Poolin': '#EF4444',      // Red
    'BTC.com': '#0EA5E9',     // Sky blue
    'MARA Pool': '#84CC16',   // Lime green
    'SlushPool': '#2563EB',   // Royal blue
    'SECPOOL': '#8B5CF6',     // Violet
    'Mining Squared': '#F472B6', // Pink
    'OCEAN': '#0D9488',       // Teal
    'SpiderPool': '#FB923C',  // Orange
    'WhitePool': '#A1A1AA',   // Zinc/gray
    'Carbon Negative': '#22C55E', // Green
    'Unknown': '#A3A3A3'      // Gray
  };
  
  return poolColors[standardizedName] || `#${Math.floor(Math.random()*16777215).toString(16)}`;
}

// Response type for mining pools data
interface MiningPoolsResponse {
  pools: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  networkStats: {
    lastEstimatedHashrate: number;
    lastEstimatedHashrate3d: number;
    lastEstimatedHashrate1w: number;
    blockCount: number;
  };
}

// Get mining pools data from mempool.space and cache it in Redis
async function fetchAndCacheMiningPools(period: string = '1w'): Promise<MiningPoolsResponse> {
  try {
    // Check if data is in Redis cache (if Redis is connected)
    const redisClient = getRedisClient();
    if (redisClient) {
      const cacheKey = `mempool:mining-pools:${period}`;
      try {
        const cachedData = await redisClient.get(cacheKey);
        
        if (cachedData) {
          console.log(`Using cached mining pools data for ${period}`);
          return JSON.parse(cachedData);
        }
      } catch (redisError) {
        console.error('Redis cache retrieval error:', redisError);
        // Continue to fetch from API if Redis retrieval fails
      }
    } else {
      console.log('Redis not connected, skipping cache lookup');
    }
    
    // Fetch data from mempool.space API
    console.log(`Fetching fresh mining pools data for ${period} from mempool.space`);
    const response = await axios.get(`https://mempool.space/api/v1/mining/pools/${period}`);
    
    // The API returns an object with a 'pools' property containing the array
    const poolsData = response.data;
    
    if (!poolsData || !poolsData.pools || !Array.isArray(poolsData.pools)) {
      console.error('Unexpected API response format:', poolsData);
      throw new Error('Invalid API response format from mempool.space');
    }
    
    // Process and format the data
    const formattedPools = poolsData.pools.map((pool: any) => {
      // Standardize the pool name
      const standardizedName = standardizePoolName(pool.name);
      // Get color based on standardized name
      const color = getColorForPool(standardizedName);
      
      return {
        name: standardizedName,
        value: pool.blockCount,
        color: color
      };
    }).sort((a: any, b: any) => b.value - a.value);
    
    // Extract network stats from the response with period-specific hashrates
    const networkStats = {
      lastEstimatedHashrate: poolsData.lastEstimatedHashrate || 0,
      lastEstimatedHashrate3d: poolsData.lastEstimatedHashrate3d || 0,
      lastEstimatedHashrate1w: poolsData.lastEstimatedHashrate1w || 0,
      blockCount: poolsData.pools.reduce((sum: number, pool: any) => sum + pool.blockCount, 0)
    };
    
    // Format the complete response
    const formattedResponse = {
      pools: formattedPools,
      networkStats
    };
    
    // Cache the data in Redis if connected (expire after 15 minutes)
    if (redisClient) {
      try {
        const cacheKey = `mempool:mining-pools:${period}`;
        await redisClient.set(cacheKey, JSON.stringify(formattedResponse), {
          EX: 15 * 60
        });
        console.log(`Cached mining pools data for ${period} in Redis`);
      } catch (redisError) {
        console.error('Redis cache storing error:', redisError);
        // Continue even if Redis storage fails
      }
    }
    
    return formattedResponse;
  } catch (error) {
    console.error('Error fetching mining pools data:', error);
    throw error;
  }
}

// Add routes to the API router

// GET /api/blocks - Get all blocks
apiRouter.get('/blocks', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const blocks = await repository.getRecentBlocks(limit);
    res.json(blocks);
  } catch (error) {
    console.error('Error fetching blocks:', error);
    res.status(500).json({ error: 'Failed to fetch blocks' });
  }
});

// GET /api/blocks/:number - Get a specific block by number
apiRouter.get('/blocks/:number', async (req, res) => {
  try {
    const number = parseInt(req.params.number);
    const block = await repository.getBlockByNumber(number);
    
    if (!block) {
      return res.status(404).json({ error: 'Block not found' });
    }
    
    res.json(block);
  } catch (error) {
    console.error('Error fetching block:', error);
    res.status(500).json({ error: 'Failed to fetch block' });
  }
});

// GET /api/miners - Get all miners
apiRouter.get('/miners', async (req, res) => {
  try {
    const miners = await repository.getAllMiners();
    res.json(miners);
  } catch (error) {
    console.error('Error fetching miners:', error);
    res.status(500).json({ error: 'Failed to fetch miners' });
  }
});

// GET /api/miners/:id - Get a specific miner by ID
apiRouter.get('/miners/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const miner = await repository.getMinerById(id);
    
    if (!miner) {
      return res.status(404).json({ error: 'Miner not found' });
    }
    
    res.json(miner);
  } catch (error) {
    console.error('Error fetching miner:', error);
    res.status(500).json({ error: 'Failed to fetch miner' });
  }
});

// GET /api/odds/:blockNumber - Get betting odds for a specific block
apiRouter.get('/odds/:blockNumber', async (req, res) => {
  try {
    const blockNumber = parseInt(req.params.blockNumber);
    const odds = await repository.getOddsForBlock(blockNumber);
    res.json(odds);
  } catch (error) {
    console.error('Error fetching odds:', error);
    res.status(500).json({ error: 'Failed to fetch odds' });
  }
});

// GET /api/bets/:blockId - Get bets for a specific block
apiRouter.get('/bets/:blockId', async (req, res) => {
  try {
    const blockId = parseInt(req.params.blockId);
    const bets = await repository.getBetsForBlock(blockId);
    res.json(bets);
  } catch (error) {
    console.error('Error fetching bets:', error);
    res.status(500).json({ error: 'Failed to fetch bets' });
  }
});

// GET /api/stats/miners - Get miner statistics
apiRouter.get('/stats/miners', async (req, res) => {
  try {
    const stats = await repository.getMinerStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching miner stats:', error);
    res.status(500).json({ error: 'Failed to fetch miner stats' });
  }
});

// GET /api/stats - Get general statistics
apiRouter.get('/stats', async (req, res) => {
  try {
    const [blocksCount, minersCount, betsCount] = await Promise.all([
      repository.getBlocksCount(),
      repository.getMinersCount(),
      repository.getBetsCount()
    ]);
    
    res.json({
      blocksCount,
      minersCount,
      betsCount,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/health - Health check endpoint
apiRouter.get('/health', async (req, res) => {
  try {
    const dbConnected = await repository.testConnection();
    
    if (!dbConnected) {
      return res.status(500).json({
        status: 'error',
        database: 'disconnected'
      });
    }
    
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Health check failed'
    });
  }
});

// GET /api/mining-stats/:blockCount - Calculate mining statistics
apiRouter.get('/mining-stats/:blockCount', async (req, res) => {
  try {
    console.log("API endpoint /api/mining-stats/:blockCount called");
    const blockCount = parseInt(req.params.blockCount);
    console.log(`Fetching stats for ${blockCount} blocks`);
    
    // Get the most recent blocks for actual block count
    const blocks = await repository.getRecentBlocks(blockCount);
    console.log(`Found ${blocks.length} blocks`);
    
    // Count blocks by mining pool
    const blocksByPool: Record<string, number> = {};
    blocks.forEach(block => {
      // Standardize the pool slug for consistent naming
      const normalizedPoolSlug = (block.poolSlug || 'unknown').toLowerCase().replace(/[\s\-\.]/g, '');
      
      if (!blocksByPool[normalizedPoolSlug]) {
        blocksByPool[normalizedPoolSlug] = 0;
      }
      blocksByPool[normalizedPoolSlug]++;
    });
    
    console.log('Pool blocks count:', Object.entries(blocksByPool).map(([pool, count]) => `${pool}: ${count}`).join(', '));
    
    // Get mining pool data directly from mempool.space API with caching
    // We use 1w period for more stable hashrate percentages
    const period = '1w';
    
    // Check if data is in Redis cache (if Redis is connected)
    const redisClient = getRedisClient();
    let mempoolPoolsData;
    
    if (redisClient) {
      const cacheKey = `mempool:mining-pools:${period}`;
      try {
        const cachedData = await redisClient.get(cacheKey);
        
        if (cachedData) {
          console.log(`Using cached mining pools data for ${period}`);
          mempoolPoolsData = JSON.parse(cachedData);
        }
      } catch (redisError) {
        console.error('Redis cache retrieval error:', redisError);
        // Continue to fetch from API if Redis retrieval fails
      }
    }
    
    // If not in cache, fetch directly
    if (!mempoolPoolsData) {
      console.log(`Fetching fresh mining pools data for ${period} from mempool.space`);
      const response = await axios.get(`https://mempool.space/api/v1/mining/pools/${period}`);
      
      if (!response.data || !response.data.pools || !Array.isArray(response.data.pools)) {
        throw new Error('Invalid API response format from mempool.space');
      }
      
      mempoolPoolsData = response.data;
      
      // Cache the data in Redis if connected (expire after 1 hour)
      if (redisClient) {
        try {
          await redisClient.set(`mempool:mining-pools:${period}`, JSON.stringify(mempoolPoolsData), {
            EX: 60 * 60 // 1 hour expiration
          });
          console.log(`Cached mining pools data for ${period} in Redis`);
        } catch (redisError) {
          console.error('Redis cache storing error:', redisError);
        }
      }
    }
    
    // Process the mempool.space data
    const totalBlocks = mempoolPoolsData.pools.reduce((sum: number, pool: any) => sum + pool.blockCount, 0);
    console.log(`Total blocks from mempool API (${period}): ${totalBlocks}`);
    
    // Format and calculate the stats
    const poolStats = mempoolPoolsData.pools.map((pool: any) => {
      // Standardize the pool name
      const standardizedName = standardizePoolName(pool.name);
      
      // Calculate hashrate percentage from mempool data
      const hashratePercent = (pool.blockCount / totalBlocks) * 100;
      
      // Normalize name for comparison with our database
      const poolSlug = pool.slug || pool.name.toLowerCase().replace(/[\s\-\.]/g, '');
      const normalizedPoolSlug = poolSlug.toLowerCase().replace(/[\s\-\.]/g, '');
      
      // Get actual blocks found in our database
      const blocksFound = blocksByPool[normalizedPoolSlug] || 0;
      
      // Calculate expected blocks based on hashrate percentage
      const expected = (hashratePercent * blocks.length) / 100;
      
      // Calculate luck
      const luck = expected > 0 ? (blocksFound / expected) * 100 : 0;
      
      return {
        name: poolSlug.toLowerCase(),
        displayName: standardizedName,
        color: getColorForPool(standardizedName),
        hashratePct: hashratePercent,
        expectedBlocks: expected,
        actualBlocks: blocksFound,
        luck: luck
      };
    })
    .filter((pool: any) => pool.hashratePct > 0 || pool.actualBlocks > 0)
    .sort((a: any, b: any) => b.hashratePct - a.hashratePct);
    
    console.log(`Returning stats for ${poolStats.length} mining pools`);
    res.json(poolStats);
  } catch (error) {
    console.error('Error calculating mining stats:', error);
    res.status(500).json({ error: "Failed to calculate mining stats" });
  }
});

// GET /api/mempool/mining-pools/:period - Get mining pool data from mempool.space API
apiRouter.get('/mempool/mining-pools/:period?', async (req, res) => {
  try {
    const period = req.params.period || '1w';
    // Validate period - only allow 24h, 3d, or 1w
    if (!['24h', '3d', '1w'].includes(period)) {
      return res.status(400).json({ error: "Invalid period. Allowed values: 24h, 3d, 1w" });
    }
    
    const poolsData = await fetchAndCacheMiningPools(period);
    res.json(poolsData);
  } catch (error) {
    console.error('Error in /api/mempool/mining-pools endpoint:', error);
    res.status(500).json({ error: "Failed to fetch mining pool data from mempool.space" });
  }
});

// Set the redisConnected flag - this should be called during initialization
export const setRedisConnected = (isConnected: boolean) => {
  redisConnected = isConnected;
  console.log('Redis connection status set to:', redisConnected ? 'Connected' : 'Not connected');
};

// GET /api/reserve-addresses - Get all reserve addresses
apiRouter.get('/reserve-addresses', async (req, res) => {
  try {
    const addresses = await storage.getAllReserveAddresses();
    res.json(addresses);
  } catch (error) {
    console.error('Error fetching reserve addresses:', error);
    res.status(500).json({ error: 'Failed to fetch reserve addresses' });
  }
});

// GET /api/betting-options - Get all available betting options
apiRouter.get('/betting-options', async (req, res) => {
  try {
    // Return available betting options
    const bettingOptions = [
      { id: 'mining_pool', name: 'Mining Pool Will Mine', description: 'Bet on which mining pool will mine the next block' },
      { id: 'block_time', name: 'Block Time', description: 'Bet on when the next block will be mined' }
    ];
    res.json(bettingOptions);
  } catch (error) {
    console.error('Error fetching betting options:', error);
    res.status(500).json({ error: 'Failed to fetch betting options' });
  }
});

// GET /api/mining-pools - Get all mining pools
apiRouter.get('/mining-pools', async (req, res) => {
  try {
    const pools = await storage.getAllMiningPools();
    res.json(pools);
  } catch (error) {
    console.error('Error fetching mining pools:', error);
    res.status(500).json({ error: 'Failed to fetch mining pools' });
  }
});

// GET /api/published-blocks - Get all published blocks
apiRouter.get('/published-blocks', async (req, res) => {
  try {
    // Get all published blocks or active ones based on query parameter
    const showAll = req.query.all === 'true';
    const blocks = showAll 
      ? await storage.getAllPublishedBlocks()
      : await storage.getActivePublishedBlocks();
    
    res.json(blocks);
  } catch (error) {
    console.error('Error fetching published blocks:', error);
    res.status(500).json({ error: 'Failed to fetch published blocks' });
  }
});

// Admin routes for publishing blocks
adminRouter.post("/published-blocks", async (req, res) => {
  try {
    // Support both estimatedDate or estimatedTime (frontend uses estimatedDate)
    const { height, estimatedDate, estimatedTime, timeThreshold, isActive, description, isSpecial } = req.body;
    
    // Use estimatedDate if provided, otherwise fall back to estimatedTime
    const estimatedDateTime = estimatedDate || estimatedTime;
    
    if (!height || !estimatedDateTime) {
      return res.status(400).json({ error: "Missing required fields: height and estimated date/time" });
    }
    
    const existingBlock = await storage.getPublishedBlockByHeight(parseInt(height));
    
    if (existingBlock) {
      return res.status(400).json({ error: "Block with this height already exists" });
    }
    
    // Get the current blockchain height to calculate estimated time if needed
    let currentBlockHeight;
    try {
      const blocksRes = await fetch('https://mempool.space/api/blocks/tip/height');
      currentBlockHeight = parseInt(await blocksRes.text());
    } catch (error) {
      console.error('Failed to fetch current block height:', error);
      // Default to a reasonable value if we can't get current height
      currentBlockHeight = 895000;  
    }
    
    // For estimating block time
    const blockHeightDiff = parseInt(height) - currentBlockHeight;
    const minutesPerBlock = 10; // Average Bitcoin block time
    
    // Calculate the estimated time if not explicitly provided
    let estimatedTimeDate;
    if (estimatedDateTime) {
      estimatedTimeDate = new Date(estimatedDateTime);
    } else {
      // Auto-calculate based on current time + (block height difference * 10 minutes)
      estimatedTimeDate = new Date();
      estimatedTimeDate.setMinutes(estimatedTimeDate.getMinutes() + (blockHeightDiff * minutesPerBlock));
    }
    
    const blockData = {
      height: parseInt(height),
      estimatedTime: estimatedTimeDate,
      timeThreshold: timeThreshold || 10,
      isActive: isActive !== undefined ? isActive : true,
      description: description || null,
      isSpecial: isSpecial || false
    };
    
    console.log("Creating published block with data:", blockData);
    const newBlock = await storage.createPublishedBlock(blockData);
    res.status(201).json(newBlock);
  } catch (error) {
    console.error("Error creating published block:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to create published block" });
  }
});

// Update a published block
adminRouter.put("/published-blocks/:height", async (req, res) => {
  try {
    const height = parseInt(req.params.height);
    const blockData = req.body;
    
    const updatedBlock = await storage.updatePublishedBlock(height, blockData);
    
    if (!updatedBlock) {
      return res.status(404).json({ error: "Published block not found" });
    }
    
    res.json(updatedBlock);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to update published block" });
  }
});

// Block miner odds (mining pool-specific betting)
adminRouter.post("/block-miner-odds", async (req, res) => {
  try {
    const oddsData = insertBlockMinerOddsSchema.parse(req.body);
    const newOdds = await storage.createBlockMinerOdds(oddsData);
    res.status(201).json(newOdds);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to create block miner odds" });
  }
});

// Get block miner odds for a specific block
apiRouter.get("/block-miner-odds/:blockNumber", async (req, res) => {
  try {
    const blockNumber = parseInt(req.params.blockNumber);
    const odds = await storage.getBlockMinerOddsByBlockNumber(blockNumber);
    res.json(odds);
  } catch (error) {
    console.error('Error fetching block miner odds:', error);
    res.status(500).json({ error: "Failed to fetch block miner odds" });
  }
});

// Get all block miner odds
apiRouter.get("/block-miner-odds", async (req, res) => {
  try {
    const odds = await storage.getAllBlockMinerOdds();
    res.json(odds);
  } catch (error) {
    console.error('Error fetching all block miner odds:', error);
    res.status(500).json({ error: "Failed to fetch block miner odds" });
  }
});

// Add POST endpoint for block-miner-odds to apiRouter for frontend compatibility
apiRouter.post("/block-miner-odds", async (req, res) => {
  try {
    const oddsData = insertBlockMinerOddsSchema.parse(req.body);
    const newOdds = await storage.createBlockMinerOdds(oddsData);
    res.status(201).json(newOdds);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating block miner odds:', error);
    res.status(500).json({ error: "Failed to create block miner odds" });
  }
});

// Time bets
adminRouter.post("/time-bets", async (req, res) => {
  try {
    console.log('Received time bet data:', JSON.stringify(req.body));
    const betData = insertTimeBetsSchema.parse(req.body);
    console.log('Parsed time bet data:', JSON.stringify(betData));
    const newBet = await storage.createTimeBet(betData);
    console.log('Created time bet:', JSON.stringify(newBet));
    res.status(201).json(newBet);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod validation error for time bet:', error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating time bet:', error);
    res.status(500).json({ error: "Failed to create time bet" });
  }
});

// Time bet by block number
adminRouter.get("/time-bets/:blockNumber", async (req, res) => {
  try {
    const blockNumber = parseInt(req.params.blockNumber);
    const bet = await storage.getTimeBetByBlockNumber(blockNumber);
    
    if (!bet) {
      return res.status(404).json({ error: "Time bet not found for this block" });
    }
    
    res.json(bet);
  } catch (error) {
    console.error('Error fetching time bet:', error);
    res.status(500).json({ error: "Failed to fetch time bet" });
  }
});

// Update time bet
adminRouter.put("/time-bets/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const betData = req.body;
    
    const updatedBet = await storage.updateTimeBet(id, betData);
    
    if (!updatedBet) {
      return res.status(404).json({ error: "Time bet not found" });
    }
    
    res.json(updatedBet);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating time bet:', error);
    res.status(500).json({ error: "Failed to update time bet" });
  }
});

// Payment addresses
adminRouter.post("/payment-addresses", async (req, res) => {
  try {
    console.log('Received payment address data:', JSON.stringify(req.body));
    const addressData = insertPaymentAddressSchema.parse(req.body);
    console.log('Parsed payment address data:', JSON.stringify(addressData));
    
    // Helper function to safely convert null to undefined
    const nullToUndefined = <T>(value: T | null): T | undefined => {
      return value === null ? undefined : value;
    };

    // Check if a payment address already exists with these criteria
    const existingAddresses = await storage.getPaymentAddressesByBlockNumber(
      addressData.betId,
      addressData.betType,
      addressData.outcome,
      addressData.betType === 'miner' ? nullToUndefined(addressData.poolSlug) : undefined,
      addressData.betType === 'time' ? nullToUndefined(addressData.odds) : undefined
    );
    
    if (existingAddresses && existingAddresses.length > 0) {
      // Update existing payment address
      console.log(`Found existing payment address with ID ${existingAddresses[0].id}, updating it`);
      const updatedAddress = await storage.updatePaymentAddress(existingAddresses[0].id, addressData);
      
      if (!updatedAddress) {
        return res.status(404).json({ error: "Failed to update payment address" });
      }
      
      console.log('Updated payment address:', JSON.stringify(updatedAddress));
      return res.json(updatedAddress);
    }
    
    // Create new payment address
    const newAddress = await storage.createPaymentAddress(addressData);
    console.log('Created payment address:', JSON.stringify(newAddress));
    res.status(201).json(newAddress);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod validation error for payment address:', error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error managing payment address:', error);
    res.status(500).json({ error: "Failed to create or update payment address" });
  }
});

export { apiRouter, adminRouter };