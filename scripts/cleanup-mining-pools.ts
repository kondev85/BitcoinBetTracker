import { db, pool } from '../server/db';
import * as schema from '../shared/schema';
import { eq, sql } from 'drizzle-orm';

// Define canonical pool slugs and their variants
const canonicalMappings: Record<string, string[]> = {
  'foundryusa': ['foundry-usa'],
  'antpool': [],
  'f2pool': [],
  'viabtc': [],
  'binancepool': ['binance-pool'],
  'btccom': ['btc.com'],
  'sbicrypto': ['sbi-crypto'],
  'marapool': ['mara-pool'],
  'braiinspool': ['braiins-pool'],
  'spiderpool': [],
  'luxor': [],
  'poolin': [],
  'ocean': [],
  'miningsquared': ['mining-squared'],
  'carbonnegative': ['carbon-negative'],
  'ultimuspool': [],
  'secpool': [],
  'unknown': []
};

// Perform the cleanup
async function cleanupMiningPools() {
  try {
    console.log('Starting mining_pools table cleanup...');
    
    // For each canonical slug and its variants
    for (const [canonicalSlug, variants] of Object.entries(canonicalMappings)) {
      console.log(`Processing canonical slug: ${canonicalSlug}`);
      
      // Check if the canonical slug exists
      const [canonicalPool] = await db
        .select()
        .from(schema.miningPools)
        .where(eq(schema.miningPools.poolSlug, canonicalSlug));
      
      if (!canonicalPool) {
        console.log(`Warning: Canonical pool ${canonicalSlug} not found in database, skipping`);
        continue;
      }
      
      // For each variant, transfer any block references and delete the variant
      for (const variant of variants) {
        console.log(`Processing variant: ${variant}`);
        
        // Check if the variant exists
        const [variantPool] = await db
          .select()
          .from(schema.miningPools)
          .where(eq(schema.miningPools.poolSlug, variant));
          
        if (!variantPool) {
          console.log(`Variant ${variant} not found, skipping`);
          continue;
        }
        
        // Update any blocks that reference the variant to use the canonical slug
        console.log(`Updating blocks: ${variant} -> ${canonicalSlug}`);
        const updateResult = await db
          .update(schema.blocks)
          .set({ poolSlug: canonicalSlug })
          .where(eq(schema.blocks.poolSlug, variant));
          
        console.log(`Updated blocks with pool_slug = '${variant}' to use '${canonicalSlug}'`);
        
        // Delete the variant from mining_pools
        console.log(`Deleting variant ${variant} from mining_pools`);
        await db
          .delete(schema.miningPools)
          .where(eq(schema.miningPools.poolSlug, variant));
          
        console.log(`Deleted variant ${variant}`);
      }
    }
    
    // Check for any remaining duplicates
    const duplicateCheck = await db.execute(sql`
      SELECT display_name, COUNT(*) as count
      FROM mining_pools
      GROUP BY display_name
      HAVING COUNT(*) > 1
    `);
    
    if (duplicateCheck.rows.length > 0) {
      console.log('Remaining duplicates found:');
      console.log(duplicateCheck.rows);
    } else {
      console.log('No duplicate display names remaining');
    }
    
    console.log('Mining pools cleanup complete');
  } catch (error) {
    console.error('Error cleaning up mining_pools table:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the script
cleanupMiningPools().catch(console.error);