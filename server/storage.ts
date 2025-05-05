import {
  blocks, type Block, type InsertBlock,
  blockMinerOdds, type BlockMinerOdds, type InsertBlockMinerOdds,
  timeBets, type TimeBets, type InsertTimeBets,
  paymentAddresses, type PaymentAddress, type InsertPaymentAddress,
  miners, type Miner, type InsertMiner,
  miningPools, type MiningPool, type InsertMiningPool,
  networkHashrate, type NetworkHashrate, type InsertNetworkHashrate,
  publishedBlocks, type PublishedBlock, type InsertPublishedBlock,
  reserveAddresses, type ReserveAddress, type InsertReserveAddress
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // Block operations
  getAllBlocks(): Promise<Block[]>;
  getBlockByHeight(height: number): Promise<Block | undefined>;
  getRecentBlocks(limit: number): Promise<Block[]>;
  createBlock(block: InsertBlock): Promise<Block>;
  createManyBlocks(blocks: InsertBlock[]): Promise<Block[]>;
  
  // Miner operations
  getAllMiners(): Promise<Miner[]>;
  getMinerById(id: number): Promise<Miner | undefined>;
  createMiner(miner: InsertMiner): Promise<Miner>;
  
  // Mining Pool operations
  getAllMiningPools(): Promise<MiningPool[]>;
  // Legacy method - use getMiningPoolBySlug instead
  getMiningPoolByName(name: string): Promise<MiningPool | undefined>;
  // New method with better naming
  getMiningPoolBySlug(poolSlug: string): Promise<MiningPool | undefined>;
  createMiningPool(pool: InsertMiningPool): Promise<MiningPool>;
  updateMiningPool(poolSlug: string, pool: Partial<InsertMiningPool>): Promise<MiningPool | undefined>;
  
  // Network Hashrate operations
  getNetworkHashrate(period: string): Promise<NetworkHashrate | undefined>;
  createNetworkHashrate(hashrate: InsertNetworkHashrate): Promise<NetworkHashrate>;
  
  // Published Blocks operations
  getAllPublishedBlocks(): Promise<PublishedBlock[]>;
  getActivePublishedBlocks(): Promise<PublishedBlock[]>;
  getPublishedBlockByHeight(height: number): Promise<PublishedBlock | undefined>;
  createPublishedBlock(block: InsertPublishedBlock): Promise<PublishedBlock>;
  updatePublishedBlock(height: number, block: Partial<InsertPublishedBlock>): Promise<PublishedBlock | undefined>;
  
  // Reserve Address operations
  getAllReserveAddresses(): Promise<ReserveAddress[]>;
  getReserveAddressByCurrency(currency: string): Promise<ReserveAddress | undefined>;
  createReserveAddress(address: InsertReserveAddress): Promise<ReserveAddress>;
  updateReserveAddress(currency: string, address: Partial<InsertReserveAddress>): Promise<ReserveAddress | undefined>;
  
  // Block Miner Odds operations
  getAllBlockMinerOdds(): Promise<BlockMinerOdds[]>;
  getBlockMinerOddsByBlockNumber(blockNumber: number): Promise<BlockMinerOdds[]>;
  getBlockMinerOddsById(id: number): Promise<BlockMinerOdds | undefined>;
  createBlockMinerOdds(odds: InsertBlockMinerOdds): Promise<BlockMinerOdds>;
  updateBlockMinerOdds(id: number, odds: Partial<InsertBlockMinerOdds>): Promise<BlockMinerOdds | undefined>;
  
  // Time Bets operations
  getAllTimeBets(): Promise<TimeBets[]>;
  getTimeBetByBlockNumber(blockNumber: number): Promise<TimeBets | undefined>;
  getTimeBetById(id: number): Promise<TimeBets | undefined>;
  createTimeBet(bet: InsertTimeBets): Promise<TimeBets>;
  updateTimeBet(id: number, bet: Partial<InsertTimeBets>): Promise<TimeBets | undefined>;
  
  // Payment Addresses operations
  getAllPaymentAddresses(): Promise<PaymentAddress[]>;
  getPaymentAddressById(id: number): Promise<PaymentAddress | undefined>;
  getPaymentAddressesByBlockNumber(blockNumber: number, betType: string, outcome: string): Promise<PaymentAddress[]>;
  createPaymentAddress(address: InsertPaymentAddress): Promise<PaymentAddress>;
  updatePaymentAddress(id: number, address: Partial<InsertPaymentAddress>): Promise<PaymentAddress | undefined>;
}

