import { db, pool } from '../server/db';
import { createInsertSchema } from 'drizzle-zod';
import { sql } from 'drizzle-orm';
import * as schema from '../shared/schema';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

// Push our schema directly to the database
async function pushSchema() {
  console.log('Pushing schema to database...');
  
  try {
    // First, let's check if tables exist
    try {
      const tablesResult = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      const tables = tablesResult.rows.map((row: any) => row.table_name);
      console.log('Existing tables:', tables);
      
      if (tables.includes('blocks') && tables.includes('mining_pools')) {
        console.log('Main tables already exist in the database. Not pushing schema again.');
        return;
      }
    } catch (error) {
      console.log('Error checking tables, will try to create schema:', error);
    }
    
    // Create tables using SQL queries directly
    console.log('Creating tables...');
    
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      )
    `);
    console.log('Created users table');
    
    // Create blocks table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS blocks (
        id SERIAL PRIMARY KEY,
        height INTEGER NOT NULL UNIQUE,
        mining_pool TEXT NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        found_in_minutes INTEGER,
        block_reward REAL,
        fees REAL,
        total_input REAL,
        size REAL,
        tx_count INTEGER
      )
    `);
    console.log('Created blocks table');
    
    // Create mining_pools table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS mining_pools (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        color TEXT NOT NULL,
        hashrate_24h REAL,
        hashrate_3d REAL,
        hashrate_1w REAL
      )
    `);
    console.log('Created mining_pools table');
    
    // Create network_hashrate table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS network_hashrate (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP NOT NULL,
        hashrate REAL NOT NULL,
        period TEXT NOT NULL
      )
    `);
    console.log('Created network_hashrate table');
    
    // Create published_blocks table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS published_blocks (
        id SERIAL PRIMARY KEY,
        height INTEGER NOT NULL UNIQUE,
        estimated_date TIMESTAMP NOT NULL,
        description TEXT,
        is_special BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true
      )
    `);
    console.log('Created published_blocks table');
    
    // Create betting_options table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS betting_options (
        id SERIAL PRIMARY KEY,
        block_height INTEGER NOT NULL,
        type TEXT NOT NULL,
        value TEXT NOT NULL,
        odds REAL NOT NULL,
        payment_address TEXT NOT NULL
      )
    `);
    console.log('Created betting_options table');
    
    // Create reserve_addresses table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reserve_addresses (
        id SERIAL PRIMARY KEY,
        currency TEXT NOT NULL UNIQUE,
        address TEXT NOT NULL,
        balance REAL,
        last_updated TIMESTAMP
      )
    `);
    console.log('Created reserve_addresses table');
    
    console.log('Schema pushed successfully!');
  } catch (error) {
    console.error('Error pushing schema:', error);
  }
}

// Import blocks from CSV for initial data population
async function importBlocksFromCSV() {
  try {
    const filePath = path.join(process.cwd(), 'attached_assets', 'block-explorer-export (3).csv');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Parse CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });
    
    console.log(`Loaded ${records.length} blocks from CSV`);
    
    // Insert blocks into database
    const blocks = records.map((record: any) => ({
      height: parseInt(record.height),
      miningPool: record.miner || 'Unknown',
      timestamp: new Date(record.timestamp),
      foundInMinutes: record.time_to_mine_minutes ? parseFloat(record.time_to_mine_minutes) : null,
      blockReward: record.block_reward ? parseFloat(record.block_reward) : null,
      fees: record.fees ? parseFloat(record.fees) : null,
      totalInput: record.total_input ? parseFloat(record.total_input) : null,
      size: record.size ? parseInt(record.size) : null,
      txCount: record.tx_count ? parseInt(record.tx_count) : null,
    }));
    
    // Insert mining pools first
    const uniquePools = new Set<string>();
    blocks.forEach(block => uniquePools.add(block.miningPool));
    
    for (const poolName of uniquePools) {
      // Generate a color based on the pool name
      const color = getColorForPool(poolName);
      
      // Insert the pool
      await db.insert(schema.miningPools).values({
        name: poolName,
        displayName: poolName,
        color,
        hashrate24h: null,
        hashrate3d: null,
        hashrate1w: null,
      }).onConflictDoNothing();
    }
    
    console.log(`Created ${uniquePools.size} mining pools`);
    
    // Insert blocks in batches
    const batchSize = 100;
    for (let i = 0; i < blocks.length; i += batchSize) {
      const batch = blocks.slice(i, i + batchSize);
      await db.insert(schema.blocks).values(batch).onConflictDoNothing();
      console.log(`Inserted blocks ${i + 1} to ${Math.min(i + batchSize, blocks.length)}`);
    }
    
    console.log(`Imported ${blocks.length} blocks from CSV`);
  } catch (error) {
    console.error('Error importing blocks from CSV:', error);
  }
}

// Create sample future blocks and betting options
async function createSampleData() {
  try {
    // Create network hashrate entries
    const networkHashrateData = [
      { timestamp: new Date(), hashrate: 350, period: '24h' },
      { timestamp: new Date(), hashrate: 345, period: '3d' },
      { timestamp: new Date(), hashrate: 340, period: '1w' },
    ];
    
    for (const data of networkHashrateData) {
      await db.insert(schema.networkHashrate).values(data).onConflictDoNothing();
    }
    
    console.log('Created network hashrate entries');
    
    // Create published future blocks
    const nextBlock = 900000; // Example milestone block
    const publishedBlocksData = [
      {
        height: nextBlock,
        estimatedDate: new Date('2025-05-01'),
        description: 'Bitcoin block #900,000 - a special milestone',
        isSpecial: true,
        isActive: true,
      },
      {
        height: nextBlock + 1000,
        estimatedDate: new Date('2025-05-08'),
        description: 'Bitcoin block #901,000',
        isSpecial: false,
        isActive: true,
      },
      {
        height: nextBlock + 2000,
        estimatedDate: new Date('2025-05-15'),
        description: 'Bitcoin block #902,000',
        isSpecial: false,
        isActive: true,
      },
    ];
    
    for (const data of publishedBlocksData) {
      await db.insert(schema.publishedBlocks).values(data).onConflictDoNothing();
    }
    
    console.log('Created published future blocks');
    
    // Create betting options for the next block
    const bettingOptionsData = [
      { blockHeight: nextBlock, type: 'miner', value: 'Foundry USA', odds: 1.8, paymentAddress: 'bc1q84s0g9jv0qntlhk2tz29p63zlcm4e027rywrjf' },
      { blockHeight: nextBlock, type: 'miner', value: 'Antpool', odds: 2.5, paymentAddress: 'bc1q84s0g9jv0qntlhk2tz29p63zlcm4e027rywrjf' },
      { blockHeight: nextBlock, type: 'not_miner', value: 'Foundry USA', odds: 2.2, paymentAddress: 'bc1q84s0g9jv0qntlhk2tz29p63zlcm4e027rywrjf' },
      { blockHeight: nextBlock, type: 'over_time', value: '12', odds: 2.0, paymentAddress: 'bc1q84s0g9jv0qntlhk2tz29p63zlcm4e027rywrjf' },
      { blockHeight: nextBlock, type: 'under_time', value: '8', odds: 1.9, paymentAddress: 'bc1q84s0g9jv0qntlhk2tz29p63zlcm4e027rywrjf' },
    ];
    
    for (const data of bettingOptionsData) {
      await db.insert(schema.bettingOptions).values(data).onConflictDoNothing();
    }
    
    console.log('Created betting options');
    
    // Create reserve addresses
    const reserveAddressesData = [
      { currency: 'BTC', address: 'bc1q84s0g9jv0qntlhk2tz29p63zlcm4e027rywrjf', balance: 1.25, lastUpdated: new Date() },
      { currency: 'LTC', address: 'ltc1q84s0g9jv0qntlhk2tz29p63zlcm4e027rywrjf', balance: 50.0, lastUpdated: new Date() },
    ];
    
    for (const data of reserveAddressesData) {
      await db.insert(schema.reserveAddresses).values(data).onConflictDoNothing();
    }
    
    console.log('Created reserve addresses');
    
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
}

// Helper function to generate a color for mining pools
function getColorForPool(poolName: string): string {
  const poolColors: Record<string, string> = {
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
  
  return poolColors[poolName] || "#6B7280";
}

// Run all functions
async function main() {
  try {
    await pushSchema();
    await importBlocksFromCSV();
    await createSampleData();
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    process.exit(0);
  }
}

main();