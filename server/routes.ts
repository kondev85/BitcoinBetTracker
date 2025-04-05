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

// Initialize server with data from CSV
async function initializeData() {
  try {
    // Load blocks from CSV file
    const csvPath = path.resolve(process.cwd(), "attached_assets", "block-explorer-export (3).csv");
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    });

    // Map CSV records to Block schema
    const blocks = records.map((record: any) => {
      // Convert date string to Date object
      const timestamp = new Date(record.Timestamp);
      
      return {
        height: parseInt(record["Block Height"]),
        miningPool: record["Mining Pool"],
        timestamp,
        foundInMinutes: record["Found In (min)"] ? parseInt(record["Found In (min)"]) : null,
        blockReward: record["Block Reward (BTC)"] ? parseFloat(record["Block Reward (BTC)"]) : null,
        fees: record["Fees (BTC)"] ? parseFloat(record["Fees (BTC)"]) : null,
        totalInput: record["Total Input (BTC)"] ? parseFloat(record["Total Input (BTC)"]) : null,
        size: record["Size (MB)"] ? parseFloat(record["Size (MB)"]) : null,
        txCount: record["Tx Count"] ? parseInt(record["Tx Count"]) : null,
      };
    });

    // Store blocks in memory
    await storage.createManyBlocks(blocks);
    console.log(`Imported ${blocks.length} blocks from CSV`);

    // Create initial mining pools
    const poolColors = {
      "Foundry USA": "#F7931A",
      "Antpool": "#3B82F6",
      "F2Pool": "#10B981",
      "ViaBTC": "#F59E0B",
      "Binance Pool": "#8B5CF6",
      "Luxor": "#EC4899",
      "SECPOOL": "#2563EB",
      "MARA Pool": "#EF4444", 
      "Braiins Pool": "#14B8A6",
      "Poolin": "#8B5CF6",
      "BTC.com": "#DB2777",
      "SBI Crypto": "#047857",
      "ULTIMUSPOOL": "#4F46E5",
      "OCEAN": "#1E40AF",
      "Mining Squared": "#7C3AED",
      "SpiderPool": "#DB2777",
    };

    // Get unique mining pools from blocks
    const uniquePools = [...new Set(blocks.map(block => block.miningPool))];
    
    // Create mining pools
    for (const poolName of uniquePools) {
      await storage.createMiningPool({
        name: poolName,
        displayName: poolName,
        color: poolColors[poolName] || "#6B7280", // Default gray for unknown pools
        hashrate24h: null,
        hashrate3d: null,
        hashrate1w: null,
      });
    }
    console.log(`Created ${uniquePools.length} mining pools`);

    // Create network hashrate entries
    await storage.createNetworkHashrate({
      timestamp: new Date(),
      hashrate: 350000000, // Example value in TH/s
      period: "24h"
    });
    
    await storage.createNetworkHashrate({
      timestamp: new Date(),
      hashrate: 345000000,
      period: "3d"
    });
    
    await storage.createNetworkHashrate({
      timestamp: new Date(),
      hashrate: 340000000,
      period: "1w"
    });
    console.log("Created network hashrate entries");

    // Create published future blocks
    await storage.createPublishedBlock({
      height: 900000,
      estimatedDate: new Date("2025-05-15T10:00:00Z"),
      description: "Milestone block #900,000",
      isSpecial: true,
      isActive: true
    });
    console.log("Created published future blocks");

    // Create betting options for block #900,000
    const bettingOptions = [
      {
        blockHeight: 900000,
        type: "miner",
        value: "Foundry USA",
        odds: 3.85,
        paymentAddress: "bc1qfoundryusa123456789abcdefg"
      },
      {
        blockHeight: 900000,
        type: "miner",
        value: "Antpool",
        odds: 5.55,
        paymentAddress: "bc1qantpool123456789abcdefg"
      },
      {
        blockHeight: 900000,
        type: "miner",
        value: "F2Pool",
        odds: 7.15,
        paymentAddress: "bc1qf2pool123456789abcdefg"
      },
      {
        blockHeight: 900000,
        type: "under_time",
        value: "10",
        odds: 2.10,
        paymentAddress: "bc1qundertime123456789abcdefg"
      },
      {
        blockHeight: 900000,
        type: "over_time",
        value: "10",
        odds: 1.90,
        paymentAddress: "bc1qovertime123456789abcdefg"
      }
    ];

    for (const option of bettingOptions) {
      await storage.createBettingOption(option);
    }
    console.log(`Created ${bettingOptions.length} betting options`);

    // Create reserve addresses
    const reserveAddresses = [
      {
        currency: "BTC",
        address: "bc1q84s0qlj7pnz95yrz9z2lds82wescrf5xnrcxmz",
        balance: 42.3891,
        lastUpdated: new Date()
      },
      {
        currency: "LTC",
        address: "ltc1qh7n8pc0srhkh0kwdtgyr0z2m2vwrhtwe29uyuj",
        balance: 1205.7531,
        lastUpdated: new Date()
      }
    ];

    for (const address of reserveAddresses) {
      await storage.createReserveAddress(address);
    }
    console.log(`Created ${reserveAddresses.length} reserve addresses`);

  } catch (error) {
    console.error("Failed to initialize data:", error);
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
