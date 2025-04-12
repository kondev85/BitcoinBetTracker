import {
  users, type User, type InsertUser,
  blocks, type Block, type InsertBlock,
  miningPools, type MiningPool, type InsertMiningPool,
  networkHashrate, type NetworkHashrate, type InsertNetworkHashrate,
  publishedBlocks, type PublishedBlock, type InsertPublishedBlock,
  bettingOptions, type BettingOption, type InsertBettingOption,
  reserveAddresses, type ReserveAddress, type InsertReserveAddress
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Block operations
  getAllBlocks(): Promise<Block[]>;
  getBlockByHeight(height: number): Promise<Block | undefined>;
  getRecentBlocks(limit: number): Promise<Block[]>;
  createBlock(block: InsertBlock): Promise<Block>;
  createManyBlocks(blocks: InsertBlock[]): Promise<Block[]>;
  
  // Mining Pool operations
  getAllMiningPools(): Promise<MiningPool[]>;
  getMiningPoolByName(name: string): Promise<MiningPool | undefined>;
  createMiningPool(pool: InsertMiningPool): Promise<MiningPool>;
  updateMiningPool(name: string, pool: Partial<InsertMiningPool>): Promise<MiningPool | undefined>;
  
  // Network Hashrate operations
  getNetworkHashrate(period: string): Promise<NetworkHashrate | undefined>;
  createNetworkHashrate(hashrate: InsertNetworkHashrate): Promise<NetworkHashrate>;
  
  // Published Blocks operations
  getAllPublishedBlocks(): Promise<PublishedBlock[]>;
  getActivePublishedBlocks(): Promise<PublishedBlock[]>;
  getPublishedBlockByHeight(height: number): Promise<PublishedBlock | undefined>;
  createPublishedBlock(block: InsertPublishedBlock): Promise<PublishedBlock>;
  updatePublishedBlock(height: number, block: Partial<InsertPublishedBlock>): Promise<PublishedBlock | undefined>;
  
  // Betting Option operations
  getAllBettingOptions(): Promise<BettingOption[]>;
  getBettingOptionsForBlock(height: number): Promise<BettingOption[]>;
  createBettingOption(option: InsertBettingOption): Promise<BettingOption>;
  updateBettingOption(id: number, option: Partial<InsertBettingOption>): Promise<BettingOption | undefined>;
  
  // Reserve Address operations
  getAllReserveAddresses(): Promise<ReserveAddress[]>;
  getReserveAddressByCurrency(currency: string): Promise<ReserveAddress | undefined>;
  createReserveAddress(address: InsertReserveAddress): Promise<ReserveAddress>;
  updateReserveAddress(currency: string, address: Partial<InsertReserveAddress>): Promise<ReserveAddress | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private blocks: Map<number, Block>;
  private miningPools: Map<string, MiningPool>;
  private networkHashrates: Map<string, NetworkHashrate>;
  private publishedBlocks: Map<number, PublishedBlock>;
  private bettingOptions: Map<number, BettingOption>;
  private reserveAddresses: Map<string, ReserveAddress>;
  
  private currentUserId: number;
  private currentBlockId: number;
  private currentMiningPoolId: number;
  private currentNetworkHashrateId: number;
  private currentPublishedBlockId: number;
  private currentBettingOptionId: number;
  private currentReserveAddressId: number;

  constructor() {
    this.users = new Map();
    this.blocks = new Map();
    this.miningPools = new Map();
    this.networkHashrates = new Map();
    this.publishedBlocks = new Map();
    this.bettingOptions = new Map();
    this.reserveAddresses = new Map();
    
    this.currentUserId = 1;
    this.currentBlockId = 1;
    this.currentMiningPoolId = 1;
    this.currentNetworkHashrateId = 1;
    this.currentPublishedBlockId = 1;
    this.currentBettingOptionId = 1;
    this.currentReserveAddressId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Block operations
  async getAllBlocks(): Promise<Block[]> {
    return Array.from(this.blocks.values()).sort((a, b) => b.height - a.height);
  }
  
  async getBlockByHeight(height: number): Promise<Block | undefined> {
    return Array.from(this.blocks.values()).find(block => block.height === height);
  }
  
  async getRecentBlocks(limit: number): Promise<Block[]> {
    return Array.from(this.blocks.values())
      .sort((a, b) => b.height - a.height)
      .slice(0, limit);
  }
  
  async createBlock(block: InsertBlock): Promise<Block> {
    const id = this.currentBlockId++;
    const newBlock: Block = { ...block, id };
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
  
  async getMiningPoolByName(name: string): Promise<MiningPool | undefined> {
    return this.miningPools.get(name);
  }
  
  async createMiningPool(pool: InsertMiningPool): Promise<MiningPool> {
    const id = this.currentMiningPoolId++;
    const newPool: MiningPool = { ...pool, id };
    this.miningPools.set(pool.name, newPool);
    return newPool;
  }
  
  async updateMiningPool(name: string, pool: Partial<InsertMiningPool>): Promise<MiningPool | undefined> {
    const existingPool = this.miningPools.get(name);
    if (!existingPool) return undefined;
    
    const updatedPool: MiningPool = { ...existingPool, ...pool };
    this.miningPools.set(name, updatedPool);
    return updatedPool;
  }

  // Network Hashrate operations
  async getNetworkHashrate(period: string): Promise<NetworkHashrate | undefined> {
    return Array.from(this.networkHashrates.values()).find(h => h.period === period);
  }
  
  async createNetworkHashrate(hashrate: InsertNetworkHashrate): Promise<NetworkHashrate> {
    const id = this.currentNetworkHashrateId++;
    const newHashrate: NetworkHashrate = { ...hashrate, id };
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
    const newBlock: PublishedBlock = { ...block, id };
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

  // Betting Option operations
  async getAllBettingOptions(): Promise<BettingOption[]> {
    return Array.from(this.bettingOptions.values());
  }
  
  async getBettingOptionsForBlock(height: number): Promise<BettingOption[]> {
    return Array.from(this.bettingOptions.values()).filter(option => option.blockHeight === height);
  }
  
  async createBettingOption(option: InsertBettingOption): Promise<BettingOption> {
    const id = this.currentBettingOptionId++;
    const newOption: BettingOption = { ...option, id };
    this.bettingOptions.set(id, newOption);
    return newOption;
  }
  
  async updateBettingOption(id: number, option: Partial<InsertBettingOption>): Promise<BettingOption | undefined> {
    const existingOption = this.bettingOptions.get(id);
    if (!existingOption) return undefined;
    
    const updatedOption: BettingOption = { ...existingOption, ...option };
    this.bettingOptions.set(id, updatedOption);
    return updatedOption;
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
    const newAddress: ReserveAddress = { ...address, id };
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
}

// Import the DatabaseStorage implementation
import { DatabaseStorage } from './database-storage';

// Export an instance of DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
