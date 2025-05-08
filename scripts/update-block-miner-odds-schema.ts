import { db } from '../server/db';
import { sql } from 'drizzle-orm';

/**
 * This script modifies the block_miner_odds table to allow null values for odds
 * so that only the selected bet type (hit or no_hit) has odds and the other is null.
 */
async function updateBlockMinerOddsSchema() {
  console.log('Starting block_miner_odds schema update to allow null values for odds...');

  try {
    // Start a transaction to ensure database consistency
    await db.execute(sql`BEGIN`);
    
    try {
      // Drop the NOT NULL constraint for hit_odds column
      console.log('Dropping NOT NULL constraint for hit_odds...');
      await db.execute(sql`
        ALTER TABLE block_miner_odds
        ALTER COLUMN hit_odds DROP NOT NULL
      `);
      
      // Drop the NOT NULL constraint for no_hit_odds column
      console.log('Dropping NOT NULL constraint for no_hit_odds...');
      await db.execute(sql`
        ALTER TABLE block_miner_odds
        ALTER COLUMN no_hit_odds DROP NOT NULL
      `);
      
      // Remove the default value for hit_odds
      console.log('Removing default value for hit_odds...');
      await db.execute(sql`
        ALTER TABLE block_miner_odds
        ALTER COLUMN hit_odds DROP DEFAULT
      `);
      
      // Remove the default value for no_hit_odds
      console.log('Removing default value for no_hit_odds...');
      await db.execute(sql`
        ALTER TABLE block_miner_odds
        ALTER COLUMN no_hit_odds DROP DEFAULT
      `);
      
      // Commit the transaction
      await db.execute(sql`COMMIT`);
      console.log('Successfully updated block_miner_odds table schema');
    } catch (error) {
      // Rollback on error
      await db.execute(sql`ROLLBACK`);
      throw error;
    }

    console.log('Block miner odds schema update completed successfully');
  } catch (error) {
    console.error('Error updating block_miner_odds schema:', error);
    throw error;
  }
}

// Run the migration
updateBlockMinerOddsSchema()
  .then(() => {
    console.log('Block miner odds schema update completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Block miner odds schema update failed:', error);
    process.exit(1);
  });