export class MemStorage implements IStorage {
  private blocks: Map<number, Block>;
  private miners: Map<number, Miner>;
  private miningPools: Map<string, MiningPool>;
  private networkHashrates: Map<string, NetworkHashrate>;
  private publishedBlocks: Map<number, PublishedBlock>;
  private reserveAddresses: Map<string, ReserveAddress>;
  private blockMinerOdds: Map<number, BlockMinerOdds>;
  private timeBets: Map<number, TimeBets>;
  private paymentAddresses: Map<number, PaymentAddress>;
  
  private currentBlockId: number;
  private currentMinerId: number;
  private currentMiningPoolId: number;
  private currentNetworkHashrateId: number;
  private currentPublishedBlockId: number;
  private currentReserveAddressId: number;
  private currentBlockMinerOddsId: number;
  private currentTimeBetsId: number;
  private currentPaymentAddressId: number;

  constructor() {
    this.blocks = new Map();
    this.miners = new Map();
    this.miningPools = new Map();
    this.networkHashrates = new Map();
    this.publishedBlocks = new Map();
    this.reserveAddresses = new Map();
    this.blockMinerOdds = new Map();
    this.timeBets = new Map();
    this.paymentAddresses = new Map();
    
    this.currentBlockId = 1;
    this.currentMinerId = 1;
    this.currentMiningPoolId = 1;
    this.currentNetworkHashrateId = 1;
    this.currentPublishedBlockId = 1;
    this.currentReserveAddressId = 1;
    this.currentBlockMinerOddsId = 1;
    this.currentTimeBetsId = 1;
    this.currentPaymentAddressId = 1;
  }

  // Miner operations
  async getAllMiners(): Promise<Miner[]> {
    return Array.from(this.miners.values());
  }
  
  async getMinerById(id: number): Promise<Miner | undefined> {
    return this.miners.get(id);
  }
  
  async createMiner(miner: InsertMiner): Promise<Miner> {
    const id = this.currentMinerId++;
    const newMiner: Miner = { 
      ...miner, 
      id,
      absoluteHashrate: miner.absoluteHashrate || null,
      averageHashrate: miner.averageHashrate || null,
      lastHashrateUpdate: miner.lastHashrateUpdate || null,
      networkHashrate: miner.networkHashrate || null
    };
    this.miners.set(id, newMiner);
    return newMiner;
  }

  // Block operations
  async getAllBlocks(): Promise<Block[]> {
    return Array.from(this.blocks.values()).sort((a, b) => b.number - a.number);
  }
  
  async getBlockByHeight(height: number): Promise<Block | undefined> {
    return Array.from(this.blocks.values()).find(block => block.number === height);
  }
  
  async getRecentBlocks(limit: number): Promise<Block[]> {
    return Array.from(this.blocks.values())
      .sort((a, b) => b.number - a.number)
      .slice(0, limit);
  }
  
  async createBlock(block: InsertBlock): Promise<Block> {
    const id = this.currentBlockId++;
    const newBlock: Block = { 
      ...block, 
      id,
      poolSlug: block.poolSlug || null,
      isPublished: block.isPublished || false,
      foundInMinutes: block.foundInMinutes || null,
      totalOutputAmount: block.totalOutputAmount || null,
      totalInputAmount: block.totalInputAmount || null,
      fees: block.fees || null,
      size: block.size || null,
      txCount: block.txCount || null
    };
    this.blocks.set(id, newBlock);
    return newBlock;
  }
  
  async createManyBlocks(blocks: InsertBlock[]): Promise<Block[]> {
    return Promise.all(blocks.map(block => this.createBlock(block)));
  }

  // Mining Pool operations
  async getAllMiningPools(): Promise<MiningPool[]> {
    return Array.from(this.miningPools.values());
  }
  
  // Old method for backward compatibility
  async getMiningPoolByName(name: string): Promise<MiningPool | undefined> {
    return this.miningPools.get(name);
  }
  
  // New method with better naming
  async getMiningPoolBySlug(poolSlug: string): Promise<MiningPool | undefined> {
    return this.miningPools.get(poolSlug);
  }
  
