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

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize data from CSV
  await initializeData();

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
