import { db } from './db';
import { eq, desc, asc, and, isNull } from 'drizzle-orm';
import { 
  blocks, miners, miningPools, networkHashrate, 
  publishedBlocks, reserveAddresses,
  blockMinerOdds, timeBets, paymentAddresses,
  type Block, type InsertBlock,
  type Miner, type InsertMiner,
  type MiningPool, type InsertMiningPool, 
  type NetworkHashrate, type InsertNetworkHashrate,
  type PublishedBlock, type InsertPublishedBlock,
  type ReserveAddress, type InsertReserveAddress,
  type BlockMinerOdds, type InsertBlockMinerOdds, 
  type TimeBets, type InsertTimeBets,
  type PaymentAddress, type InsertPaymentAddress
} from '@shared/schema';
import { IStorage } from './storage';

export class DatabaseStorage implements IStorage {
  // Block operations
  async getAllBlocks(): Promise<Block[]> {
    return db.select().from(blocks).orderBy(desc(blocks.number));
  }
  
  async getBlockByHeight(height: number): Promise<Block | undefined> {
    const [block] = await db.select().from(blocks).where(eq(blocks.number, height));
    return block;
  }
  
  async getRecentBlocks(limit: number): Promise<Block[]> {
    return db.select().from(blocks).orderBy(desc(blocks.number)).limit(limit);
  }
  
  async createBlock(block: InsertBlock): Promise<Block> {
    const [newBlock] = await db.insert(blocks).values(block).returning();
    return newBlock;
  }
  
  async createManyBlocks(blocksData: InsertBlock[]): Promise<Block[]> {
    if (blocksData.length === 0) return [];
    return db.insert(blocks).values(blocksData).returning();
  }
  
  // Miner operations
  async getAllMiners(): Promise<Miner[]> {
    return db.select().from(miners);
  }
  
  async getMinerById(id: number): Promise<Miner | undefined> {
    const [miner] = await db.select().from(miners).where(eq(miners.id, id));
    return miner;
  }
  
  async createMiner(miner: InsertMiner): Promise<Miner> {
    const [newMiner] = await db.insert(miners).values(miner).returning();
    return newMiner;
  }

  // Mining Pool operations
  async getAllMiningPools(): Promise<MiningPool[]> {
    return db.select().from(miningPools);
  }
  
  async getMiningPoolByName(name: string): Promise<MiningPool | undefined> {
    const [pool] = await db.select().from(miningPools).where(eq(miningPools.poolSlug, name));
    return pool;
  }
  
  async createMiningPool(pool: InsertMiningPool): Promise<MiningPool> {
    const [newPool] = await db.insert(miningPools).values(pool).returning();
    return newPool;
  }
  
  async updateMiningPool(name: string, pool: Partial<InsertMiningPool>): Promise<MiningPool | undefined> {
    const [updatedPool] = await db
      .update(miningPools)
      .set({ ...pool, updatedAt: new Date() })
      .where(eq(miningPools.poolSlug, name))
      .returning();
    return updatedPool;
  }

  // Network Hashrate operations
  async getNetworkHashrate(period: string): Promise<NetworkHashrate | undefined> {
    const [hashrate] = await db.select().from(networkHashrate).where(eq(networkHashrate.period, period));
    return hashrate;
  }
  
  async createNetworkHashrate(hashrate: InsertNetworkHashrate): Promise<NetworkHashrate> {
    const [newHashrate] = await db.insert(networkHashrate).values(hashrate).returning();
    return newHashrate;
  }

  // Published Blocks operations
  async getAllPublishedBlocks(): Promise<PublishedBlock[]> {
    return db.select().from(publishedBlocks).orderBy(asc(publishedBlocks.height));
  }
  
  async getActivePublishedBlocks(): Promise<PublishedBlock[]> {
    return db
      .select()
      .from(publishedBlocks)
      .where(eq(publishedBlocks.isActive, true))
      .orderBy(asc(publishedBlocks.height));
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
    const [updatedBlock] = await db
      .update(publishedBlocks)
      .set(block)
      .where(eq(publishedBlocks.height, height))
      .returning();
    return updatedBlock;
  }

