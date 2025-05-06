import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import {
  insertBlockSchema,
  insertBlockMinerOddsSchema,
  insertTimeBetsSchema,
  insertPaymentAddressSchema,
} from "@shared/schema";

// Create a schema for published blocks from the block schema
const insertPublishedBlockSchema = z.object({
  height: z.number(),
  status: z.string(),
  publishedAt: z.string().transform(str => new Date(str)),
  isActive: z.boolean().default(true),
});
import { z } from "zod";
import { getRedisClient } from "./redis";
import axios from "axios";

// Check database connection and verify existing tables
async function initializeData() {
  try {
    console.log("Checking Neon database connection...");
    
    try {
      // Verify database connection by testing a few tables
      const blocks = await storage.getAllBlocks();
      console.log(`Connected to Neon database successfully. Found ${blocks.length} blocks.`);
      
      // Check if we have mining pools data
      const pools = await storage.getAllMiningPools();
      console.log(`Found ${pools.length} mining pools in the database.`);
      
      // Check published blocks
      const publishedBlocks = await storage.getAllPublishedBlocks();
      console.log(`Found ${publishedBlocks.length} published blocks in the database.`);
      
      // Check block miner odds
      const blockMinerOdds = await storage.getAllBlockMinerOdds();
      console.log(`Found ${blockMinerOdds.length} block miner odds in the database.`);
      
      // Check reserve addresses
      const reserveAddresses = await storage.getAllReserveAddresses();
      console.log(`Found ${reserveAddresses.length} reserve addresses in the database.`);
      
      console.log("Database tables exist and contain data. Using your existing Neon database.");
      
    } catch (error) {
      console.error('Error connecting to database or tables not found:', error);
      console.error('Please make sure your Neon database has the required tables and data.');
      throw new Error('Database tables not ready or connection error');
    }
  } catch (error) {
    console.error("Failed to initialize data:", error);
    throw error;
  }
}

