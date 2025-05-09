import { db } from "../server/db";
import { paymentAddresses } from "../shared/schema";
import { pool } from "../server/db";

async function addDemoPaymentAddresses() {
  try {
    console.log("Adding demo payment addresses to the database...");
    
    // Sample blocks to create payment addresses for
    const blockNumbers = [898666, 899999, 900000, 900001];
    
    // Mining pool addresses
    for (const blockNumber of blockNumbers) {
      console.log(`Creating payment addresses for block ${blockNumber}...`);
      
      // Create mining pool hit addresses
      for (const poolSlug of ['foundryusa', 'antpool', 'viabtc']) {
        // Hit bet (will mine)
        await db.insert(paymentAddresses).values({
          betId: blockNumber,
          poolSlug,
          betType: 'miner',
          outcome: 'hit',
          odds: poolSlug === 'foundryusa' ? 2.5 : (poolSlug === 'antpool' ? 3.2 : 4.1),
          address: `demo-btc-${blockNumber}-${poolSlug}-hit`,
          ltcAddress: `demo-ltc-${blockNumber}-${poolSlug}-hit`,
          usdcAddress: `demo-usdc-${blockNumber}-${poolSlug}-hit`
        });
        
        // No hit bet (won't mine)
        await db.insert(paymentAddresses).values({
          betId: blockNumber,
          poolSlug,
          betType: 'miner',
          outcome: 'noHit',
          odds: poolSlug === 'foundryusa' ? 3.5 : (poolSlug === 'antpool' ? 2.8 : 1.9),
          address: `demo-btc-${blockNumber}-${poolSlug}-nohit`,
          ltcAddress: `demo-ltc-${blockNumber}-${poolSlug}-nohit`,
          usdcAddress: `demo-usdc-${blockNumber}-${poolSlug}-nohit`
        });
      }
      
      // Time-based bets (under/over)
      await db.insert(paymentAddresses).values({
        betId: blockNumber,
        betType: 'time',
        outcome: 'under',
        odds: 2.0,
        address: `demo-btc-${blockNumber}-time-under`,
        ltcAddress: `demo-ltc-${blockNumber}-time-under`,
        usdcAddress: `demo-usdc-${blockNumber}-time-under`
      });
      
      await db.insert(paymentAddresses).values({
        betId: blockNumber,
        betType: 'time',
        outcome: 'over',
        odds: 2.1,
        address: `demo-btc-${blockNumber}-time-over`,
        ltcAddress: `demo-ltc-${blockNumber}-time-over`,
        usdcAddress: `demo-usdc-${blockNumber}-time-over`
      });
    }
    
    console.log("Demo payment addresses added successfully!");
  } catch (error) {
    console.error("Error adding demo payment addresses:", error);
  } finally {
    await pool.end();
  }
}

// Run the function
addDemoPaymentAddresses();