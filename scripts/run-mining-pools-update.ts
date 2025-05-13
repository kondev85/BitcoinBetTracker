import { updateMiningPools } from './update-mining-pools';

async function main() {
  console.log('Starting manual update of mining pools data...');
  
  try {
    await updateMiningPools();
    console.log('Mining pools update completed successfully!');
  } catch (error) {
    console.error('Error updating mining pools:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();