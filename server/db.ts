import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
});
export const db = drizzle({ client: pool, schema });

// Health check function to test database connection
export async function checkDbConnection() {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT 1');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  } finally {
    if (client) client.release();
  }
}

// Function to forcibly reset the pool if needed
export async function resetConnectionPool() {
  try {
    await pool.end();
    console.log('Connection pool closed, recreating...');
    // Recreate the pool with the same settings
    const newPool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
    });
    
    // Replace the global pool reference
    Object.assign(pool, newPool);
    console.log('Connection pool recreated successfully');
    return true;
  } catch (error) {
    console.error('Failed to reset connection pool:', error);
    return false;
  }
}

// Export a function to close the pool when needed
export const closePool = async () => {
  await pool.end();
};