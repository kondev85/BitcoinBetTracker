import { queryClient, apiRequest } from "@/lib/queryClient";
import type { 
  Block, 
  MiningPool, 
  PublishedBlock, 
  BettingOption, 
  ReserveAddress, 
  NetworkHashrate,
  MiningPoolStat,
  TimePeriod
} from "./types";

// Type for mempool.space mining pool data
export interface MiningPoolHashrateData {
  name: string;
  value: number;
  color: string;
}

// Blocks API
export const fetchBlocks = async (limit?: number): Promise<Block[]> => {
  const url = limit ? `/api/blocks?limit=${limit}` : '/api/blocks';
  const res = await apiRequest('GET', url);
  return res.json();
};

export const fetchBlockByHeight = async (height: number): Promise<Block> => {
  const res = await apiRequest('GET', `/api/blocks/${height}`);
  return res.json();
};

// Mining Pools API
export const fetchMiningPools = async (): Promise<MiningPool[]> => {
  const res = await apiRequest('GET', '/api/mining-pools');
  return res.json();
};

// Network Hashrate API
export const fetchNetworkHashrate = async (period: TimePeriod): Promise<NetworkHashrate> => {
  const res = await apiRequest('GET', `/api/network-hashrate/${period}`);
  return res.json();
};

// Published Blocks API
export const fetchPublishedBlocks = async (onlyActive = true): Promise<PublishedBlock[]> => {
  const res = await apiRequest('GET', `/api/published-blocks?active=${onlyActive}`);
  return res.json();
};

export const fetchPublishedBlockByHeight = async (height: number): Promise<PublishedBlock> => {
  const res = await apiRequest('GET', `/api/published-blocks/${height}`);
  return res.json();
};

// Betting Options API
export const fetchBettingOptions = async (blockHeight?: number): Promise<BettingOption[]> => {
  const url = blockHeight ? `/api/betting-options?blockHeight=${blockHeight}` : '/api/betting-options';
  const res = await apiRequest('GET', url);
  return res.json();
};

// Reserve Addresses API
export const fetchReserveAddresses = async (): Promise<ReserveAddress[]> => {
  const res = await apiRequest('GET', '/api/reserve-addresses');
  return res.json();
};

// Mining Stats API
export const fetchMiningStats = async (blockCount: number): Promise<MiningPoolStat[]> => {
  const res = await apiRequest('GET', `/api/mining-stats/${blockCount}`);
  return res.json();
};

// Admin API
export const createPublishedBlock = async (block: Omit<PublishedBlock, 'id'>): Promise<PublishedBlock> => {
  const res = await apiRequest('POST', '/api/admin/published-blocks', block);
  const newBlock = await res.json();
  
  // Invalidate queries
  queryClient.invalidateQueries({ queryKey: ['/api/published-blocks'] });
  
  return newBlock;
};

export const updatePublishedBlock = async (height: number, block: Partial<PublishedBlock>): Promise<PublishedBlock> => {
  const res = await apiRequest('PUT', `/api/admin/published-blocks/${height}`, block);
  const updatedBlock = await res.json();
  
  // Invalidate queries
  queryClient.invalidateQueries({ queryKey: ['/api/published-blocks'] });
  queryClient.invalidateQueries({ queryKey: [`/api/published-blocks/${height}`] });
  
  return updatedBlock;
};

export const createBettingOption = async (option: Omit<BettingOption, 'id'>): Promise<BettingOption> => {
  const res = await apiRequest('POST', '/api/admin/betting-options', option);
  const newOption = await res.json();
  
  // Invalidate queries
  queryClient.invalidateQueries({ queryKey: ['/api/betting-options'] });
  
  return newOption;
};

export const updateBettingOption = async (id: number, option: Partial<BettingOption>): Promise<BettingOption> => {
  const res = await apiRequest('PUT', `/api/admin/betting-options/${id}`, option);
  const updatedOption = await res.json();
  
  // Invalidate queries
  queryClient.invalidateQueries({ queryKey: ['/api/betting-options'] });
  
  return updatedOption;
};

export const updateMiningPool = async (name: string, pool: Partial<MiningPool>): Promise<MiningPool> => {
  const res = await apiRequest('PUT', `/api/admin/mining-pools/${name}`, pool);
  const updatedPool = await res.json();
  
  // Invalidate queries
  queryClient.invalidateQueries({ queryKey: ['/api/mining-pools'] });
  
  return updatedPool;
};

// Network stats interface for mempool.space data
export interface NetworkStats {
  lastEstimatedHashrate: number;
  lastEstimatedHashrate3d: number;
  lastEstimatedHashrate1w: number;
  blockCount: number;
}

// Mempool.space API
export const fetchMempoolMiningPools = async (period: TimePeriod = '1w'): Promise<{
  pools: MiningPoolHashrateData[];
  networkStats: NetworkStats;
}> => {
  const res = await apiRequest('GET', `/api/mempool/mining-pools/${period}`);
  return res.json();
};
