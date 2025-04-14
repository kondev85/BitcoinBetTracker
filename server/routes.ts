import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import {
  insertBlockSchema,
  insertBettingOptionSchema,
  insertMiningPoolSchema,
  insertNetworkHashrateSchema,
  insertPublishedBlockSchema,
  insertReserveAddressSchema
} from "@shared/schema";
import { z } from "zod";
import { redisClient, initRedis } from "./redis";
import axios from "axios";

// Flag to track Redis connection
let redisConnected = false;

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
      
      // Check betting options
      const bettingOptions = await storage.getAllBettingOptions();
      console.log(`Found ${bettingOptions.length} betting options in the database.`);
      
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
async function fetchAndCacheMiningPools(period: string = '1w'): Promise<any[]> {
  try {
    // Check if data is in Redis cache (if Redis is connected)
    if (redisConnected) {
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
    const pools = response.data;
    
    // Process and format the data
    const formattedPools = pools.map((pool: any) => {
      // Generate a color if not available (simple function to assign colors)
      const color = getColorForPool(pool.name);
      
      return {
        name: pool.name,
        value: pool.blockCount,
        color: color
      };
    }).sort((a: any, b: any) => b.value - a.value);
    
    // Cache the data in Redis if connected (expire after 15 minutes)
    if (redisConnected) {
      try {
        const cacheKey = `mempool:mining-pools:${period}`;
        await redisClient.set(cacheKey, JSON.stringify(formattedPools), {
          EX: 15 * 60
        });
        console.log(`Cached mining pools data for ${period} in Redis`);
      } catch (redisError) {
        console.error('Redis cache storing error:', redisError);
        // Continue even if Redis storage fails
      }
    }
    
    return formattedPools;
  } catch (error) {
    console.error('Error fetching mining pools data:', error);
    throw error;
  }
}

// Helper function to assign colors to mining pools
function getColorForPool(poolName: string): string {
  const poolColors: Record<string, string> = {
    'Foundry USA': '#F7931A',
    'AntPool': '#3B82F6',
    'F2Pool': '#10B981',
    'ViaBTC': '#F59E0B',
    'Binance Pool': '#8B5CF6',
    'Luxor': '#EC4899',
    'SBI Crypto': '#06B6D4',
    'Poolin': '#EF4444',
    'BTC.com': '#8B5CF6',
    'MARA Pool': '#84CC16',
    'SlushPool': '#2563EB'
  };
  
  return poolColors[poolName] || `#${Math.floor(Math.random()*16777215).toString(16)}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize data from CSV
  await initializeData();
  
  // Initialize Redis
  redisConnected = await initRedis();
  console.log('Redis connection status:', redisConnected ? 'Connected' : 'Not connected');

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

  app.get("/api/betting-options", async (req, res) => {
    try {
      const blockHeight = req.query.blockHeight ? parseInt(req.query.blockHeight as string) : undefined;
      
      const options = blockHeight
        ? await storage.getBettingOptionsForBlock(blockHeight)
        : await storage.getAllBettingOptions();
      
      res.json(options);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch betting options" });
    }
  });

  app.get("/api/reserve-addresses", async (req, res) => {
    try {
      const addresses = await storage.getAllReserveAddresses();
      res.json(addresses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reserve addresses" });
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
      const blockData = insertPublishedBlockSchema.parse(req.body);
      const existingBlock = await storage.getPublishedBlockByHeight(blockData.height);
      
      if (existingBlock) {
        return res.status(400).json({ error: "Block with this height already exists" });
      }
      
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

  app.post("/api/admin/betting-options", async (req, res) => {
    try {
      const optionData = insertBettingOptionSchema.parse(req.body);
      const newOption = await storage.createBettingOption(optionData);
      res.status(201).json(newOption);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create betting option" });
    }
  });

  app.put("/api/admin/betting-options/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const optionData = req.body;
      
      const updatedOption = await storage.updateBettingOption(id, optionData);
      
      if (!updatedOption) {
        return res.status(404).json({ error: "Betting option not found" });
      }
      
      res.json(updatedOption);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update betting option" });
    }
  });

  app.put("/api/admin/mining-pools/:name", async (req, res) => {
    try {
      const name = req.params.name;
      const poolData = req.body;
      
      const updatedPool = await storage.updateMiningPool(name, poolData);
      
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

  // Mining stats calculation
  app.get("/api/mining-stats/:blockCount", async (req, res) => {
    try {
      const blockCount = parseInt(req.params.blockCount);
      const blocks = await storage.getRecentBlocks(blockCount);
      const pools = await storage.getAllMiningPools();
      
      // Count blocks by mining pool
      const blocksByPool: Record<string, number> = {};
      blocks.forEach(block => {
        if (!blocksByPool[block.miningPool]) {
          blocksByPool[block.miningPool] = 0;
        }
        blocksByPool[block.miningPool]++;
      });
      
      // Calculate mining pool hashrates based on block proportion
      const totalBlocks = blocks.length;
      const poolStats = pools.map(pool => {
        const blocksFound = blocksByPool[pool.name] || 0;
        const hashratePct = (blocksFound / totalBlocks) * 100;
        const expected = (pool.hashrate24h || 0) * totalBlocks / 100;
        const luck = expected > 0 ? (blocksFound / expected) * 100 : 0;
        
        return {
          name: pool.name,
          displayName: pool.displayName,
          color: pool.color,
          hashratePct,
          expectedBlocks: expected,
          actualBlocks: blocksFound,
          luck
        };
      }).filter(pool => pool.hashratePct > 0 || pool.hashrate24h > 0)
        .sort((a, b) => b.hashratePct - a.hashratePct);
      
      res.json(poolStats);
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate mining stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
