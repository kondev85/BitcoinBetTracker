import { db, pool } from '../server/db';
import * as schema from '../shared/schema';
import { eq, sql } from 'drizzle-orm';

// Define mapping from various pool slug formats to canonical slugs
const poolSlugMapping: Record<string, string> = {
  // Foundry variants
  'foundry-usa': 'foundryusa',
  'foundry usa': 'foundryusa',
  'foundry': 'foundryusa',
  
  // Binance variants
  'binance-pool': 'binancepool',
  'binance pool': 'binancepool',
  'binance': 'binancepool',
  
  // F2Pool variants
  'f2-pool': 'f2pool',
  'f2 pool': 'f2pool',
  
  // ViaBTC variants
  'via-btc': 'viabtc',
  'via btc': 'viabtc',
  
  // BTC.com variants
  'btc.com': 'btccom',
  'btc-com': 'btccom',
  'btc com': 'btccom',
  
  // SBI Crypto variants
  'sbi-crypto': 'sbicrypto',
  'sbi crypto': 'sbicrypto',
  'sbi': 'sbicrypto',
  
  // MARA Pool variants
  'mara-pool': 'marapool',
  'mara pool': 'marapool',
  'mara': 'marapool',
  
  // Braiins Pool variants
  'braiins-pool': 'braiinspool',
  'braiins pool': 'braiinspool',
  'slushpool': 'braiinspool',
  'slush-pool': 'braiinspool',
  'slush pool': 'braiinspool',
  
  // Spider Pool variants
  'spider-pool': 'spiderpool',
  'spider pool': 'spiderpool',
  'spider': 'spiderpool',
  
  // Mining Squared variants
  'mining-squared': 'miningsquared',
  'mining squared': 'miningsquared',
  
  // Carbon Negative variants
  'carbon-negative': 'carbonnegative',
  'carbon negative': 'carbonnegative',

  // Other variants that might exist
  'luxor-mining': 'luxor',
  'luxor mining': 'luxor',
  'ocean-pool': 'ocean',
  'ocean pool': 'ocean',
  'unknown-pool': 'unknown',
  'unknown pool': 'unknown'
};

// Main function to normalize pool slugs in the blocks table
async function normalizeBlockPools() {
  try {
    console.log('Starting to normalize pool slugs in blocks table...');
    
    // Get all unique pool slugs from blocks table
    const query = sql`
      SELECT DISTINCT pool_slug FROM blocks 
      WHERE pool_slug IS NOT NULL AND pool_slug <> ''
    `;
    
    const result = await db.execute(query);
    const poolSlugs: string[] = result.rows.map((row: any) => row.pool_slug);
    
    console.log(`Found ${poolSlugs.length} unique pool slugs in blocks table`);
    
    // Count of updated blocks
    let totalUpdated = 0;
    
    // Process each pool slug
    for (const poolSlug of poolSlugs) {
      // Check if this slug needs to be normalized
      const normalizedSlug = poolSlugMapping[poolSlug.toLowerCase()];
      
      if (normalizedSlug) {
        // Update blocks with this slug
        console.log(`Normalizing: ${poolSlug} -> ${normalizedSlug}`);
        
        // Count blocks with this slug
        const countQuery = sql`
          SELECT COUNT(*) as count FROM blocks 
          WHERE pool_slug = ${poolSlug}
        `;
        const countResult = await db.execute(countQuery);
        const count = parseInt(countResult.rows[0].count || '0');
        
        // Update blocks
        await db
          .update(schema.blocks)
          .set({ poolSlug: normalizedSlug })
          .where(eq(schema.blocks.poolSlug, poolSlug));
          
        console.log(`Updated ${count} blocks from ${poolSlug} to ${normalizedSlug}`);
        totalUpdated += count;
      }
    }
    
    console.log(`Normalization complete. Updated ${totalUpdated} blocks.`);
    
    // Get the final list of unique pool slugs
    const finalQuery = sql`
      SELECT DISTINCT pool_slug FROM blocks 
      WHERE pool_slug IS NOT NULL AND pool_slug <> ''
    `;
    
    const finalResult = await db.execute(finalQuery);
    const finalPoolSlugs: string[] = finalResult.rows.map((row: any) => row.pool_slug);
    
    console.log(`Now have ${finalPoolSlugs.length} unique pool slugs in blocks table`);
    console.log('Final pool slug list: ', finalPoolSlugs.join(', '));
    
  } catch (error) {
    console.error('Error normalizing pool slugs in blocks table:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the script
normalizeBlockPools().catch(console.error);