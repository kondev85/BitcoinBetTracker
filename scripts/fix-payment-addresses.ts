import { db, pool } from "../server/db";
import { sql } from "drizzle-orm";

async function fixPaymentAddresses() {
  try {
    console.log("Updating payment_addresses table...");
    
    // 1. First drop the existing constraint
    await db.execute(sql.raw(`
      ALTER TABLE payment_addresses 
      DROP CONSTRAINT IF EXISTS payment_addresses_bet_id_bet_type_outcome_odds_currency_key
    `));
    console.log("Dropped existing constraint from payment_addresses");
    
    // 2. Now add the new constraint that includes pool_slug
    await db.execute(sql.raw(`
      ALTER TABLE payment_addresses 
      ADD CONSTRAINT payment_addresses_bet_id_bet_type_pool_slug_outcome_currency_key 
      UNIQUE (bet_id, bet_type, pool_slug, outcome, currency)
    `));
    console.log("Added new constraint to payment_addresses");
    
    console.log("Payment addresses table updated successfully");
  } catch (error) {
    console.error("Error updating payment_addresses table:", error);
  } finally {
    await pool.end();
  }
}

// Execute the function
fixPaymentAddresses()
  .then(() => console.log("Script completed successfully"))
  .catch(error => console.error("Script failed:", error));