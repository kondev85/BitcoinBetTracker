import { db } from '../server/db';
import { sql } from 'drizzle-orm';

/**
 * This script modifies the time_bets table to allow null values for odds
 * so that only the selected bet type has odds and the other is null.
 */
async function updateTimeBetsSchema() {
  console.log('Starting time_bets schema update to allow null values for odds...');

  try {
    // Start a transaction to ensure database consistency
    await db.execute(sql`BEGIN`);
    
    try {
      // Drop the NOT NULL constraint for under_minutes_odds column
      console.log('Dropping NOT NULL constraint for under_minutes_odds...');
      await db.execute(sql`
        ALTER TABLE time_bets
        ALTER COLUMN under_minutes_odds DROP NOT NULL
      `);
      
      // Drop the NOT NULL constraint for over_minutes_odds column
      console.log('Dropping NOT NULL constraint for over_minutes_odds...');
      await db.execute(sql`
        ALTER TABLE time_bets
        ALTER COLUMN over_minutes_odds DROP NOT NULL
      `);
      
      // Remove the default value for under_minutes_odds
      console.log('Removing default value for under_minutes_odds...');
      await db.execute(sql`
        ALTER TABLE time_bets
        ALTER COLUMN under_minutes_odds DROP DEFAULT
      `);
      
      // Remove the default value for over_minutes_odds
      console.log('Removing default value for over_minutes_odds...');
      await db.execute(sql`
        ALTER TABLE time_bets
        ALTER COLUMN over_minutes_odds DROP DEFAULT
      `);
      
      // Commit the transaction
      await db.execute(sql`COMMIT`);
      console.log('Successfully updated time_bets table schema');
    } catch (error) {
      // Rollback on error
      await db.execute(sql`ROLLBACK`);
      throw error;
    }

    console.log('Time bets schema update completed successfully');
  } catch (error) {
    console.error('Error updating time_bets schema:', error);
    throw error;
  }
}

// Run the migration
updateTimeBetsSchema()
  .then(() => {
    console.log('Time bets schema update completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Time bets schema update failed:', error);
    process.exit(1);
  });