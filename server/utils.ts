import { storage } from './storage';

/**
 * Helper function to automatically create betting options for a new block
 * This includes both time-based bets and mining pool bets
 */
export async function createAutoBettingOptions(blockHeight: number, timeThreshold: number) {
  try {
    console.log(`Creating auto betting options for block ${blockHeight}...`);
    
    // 1. Create time-based betting options
    // Time bet: Under 10 minutes with odds 1.5
    const underTimeBet = await storage.createTimeBet({
      blockNumber: blockHeight,
      underMinutesOdds: 1.5,  // Under odds
      overMinutesOdds: null   // Not needed for this option
    });
    
    // Create payment address for "under" time bet
    await storage.createPaymentAddress({
      betId: blockHeight,
      betType: 'time',
      outcome: 'under',
      odds: 1.5,
      address: `auto-btc-${blockHeight}-time-under`,
      ltcAddress: `auto-ltc-${blockHeight}-time-under`,
      usdcAddress: `auto-usdc-${blockHeight}-time-under`
    });
    
    // Time bet: Over 10 minutes with odds 2.8
    const overTimeBet = await storage.createTimeBet({
      blockNumber: blockHeight,
      underMinutesOdds: null,  // Not needed for this option  
      overMinutesOdds: 2.8     // Over odds
    });
    
    // Create payment address for "over" time bet
    await storage.createPaymentAddress({
      betId: blockHeight,
      betType: 'time',
      outcome: 'over',
      odds: 2.8,
      address: `auto-btc-${blockHeight}-time-over`,
      ltcAddress: `auto-ltc-${blockHeight}-time-over`,
      usdcAddress: `auto-usdc-${blockHeight}-time-over`
    });
    
    // 2. Create mining pool betting options
    // Define pools and their odds as specified in the requirements
    const poolOdds = [
      { slug: 'foundryusa', displayName: 'Foundry USA', hitOdds: 3.0, noHitOdds: 1.4 },
      { slug: 'antpool', displayName: 'AntPool', hitOdds: 5.0, noHitOdds: 1.2 },
      { slug: 'viabtc', displayName: 'ViaBTC', hitOdds: 8.0, noHitOdds: 1.1 },
      { slug: 'other', displayName: 'Other', hitOdds: 2.5, noHitOdds: 1.6 }
    ];
    
    // Create miner bets for each pool
    for (const pool of poolOdds) {
      // Create block-miner-odds record for this pool
      const blockMinerOdds = await storage.createBlockMinerOdds({
        blockNumber: blockHeight,
        poolSlug: pool.slug,
        hitOdds: pool.hitOdds,
        noHitOdds: pool.noHitOdds
      });
      
      // Create payment address for "hit" bet
      await storage.createPaymentAddress({
        betId: blockHeight,
        poolSlug: pool.slug,
        betType: 'miner',
        outcome: 'hit',
        odds: pool.hitOdds,
        address: `auto-btc-${blockHeight}-${pool.slug}-hit`,
        ltcAddress: `auto-ltc-${blockHeight}-${pool.slug}-hit`,
        usdcAddress: `auto-usdc-${blockHeight}-${pool.slug}-hit`
      });
      
      // Create payment address for "noHit" bet
      await storage.createPaymentAddress({
        betId: blockHeight,
        poolSlug: pool.slug,
        betType: 'miner',
        outcome: 'noHit',
        odds: pool.noHitOdds,
        address: `auto-btc-${blockHeight}-${pool.slug}-nohit`,
        ltcAddress: `auto-ltc-${blockHeight}-${pool.slug}-nohit`,
        usdcAddress: `auto-usdc-${blockHeight}-${pool.slug}-nohit`
      });
    }
    
    console.log(`Successfully created all betting options for block ${blockHeight}`);
  } catch (error) {
    console.error(`Error creating betting options for block ${blockHeight}:`, error);
    throw error;
  }
}