import { db, pool } from "../server/db";
import { sql } from "drizzle-orm";

async function fixBlockMinerOddsTable() {
  try {
    console.log("Fixing block_miner_odds table...");
    
    // Check if the miner_id column already exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'block_miner_odds' 
      AND column_name = 'miner_id'
    `;
    
    const checkResult = await db.execute(sql.raw(checkColumnQuery));
    
    if (checkResult.rows.length === 0) {
      // Add the miner_id column
      await db.execute(sql.raw(`
        ALTER TABLE block_miner_odds 
        ADD COLUMN miner_id INTEGER NULL
      `));
      console.log("Successfully added miner_id column to block_miner_odds table");
    } else {
      console.log("miner_id column already exists in block_miner_odds table");
    }
    
    // Add unique constraint on both poolSlug and blockNumber
    const checkConstraintQuery = `
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'block_miner_odds'::regclass 
      AND conname = 'block_miner_odds_block_number_pool_slug_key'
    `;
    
    const constraintResult = await db.execute(sql.raw(checkConstraintQuery));
    
    if (constraintResult.rows.length === 0) {
      // Add the unique constraint
      await db.execute(sql.raw(`
        ALTER TABLE block_miner_odds 
        ADD CONSTRAINT block_miner_odds_block_number_pool_slug_key 
        UNIQUE (block_number, pool_slug)
      `));
      console.log("Successfully added unique constraint on block_number and pool_slug");
    } else {
      console.log("Unique constraint already exists");
    }
    
    console.log("Database update completed successfully");
  } catch (error) {
    console.error("Error updating block_miner_odds table:", error);
  } finally {
    await pool.end();
  }
}

// Execute the function
fixBlockMinerOddsTable()
  .then(() => console.log("Script completed successfully"))
  .catch(error => console.error("Script failed:", error));