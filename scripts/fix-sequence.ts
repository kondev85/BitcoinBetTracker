import { db, pool } from "../server/db";
import { sql } from "drizzle-orm";

async function fixSequences() {
  try {
    console.log("Fixing payment_addresses sequence...");
    
    // Get the current maximum ID from the payment_addresses table
    const maxIdQuery = `
      SELECT COALESCE(MAX(id), 0) as max_id FROM payment_addresses
    `;
    
    const maxIdResult = await db.execute(sql.raw(maxIdQuery));
    const maxId = parseInt(maxIdResult.rows[0].max_id);
    
    console.log(`Current maximum ID in payment_addresses table: ${maxId}`);
    
    // Now set the sequence to start from max_id + 1
    const newSeqValue = maxId + 1;
    const setSeqQuery = `
      SELECT setval('payment_addresses_id_seq', ${newSeqValue}, true)
    `;
    
    const seqResult = await db.execute(sql.raw(setSeqQuery));
    console.log(`Sequence updated to start from: ${newSeqValue}`);
    console.log(`Sequence update result:`, seqResult.rows[0]);
    
    console.log("Payment addresses sequence fixed successfully");
  } catch (error) {
    console.error("Error fixing payment_addresses sequence:", error);
  } finally {
    await pool.end();
  }
}

// Execute the function
fixSequences()
  .then(() => console.log("Script completed successfully"))
  .catch(error => console.error("Script failed:", error));