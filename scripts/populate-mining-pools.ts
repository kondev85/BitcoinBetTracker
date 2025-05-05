import { db, pool } from '../server/db';
import * as schema from '../shared/schema';
import { eq, sql } from 'drizzle-orm';
import { type InsertMiningPool } from '../shared/schema';

// Function to generate a color for a given pool name
function getColorForPool(poolName: string): string {
  // Color map for popular mining pools
  const colorMap: { [key: string]: string } = {
    'foundry usa': '#F7931A', // Orange
    'foundryusa': '#F7931A',
    'antpool': '#3B82F6', // Blue
    'f2pool': '#10B981', // Green
    'viabtc': '#6D28D9', // Purple
    'binancepool': '#FBBF24', // Yellow
    'poolin': '#EC4899', // Pink
    'unknown': '#6B7280', // Gray
    'slushpool': '#06B6D4', // Cyan
    'marapool': '#84CC16', // Lime
    'mara pool': '#84CC16',
    'luxor': '#EC4899', // Pink
    'luxor mining': '#EC4899',
    'btc.com': '#0EA5E9', // Light blue
    'braiins pool': '#af96be', // Light purple
    'spiderpool': '#FB923C', // Orange-ish
    'sbicrypto': '#06B6D4', // Cyan
    'sbi crypto': '#06B6D4',
    'oceanpool': '#0D9488', // Teal
    'ocean pool': '#0D9488',
    'ocean': '#0D9488'
  };

  // Normalize the pool name for lookup
  const normalizedName = poolName.toLowerCase();
  
  // Return the color if it exists in the map, otherwise return a default color
  return colorMap[normalizedName] || '#6B7280'; // Default to gray
}

// Function to standardize pool names
function standardizePoolName(poolName: string): string {
  // Map of common variations to standardized names
  const nameMap: { [key: string]: string } = {
    'foundry': 'Foundry USA',
    'foundryusa': 'Foundry USA',
    'foundry usa': 'Foundry USA',
    'antpool': 'AntPool',
    'f2pool': 'F2Pool',
    'f2 pool': 'F2Pool',
    'viabtc': 'ViaBTC',
    'via btc': 'ViaBTC',
    'binancepool': 'Binance Pool',
    'binance pool': 'Binance Pool',
    'poolin': 'Poolin',
    'slushpool': 'Braiins Pool',
    'slush pool': 'Braiins Pool',
    'braiins': 'Braiins Pool',
    'braiins pool': 'Braiins Pool',
    'marapool': 'MARA Pool',
    'mara pool': 'MARA Pool',
    'mara': 'MARA Pool',
    'luxor': 'Luxor',
    'luxor mining': 'Luxor',
    'btc.com': 'BTC.com',
    'btccom': 'BTC.com',
    'btc com': 'BTC.com',
    'sbicrypto': 'SBI Crypto',
    'sbi crypto': 'SBI Crypto',
    'sbi': 'SBI Crypto',
    'oceanpool': 'OCEAN',
    'ocean pool': 'OCEAN',
    'ocean': 'OCEAN',
    'unknown': 'Unknown Pool',
    'spider': 'SpiderPool',
    'spiderpool': 'SpiderPool',
    'spider pool': 'SpiderPool'
  };

  // Normalize the pool name for lookup
  const normalizedName = poolName.toLowerCase();
  
  // Return the standardized name if it exists in the map, otherwise return the original
  return nameMap[normalizedName] || poolName;
}

// Main function to populate the mining_pools table from blocks data
async function populateMiningPoolsFromBlocks() {
  try {
    console.log('Starting to populate mining_pools table from blocks data...');
    
    // Get unique pool slugs from blocks table
    const query = sql`
      SELECT DISTINCT pool_slug FROM blocks 
      WHERE pool_slug IS NOT NULL AND pool_slug <> ''
    `;
    
    const result = await db.execute(query);
    const poolSlugs: string[] = result.rows.map((row: any) => row.pool_slug);
    
    console.log(`Found ${poolSlugs.length} unique pool slugs in blocks table.`);
    
    // Count of existing and newly added pools
    let existingCount = 0;
    let addedCount = 0;
    
    // Process each pool slug
    for (const poolSlug of poolSlugs) {
      try {
        // Check if pool already exists in mining_pools table
        const [existingPool] = await db
          .select()
          .from(schema.miningPools)
          .where(eq(schema.miningPools.poolSlug, poolSlug));
        
        if (existingPool) {
          console.log(`Pool '${poolSlug}' already exists in database.`);
          existingCount++;
          continue;
        }
        
        // Standardize the pool name and get display name
        const displayName = standardizePoolName(poolSlug);
        
        // Get a color for the pool
        const color = getColorForPool(poolSlug);
        
        // Create a new mining pool record
        const newPool: InsertMiningPool = {
          poolSlug,
          displayName,
          color,
          hashrate24h: 0,  // Default values, to be updated later
          hashrate3d: 0,
          hashrate1w: 0
        };
        
        // Insert the new pool
        const [insertedPool] = await db
          .insert(schema.miningPools)
          .values(newPool)
          .returning();
        
        console.log(`Added new mining pool: ${poolSlug} (${displayName})`);
        addedCount++;
        
      } catch (error) {
        console.error(`Error processing pool '${poolSlug}':`, error);
      }
    }
    
    console.log(`Mining pools population complete.`);
    console.log(`Pools already in database: ${existingCount}`);
    console.log(`New pools added: ${addedCount}`);
    console.log(`Total unique pools: ${poolSlugs.length}`);
    
  } catch (error) {
    console.error('Error populating mining_pools table:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the script
populateMiningPoolsFromBlocks().catch(console.error);