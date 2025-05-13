import axios from 'axios';
import { db } from '../server/db';
import { miningPools } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Helper function from server/apis.ts to standardize pool names
function standardizePoolName(poolName: string): string {
  if (!poolName) return 'Unknown';
  
  // Clean up common variations
  const name = poolName
    .replace(/\s+Pool$/i, '') // Remove " Pool" suffix
    .replace(/^Pool\s+/i, '') // Remove "Pool " prefix
    .trim();
  
  // Handle special cases
  if (name.toLowerCase() === 'f2pool') return 'F2Pool';
  if (name.toLowerCase() === 'slushpool' || name.toLowerCase() === 'braiins pool') return 'Braiins Pool';
  if (name.toLowerCase() === 'btc.com' || name.toLowerCase() === 'btccom') return 'BTC.com';
  if (name.toLowerCase() === 'viabtc') return 'ViaBTC';
  if (name.toLowerCase() === 'antpool') return 'AntPool';
  if (name.toLowerCase() === 'binance') return 'Binance Pool';
  if (name.toLowerCase() === 'huobi') return 'Huobi Pool';
  if (name.toLowerCase() === 'foundry usa') return 'Foundry USA';
  if (name.toLowerCase() === 'luxor') return 'Luxor';
  if (name.toLowerCase() === 'unknown' || !name) return 'Unknown';
  
  // Return the standardized name
  return name;
}

// Helper function from server/apis.ts to get color for a pool
function getColorForPool(poolName: string): string {
  const poolColors: Record<string, string> = {
    'Foundry USA': '#F7931A',  // Bitcoin orange
    'AntPool': '#3B82F6',      // Blue
    'F2Pool': '#10B981',      // Green
    'ViaBTC': '#6D28D9',      // Changed to deep purple to differentiate from Foundry
    'Binance Pool': '#6366F1', // Indigo
    'Luxor': '#EC4899',       // Pink
    'SBI Crypto': '#06B6D4',  // Cyan
    'Poolin': '#EF4444',      // Red
    'BTC.com': '#0EA5E9',     // Sky blue
    'MARA Pool': '#84CC16',   // Lime green
    'SlushPool': '#2563EB',   // Royal blue
    'SECPOOL': '#8B5CF6',     // Violet
    'Mining Squared': '#F472B6', // Pink
    'OCEAN': '#0D9488',       // Teal
    'SpiderPool': '#FB923C',  // Orange
    'WhitePool': '#A1A1AA',   // Zinc/gray
    'Carbon Negative': '#22C55E', // Green
    'Unknown': '#A3A3A3'      // Gray
  };
  
  return poolColors[poolName] || `#${Math.floor(Math.random()*16777215).toString(16)}`;
}

// Helper function to convert pool name to standardized slug
function poolNameToSlug(name: string): string {
  // First, standardize the name to handle inconsistencies
  const standardizedName = standardizePoolName(name);
  
  // Special cases for slug standardization
  if (standardizedName.toLowerCase() === 'braiins pool') return 'braiinspool';
  if (standardizedName.toLowerCase() === 'btc.com') return 'btccom';
  if (standardizedName.toLowerCase() === 'mara pool') return 'marapool';
  if (standardizedName.toLowerCase() === 'foundry usa') return 'foundryusa';
  if (standardizedName.toLowerCase() === 'spider pool') return 'spiderpool';
  if (standardizedName.toLowerCase() === 'mining squared') return 'miningsquared';
  if (standardizedName.toLowerCase() === 'nice hash') return 'nicehash';
  
  // General slug generation
  return standardizedName.toLowerCase().replace(/[\s\.]+/g, '');
}

// Function to calculate percentages from blockCount values
function calculatePercentages(pools: any[]): Map<string, number> {
  const totalBlocks = pools.reduce((sum, pool) => sum + pool.blockCount, 0);
  
  // Create a map of standardized name to percentage
  const percentages = new Map<string, number>();
  
  pools.forEach(pool => {
    const standardizedName = standardizePoolName(pool.name);
    const percentage = (pool.blockCount / totalBlocks) * 100;
    
    // If this pool already exists in the map, add the percentage (handling variations of the same pool)
    if (percentages.has(standardizedName)) {
      percentages.set(standardizedName, percentages.get(standardizedName)! + percentage);
    } else {
      percentages.set(standardizedName, percentage);
    }
  });
  
  return percentages;
}

/**
 * Helper function to handle standardized pool updating
 */
async function handleStandardizedPool(standardSlug: string, displayName: string, data: any) {
  const existingPool = await db.select().from(miningPools).where(eq(miningPools.poolSlug, standardSlug));
  
  if (existingPool.length > 0) {
    // Update existing pool
    await db.update(miningPools)
      .set({
        displayName: displayName,
        color: data.color,
        hashrate24h: data.hashrate24h,
        hashrate3d: data.hashrate3d,
        hashrate1w: data.hashrate1w,
        updatedAt: new Date()
      })
      .where(eq(miningPools.poolSlug, standardSlug));
      
    console.log(`Updated standardized mining pool: ${displayName}`);
  } else {
    // Insert new pool with standard slug
    await db.insert(miningPools).values({
      poolSlug: standardSlug,
      displayName: displayName,
      color: data.color,
      hashrate24h: data.hashrate24h,
      hashrate3d: data.hashrate3d,
      hashrate1w: data.hashrate1w
    });
    
    console.log(`Added standardized mining pool: ${displayName}`);
  }
}

/**
 * Function to clean up duplicate pools
 */
