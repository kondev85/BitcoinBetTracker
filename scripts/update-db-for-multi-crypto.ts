import { db } from '../server/db';
import { sql } from 'drizzle-orm';

/**
 * This script replaces the currency column with cryptocurrency-specific address columns
 * in the payment_addresses table to support multiple cryptocurrency payment options.
 */
async function updateDatabaseForMultiCrypto() {
  console.log('Starting database update for multi-cryptocurrency support...');

  try {
    // Check if ltc_address column exists
    const checkLtcColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payment_addresses' AND column_name = 'ltc_address'
    `);

    // Check if currency column exists (old structure)
    const checkCurrencyColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payment_addresses' AND column_name = 'currency'
    `);

    // If currency exists (old schema) and ltc_address doesn't exist (new schema)
    if ((checkCurrencyColumn as any).rows?.length > 0 && (checkLtcColumn as any).rows?.length === 0) {
      console.log('Found old schema with currency column. Updating to multi-cryptocurrency structure...');
      
      // Start a transaction to ensure database consistency
      await db.execute(sql`BEGIN`);
      
      try {
        // First drop the currency column (we'll use default BTC in address)
        console.log('Removing currency column...');
        await db.execute(sql`
          ALTER TABLE payment_addresses
          DROP COLUMN IF EXISTS currency
        `);
        
        // Add the new cryptocurrency address columns
        console.log('Adding cryptocurrency-specific address columns...');
        await db.execute(sql`
          ALTER TABLE payment_addresses 
          ADD COLUMN ltc_address TEXT,
          ADD COLUMN usdc_address TEXT
        `);
        
        // Commit the transaction
        await db.execute(sql`COMMIT`);
        console.log('Successfully updated payment_addresses table structure');
      } catch (error) {
        // Rollback on error
        await db.execute(sql`ROLLBACK`);
        throw error;
      }
    } else if ((checkLtcColumn as any).rows?.length > 0) {
      console.log('Multi-cryptocurrency columns already exist with new schema');
    } else {
      console.log('Unexpected database state. Please check the payment_addresses table structure.');
    }

    console.log('Database update completed successfully');
  } catch (error) {
    console.error('Error updating database:', error);
    throw error;
  }
}

// Run the migration
updateDatabaseForMultiCrypto()
  .then(() => {
    console.log('Database update completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database update failed:', error);
    process.exit(1);
  });