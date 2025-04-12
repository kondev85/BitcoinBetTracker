import { Router } from 'express';
import { repository } from './repository';
import { z } from 'zod';

// Create a router to handle API requests
const apiRouter = Router();

// GET /api/blocks - Get all blocks
apiRouter.get('/blocks', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const blocks = await repository.getRecentBlocks(limit);
    res.json(blocks);
  } catch (error) {
    console.error('Error fetching blocks:', error);
    res.status(500).json({ error: 'Failed to fetch blocks' });
  }
});

// GET /api/blocks/:number - Get a specific block by number
apiRouter.get('/blocks/:number', async (req, res) => {
  try {
    const number = parseInt(req.params.number);
    const block = await repository.getBlockByNumber(number);
    
    if (!block) {
      return res.status(404).json({ error: 'Block not found' });
    }
    
    res.json(block);
  } catch (error) {
    console.error('Error fetching block:', error);
    res.status(500).json({ error: 'Failed to fetch block' });
  }
});

// GET /api/miners - Get all miners
apiRouter.get('/miners', async (req, res) => {
  try {
    const miners = await repository.getAllMiners();
    res.json(miners);
  } catch (error) {
    console.error('Error fetching miners:', error);
    res.status(500).json({ error: 'Failed to fetch miners' });
  }
});

// GET /api/miners/:id - Get a specific miner by ID
apiRouter.get('/miners/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const miner = await repository.getMinerById(id);
    
    if (!miner) {
      return res.status(404).json({ error: 'Miner not found' });
    }
    
    res.json(miner);
  } catch (error) {
    console.error('Error fetching miner:', error);
    res.status(500).json({ error: 'Failed to fetch miner' });
  }
});

// GET /api/odds/:blockNumber - Get betting odds for a specific block
apiRouter.get('/odds/:blockNumber', async (req, res) => {
  try {
    const blockNumber = parseInt(req.params.blockNumber);
    const odds = await repository.getOddsForBlock(blockNumber);
    res.json(odds);
  } catch (error) {
    console.error('Error fetching odds:', error);
    res.status(500).json({ error: 'Failed to fetch odds' });
  }
});

// GET /api/bets/:blockId - Get bets for a specific block
apiRouter.get('/bets/:blockId', async (req, res) => {
  try {
    const blockId = parseInt(req.params.blockId);
    const bets = await repository.getBetsForBlock(blockId);
    res.json(bets);
  } catch (error) {
    console.error('Error fetching bets:', error);
    res.status(500).json({ error: 'Failed to fetch bets' });
  }
});

// GET /api/stats/miners - Get miner statistics
apiRouter.get('/stats/miners', async (req, res) => {
  try {
    const stats = await repository.getMinerStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching miner stats:', error);
    res.status(500).json({ error: 'Failed to fetch miner stats' });
  }
});

// GET /api/stats - Get general statistics
apiRouter.get('/stats', async (req, res) => {
  try {
    const [blocksCount, minersCount, betsCount] = await Promise.all([
      repository.getBlocksCount(),
      repository.getMinersCount(),
      repository.getBetsCount()
    ]);
    
    res.json({
      blocksCount,
      minersCount,
      betsCount,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/health - Health check endpoint
apiRouter.get('/health', async (req, res) => {
  try {
    const dbConnected = await repository.testConnection();
    
    if (!dbConnected) {
      return res.status(500).json({
        status: 'error',
        database: 'disconnected'
      });
    }
    
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Health check failed'
    });
  }
});

export { apiRouter };