// Get mining pools data from mempool.space and cache it in Redis
async function fetchAndCacheMiningPools(period: string = '1w'): Promise<any> {
  try {
    // Get Redis client if available
    let redisClient = getRedisClient();
    
    // Check if data is in Redis cache (if Redis is connected)
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize data from CSV
  await initializeData();
  
  // Initialize Redis - we don't need to do anything since redis will try to connect automatically
  // and our getRedisClient() function will handle connection status

  // API routes
  app.get("/api/blocks", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const blocks = await storage.getRecentBlocks(limit);
      res.json(blocks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blocks" });
    }
  });

  app.get("/api/blocks/:height", async (req, res) => {
    try {
      const height = parseInt(req.params.height);
      const block = await storage.getBlockByHeight(height);
      
      if (!block) {
        return res.status(404).json({ error: "Block not found" });
      }
      
      res.json(block);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch block" });
    }
  });

  app.get("/api/mining-pools", async (req, res) => {
    try {
      const pools = await storage.getAllMiningPools();
      res.json(pools);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mining pools" });
    }
  });

  app.get("/api/network-hashrate/:period", async (req, res) => {
    try {
      const period = req.params.period;
      const hashrate = await storage.getNetworkHashrate(period);
      
      if (!hashrate) {
        return res.status(404).json({ error: "Hashrate data not found" });
      }
      
      res.json(hashrate);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch network hashrate" });
    }
  });

  app.get("/api/published-blocks", async (req, res) => {
    try {
      const onlyActive = req.query.active === "true";
      const blocks = onlyActive 
        ? await storage.getActivePublishedBlocks()
        : await storage.getAllPublishedBlocks();
      
      res.json(blocks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch published blocks" });
    }
  });

  app.get("/api/published-blocks/:height", async (req, res) => {
    try {
      const height = parseInt(req.params.height);
      const block = await storage.getPublishedBlockByHeight(height);
      
      if (!block) {
        return res.status(404).json({ error: "Published block not found" });
      }
      
      res.json(block);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch published block" });
    }
  });

  // Betting options are now handled by the dedicated endpoint below

  app.get("/api/reserve-addresses", async (req, res) => {
    try {
      const addresses = await storage.getAllReserveAddresses();
      res.json(addresses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reserve addresses" });
    }
  });
  
  // Get payment addresses for a specific block, bet type, and outcome
  app.get("/api/payment-addresses/:blockNumber/:betType/:outcome", async (req, res) => {
    try {
      const blockNumber = parseInt(req.params.blockNumber);
      const betType = req.params.betType;
      const outcome = req.params.outcome;
      
      // Validate betType
      if (!['miner', 'time'].includes(betType)) {
        return res.status(400).json({ error: "Invalid bet type. Allowed values: miner, time" });
      }
      
      // Validate outcome based on betType
      if (betType === 'miner' && !['hit', 'noHit'].includes(outcome)) {
        return res.status(400).json({ error: "Invalid outcome for miner bet type. Allowed values: hit, noHit" });
      }
      
      if (betType === 'time' && !['under', 'over'].includes(outcome)) {
        return res.status(400).json({ error: "Invalid outcome for time bet type. Allowed values: under, over" });
      }
      
      const addresses = await storage.getPaymentAddressesByBlockNumber(blockNumber, betType, outcome);
      res.json(addresses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payment addresses" });
    }
  });
  
  // Mempool.space API endpoints
  app.get("/api/mempool/mining-pools/:period?", async (req, res) => {
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

  // Admin routes
  app.post("/api/admin/published-blocks", async (req, res) => {
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
      
      const newBlock = await storage.createPublishedBlock(blockData);
      res.status(201).json(newBlock);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create published block" });
    }
  });

  app.put("/api/admin/published-blocks/:height", async (req, res) => {
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
  app.post("/api/admin/block-miner-odds", async (req, res) => {
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

  app.get("/api/admin/block-miner-odds/:blockNumber", async (req, res) => {
    try {
      const blockNumber = parseInt(req.params.blockNumber);
      const odds = await storage.getBlockMinerOddsByBlockNumber(blockNumber);
      res.json(odds);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch block miner odds" });
    }
  });

  app.put("/api/admin/block-miner-odds/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const oddsData = req.body;
      
      const updatedOdds = await storage.updateBlockMinerOdds(id, oddsData);
      
      if (!updatedOdds) {
        return res.status(404).json({ error: "Block miner odds not found" });
      }
      
      res.json(updatedOdds);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update block miner odds" });
    }
  });

  // Time-based bets
  app.post("/api/admin/time-bets", async (req, res) => {
    try {
      const betData = insertTimeBetsSchema.parse(req.body);
      const newBet = await storage.createTimeBet(betData);
      res.status(201).json(newBet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create time bet" });
    }
  });

  app.get("/api/admin/time-bets/:blockNumber", async (req, res) => {
    try {
      const blockNumber = parseInt(req.params.blockNumber);
      const bets = await storage.getTimeBetByBlockNumber(blockNumber);
      
      if (!bets) {
        return res.status(404).json({ error: "Time bet not found for this block" });
      }
      
      res.json(bets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch time bets" });
    }
  });

  app.put("/api/admin/time-bets/:id", async (req, res) => {
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
      res.status(500).json({ error: "Failed to update time bet" });
    }
  });

  // Payment addresses
  app.post("/api/admin/payment-addresses", async (req, res) => {
    try {
      const addressData = insertPaymentAddressSchema.parse(req.body);
      const newAddress = await storage.createPaymentAddress(addressData);
      res.status(201).json(newAddress);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create payment address" });
    }
  });

  app.get("/api/admin/payment-addresses/:betId/:betType/:outcome", async (req, res) => {
    try {
      const betId = parseInt(req.params.betId);
      const betType = req.params.betType;
      const outcome = req.params.outcome;
      
      // Validate betType
      if (!['miner', 'time'].includes(betType)) {
        return res.status(400).json({ error: "Invalid bet type. Allowed values: miner, time" });
      }
      
      // Validate outcome based on betType
      if (betType === 'miner' && !['hit', 'noHit'].includes(outcome)) {
        return res.status(400).json({ error: "Invalid outcome for miner bet type. Allowed values: hit, noHit" });
      }
      
      if (betType === 'time' && !['under', 'over'].includes(outcome)) {
        return res.status(400).json({ error: "Invalid outcome for time bet type. Allowed values: under, over" });
      }
      
      const addresses = await storage.getPaymentAddressesByBlockNumber(betId, betType, outcome);
      res.json(addresses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payment addresses" });
    }
  });

  app.put("/api/admin/payment-addresses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const addressData = req.body;
      
      const updatedAddress = await storage.updatePaymentAddress(id, addressData);
      
      if (!updatedAddress) {
        return res.status(404).json({ error: "Payment address not found" });
      }
      
      res.json(updatedAddress);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update payment address" });
    }
  });

  app.put("/api/admin/mining-pools/:poolSlug", async (req, res) => {
    try {
      const poolSlug = req.params.poolSlug;
      const poolData = req.body;
      
      const updatedPool = await storage.updateMiningPool(poolSlug, poolData);
      
      if (!updatedPool) {
        return res.status(404).json({ error: "Mining pool not found" });
      }
      
      res.json(updatedPool);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update mining pool" });
    }
  });
  
  // Block Miner Odds endpoints
  app.post("/api/block-miner-odds", async (req, res) => {
    try {
      const oddsData = req.body;
      
      // Add validation for required fields
      if (!oddsData.blockNumber || !oddsData.poolSlug) {
        return res.status(400).json({ error: "Missing required fields: blockNumber and poolSlug" });
      }
      
      // Create block miner odds
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
  
  // Get all block miner odds or odds for a specific block
  app.get("/api/block-miner-odds", async (req, res) => {
    try {
      const blockNumber = req.query.blockNumber ? parseInt(req.query.blockNumber as string) : undefined;
      
      let odds;
      if (blockNumber) {
        odds = await storage.getBlockMinerOddsByBlockNumber(blockNumber);
      } else {
        odds = await storage.getAllBlockMinerOdds();
      }
      
      res.json(odds);
    } catch (error) {
      console.error('Error fetching block miner odds:', error);
      res.status(500).json({ error: "Failed to fetch block miner odds" });
    }
  });
  
  // For backward compatibility - redirect betting options to block miner odds
  app.get("/api/betting-options", async (req, res) => {
    try {
      const blockNumber = req.query.blockNumber ? parseInt(req.query.blockNumber as string) : undefined;
      
      let odds;
      if (blockNumber) {
        odds = await storage.getBlockMinerOddsByBlockNumber(blockNumber);
      } else {
        odds = await storage.getAllBlockMinerOdds();
      }
      
      res.json(odds);
    } catch (error) {
      console.error('Error fetching betting options:', error);
      res.status(500).json({ error: "Failed to fetch betting options" });
    }
  });
  
  // Reserve addresses endpoints
  app.post("/api/reserve-addresses", async (req, res) => {
    try {
      const addressData = req.body;
      
      // Add validation for required fields
      if (!addressData.currency || !addressData.address) {
        return res.status(400).json({ error: "Missing required fields: currency and address" });
      }
      
      // Create or update reserve address
      const existingAddress = await storage.getReserveAddressByCurrency(addressData.currency);
      
      let result;
      if (existingAddress) {
        // Update existing address
        result = await storage.updateReserveAddress(addressData.currency, addressData);
      } else {
        // Create new address
        result = await storage.createReserveAddress(addressData);
      }
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Error managing reserve address:', error);
      res.status(500).json({ error: "Failed to create/update reserve address" });
    }
  });
  
  // Get all reserve addresses
  app.get("/api/reserve-addresses", async (req, res) => {
    try {
      const addresses = await storage.getAllReserveAddresses();
      res.json(addresses);
    } catch (error) {
      console.error('Error fetching reserve addresses:', error);
      res.status(500).json({ error: "Failed to fetch reserve addresses" });
    }
  });
  
  // Published blocks endpoints - blocks that are available for betting
  app.post("/api/published-blocks", async (req, res) => {
    try {
      const { height, estimatedTime, timeThreshold = 10, isActive = true } = req.body;
      
      // Add validation for required fields
      if (!height) {
        return res.status(400).json({ error: "Missing required field: height" });
      }
      
      // Ensure we have an estimatedTime (required field)
      if (!estimatedTime) {
        return res.status(400).json({ error: "Missing required field: estimatedTime" });
      }
      
      // Create published block
      const blockData = {
        height: parseInt(height),
        estimatedTime: new Date(estimatedTime),
        timeThreshold,
        isActive
      };
      
      const newBlock = await storage.createPublishedBlock(blockData);
      res.status(201).json(newBlock);
    } catch (error) {
      console.error('Error creating published block:', error);
      res.status(500).json({ error: "Failed to create published block" });
    }
  });
  
  // Get all published blocks or specific published block
  app.get("/api/published-blocks", async (req, res) => {
    try {
      const height = req.query.height ? parseInt(req.query.height as string) : undefined;
      const activeOnly = req.query.activeOnly === 'true';
      
      let blocks;
      if (height) {
        // Get a specific published block
        blocks = await storage.getPublishedBlockByHeight(height);
      } else if (activeOnly) {
        // Get active published blocks (available for betting)
        blocks = await storage.getActivePublishedBlocks();
      } else {
        // Get all published blocks
        blocks = await storage.getAllPublishedBlocks();
      }
      
      res.json(blocks);
    } catch (error) {
      console.error('Error fetching published blocks:', error);
      res.status(500).json({ error: "Failed to fetch published blocks" });
    }
  });
  
  // Update a published block
  app.patch("/api/published-blocks/:height", async (req, res) => {
    try {
      const height = parseInt(req.params.height);
      const updateData = req.body;
      
      // Update published block
      const updatedBlock = await storage.updatePublishedBlock(height, updateData);
      
      if (!updatedBlock) {
        return res.status(404).json({ error: "Published block not found" });
      }
      
      res.json(updatedBlock);
    } catch (error) {
      console.error('Error updating published block:', error);
      res.status(500).json({ error: "Failed to update published block" });
    }
  });

  // Mining stats calculation
  app.get("/api/mining-stats/:blockCount", async (req, res) => {
    try {
      console.log("API endpoint /api/mining-stats/:blockCount called");
      const blockCount = parseInt(req.params.blockCount);
      console.log(`Fetching stats for ${blockCount} blocks`);
      const blocks = await storage.getRecentBlocks(blockCount);
      console.log(`Found ${blocks.length} blocks`);
      const pools = await storage.getAllMiningPools();
      console.log(`Found ${pools.length} mining pools`);
      console.log(`Sample block:`, blocks[0] ? JSON.stringify(blocks[0]) : "None");
      console.log(`Sample pool:`, pools[0] ? JSON.stringify(pools[0]) : "None");
      
      // Count blocks by mining pool
      const blocksByPool: Record<string, number> = {};
      blocks.forEach(block => {
        // Our blocks have poolSlug property
        const miningPool = pools.find(p => p.poolSlug === block.poolSlug || p.poolSlug.toLowerCase() === block.poolSlug?.toLowerCase())?.poolSlug || 'Unknown';
        
        if (!blocksByPool[miningPool]) {
          blocksByPool[miningPool] = 0;
        }
        blocksByPool[miningPool]++;
      });
      
      // Calculate mining pool hashrates based on block proportion
      const totalBlocks = blocks.length;
      const poolStats = pools.map(pool => {
        const blocksFound = blocksByPool[pool.poolSlug] || 0;
        // Use weekly hashrate for better accuracy in calculating expected blocks
        const hashratePct = pool.hashrate1w || 0;
        const expected = (hashratePct * totalBlocks) / 100;
        const luck = expected > 0 ? (blocksFound / expected) * 100 : 0;
        
        return {
          name: pool.poolSlug, // For backward compatibility
          poolSlug: pool.poolSlug,
          displayName: pool.displayName,
          color: pool.color,
          hashratePct,
          expectedBlocks: expected,
          actualBlocks: blocksFound,
          luck
        };
      }).filter(pool => pool.hashratePct > 0 || pool.actualBlocks > 0)
        .sort((a, b) => b.hashratePct - a.hashratePct);
      
      res.json(poolStats);
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate mining stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
