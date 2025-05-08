import { db, pool } from "../server/db";
import { sql } from "drizzle-orm";

async function addUniqueConstraints() {
  try {
    console.log("Adding unique constraints to tables...");
    
    // 1. Add unique constraint to block_miner_odds table
    const checkBmoConstraintQuery = `
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'block_miner_odds'::regclass 
      AND conname = 'block_miner_odds_block_number_pool_slug_key'
    `;
    
    const bmoConstraintResult = await db.execute(sql.raw(checkBmoConstraintQuery));
    
    if (bmoConstraintResult.rows.length === 0) {
      // Add the unique constraint
      await db.execute(sql.raw(`
        ALTER TABLE block_miner_odds 
        ADD CONSTRAINT block_miner_odds_block_number_pool_slug_key 
        UNIQUE (block_number, pool_slug)
      `));
      console.log("Successfully added unique constraint to block_miner_odds table");
    } else {
      console.log("Unique constraint already exists on block_miner_odds table");
    }
    
    // 2. Update constraint for payment_addresses table
    // First drop the existing constraint
    await db.execute(sql.raw(`
      ALTER TABLE payment_addresses 
      DROP CONSTRAINT IF EXISTS payment_addresses_bet_id_bet_type_outcome_odds_currency_key
    `));
    console.log("Dropped existing constraint from payment_addresses table");
    
    // Now add the new constraint that includes pool_slug
    await db.execute(sql.raw(`
      ALTER TABLE payment_addresses 
      ADD CONSTRAINT payment_addresses_bet_id_bet_type_pool_slug_outcome_odds_currency_key 
      UNIQUE (bet_id, bet_type, pool_slug, outcome, odds, currency)
    `));
    console.log("Added new constraint to payment_addresses table");
    
    console.log("Unique constraints added successfully");
  } catch (error) {
    console.error("Error adding unique constraints:", error);
  } finally {
    await pool.end();
  }
}

// Execute the function
addUniqueConstraints()
  .then(() => console.log("Script completed successfully"))
  .catch(error => console.error("Script failed:", error));