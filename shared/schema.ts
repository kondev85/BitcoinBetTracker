import { pgTable, text, serial, integer, timestamp, real, boolean, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Basic miner information (constant data)
export const miners = pgTable("miners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  hashrate: real("hashrate").notNull(),                 // Hashrate percentage (0-100%)
  absoluteHashrate: real("absolute_hashrate"),          // Absolute hashrate in EH/s
  averageHashrate: real("average_hashrate"),            // Average hashrate percentage over time
  lastHashrateUpdate: timestamp("last_hashrate_update"), // When the hashrate was last updated
  networkHashrate: real("network_hashrate"),            // Network hashrate in EH/s
});

// Block event information
export const blocks = pgTable("blocks", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull().unique(), // Block height
  poolSlug: text("pool_slug"), // Mempool.space API pool identifier
  timestamp: timestamp("timestamp").notNull(),
  status: text("status").notNull(), // pending, completed
  isPublished: boolean("is_published").notNull().default(false),
  foundInMinutes: real("found_in"), // Time in minutes since last block
  totalOutputAmount: real("total_output_amount"), // Total BTC output (mining reward)
  totalInputAmount: real("total_input_amount"), // Total BTC amount sent in this block
  fees: real("fees"), // Total fees in BTC
  size: real("size"), // Block size in MB
  txCount: integer("tx_count"), // Number of transactions
});

// Published blocks for betting
export const publishedBlocks = pgTable("published_blocks", {
  id: serial("id").primaryKey(),
  height: integer("height").notNull().unique(), // Block height
  estimatedTime: timestamp("estimated_time").notNull(), // Estimated time the block will be found
  timeThreshold: real("time_threshold").notNull().default(10), // Minutes threshold for time bets
  isActive: boolean("is_active").notNull().default(true), // Whether betting is active
  isSpecial: boolean("is_special").default(false), // Whether this is a featured/special block
  description: text("description"), // Optional description for the block
  createdAt: timestamp("created_at").defaultNow(), // When this block was published for betting
});

// Block-specific miner odds (mining pool betting)
export const blockMinerOdds = pgTable("block_miner_odds", {
  id: serial("id").primaryKey(),
  blockNumber: integer("block_number").notNull(),
  poolSlug: text("pool_slug").notNull(), // Mining pool identifier (e.g., "foundryusa", "antpool")
  hitOdds: real("hit_odds"), // Odds for betting this pool will find the block, can be null if not applicable
  noHitOdds: real("no_hit_odds"), // Odds for betting this pool will NOT find the block, can be null if not applicable
  createdAt: timestamp("created_at").defaultNow(), // When this betting option was created
});

// Time-based bets (for betting on block time)
export const timeBets = pgTable("time_bets", {
  id: serial("id").primaryKey(),
  blockNumber: integer("block_number").notNull(),
  underMinutesOdds: real("under_minutes_odds"), // Odds for under time threshold, can be null if not applicable
  overMinutesOdds: real("over_minutes_odds"), // Odds for over time threshold, can be null if not applicable
  createdAt: timestamp("created_at").defaultNow(), // When this betting option was created
});

