import 'dotenv/config';
import { db, closePool } from '../server/db';
import { sql } from 'drizzle-orm';

/**
 * This script modifies the payment_addresses table structure:
 * 1. Removes the currency column (as all addresses will be BTC by default)
 * 2. Adds ltc_address and usdc_address columns for Litecoin and USDC payment options
 */
async function updatePaymentAddressesStructure() {
  try {
    console.log('Starting payment_addresses table structure update...');
    
    // First, check if the ltc_address and usdc_address columns already exist
    const checkColumns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payment_addresses' 
      AND (column_name = 'ltc_address' OR column_name = 'usdc_address')
    `);
    
    if (checkColumns.length > 0) {
      console.log('New columns already exist, skipping column addition');
    } else {
      // Add the new columns
      console.log('Adding ltc_address and usdc_address columns...');
      await db.execute(sql`
        ALTER TABLE payment_addresses 
        ADD COLUMN IF NOT EXISTS ltc_address TEXT,
        ADD COLUMN IF NOT EXISTS usdc_address TEXT
      `);
      console.log('New columns added successfully');
    }
    
    // Check if the currency column exists
    const checkCurrencyColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payment_addresses' 
      AND column_name = 'currency'
    `);
    
    if (checkCurrencyColumn.length === 0) {
      console.log('Currency column does not exist, skipping removal');
    } else {
      // Remove the currency column
      console.log('Removing currency column...');
      await db.execute(sql`
        ALTER TABLE payment_addresses 
        DROP COLUMN IF EXISTS currency
      `);
      console.log('Currency column removed successfully');
    }
    
    console.log('Payment addresses structure update completed successfully');
  } catch (error) {
    console.error('Error updating payment_addresses structure:', error);
    throw error;
  } finally {
    await closePool();
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  updatePaymentAddressesStructure()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}