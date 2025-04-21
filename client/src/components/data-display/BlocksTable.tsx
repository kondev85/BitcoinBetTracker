import { useQuery } from "@tanstack/react-query";
import { fetchBlocks } from "@/lib/api";
import { Link } from "wouter";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface BlocksTableProps {
  limit?: number;
  showViewAllLink?: boolean;
}

export default function BlocksTable({ limit = 5, showViewAllLink = true }: BlocksTableProps) {
  const { data: blocks, isLoading } = useQuery({
    queryKey: ['/api/blocks', limit],
    queryFn: () => fetchBlocks(limit),
  });

  // Helper function to standardize pool slugs
  const standardizePoolSlug = (slug: string | null): string => {
    if (!slug) return 'unknown';
    
    // Map of pool name variations to standard slugs
    const poolSlugMap: Record<string, string> = {
      // Foundry variations
      'foundry-usa': 'foundryusa',
      'foundryusa': 'foundryusa',
      // MARA variations
      'mara-pool': 'marapool',
      'marapool': 'marapool',
      // Binance variations
      'binance-pool': 'binancepool',
      'binancepool': 'binancepool',
      // Carbon variations
      'carbon-neutral': 'carbonnegative',
      'carbonneutral': 'carbonnegative',
      'carbon-negative': 'carbonnegative',
      'carbonnegative': 'carbonnegative',
      // Spider variations
      'spider-pool': 'spiderpool',
      'spiderpool': 'spiderpool',
      // SBI variations
      'sbi-crypto': 'sbicrypto',
      'sbicrypto': 'sbicrypto',
      // Other common variations
      'btc.com': 'btccom',
      'btccom': 'btccom',
      'secpool': 'secpool',
      'sec-pool': 'secpool',
      'mining-squared': 'miningsquared',
      'miningsquared': 'miningsquared',
      'slush-pool': 'slushpool',
      'slushpool': 'slushpool',
      'braiins-pool': 'slushpool',
      'braiinspool': 'slushpool',
      'unknown': 'unknown'
    };
    
    const normalizedSlug = slug.toLowerCase();
    return poolSlugMap[normalizedSlug] || normalizedSlug;
  };

  // Map pool slugs to proper names
  const poolSlugsToNames: Record<string, string> = {
    'foundryusa': 'Foundry USA',
    'antpool': 'Antpool',
    'f2pool': 'F2Pool',
    'binancepool': 'Binance Pool',
    'viabtc': 'ViaBTC',
    'btccom': 'BTC.com',
    'poolin': 'Poolin',
    'luxor': 'Luxor',
    'slushpool': 'Braiins Pool',
    'marapool': 'MARA Pool',
    'secpool': 'SEC Pool',
    'sbicrypto': 'SBI Crypto',
    'miningsquared': 'Mining Squared',
    'innopolistech': 'Innopolis Tech',
    'rigpool': 'RigPool',
    'satoshifloor': 'Satoshi Floor',
    'ultimatepool': 'Ultimate Pool',
    'digitalfarm': 'Digital Farm',
    'ckpool': 'CKPool',
    'kncminer': 'KnCMiner',
    'blocksmith': 'Blocksmith',
    'cryptoforge': 'Crypto Forge',
    'hashpool': 'HashPool',
    'bitdeer': 'BitDeer',
    'spiderpool': 'SpiderPool',
    'carbonnegative': 'Carbon Negative',
    'ocean': 'OCEAN',
    'ultimuspool': 'ULTIMUS Pool',
    'unknown': 'Unknown Pool'
  };
  
  // Map pool slugs to colors
  const poolSlugsToColors: Record<string, string> = {
    'foundryusa': '#F7931A', // Bitcoin orange
    'antpool': '#3B82F6',    // Blue
    'f2pool': '#10B981',     // Green
    'binancepool': '#6366F1', // Indigo
    'viabtc': '#6D28D9',     // Deep purple
    'btccom': '#0EA5E9',     // Sky blue
    'poolin': '#EF4444',     // Red
    'luxor': '#EC4899',      // Pink
    'slushpool': '#2563EB',  // Royal blue
    'marapool': '#84CC16',   // Lime green
    'secpool': '#8B5CF6',    // Violet
    'sbicrypto': '#06B6D4',  // Cyan
    'miningsquared': '#F472B6', // Pink
    'spiderpool': '#FB923C', // Orange
    'carbonnegative': '#22C55E', // Green
    'ocean': '#0D9488',      // Teal
    'innopolistech': '#84CC16', // Lime green
    'rigpool': '#9333EA',    // Purple
    'satoshifloor': '#F97316', // Orange
    'ultimatepool': '#DC2626', // Red
    'ultimuspool': '#DC2626', // Red
    'digitalfarm': '#2563EB', // Blue
    'ckpool': '#CA8A04',     // Yellow
    'kncminer': '#C026D3',   // Fuchsia
    'blocksmith': '#14B8A6',  // Teal
    'cryptoforge': '#7C3AED', // Violet
    'hashpool': '#EA580C',   // Orange
    'bitdeer': '#0369A1',    // Blue
    'unknown': '#A3A3A3'     // Gray
  };

  return (
    <Card className="w-full bg-black text-white">
      <CardHeader>
        <CardTitle className="text-center">Latest Bitcoin Blocks</CardTitle>
        <CardDescription className="text-center">
          See the most recently mined blocks and which pools found them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-800">
                <TableHead className="text-gray-300 group relative cursor-help">
                  Block Height
                  <span className="absolute hidden group-hover:block bg-gray-900 text-xs p-2 rounded shadow-lg z-10 w-48 -left-4 top-full mt-1">
                    The sequential number of the block in the blockchain
                  </span>
                </TableHead>
                <TableHead className="text-gray-300 group relative cursor-help">
                  Mining Pool
                  <span className="absolute hidden group-hover:block bg-gray-900 text-xs p-2 rounded shadow-lg z-10 w-48 -left-4 top-full mt-1">
                    The mining pool that found/mined this block
                  </span>
                </TableHead>
                <TableHead className="text-gray-300 group relative cursor-help">
                  Timestamp
                  <span className="absolute hidden group-hover:block bg-gray-900 text-xs p-2 rounded shadow-lg z-10 w-48 -left-4 top-full mt-1">
                    The date and time when the block was mined
                  </span>
                </TableHead>
                <TableHead className="text-gray-300 group relative cursor-help">
                  Found In (min)
                  <span className="absolute hidden group-hover:block bg-gray-900 text-xs p-2 rounded shadow-lg z-10 w-60 -left-4 top-full mt-1">
                    Time in minutes it took to find this block since the previous one
                  </span>
                </TableHead>
                <TableHead className="text-gray-300 group relative cursor-help">
                  Size (MB)
                  <span className="absolute hidden group-hover:block bg-gray-900 text-xs p-2 rounded shadow-lg z-10 w-48 -left-4 top-full mt-1">
                    The size of the block in megabytes
                  </span>
                </TableHead>
                <TableHead className="text-gray-300 group relative cursor-help">
                  Block Reward
                  <span className="absolute hidden group-hover:block bg-gray-900 text-xs p-2 rounded shadow-lg z-10 w-60 -left-4 top-full mt-1">
                    The total reward in BTC given to the miner for finding this block
                  </span>
                </TableHead>
                <TableHead className="text-gray-300 group relative cursor-help">
                  Transactions
                  <span className="absolute hidden group-hover:block bg-gray-900 text-xs p-2 rounded shadow-lg z-10 w-48 -left-4 top-full mt-1">
                    Number of transactions included in this block
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(limit).fill(0).map((_, i) => (
                  <TableRow key={i} className="border-b border-gray-800">
                    <TableCell><Skeleton className="h-4 w-16 bg-gray-700" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 bg-gray-700" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32 bg-gray-700" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8 bg-gray-700" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12 bg-gray-700" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 bg-gray-700" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12 bg-gray-700" /></TableCell>
                  </TableRow>
                ))
              ) : blocks?.map(block => (
                <TableRow 
                  key={block.id} 
                  className="border-b border-gray-800 hover:bg-gray-900"
                >
                  <TableCell className="font-medium text-orange-500">
                    <Link 
                      href={`/block-details/${block.number}`}
                      className="text-orange-500 hover:underline"
                    >
                      {block.number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ 
                          backgroundColor: block.poolSlug 
                            ? poolSlugsToColors[standardizePoolSlug(block.poolSlug)] || '#6B7280' 
                            : '#6B7280' // default gray
                        }}
                      ></div>
                      {block.poolSlug 
                        ? poolSlugsToNames[standardizePoolSlug(block.poolSlug)] || 'Unknown Pool' 
                        : 'Unknown Pool'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatBlockTimestamp(block.timestamp)}
                  </TableCell>
                  <TableCell>
                    {block.foundInMinutes ? `${Math.round(Number(block.foundInMinutes))}` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {block.size ? `${(Number(block.size)).toFixed(2)}` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {block.totalOutputAmount ? `${(block.totalOutputAmount).toFixed(3)} BTC` : '0.000 BTC'}
                  </TableCell>
                  <TableCell>
                    {block.txCount?.toLocaleString() || 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {showViewAllLink && (
          <div className="flex justify-center mt-6">
            <Button 
              variant="link" 
              className="text-primary"
              onClick={() => window.location.href = "/stats"}
            >
              View all blocks
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to format timestamp
function formatBlockTimestamp(timestamp: string | Date) {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  // Format as MM/DD/YYYY, hh:mm:ss AM/PM
  return date.toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true
  });
}
