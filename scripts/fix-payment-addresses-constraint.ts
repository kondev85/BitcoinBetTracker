import { db, pool } from "../server/db";
import { sql } from "drizzle-orm";

async function fixPaymentAddressesConstraint() {
  try {
    console.log("Fixing payment_addresses table constraints...");
    
    // First drop the existing constraint
    await db.execute(sql.raw(`
      ALTER TABLE payment_addresses 
      DROP CONSTRAINT IF EXISTS payment_addresses_bet_id_bet_type_outcome_odds_currency_key
    `));
    console.log("Dropped existing constraint");
    
    // Now add the new constraint that includes pool_slug
    await db.execute(sql.raw(`
      ALTER TABLE payment_addresses 
      ADD CONSTRAINT payment_addresses_bet_id_bet_type_pool_slug_outcome_odds_currency_key 
      UNIQUE (bet_id, bet_type, pool_slug, outcome, odds, currency)
    `));
    console.log("Added new constraint including pool_slug");
    
    console.log("Payment addresses constraints updated successfully");
  } catch (error) {
    console.error("Error updating payment_addresses constraints:", error);
  } finally {
    await pool.end();
  }
}

// Execute the function
fixPaymentAddressesConstraint()
  .then(() => console.log("Script completed successfully"))
  .catch(error => console.error("Script failed:", error));