  // Reserve Address operations
  async getAllReserveAddresses(): Promise<ReserveAddress[]> {
    return db.select().from(reserveAddresses);
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
    const [updatedAddress] = await db
      .update(reserveAddresses)
      .set(address)
      .where(eq(reserveAddresses.currency, currency))
      .returning();
    return updatedAddress;
  }

  // Block Miner Odds operations
  async getAllBlockMinerOdds(): Promise<BlockMinerOdds[]> {
    return db.select().from(blockMinerOdds);
  }
  
  async getBlockMinerOddsByBlockNumber(blockNumber: number): Promise<BlockMinerOdds[]> {
    return db
      .select()
      .from(blockMinerOdds)
      .where(eq(blockMinerOdds.blockNumber, blockNumber));
  }
  
  async getBlockMinerOddsById(id: number): Promise<BlockMinerOdds | undefined> {
    const [odds] = await db
      .select()
      .from(blockMinerOdds)
      .where(eq(blockMinerOdds.id, id));
    return odds;
  }
  
  async createBlockMinerOdds(odds: InsertBlockMinerOdds): Promise<BlockMinerOdds> {
    const [newOdds] = await db
      .insert(blockMinerOdds)
      .values(odds)
      .returning();
    return newOdds;
  }
  
  async updateBlockMinerOdds(id: number, odds: Partial<InsertBlockMinerOdds>): Promise<BlockMinerOdds | undefined> {
    const [updatedOdds] = await db
      .update(blockMinerOdds)
      .set(odds)
      .where(eq(blockMinerOdds.id, id))
      .returning();
    return updatedOdds;
  }

  // Time Bets operations
  async getAllTimeBets(): Promise<TimeBets[]> {
    return db.select().from(timeBets);
  }
  
  async getTimeBetByBlockNumber(blockNumber: number): Promise<TimeBets | undefined> {
    const [bet] = await db
      .select()
      .from(timeBets)
      .where(eq(timeBets.blockNumber, blockNumber));
    return bet;
  }
  
  async getTimeBetById(id: number): Promise<TimeBets | undefined> {
    const [bet] = await db
      .select()
      .from(timeBets)
      .where(eq(timeBets.id, id));
    return bet;
  }
  
  async createTimeBet(bet: InsertTimeBets): Promise<TimeBets> {
    const [newBet] = await db
      .insert(timeBets)
      .values(bet)
      .returning();
    return newBet;
  }
  
  async updateTimeBet(id: number, bet: Partial<InsertTimeBets>): Promise<TimeBets | undefined> {
    const [updatedBet] = await db
      .update(timeBets)
      .set(bet)
      .where(eq(timeBets.id, id))
      .returning();
    return updatedBet;
  }

  // Payment Addresses operations
  async getAllPaymentAddresses(): Promise<PaymentAddress[]> {
    return db.select().from(paymentAddresses);
  }
  
  async getPaymentAddressById(id: number): Promise<PaymentAddress | undefined> {
    const [address] = await db
      .select()
      .from(paymentAddresses)
      .where(eq(paymentAddresses.id, id));
    return address;
  }
  
  async getPaymentAddressesByBlockNumber(blockNumber: number, betType: string, outcome: string): Promise<PaymentAddress[]> {
    return db
      .select()
      .from(paymentAddresses)
      .where(
        and(
          eq(paymentAddresses.blockNumber, blockNumber),
          eq(paymentAddresses.betType, betType),
          eq(paymentAddresses.outcome, outcome)
        )
      );
  }
  
  async createPaymentAddress(address: InsertPaymentAddress): Promise<PaymentAddress> {
    const [newAddress] = await db
      .insert(paymentAddresses)
      .values(address)
      .returning();
    return newAddress;
  }
  
  async updatePaymentAddress(id: number, address: Partial<InsertPaymentAddress>): Promise<PaymentAddress | undefined> {
    const [updatedAddress] = await db
      .update(paymentAddresses)
      .set(address)
      .where(eq(paymentAddresses.id, id))
      .returning();
    return updatedAddress;
  }
}