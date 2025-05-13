import { Router } from 'express';
import { db } from './db';
import { eq, desc } from 'drizzle-orm';
import { networkHashrate } from '@shared/schema';

// Create a new router for network hashrate API endpoints
const networkHashrateRouter = Router();

// GET /api/network-hashrate/:period - Get latest network hashrate data
networkHashrateRouter.get('/:period', async (req, res) => {
  try {
    const period = req.params.period;
    
    // Get the latest hashrate data for the specified period
    const [hashrateData] = await db.select()
      .from(networkHashrate)
      .where(eq(networkHashrate.period, period))
      .orderBy(desc(networkHashrate.updatedAt))
      .limit(1);
    
    if (!hashrateData) {
      return res.status(404).json({ error: `No hashrate data found for period: ${period}` });
    }
    
    // Format the hashrate values to be more readable for the client
    const formattedData = {
      ...hashrateData,
      // Convert to exahashes per second (EH/s) for readability (divide by 1e18)
      readableHashrate: hashrateData.hashrate / 1e18,
      readableHashrate24h: hashrateData.hashrate24h ? hashrateData.hashrate24h / 1e18 : null,
      readableHashrate3d: hashrateData.hashrate3d ? hashrateData.hashrate3d / 1e18 : null,
      readableHashrate1w: hashrateData.hashrate1w ? hashrateData.hashrate1w / 1e18 : null,
    };
    
    res.json(formattedData);
  } catch (error) {
    console.error('Error in /api/network-hashrate endpoint:', error);
    res.status(500).json({ error: "Failed to fetch network hashrate data" });
  }
});

// GET /api/network-hashrate/history/:period/:limit? - Get historical network hashrate data
networkHashrateRouter.get('/history/:period/:limit?', async (req, res) => {
  try {
    const period = req.params.period;
    const limit = req.params.limit ? parseInt(req.params.limit) : 10;
    
    // Get the historical hashrate data
    const hashrateHistory = await db.select()
      .from(networkHashrate)
      .where(eq(networkHashrate.period, period))
      .orderBy(desc(networkHashrate.updatedAt))
      .limit(limit);
    
    if (!hashrateHistory || hashrateHistory.length === 0) {
      return res.status(404).json({ error: `No hashrate history found for period: ${period}` });
    }
    
    // Format the hashrate values to be more readable for the client
    const formattedHistory = hashrateHistory.map(data => ({
      ...data,
      // Convert to exahashes per second (EH/s) for readability (divide by 1e18)
      readableHashrate: data.hashrate / 1e18,
      readableHashrate24h: data.hashrate24h ? data.hashrate24h / 1e18 : null,
      readableHashrate3d: data.hashrate3d ? data.hashrate3d / 1e18 : null,
      readableHashrate1w: data.hashrate1w ? data.hashrate1w / 1e18 : null,
    }));
    
    res.json(formattedHistory);
  } catch (error) {
    console.error('Error in /api/network-hashrate/history endpoint:', error);
    res.status(500).json({ error: "Failed to fetch network hashrate history data" });
  }
});

export default networkHashrateRouter;