  async createMiningPool(pool: InsertMiningPool): Promise<MiningPool> {
    const id = this.currentMiningPoolId++;
    const newPool: MiningPool = { 
      ...pool, 
      id,
      hashrate24h: pool.hashrate24h || 0,
      hashrate3d: pool.hashrate3d || 0,
      hashrate1w: pool.hashrate1w || 0,
      updatedAt: new Date()
    };
    this.miningPools.set(pool.poolSlug, newPool);
    return newPool;
  }
  
  // Old method for backward compatibility
  async updateMiningPool(name: string, pool: Partial<InsertMiningPool>): Promise<MiningPool | undefined> {
    const existingPool = this.miningPools.get(name);
    if (!existingPool) return undefined;
    
    const updatedPool: MiningPool = { ...existingPool, ...pool, updatedAt: new Date() };
    this.miningPools.set(name, updatedPool);
    return updatedPool;
  }

  // Network Hashrate operations
  async getNetworkHashrate(period: string): Promise<NetworkHashrate | undefined> {
    return Array.from(this.networkHashrates.values()).find(h => h.period === period);
  }
  
  async createNetworkHashrate(hashrate: InsertNetworkHashrate): Promise<NetworkHashrate> {
    const id = this.currentNetworkHashrateId++;
    const newHashrate: NetworkHashrate = { 
      ...hashrate, 
      id,
      updatedAt: new Date()
    };
    this.networkHashrates.set(`${hashrate.period}-${id}`, newHashrate);
    return newHashrate;
  }

  // Published Blocks operations
  async getAllPublishedBlocks(): Promise<PublishedBlock[]> {
    return Array.from(this.publishedBlocks.values()).sort((a, b) => a.height - b.height);
  }
  
  async getActivePublishedBlocks(): Promise<PublishedBlock[]> {
    return Array.from(this.publishedBlocks.values())
      .filter(block => block.isActive)
      .sort((a, b) => a.height - b.height);
  }
  
  async getPublishedBlockByHeight(height: number): Promise<PublishedBlock | undefined> {
    return Array.from(this.publishedBlocks.values()).find(block => block.height === height);
  }
  
  async createPublishedBlock(block: InsertPublishedBlock): Promise<PublishedBlock> {
    const id = this.currentPublishedBlockId++;
    const newBlock: PublishedBlock = { 
      ...block, 
      id,
      timeThreshold: block.timeThreshold || 10,
      isActive: block.isActive !== undefined ? block.isActive : true,
      createdAt: new Date()
    };
    this.publishedBlocks.set(block.height, newBlock);
    return newBlock;
  }
  
  async updatePublishedBlock(height: number, block: Partial<InsertPublishedBlock>): Promise<PublishedBlock | undefined> {
    const existingBlock = Array.from(this.publishedBlocks.values()).find(b => b.height === height);
    if (!existingBlock) return undefined;
    
    const updatedBlock: PublishedBlock = { ...existingBlock, ...block };
    this.publishedBlocks.set(existingBlock.height, updatedBlock);
    return updatedBlock;
  }

  // Block Miner Odds operations
  async getAllBlockMinerOdds(): Promise<BlockMinerOdds[]> {
    return Array.from(this.blockMinerOdds.values());
  }
  
  async getBlockMinerOddsByBlockNumber(blockNumber: number): Promise<BlockMinerOdds[]> {
    return Array.from(this.blockMinerOdds.values()).filter(odds => odds.blockNumber === blockNumber);
  }
  
  async getBlockMinerOddsById(id: number): Promise<BlockMinerOdds | undefined> {
    return this.blockMinerOdds.get(id);
  }
  
  async createBlockMinerOdds(odds: InsertBlockMinerOdds): Promise<BlockMinerOdds> {
    const id = this.currentBlockMinerOddsId++;
    const newOdds: BlockMinerOdds = { 
      ...odds, 
      id, 
      createdAt: new Date(),
      minerId: null, // DEPRECATED: Using poolSlug instead, but field is still required by type
      hitOdds: odds.hitOdds || 2.0,
      noHitOdds: odds.noHitOdds || 2.0
    };
    this.blockMinerOdds.set(id, newOdds);
    return newOdds;
  }
  
