import { db, pool } from "../server/db";
import { sql } from "drizzle-orm";

async function fixBlockMinerOddsDuplicates() {
  try {
    console.log("Fixing duplicates in block_miner_odds table...");
    
    // 1. Find duplicate block_number, pool_slug combinations
    const findDuplicatesQuery = `
      SELECT block_number, pool_slug, COUNT(*) 
      FROM block_miner_odds 
      GROUP BY block_number, pool_slug 
      HAVING COUNT(*) > 1
    `;
    
    const duplicates = await db.execute(sql.raw(findDuplicatesQuery));
    console.log(`Found ${duplicates.rows.length} duplicate combinations`);
    
    // 2. For each duplicate set, keep the newest one and delete the rest
    for (const dup of duplicates.rows) {
      const blockNumber = dup.block_number;
      const poolSlug = dup.pool_slug;
      
      // Get all records for this combination
      const recordsQuery = `
        SELECT id, created_at
        FROM block_miner_odds
        WHERE block_number = ${blockNumber} AND pool_slug = '${poolSlug}'
        ORDER BY created_at DESC
      `;
      
      const records = await db.execute(sql.raw(recordsQuery));
      
      // Keep the newest one (first in the sorted list)
      // and delete the rest
      if (records.rows.length > 1) {
        const keepId = records.rows[0].id;
        const deleteIds = records.rows.slice(1).map(r => r.id).join(',');
        
        if (deleteIds) {
          const deleteQuery = `
            DELETE FROM block_miner_odds
            WHERE id IN (${deleteIds})
          `;
          
          await db.execute(sql.raw(deleteQuery));
          console.log(`Deleted ${records.rows.length - 1} duplicate records for block ${blockNumber}, pool ${poolSlug}`);
        }
      }
    }
    
    // 3. Now try to add the unique constraint
    try {
      await db.execute(sql.raw(`
        ALTER TABLE block_miner_odds 
        ADD CONSTRAINT block_miner_odds_block_number_pool_slug_key 
        UNIQUE (block_number, pool_slug)
      `));
      console.log("Successfully added unique constraint to block_miner_odds");
    } catch (constraintError) {
      console.error("Error adding constraint:", constraintError);
    }
    
    console.log("block_miner_odds table cleaned up successfully");
  } catch (error) {
    console.error("Error fixing block_miner_odds duplicates:", error);
  } finally {
    await pool.end();
  }
}

// Execute the function
fixBlockMinerOddsDuplicates()
  .then(() => console.log("Script completed successfully"))
  .catch(error => console.error("Script failed:", error));