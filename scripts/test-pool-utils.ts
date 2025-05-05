import { normalizePoolSlug, getPoolDisplayName, getPoolColor } from '../shared/utils/poolUtils';

// Test cases for pool slug normalization
const testSlugs = [
  'Foundry-USA',
  'foundry usa',
  'binance-pool',
  'BINANCE POOL',
  'F2Pool',
  'f2-pool',
  'Via BTC',
  'via-btc',
  'Unknown Pool',
  'MARA-Pool',
  'Carbon-Negative',
  'BTC.com',
  'spider-pool',
  'Braiins Pool',
  'slushpool'
];

// Run tests
console.log('Testing pool slug normalization:');
console.log('--------------------------------');
testSlugs.forEach(slug => {
  const normalized = normalizePoolSlug(slug);
  const displayName = getPoolDisplayName(normalized);
  const color = getPoolColor(normalized);
  console.log(`Original: "${slug}" → Normalized: "${normalized}" → Display: "${displayName}" → Color: ${color}`);
});