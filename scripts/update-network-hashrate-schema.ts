import { db, pool } from '../server/db';
import { sql } from 'drizzle-orm';

/**
 * This script updates the network_hashrate table to add new columns for different time periods
 * and removes the unique constraint from the period column.
 */
async function updateNetworkHashrateSchema() {
  console.log('Starting network_hashrate schema update...');
  
  try {
    // 1. Add new columns for different time periods
    console.log('Adding new columns to network_hashrate table...');
    
    const alterTableQueries = [
      // Add hashrate_24h column if it doesn't exist
      sql`ALTER TABLE IF EXISTS network_hashrate ADD COLUMN IF NOT EXISTS hashrate_24h REAL`,
      
      // Add hashrate_3d column if it doesn't exist
      sql`ALTER TABLE IF EXISTS network_hashrate ADD COLUMN IF NOT EXISTS hashrate_3d REAL`,
      
      // Add hashrate_1w column if it doesn't exist
      sql`ALTER TABLE IF EXISTS network_hashrate ADD COLUMN IF NOT EXISTS hashrate_1w REAL`,
      
      // Add block_count column if it doesn't exist
      sql`ALTER TABLE IF EXISTS network_hashrate ADD COLUMN IF NOT EXISTS block_count INTEGER`
    ];
    
    for (const query of alterTableQueries) {
      await db.execute(query);
    }
    console.log('New columns added to network_hashrate table');
    
    // 2. Remove the unique constraint from period column
    // This is more complex as we need to:
    // a. Create a new table without the constraint
    // b. Copy the data over
    // c. Drop the old table
    // d. Rename the new table to the original name
    
    // First, check if the constraint exists
    const constraintCheckQuery = sql`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'network_hashrate'
      AND constraint_type = 'UNIQUE'
    `;
    
    const constraintCheck = await db.execute(constraintCheckQuery);
    
    if (constraintCheck.rows.length > 0) {
      console.log('Removing unique constraint from period column...');
      
      // Create a temporary table without the constraint
      await db.execute(sql`
        CREATE TABLE network_hashrate_new (
          id SERIAL PRIMARY KEY,
          period TEXT NOT NULL,
          hashrate REAL NOT NULL,
          hashrate_24h REAL,
          hashrate_3d REAL,
          hashrate_1w REAL,
          block_count INTEGER,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Copy data from old table to new table
      await db.execute(sql`
        INSERT INTO network_hashrate_new (id, period, hashrate, hashrate_24h, hashrate_3d, hashrate_1w, block_count, updated_at)
        SELECT id, period, hashrate, 
               hashrate_24h, 
               hashrate_3d, 
               hashrate_1w, 
               block_count, 
               updated_at
        FROM network_hashrate
      `);
      
      // Drop the old table
      await db.execute(sql`DROP TABLE network_hashrate`);
      
      // Rename the new table to the original name
      await db.execute(sql`ALTER TABLE network_hashrate_new RENAME TO network_hashrate`);
      
      console.log('Successfully removed unique constraint from period column');
    } else {
      console.log('No unique constraint found on period column - no changes needed');
    }
    
    // Update existing rows to copy hashrate to hashrate_24h where it's null
    await db.execute(sql`
      UPDATE network_hashrate
      SET hashrate_24h = hashrate
      WHERE hashrate_24h IS NULL
    `);
    
    console.log('Network hashrate schema update completed successfully');
  } catch (error) {
    console.error('Error updating network_hashrate schema:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
updateNetworkHashrateSchema()
  .then(() => {
    console.log('Network hashrate schema update completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Network hashrate schema update failed:', error);
    process.exit(1);
  });