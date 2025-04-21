import { pgTable, text, serial, integer, timestamp, real, boolean, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Block event information
export const blocks = pgTable("blocks", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull().unique(), // Block height
  poolSlug: text("pool_slug").notNull(), // Mempool.space API pool identifier
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

// Block-specific pool odds and addresses
export const blockMinerOdds = pgTable("block_miner_odds", {
  id: serial("id").primaryKey(),
  blockNumber: integer("block_number").notNull(),
  poolSlug: text("pool_slug"), // Made nullable for time-based odds

  // Hit odds and addresses
  hitOdds: real("hit_odds").notNull().default(2.0),
  hitBtcAddress: text("hit_btc_address"),
  hitEthAddress: text("hit_eth_address"),
  hitUsdcAddress: text("hit_usdc_address"),
  hitLightningAddress: text("hit_lightning_address"),
  hitLitecoinAddress: text("hit_litecoin_address"),

  // No-hit odds and addresses
  noHitOdds: real("no_hit_odds").notNull().default(2.0),
  noHitBtcAddress: text("no_hit_btc_address"),
  noHitEthAddress: text("no_hit_eth_address"),
  noHitUsdcAddress: text("no_hit_usdc_address"),
  noHitLightningAddress: text("no_hit_lightning_address"),
  noHitLitecoinAddress: text("no_hit_litecoin_address"),

  // Time-based odds and addresses
  underMinutesOdds: real("under_minutes_odds").notNull().default(2.0),
  underBtcAddress: text("under_btc_address"),
  underEthAddress: text("under_eth_address"),
  underUsdcAddress: text("under_usdc_address"),
  underLightningAddress: text("under_lightning_address"),
  underLitecoinAddress: text("under_litecoin_address"),

  overMinutesOdds: real("over_minutes_odds").notNull().default(2.0),
  overBtcAddress: text("over_btc_address"),
  overEthAddress: text("over_eth_address"),
  overUsdcAddress: text("over_usdc_address"),
  overLightningAddress: text("over_lightning_address"),
  overLitecoinAddress: text("over_litecoin_address"),
});

// Bets placed by users
export const bets = pgTable("bets", {
  id: serial("id").primaryKey(),
  blockId: integer("block_id").notNull(),
  poolSlug: text("pool_slug").notNull(),
  amount: real("amount").notNull(),
  odds: real("odds").notNull(),
  isNoHitBet: boolean("is_no_hit_bet").notNull().default(false),
  isTimeBet: boolean("is_time_bet").notNull().default(false),
  isOverMinutes: boolean("is_over_minutes").notNull().default(false),
  status: text("status").notNull(), // pending, won, lost
  timestamp: timestamp("timestamp").notNull(),
});

// Hashrate history tracking
export const hashrateHistory = pgTable("hashrate_history", {
  pool_slug: text("pool_slug").primaryKey(),
  pool_name: text("pool_name").notNull(),
  hashrate_24h: real("hashrate_24h").notNull(),
  hashrate_3d: real("hashrate_3d").notNull(),
  hashrate_1w: real("hashrate_1w").notNull()
});

// Schemas for data insertion
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
  poolSlug: true,
  amount: true,
  odds: true,
  isNoHitBet: true,
  isTimeBet: true,
  isOverMinutes: true,
});

export const insertHashrateHistorySchema = createInsertSchema(hashrateHistory);

// Types for use in application code
export type InsertBlock = z.infer<typeof insertBlockSchema>;
export type InsertBlockMinerOdds = z.infer<typeof insertBlockMinerOddsSchema>;
export type InsertBet = z.infer<typeof insertBetSchema>;
export type InsertHashrateHistory = z.infer<typeof insertHashrateHistorySchema>;
export type Block = typeof blocks.$inferSelect;
export type BlockMinerOdds = typeof blockMinerOdds.$inferSelect;
export type Bet = typeof bets.$inferSelect;
export type HashrateHistory = typeof hashrateHistory.$inferSelect;