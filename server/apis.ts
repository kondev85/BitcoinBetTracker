import { Router } from 'express';
import { repository } from './repository';
import { z } from 'zod';
import axios from 'axios';
import { getRedisClient } from './redis';

// Flag to track Redis connection
let redisConnected = false;

// Helper function to assign colors to mining pools
function getColorForPool(poolName: string): string {
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
    'Carbon Negative': '#22C55E' // Green
  };
  
  return poolColors[poolName] || `#${Math.floor(Math.random()*16777215).toString(16)}`;
}

// Get mining pools data from mempool.space and cache it in Redis
async function fetchAndCacheMiningPools(period: string = '1w'): Promise<any[]> {
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
      // Generate a color if not available (simple function to assign colors)
      const color = getColorForPool(pool.name);
      
      return {
        name: pool.name,
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

// Create a router to handle API requests
const apiRouter = Router();

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

export { apiRouter };