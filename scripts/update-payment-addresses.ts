import { db, pool } from "../server/db";
import { sql } from "drizzle-orm";

async function addOddsColumnToPaymentAddresses() {
  try {
    console.log("Adding odds column to payment_addresses table...");
    
    // Check if the column already exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payment_addresses' 
      AND column_name = 'odds'
    `;
    
    const checkResult = await db.execute(sql.raw(checkColumnQuery));
    
    if (checkResult.rows.length === 0) {
      // Add the column
      await db.execute(sql.raw(`
        ALTER TABLE payment_addresses 
        ADD COLUMN odds REAL
      `));
      console.log("Successfully added odds column to payment_addresses table");
    } else {
      console.log("odds column already exists in payment_addresses table");
    }
    
    // Update unique constraint
    const checkConstraintQuery = `
      SELECT conname 
      FROM pg_constraint 
      WHERE conname = 'payment_addresses_bet_id_bet_type_outcome_odds_currency_key'
    `;
    
    const constraintResult = await db.execute(sql.raw(checkConstraintQuery));
    
    if (constraintResult.rows.length === 0) {
      // Drop the old constraint
      try {
        await db.execute(sql.raw(`
          ALTER TABLE payment_addresses 
          DROP CONSTRAINT IF EXISTS payment_addresses_bet_id_bet_type_outcome_currency_key
        `));
        console.log("Successfully dropped old constraint");
        
        // Add new constraint including odds
        await db.execute(sql.raw(`
          ALTER TABLE payment_addresses 
          ADD CONSTRAINT payment_addresses_bet_id_bet_type_outcome_odds_currency_key 
          UNIQUE (bet_id, bet_type, outcome, odds, currency)
        `));
        console.log("Successfully added new constraint with odds column");
      } catch (error) {
        console.error("Error updating constraints:", error);
      }
    } else {
      console.log("New constraint already exists");
    }
    
    console.log("Database update completed successfully");
  } catch (error) {
    console.error("Error updating payment_addresses table:", error);
  } finally {
    await pool.end();
  }
}

// Execute the function
addOddsColumnToPaymentAddresses()
  .then(() => console.log("Script completed"))
  .catch(error => console.error("Script failed:", error));