// Reserve addresses for different cryptocurrencies
export const reserveAddresses = pgTable("reserve_addresses", {
  id: serial("id").primaryKey(),
  currency: text("currency").notNull().unique(), // 'BTC', 'ETH', 'USDC', 'LIGHTNING', 'LITECOIN', etc.
  address: text("address").notNull(),
  memo: text("memo"), // For certain currencies that require memos
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment addresses for cryptocurrency payments
export const paymentAddresses = pgTable("payment_addresses", {
  id: serial("id").primaryKey(),
  betId: integer("bet_id").notNull(),
  poolSlug: text("pool_slug"), // For miner bets
  betType: text("bet_type").notNull(), // 'miner' or 'time'
  outcome: text("outcome").notNull(), // 'hit', 'no_hit', 'under', or 'over'
  odds: real("odds"), // The odds for this bet at the time of creation
  address: text("address").notNull(), // Bitcoin address
  ltcAddress: text("ltc_address"), // Litecoin address
  usdcAddress: text("usdc_address"), // USDC address
  createdAt: timestamp("created_at").defaultNow(),
});

// Mining pools data (from mempool.space API)
export const miningPools = pgTable("mining_pools", {
  id: serial("id").primaryKey(),
  poolSlug: text("pool_slug").notNull().unique(), // Pool slug (e.g., "foundryusa", "antpool")
  displayName: text("display_name").notNull(), // Human-readable name (e.g., "Foundry USA", "AntPool")
  color: text("color").notNull(), // Color for UI display
  hashrate24h: real("hashrate_24h").notNull().default(0), // Percentage hashrate last 24h
  hashrate3d: real("hashrate_3d").notNull().default(0), // Percentage hashrate last 3 days
  hashrate1w: real("hashrate_1w").notNull().default(0), // Percentage hashrate last week
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Network hashrate data
export const networkHashrate = pgTable("network_hashrate", {
  id: serial("id").primaryKey(),
  period: text("period").notNull(), // '24h', '3d', '1w'
  hashrate: real("hashrate").notNull(), // In hashes per second (deprecated, use hashrate24h instead)
  hashrate24h: real("hashrate_24h"), // Hashrate for 24h period in hashes per second
  hashrate3d: real("hashrate_3d"), // Hashrate for 3d period in hashes per second
  hashrate1w: real("hashrate_1w"), // Hashrate for 1w period in hashes per second
  updatedAt: timestamp("updated_at").defaultNow(),
  blockCount: integer("block_count"), // Total blocks for the time period
});

// Note: Removed unique constraint from period to allow storing historical data

// Schemas for data insertion
export const insertMinerSchema = createInsertSchema(miners).pick({
  name: true,
  hashrate: true,
  absoluteHashrate: true,
  averageHashrate: true,
  lastHashrateUpdate: true,
  networkHashrate: true,
});

export const insertBlockSchema = createInsertSchema(blocks).pick({
  number: true,
  poolSlug: true,
  timestamp: true,
  status: true,
  isPublished: true,
  foundInMinutes: true,
  totalOutputAmount: true,
  totalInputAmount: true,
  fees: true,
  size: true,
  txCount: true,
});

export const insertPublishedBlockSchema = createInsertSchema(publishedBlocks).pick({
  height: true,
  estimatedTime: true,
  timeThreshold: true,
  isActive: true,
  isSpecial: true,
  description: true
});

export const insertBlockMinerOddsSchema = createInsertSchema(blockMinerOdds).pick({
  blockNumber: true,
  poolSlug: true,  // We only use poolSlug now, not minerId
  hitOdds: true,
  noHitOdds: true
});

export const insertTimeBetsSchema = createInsertSchema(timeBets).pick({
  blockNumber: true,
  underMinutesOdds: true,
  overMinutesOdds: true
});

export const insertReserveAddressSchema = createInsertSchema(reserveAddresses).pick({
  currency: true,
  address: true,
  memo: true
});

export const insertPaymentAddressSchema = createInsertSchema(paymentAddresses).pick({
  betId: true,
  poolSlug: true,
  betType: true,
  outcome: true,
  odds: true,
  address: true,
  ltcAddress: true,
  usdcAddress: true
});

export const insertMiningPoolSchema = createInsertSchema(miningPools).pick({
  poolSlug: true,
  displayName: true,
  color: true,
  hashrate24h: true,
  hashrate3d: true,
  hashrate1w: true
});

export const insertNetworkHashrateSchema = createInsertSchema(networkHashrate).pick({
  period: true,
  hashrate: true
});

// Types for use in application code
export type InsertMiner = z.infer<typeof insertMinerSchema>;
export type InsertBlock = z.infer<typeof insertBlockSchema>;
export type InsertPublishedBlock = z.infer<typeof insertPublishedBlockSchema>;
export type InsertBlockMinerOdds = z.infer<typeof insertBlockMinerOddsSchema>;
export type InsertTimeBets = z.infer<typeof insertTimeBetsSchema>;
export type InsertReserveAddress = z.infer<typeof insertReserveAddressSchema>;
export type InsertPaymentAddress = z.infer<typeof insertPaymentAddressSchema>;
export type InsertMiningPool = z.infer<typeof insertMiningPoolSchema>;
export type InsertNetworkHashrate = z.infer<typeof insertNetworkHashrateSchema>;

export type Miner = typeof miners.$inferSelect;
export type Block = typeof blocks.$inferSelect;
export type PublishedBlock = typeof publishedBlocks.$inferSelect;
export type BlockMinerOdds = typeof blockMinerOdds.$inferSelect;
export type TimeBets = typeof timeBets.$inferSelect;
export type ReserveAddress = typeof reserveAddresses.$inferSelect;
export type PaymentAddress = typeof paymentAddresses.$inferSelect;
export type MiningPool = typeof miningPools.$inferSelect;
export type NetworkHashrate = typeof networkHashrate.$inferSelect;
