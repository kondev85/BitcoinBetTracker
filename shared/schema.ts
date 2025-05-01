import { pgTable, text, serial, integer, timestamp, real, boolean } from "drizzle-orm/pg-core";
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

// Block-specific miner odds (mining pool betting)
export const blockMinerOdds = pgTable("block_miner_odds", {
  id: serial("id").primaryKey(),
  blockNumber: integer("block_number").notNull(),
  minerId: integer("miner_id"), // Legacy field, kept for backward compatibility
  poolSlug: text("pool_slug").notNull(), // Mining pool identifier (e.g., "foundryusa", "antpool")
  hitOdds: real("hit_odds").notNull().default(2.0), // Odds for betting this pool will find the block
  noHitOdds: real("no_hit_odds").notNull().default(2.0), // Odds for betting this pool will NOT find the block
  createdAt: timestamp("created_at").defaultNow(), // When this betting option was created
});

// Bets placed by users
export const bets = pgTable("bets", {
  id: serial("id").primaryKey(),
  blockId: integer("block_id").notNull(),
  minerId: integer("miner_id").notNull(),
  amount: real("amount").notNull(),
  odds: real("odds").notNull(),
  isNoHitBet: boolean("is_no_hit_bet").notNull().default(false),
  isTimeBet: boolean("is_time_bet").notNull().default(false),
  isOverMinutes: boolean("is_over_minutes").notNull().default(false),
  status: text("status").notNull(), // pending, won, lost
  timestamp: timestamp("timestamp").notNull(),
});

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

export const insertBlockMinerOddsSchema = createInsertSchema(blockMinerOdds);

export const insertBetSchema = createInsertSchema(bets).pick({
  blockId: true,
  minerId: true,
  amount: true,
  odds: true,
  isNoHitBet: true,
  isTimeBet: true,
  isOverMinutes: true,
});

// Types for use in application code
export type InsertMiner = z.infer<typeof insertMinerSchema>;
export type InsertBlock = z.infer<typeof insertBlockSchema>;
export type InsertBlockMinerOdds = z.infer<typeof insertBlockMinerOddsSchema>;
export type InsertBet = z.infer<typeof insertBetSchema>;
export type Miner = typeof miners.$inferSelect;
export type Block = typeof blocks.$inferSelect;
export type BlockMinerOdds = typeof blockMinerOdds.$inferSelect;
export type Bet = typeof bets.$inferSelect;
