import { pgTable, text, serial, integer, boolean, timestamp, real, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Original users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Blocks table
export const blocks = pgTable("blocks", {
  id: serial("id").primaryKey(),
  height: integer("height").notNull().unique(),
  miningPool: text("mining_pool").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  foundInMinutes: integer("found_in_minutes"),
  blockReward: real("block_reward"),
  fees: real("fees"),
  totalInput: real("total_input"),
  size: real("size"),
  txCount: integer("tx_count"),
});

export const insertBlockSchema = createInsertSchema(blocks).omit({ id: true });
export type InsertBlock = z.infer<typeof insertBlockSchema>;
export type Block = typeof blocks.$inferSelect;

// Mining pools table
export const miningPools = pgTable("mining_pools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  color: text("color").notNull(),
  hashrate24h: real("hashrate_24h"),
  hashrate3d: real("hashrate_3d"),
  hashrate1w: real("hashrate_1w"),
});

export const insertMiningPoolSchema = createInsertSchema(miningPools).omit({ id: true });
export type InsertMiningPool = z.infer<typeof insertMiningPoolSchema>;
export type MiningPool = typeof miningPools.$inferSelect;

// Network hashrate
export const networkHashrate = pgTable("network_hashrate", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull(),
  hashrate: real("hashrate").notNull(),
  period: text("period").notNull(), // 24h, 3d, 1w
});

export const insertNetworkHashrateSchema = createInsertSchema(networkHashrate).omit({ id: true });
export type InsertNetworkHashrate = z.infer<typeof insertNetworkHashrateSchema>;
export type NetworkHashrate = typeof networkHashrate.$inferSelect;

// Published future blocks
export const publishedBlocks = pgTable("published_blocks", {
  id: serial("id").primaryKey(),
  height: integer("height").notNull().unique(),
  estimatedDate: timestamp("estimated_date").notNull(),
  description: text("description"),
  isSpecial: boolean("is_special").default(false),
  isActive: boolean("is_active").default(true),
});

export const insertPublishedBlockSchema = createInsertSchema(publishedBlocks).omit({ id: true });
export type InsertPublishedBlock = z.infer<typeof insertPublishedBlockSchema>;
export type PublishedBlock = typeof publishedBlocks.$inferSelect;

// Betting options
export const bettingOptions = pgTable("betting_options", {
  id: serial("id").primaryKey(),
  blockHeight: integer("block_height").notNull(),
  type: text("type").notNull(), // miner, not_miner, under_time, over_time
  value: text("value").notNull(), // miner name or time threshold
  odds: real("odds").notNull(),
  paymentAddress: text("payment_address").notNull(),
});

export const insertBettingOptionSchema = createInsertSchema(bettingOptions).omit({ id: true });
export type InsertBettingOption = z.infer<typeof insertBettingOptionSchema>;
export type BettingOption = typeof bettingOptions.$inferSelect;

// Reserve addresses
export const reserveAddresses = pgTable("reserve_addresses", {
  id: serial("id").primaryKey(),
  currency: text("currency").notNull().unique(),
  address: text("address").notNull(),
  balance: real("balance"),
  lastUpdated: timestamp("last_updated"),
});

export const insertReserveAddressSchema = createInsertSchema(reserveAddresses).omit({ id: true });
export type InsertReserveAddress = z.infer<typeof insertReserveAddressSchema>;
export type ReserveAddress = typeof reserveAddresses.$inferSelect;
