// Utility functions for mining pool name/slug standardization

/**
 * Standardizes pool slugs to a consistent format.
 * This should be used whenever storing pool slugs in the database.
 * 
 * @param slug The pool slug to normalize
 * @returns The standardized pool slug
 */
export function normalizePoolSlug(slug: string | null): string {
  if (!slug) return 'unknown';
  
  // Map of pool name variations to standard slugs
  const poolSlugMap: Record<string, string> = {
    // Foundry variations
    'foundry-usa': 'foundryusa',
    'foundry usa': 'foundryusa',
    'foundry': 'foundryusa',
    
    // MARA variations
    'mara-pool': 'marapool',
    'mara pool': 'marapool',
    'mara': 'marapool',
    
    // Binance variations
    'binance-pool': 'binancepool',
    'binance pool': 'binancepool',
    'binance': 'binancepool',
    
    // Carbon variations
    'carbon-neutral': 'carbonnegative',
    'carbonneutral': 'carbonnegative',
    'carbon-negative': 'carbonnegative',
    'carbon negative': 'carbonnegative',
    
    // Spider variations
    'spider-pool': 'spiderpool',
    'spider pool': 'spiderpool',
    'spider': 'spiderpool',
    
    // SBI variations
    'sbi-crypto': 'sbicrypto',
    'sbi crypto': 'sbicrypto',
    'sbi': 'sbicrypto',
    
    // BTC.com variations
    'btc.com': 'btccom',
    'btc-com': 'btccom',
    'btc com': 'btccom',
    
    // F2Pool variations
    'f2-pool': 'f2pool',
    'f2 pool': 'f2pool',
    
    // ViaBTC variations
    'via-btc': 'viabtc',
    'via btc': 'viabtc',
    'viabtc': 'viabtc',
    
    // SEC variations
    'sec-pool': 'secpool',
    'sec pool': 'secpool',
    
    // Mining Squared variations
    'mining-squared': 'miningsquared',
    'mining squared': 'miningsquared',
    
    // Braiins/Slush variations
    'slush-pool': 'braiinspool',
    'slushpool': 'braiinspool',
    'slush pool': 'braiinspool',
    'braiins-pool': 'braiinspool',
    'braiins pool': 'braiinspool',
    'braiins': 'braiinspool',
    
    // Luxor variations
    'luxor-mining': 'luxor',
    'luxor mining': 'luxor',
    
    // Ocean variations
    'ocean-pool': 'ocean',
    'ocean pool': 'ocean',
    'oceanpool': 'ocean',
    
    // Ultimus variations
    'ultimus-pool': 'ultimuspool',
    'ultimus pool': 'ultimuspool',
    
    // Unknown variations
    'unknown-pool': 'unknown',
    'unknown pool': 'unknown'
  };
  
  const normalizedSlug = slug.toLowerCase().trim();
  return poolSlugMap[normalizedSlug] || normalizedSlug;
}

/**
 * Gets a display name for a pool from its slug.
 * This is for UI display purposes only.
 * 
 * @param poolSlug The standardized pool slug
 * @returns Human-readable pool name for display
 */
export function getPoolDisplayName(poolSlug: string | null): string {
  if (!poolSlug) return 'Unknown Pool';
  
  // Map of standard pool slugs to display names
  const displayNameMap: Record<string, string> = {
    'foundryusa': 'Foundry USA',
    'antpool': 'AntPool',
    'f2pool': 'F2Pool',
    'binancepool': 'Binance Pool',
    'viabtc': 'ViaBTC',
    'btccom': 'BTC.com',
    'poolin': 'Poolin',
    'luxor': 'Luxor',
    'braiinspool': 'Braiins Pool',
    'marapool': 'MARA Pool',
    'secpool': 'SECPOOL',
    'sbicrypto': 'SBI Crypto',
    'miningsquared': 'Mining Squared',
    'innopolistech': 'Innopolis Tech',
    'spiderpool': 'SpiderPool',
    'carbonnegative': 'Carbon Negative',
    'ocean': 'OCEAN',
    'ultimuspool': 'ULTIMUS Pool',
    'solock': 'SoloCK',
    'solo-ck': 'SoloCK',
    'unknown': 'Unknown Pool'
  };
  
  return displayNameMap[poolSlug.toLowerCase()] || poolSlug;
}

/**
 * Gets a color code for a pool from its slug or name.
 * This is for UI display purposes.
 * 
 * @param poolSlugOrName The pool slug or name
 * @returns A color code (hex) for the pool
 */
export function getPoolColor(poolSlugOrName: string | null): string {
  if (!poolSlugOrName) return '#6B7280'; // Default gray
  
  // Map of pools to colors
  const colorMap: Record<string, string> = {
    'foundryusa': '#F7931A', // Bitcoin orange
    'foundry usa': '#F7931A',
    'antpool': '#3B82F6',    // Blue
    'f2pool': '#10B981',     // Green
    'binancepool': '#FBBF24', // Yellow
    'viabtc': '#6D28D9',     // Purple
    'btccom': '#0EA5E9',     // Sky blue
    'poolin': '#EC4899',     // Pink
    'luxor': '#EC4899',      // Pink
    'braiinspool': '#af96be', // Light purple
    'marapool': '#84CC16',   // Lime green
    'secpool': '#8B5CF6',    // Violet
    'sbicrypto': '#06B6D4',  // Cyan
    'spiderpool': '#FB923C', // Orange-ish
    'carbonnegative': '#22C55E', // Green
    'ocean': '#0D9488',      // Teal
    'miningsquared': '#F472B6', // Pink
    'ultimuspool': '#3d9ded', // Blue
    'unknown': '#6B7280'     // Gray
  };
  
  // Normalize the input
  const normalizedInput = poolSlugOrName.toLowerCase();
  
  // First try to find the color by the input directly
  if (colorMap[normalizedInput]) {
    return colorMap[normalizedInput];
  }
  
  // If not found, try to normalize the slug first
  const normalizedSlug = normalizePoolSlug(normalizedInput);
  return colorMap[normalizedSlug] || '#6B7280'; // Default to gray
}