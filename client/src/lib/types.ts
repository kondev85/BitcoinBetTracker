// Re-export types from schema for frontend use
export interface User {
  id: number;
  username: string;
}

export interface Block {
  id: number;
  height: number;
  miningPool: string;
  timestamp: string;
  foundInMinutes: number | null;
  blockReward: number | null;
  fees: number | null;
  totalInput: number | null;
  size: number | null;
  txCount: number | null;
}

export interface MiningPool {
  id: number;
  poolSlug: string;
  name?: string; // Keep for backward compatibility
  displayName: string;
  color: string;
  hashrate24h: number | null;
  hashrate3d: number | null;
  hashrate1w: number | null;
}

export interface NetworkHashrate {
  id: number;
  timestamp: string;
  hashrate: number;
  period: string;
}

export interface PublishedBlock {
  id: number;
  height: number;
  estimatedDate: string;
  description: string | null;
  isSpecial: boolean;
  isActive: boolean;
}

export interface BettingOption {
  id: number;
  blockHeight: number;
  type: string; // miner, not_miner, under_time, over_time
  value: string; // miner name or time threshold
  odds: number;
  paymentAddress: string;
  ltcPaymentAddress: string | null;
  usdcPaymentAddress: string | null;
}

export interface ReserveAddress {
  id: number;
  currency: string;
  address: string;
  balance: number | null;
  lastUpdated: string | null;
}

export interface MiningPoolStat {
  name: string;
  poolSlug?: string;
  displayName: string;
  color: string;
  hashratePct: number;
  expectedBlocks: number;
  actualBlocks: number;
  luck: number;
}

export type TimePeriod = '24h' | '3d' | '1w';

export interface PaymentAddress {
  id: number;
  betId: number;
  poolSlug: string | null;
  betType: string;
  outcome: string;
  odds: number | null;
  address: string;
  ltcAddress: string | null;
  usdcAddress: string | null;
  createdAt: string;
}