  async updateBlockMinerOdds(id: number, odds: Partial<InsertBlockMinerOdds>): Promise<BlockMinerOdds | undefined> {
    const existingOdds = this.blockMinerOdds.get(id);
    if (!existingOdds) return undefined;
    
    const updatedOdds: BlockMinerOdds = { ...existingOdds, ...odds };
    this.blockMinerOdds.set(id, updatedOdds);
    return updatedOdds;
  }

  // Reserve Address operations
  async getAllReserveAddresses(): Promise<ReserveAddress[]> {
    return Array.from(this.reserveAddresses.values());
  }
  
  async getReserveAddressByCurrency(currency: string): Promise<ReserveAddress | undefined> {
    return this.reserveAddresses.get(currency);
  }
  
  async createReserveAddress(address: InsertReserveAddress): Promise<ReserveAddress> {
    const id = this.currentReserveAddressId++;
    const newAddress: ReserveAddress = { 
      ...address, 
      id,
      memo: address.memo || null,
      createdAt: new Date()
    };
    this.reserveAddresses.set(address.currency, newAddress);
    return newAddress;
  }
  
  async updateReserveAddress(currency: string, address: Partial<InsertReserveAddress>): Promise<ReserveAddress | undefined> {
    const existingAddress = this.reserveAddresses.get(currency);
    if (!existingAddress) return undefined;
    
    const updatedAddress: ReserveAddress = { ...existingAddress, ...address };
    this.reserveAddresses.set(currency, updatedAddress);
    return updatedAddress;
  }

  // Time Bets operations
  async getAllTimeBets(): Promise<TimeBets[]> {
    return Array.from(this.timeBets.values());
  }

  async getTimeBetByBlockNumber(blockNumber: number): Promise<TimeBets | undefined> {
    return Array.from(this.timeBets.values()).find(bet => bet.blockNumber === blockNumber);
  }

  async getTimeBetById(id: number): Promise<TimeBets | undefined> {
    return this.timeBets.get(id);
  }

  async createTimeBet(bet: InsertTimeBets): Promise<TimeBets> {
    const id = this.currentTimeBetsId++;
    const newBet: TimeBets = { 
      ...bet, 
      id, 
      createdAt: new Date(),
      underMinutesOdds: bet.underMinutesOdds || 2.0,
      overMinutesOdds: bet.overMinutesOdds || 2.0
    };
    this.timeBets.set(id, newBet);
    return newBet;
  }

  async updateTimeBet(id: number, bet: Partial<InsertTimeBets>): Promise<TimeBets | undefined> {
    const existingBet = this.timeBets.get(id);
    if (!existingBet) return undefined;
    
    const updatedBet: TimeBets = { ...existingBet, ...bet };
    this.timeBets.set(id, updatedBet);
    return updatedBet;
  }

  // Payment Addresses operations
  async getAllPaymentAddresses(): Promise<PaymentAddress[]> {
    return Array.from(this.paymentAddresses.values());
  }

  async getPaymentAddressById(id: number): Promise<PaymentAddress | undefined> {
    return this.paymentAddresses.get(id);
  }

  async getPaymentAddressesByBlockNumber(blockNumber: number, betType: string, outcome: string): Promise<PaymentAddress[]> {
    return Array.from(this.paymentAddresses.values()).filter(address => 
      address.blockNumber === blockNumber && 
      address.betType === betType && 
      address.outcome === outcome
    );
  }

  async createPaymentAddress(address: InsertPaymentAddress): Promise<PaymentAddress> {
    const id = this.currentPaymentAddressId++;
    const newAddress: PaymentAddress = { 
      ...address, 
      id, 
      createdAt: new Date(), 
      poolSlug: address.poolSlug || null 
    };
    this.paymentAddresses.set(id, newAddress);
    return newAddress;
  }

  async updatePaymentAddress(id: number, address: Partial<InsertPaymentAddress>): Promise<PaymentAddress | undefined> {
    const existingAddress = this.paymentAddresses.get(id);
    if (!existingAddress) return undefined;
    
    const updatedAddress: PaymentAddress = { ...existingAddress, ...address };
    this.paymentAddresses.set(id, updatedAddress);
    return updatedAddress;
  }
}

// Import the DatabaseStorage implementation
import { DatabaseStorage } from './database-storage';

// Export an instance of DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();