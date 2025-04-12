import { Block, Miner, BlockMinerOdds } from '../../shared/schema';

// Standard fetch wrapper with error handling
async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`/api/${endpoint}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`API error (${response.status}): ${errorData.error || response.statusText}`);
  }
  
  return response.json() as Promise<T>;
}

// Blocks API
export function fetchBlocks(limit = 100): Promise<Block[]> {
  return fetchApi<Block[]>(`blocks?limit=${limit}`);
}

export function fetchBlockByNumber(number: number): Promise<Block> {
  return fetchApi<Block>(`blocks/${number}`);
}

export function fetchLatestBlock(): Promise<Block> {
  return fetchApi<Block[]>('blocks?limit=1').then(blocks => blocks[0]);
}

// Miners API
export function fetchMiners(): Promise<Miner[]> {
  return fetchApi<Miner[]>('miners');
}

export function fetchMinerById(id: number): Promise<Miner> {
  return fetchApi<Miner>(`miners/${id}`);
}

// Odds API
export function fetchOddsForBlock(blockNumber: number): Promise<BlockMinerOdds[]> {
  return fetchApi<BlockMinerOdds[]>(`odds/${blockNumber}`);
}

// Stats API
export function fetchMinerStats(): Promise<any[]> {
  return fetchApi<any[]>('stats/miners');
}

export function fetchGeneralStats(): Promise<{
  blocksCount: number;
  minersCount: number;
  betsCount: number;
  lastUpdated: string;
}> {
  return fetchApi('stats');
}

// Health check
export function checkApiHealth(): Promise<{
  status: string;
  database: string;
  timestamp: string;
}> {
  return fetchApi('health');
}