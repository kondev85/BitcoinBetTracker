import { db } from './db';
import { eq, desc, sql } from 'drizzle-orm';
import * as schema from '../shared/schema';
import { Block, Miner, BlockMinerOdds, Bet } from '../shared/schema';

/**
 * Repository for database operations
 */
export class Repository {
  // Blocks
  async getAllBlocks(): Promise<Block[]> {
    return await db.select().from(schema.blocks).orderBy(desc(schema.blocks.number));
  }

  async getBlockByNumber(number: number): Promise<Block | undefined> {
    const [block] = await db.select().from(schema.blocks).where(eq(schema.blocks.number, number));
    return block;
  }

  async getRecentBlocks(limit: number): Promise<Block[]> {
    return await db.select()
      .from(schema.blocks)
      .orderBy(desc(schema.blocks.number))
      .limit(limit);
  }

  async getLatestBlock(): Promise<Block | undefined> {
    const [block] = await db.select()
      .from(schema.blocks)
      .orderBy(desc(schema.blocks.number))
      .limit(1);
    return block;
  }

  // Miners
  async getAllMiners(): Promise<Miner[]> {
    return await db.select().from(schema.miners).orderBy(desc(schema.miners.hashrate));
  }

  async getMinerById(id: number): Promise<Miner | undefined> {
    const [miner] = await db.select().from(schema.miners).where(eq(schema.miners.id, id));
    return miner;
  }

  // Block Miner Odds
  async getOddsForBlock(blockNumber: number): Promise<BlockMinerOdds[]> {
    return await db.select()
      .from(schema.blockMinerOdds)
      .where(eq(schema.blockMinerOdds.blockNumber, blockNumber));
  }

  async getOddsById(id: number): Promise<BlockMinerOdds | undefined> {
    const [odds] = await db.select()
      .from(schema.blockMinerOdds)
      .where(eq(schema.blockMinerOdds.id, id));
    return odds;
  }

  // Bets
  async getBetsForBlock(blockId: number): Promise<Bet[]> {
    return await db.select()
      .from(schema.bets)
      .where(eq(schema.bets.blockId, blockId))
      .orderBy(desc(schema.bets.timestamp));
  }

  async getBetById(id: number): Promise<Bet | undefined> {
    const [bet] = await db.select()
      .from(schema.bets)
      .where(eq(schema.bets.id, id));
    return bet;
  }

  // Stats and aggregates
  async getMinerStats(): Promise<any[]> {
    // Calculate statistics about miners from the block data
    const stats = await db.execute(sql`
      SELECT 
        m.id,
        m.name,
        m.hashrate,
        COUNT(b.id) as blocks_mined,
        AVG(b.found_in) as avg_found_in_minutes
      FROM 
        miners m
      LEFT JOIN 
        blocks b ON m.name = b.pool_slug
      GROUP BY 
        m.id, m.name, m.hashrate
      ORDER BY 
        blocks_mined DESC
    `);
    
    return stats.rows;
  }

  async getBlocksCount(): Promise<number> {
    const result = await db.select({ count: sql`count(*)` }).from(schema.blocks);
    return Number(result[0].count);
  }

  async getMinersCount(): Promise<number> {
    const result = await db.select({ count: sql`count(*)` }).from(schema.miners);
    return Number(result[0].count);
  }

  async getBetsCount(): Promise<number> {
    const result = await db.select({ count: sql`count(*)` }).from(schema.bets);
    return Number(result[0].count);
  }

  // Health check
  async testConnection(): Promise<boolean> {
    try {
      await db.execute(sql`SELECT 1`);
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const repository = new Repository();