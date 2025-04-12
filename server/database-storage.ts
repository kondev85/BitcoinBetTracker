import { db } from './db';
import { eq, desc, asc } from 'drizzle-orm';
import { 
  users, blocks, miningPools, networkHashrate, 
  publishedBlocks, bettingOptions, reserveAddresses,
  type User, type InsertUser, type Block, type InsertBlock,
  type MiningPool, type InsertMiningPool, type NetworkHashrate, type InsertNetworkHashrate,
  type PublishedBlock, type InsertPublishedBlock, type BettingOption, type InsertBettingOption,
  type ReserveAddress, type InsertReserveAddress
} from '@shared/schema';
import { IStorage } from './storage';

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Block operations
  async getAllBlocks(): Promise<Block[]> {
    return await db.select().from(blocks).orderBy(asc(blocks.height));
  }

  async getBlockByHeight(height: number): Promise<Block | undefined> {
    const [block] = await db.select().from(blocks).where(eq(blocks.height, height));
    return block;
  }

  async getRecentBlocks(limit: number): Promise<Block[]> {
    return await db.select().from(blocks).orderBy(desc(blocks.height)).limit(limit);
  }

  async createBlock(block: InsertBlock): Promise<Block> {
    const [newBlock] = await db.insert(blocks).values(block).returning();
    return newBlock;
  }

  async createManyBlocks(blocks_data: InsertBlock[]): Promise<Block[]> {
    return await db.insert(blocks).values(blocks_data).returning();
  }

  // Mining Pool operations
  async getAllMiningPools(): Promise<MiningPool[]> {
    return await db.select().from(miningPools);
  }

  async getMiningPoolByName(name: string): Promise<MiningPool | undefined> {
    const [pool] = await db.select().from(miningPools).where(eq(miningPools.name, name));
    return pool;
  }

  async createMiningPool(pool: InsertMiningPool): Promise<MiningPool> {
    const [newPool] = await db.insert(miningPools).values(pool).returning();
    return newPool;
  }

  async updateMiningPool(name: string, pool: Partial<InsertMiningPool>): Promise<MiningPool | undefined> {
    const [existingPool] = await db.select().from(miningPools).where(eq(miningPools.name, name));
    
    if (!existingPool) {
      return undefined;
    }
    
    const [updatedPool] = await db
      .update(miningPools)
      .set(pool)
      .where(eq(miningPools.name, name))
      .returning();
      
    return updatedPool;
  }

  // Network Hashrate operations
  async getNetworkHashrate(period: string): Promise<NetworkHashrate | undefined> {
    const [result] = await db.select().from(networkHashrate).where(eq(networkHashrate.period, period));
    return result;
  }

  async createNetworkHashrate(hashrate: InsertNetworkHashrate): Promise<NetworkHashrate> {
    const [newHashrate] = await db.insert(networkHashrate).values(hashrate).returning();
    return newHashrate;
  }

  // Published Blocks operations
  async getAllPublishedBlocks(): Promise<PublishedBlock[]> {
    return await db.select().from(publishedBlocks).orderBy(asc(publishedBlocks.height));
  }

  async getActivePublishedBlocks(): Promise<PublishedBlock[]> {
    return await db.select().from(publishedBlocks).where(eq(publishedBlocks.isActive, true)).orderBy(asc(publishedBlocks.height));
  }

  async getPublishedBlockByHeight(height: number): Promise<PublishedBlock | undefined> {
    const [block] = await db.select().from(publishedBlocks).where(eq(publishedBlocks.height, height));
    return block;
  }

  async createPublishedBlock(block: InsertPublishedBlock): Promise<PublishedBlock> {
    const [newBlock] = await db.insert(publishedBlocks).values(block).returning();
    return newBlock;
  }

  async updatePublishedBlock(height: number, block: Partial<InsertPublishedBlock>): Promise<PublishedBlock | undefined> {
    const [existingBlock] = await db.select().from(publishedBlocks).where(eq(publishedBlocks.height, height));
    
    if (!existingBlock) {
      return undefined;
    }
    
    const [updatedBlock] = await db
      .update(publishedBlocks)
      .set(block)
      .where(eq(publishedBlocks.height, height))
      .returning();
      
    return updatedBlock;
  }

  // Betting Option operations
  async getAllBettingOptions(): Promise<BettingOption[]> {
    return await db.select().from(bettingOptions);
  }

  async getBettingOptionsForBlock(height: number): Promise<BettingOption[]> {
    return await db.select().from(bettingOptions).where(eq(bettingOptions.blockHeight, height));
  }

  async createBettingOption(option: InsertBettingOption): Promise<BettingOption> {
    const [newOption] = await db.insert(bettingOptions).values(option).returning();
    return newOption;
  }

  async updateBettingOption(id: number, option: Partial<InsertBettingOption>): Promise<BettingOption | undefined> {
    const [existingOption] = await db.select().from(bettingOptions).where(eq(bettingOptions.id, id));
    
    if (!existingOption) {
      return undefined;
    }
    
    const [updatedOption] = await db
      .update(bettingOptions)
      .set(option)
      .where(eq(bettingOptions.id, id))
      .returning();
      
    return updatedOption;
  }

  // Reserve Address operations
  async getAllReserveAddresses(): Promise<ReserveAddress[]> {
    return await db.select().from(reserveAddresses);
  }

  async getReserveAddressByCurrency(currency: string): Promise<ReserveAddress | undefined> {
    const [address] = await db.select().from(reserveAddresses).where(eq(reserveAddresses.currency, currency));
    return address;
  }

  async createReserveAddress(address: InsertReserveAddress): Promise<ReserveAddress> {
    const [newAddress] = await db.insert(reserveAddresses).values(address).returning();
    return newAddress;
  }

  async updateReserveAddress(currency: string, address: Partial<InsertReserveAddress>): Promise<ReserveAddress | undefined> {
    const [existingAddress] = await db.select().from(reserveAddresses).where(eq(reserveAddresses.currency, currency));
    
    if (!existingAddress) {
      return undefined;
    }
    
    const [updatedAddress] = await db
      .update(reserveAddresses)
      .set(address)
      .where(eq(reserveAddresses.currency, currency))
      .returning();
      
    return updatedAddress;
  }
}