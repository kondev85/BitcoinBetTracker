import { db, pool } from "../server/db";
import { sql } from "drizzle-orm";

async function reorderPaymentAddressesColumns() {
  try {
    console.log("Reordering columns in payment_addresses table...");
    
    // First, create a new table with the desired column order
    await db.execute(sql.raw(`
      CREATE TABLE payment_addresses_new (
        id SERIAL PRIMARY KEY,
        bet_id INTEGER NOT NULL,
        bet_type TEXT NOT NULL,
        pool_slug TEXT,
        outcome TEXT NOT NULL,
        odds REAL,
        currency TEXT NOT NULL,
        address TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `));
    
    console.log("Created new table with desired column order");
    
    // Copy data from the old table to the new table
    await db.execute(sql.raw(`
      INSERT INTO payment_addresses_new (
        id, bet_id, bet_type, pool_slug, outcome, odds, currency, address, created_at
      )
      SELECT id, bet_id, bet_type, pool_slug, outcome, odds, currency, address, created_at
      FROM payment_addresses
    `));
    
    console.log("Copied data to new table");
    
    // Drop the old table
    await db.execute(sql.raw(`DROP TABLE payment_addresses`));
    console.log("Dropped old table");
    
    // Rename the new table to the original name
    await db.execute(sql.raw(`ALTER TABLE payment_addresses_new RENAME TO payment_addresses`));
    console.log("Renamed new table to payment_addresses");
    
    // Recreate the sequence for the ID column
    await db.execute(sql.raw(`
      ALTER SEQUENCE payment_addresses_new_id_seq RENAME TO payment_addresses_id_seq
    `));
    console.log("Renamed sequence");
    
    // Add the unique constraint
    await db.execute(sql.raw(`
      ALTER TABLE payment_addresses 
      ADD CONSTRAINT payment_addresses_bet_id_bet_type_outcome_odds_currency_key 
      UNIQUE (bet_id, bet_type, outcome, odds, currency)
    `));
    console.log("Added unique constraint");
    
    console.log("Successfully reordered columns in payment_addresses table");
  } catch (error) {
    console.error("Error reordering columns:", error);
  } finally {
    await pool.end();
  }
}

// Execute the function
reorderPaymentAddressesColumns()
  .then(() => console.log("Script completed successfully"))
  .catch(error => console.error("Script failed:", error));