import axios from 'axios';
import { db, pool } from '../server/db';
import { networkHashrate } from '../shared/schema';

/**
 * Script to update network hashrate data periodically
 * This script will fetch network hashrate data from mempool.space and store it in the network_hashrate table
 * Each run creates new rows to maintain historical data
 */
async function updateNetworkHashrateData() {
  console.log('Starting network hashrate data update...');
  
  try {
    // Fetch data for each time period
    const periods = ['24h', '3d', '1w'];
    
    for (const period of periods) {
      console.log(`Fetching network hashrate data for ${period} period...`);
      const response = await axios.get(`https://mempool.space/api/v1/mining/pools/${period}`);
      
      if (!response.data) {
        console.error(`Invalid response format for ${period}`);
        continue;
      }
      
      // Extract network stats
      const networkStats = {
        lastEstimatedHashrate: response.data.lastEstimatedHashrate || 0,
        lastEstimatedHashrate3d: response.data.lastEstimatedHashrate3d || 0,
        lastEstimatedHashrate1w: response.data.lastEstimatedHashrate1w || 0,
        blockCount: response.data.pools ? response.data.pools.reduce((sum: number, pool: any) => sum + (pool.blockCount || 0), 0) : 0
      };
      
      // Convert the hashrates to readable format (EH/s) for logging
      const hashrate24hEH = networkStats.lastEstimatedHashrate / 1000000000000000000; // Convert to EH/s
      const hashrate3dEH = (networkStats.lastEstimatedHashrate3d || networkStats.lastEstimatedHashrate) / 1000000000000000000; // Convert to EH/s
      const hashrate1wEH = (networkStats.lastEstimatedHashrate1w || networkStats.lastEstimatedHashrate) / 1000000000000000000; // Convert to EH/s
      
      console.log(`Network hashrate data for ${period}:`);
      console.log(`- 24h hashrate: ${hashrate24hEH.toFixed(2)} EH/s`);
      console.log(`- 3d hashrate: ${hashrate3dEH.toFixed(2)} EH/s`);
      console.log(`- 1w hashrate: ${hashrate1wEH.toFixed(2)} EH/s`);
      console.log(`- Block count: ${networkStats.blockCount}`);
      
      // Store the data in the network_hashrate table
      // We do INSERT to create a new row for historical tracking
      await db.insert(networkHashrate).values({
        period: period,
        hashrate: networkStats.lastEstimatedHashrate, // For backward compatibility
        hashrate24h: networkStats.lastEstimatedHashrate,
        hashrate3d: networkStats.lastEstimatedHashrate3d || networkStats.lastEstimatedHashrate,
        hashrate1w: networkStats.lastEstimatedHashrate1w || networkStats.lastEstimatedHashrate,
        blockCount: networkStats.blockCount
      });
      
      console.log(`Network hashrate data saved for ${period}`);
    }
    
    console.log('All network hashrate data updated successfully');
  } catch (error) {
    console.error('Error updating network hashrate data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the update function
updateNetworkHashrateData()
  .then(() => {
    console.log('Network hashrate update completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Network hashrate update failed:', error);
    process.exit(1);
  });