async function cleanupDuplicatePools() {
  console.log("Checking for duplicate mining pools...");
  
  // Known pairs of duplicates to check
  const duplicatePairs = [
    ['braiins', 'braiinspool'],
    ['mara', 'marapool'],
    ['btccom', 'btc.com']
  ];
  
  for (const [slug1, slug2] of duplicatePairs) {
    const pool1 = await db.select().from(miningPools).where(eq(miningPools.poolSlug, slug1));
    const pool2 = await db.select().from(miningPools).where(eq(miningPools.poolSlug, slug2));
    
    // If both exist, merge them into the standard one and delete the duplicate
    if (pool1.length > 0 && pool2.length > 0) {
      console.log(`Found duplicate pools: ${slug1} and ${slug2}`);
      
      // Determine which one to keep
      let keepSlug, deleteSlug;
      
      if (slug1 === 'braiinspool' || slug2 === 'braiinspool') {
        keepSlug = 'braiinspool';
        deleteSlug = keepSlug === slug1 ? slug2 : slug1;
      } else if (slug1 === 'marapool' || slug2 === 'marapool') {
        keepSlug = 'marapool';
        deleteSlug = keepSlug === slug1 ? slug2 : slug1;
      } else if (slug1 === 'btccom' || slug2 === 'btccom') {
        keepSlug = 'btccom';
        deleteSlug = keepSlug === slug1 ? slug2 : slug1;
      } else {
        // Default to the first one
        keepSlug = slug1;
        deleteSlug = slug2;
      }
      
      console.log(`Keeping ${keepSlug}, removing ${deleteSlug}`);
      
      // Delete the duplicate
      await db.delete(miningPools).where(eq(miningPools.poolSlug, deleteSlug));
    }
  }
}

/**
 * Main function to fetch data and update the database
 */
async function updateMiningPools() {
  console.log('Starting mining pools update...');
  
  try {
    // Create a map to store hashrate percentages for each pool and time period
    const poolData = new Map<string, {
      displayName: string,
      color: string,
      hashrate24h: number,
      hashrate3d: number,
      hashrate1w: number
    }>();
    
    // Fetch data for each time period
    const periods = ['24h', '3d', '1w'];
    
    for (const period of periods) {
      console.log(`Fetching data for ${period} period...`);
      const response = await axios.get(`https://mempool.space/api/v1/mining/pools/${period}`);
      
      if (!response.data || !response.data.pools || !Array.isArray(response.data.pools)) {
        console.error(`Invalid response format for ${period}`);
        continue;
      }
      
      // Calculate percentages for this period
      const percentages = calculatePercentages(response.data.pools);
      
      // Update the poolData map with the percentages for this period
      percentages.forEach((percentage, poolName) => {
        if (!poolData.has(poolName)) {
          poolData.set(poolName, {
            displayName: poolName,
            color: getColorForPool(poolName),
            hashrate24h: period === '24h' ? percentage : 0,
            hashrate3d: period === '3d' ? percentage : 0,
            hashrate1w: period === '1w' ? percentage : 0
          });
        } else {
          const data = poolData.get(poolName)!;
          
          if (period === '24h') data.hashrate24h = percentage;
          else if (period === '3d') data.hashrate3d = percentage;
          else if (period === '1w') data.hashrate1w = percentage;
          
          poolData.set(poolName, data);
        }
      });
    }
    
    // Update the database with the new data
    console.log(`Updating ${poolData.size} mining pools in the database...`);
    
    // First, let's check for any duplicate or similar pools in the database
    // and merge their data if needed
    await cleanupDuplicatePools();
    
    // Convert map entries to array for compatibility
    const poolEntries = Array.from(poolData.entries());
    
    for (const [poolName, data] of poolEntries) {
      const poolSlug = poolNameToSlug(poolName);
      
      // Handle known duplicate cases
      if (poolSlug === 'braiins' || poolSlug === 'braiinspool') {
        // Use braiinspool consistently
        await handleStandardizedPool('braiinspool', 'Braiins Pool', data);
        continue;
      }
      
      if (poolSlug === 'mara' || poolSlug === 'marapool') {
        // Use marapool consistently
        await handleStandardizedPool('marapool', 'MARA Pool', data);
        continue;
      }
      
      if (poolSlug === 'btccom' || poolSlug === 'btc.com') {
        // Use btccom consistently
        await handleStandardizedPool('btccom', 'BTC.com', data);
        continue;
      }
      
      // Check if this pool already exists in the database
      const existingPool = await db.select().from(miningPools).where(eq(miningPools.poolSlug, poolSlug));
      
      if (existingPool.length > 0) {
        // Update existing pool
        await db.update(miningPools)
          .set({
            displayName: data.displayName,
            color: data.color,
            hashrate24h: data.hashrate24h,
            hashrate3d: data.hashrate3d,
            hashrate1w: data.hashrate1w,
            updatedAt: new Date()
          })
          .where(eq(miningPools.poolSlug, poolSlug));
          
        console.log(`Updated mining pool: ${poolName}`);
      } else {
        // Insert new pool
        await db.insert(miningPools).values({
          poolSlug,
          displayName: data.displayName,
          color: data.color,
          hashrate24h: data.hashrate24h,
          hashrate3d: data.hashrate3d,
          hashrate1w: data.hashrate1w
        });
        
        console.log(`Added new mining pool: ${poolName}`);
      }
    }
    
    console.log('Mining pools update completed successfully!');
  } catch (error) {
    console.error('Error updating mining pools:', error);
  }
}

// Simply export the function - we'll call it from the API service
// No need to run it directly when imported

// Export the function for use in other modules
export { updateMiningPools };