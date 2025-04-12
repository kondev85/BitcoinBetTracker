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
    'secpool': 'SEC Pool'
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
                <TableHead className="text-gray-300">Block Height</TableHead>
                <TableHead className="text-gray-300">Mining Pool</TableHead>
                <TableHead className="text-gray-300">Timestamp</TableHead>
                <TableHead className="text-gray-300">Found In (min)</TableHead>
                <TableHead className="text-gray-300">Block Reward</TableHead>
                <TableHead className="text-gray-300">Transactions</TableHead>
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
                    <Link href={`/block-details/${block.number}`}>
                      <a>
                        {block.number}
                      </a>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2 bg-gray-500"
                      ></div>
                      {block.poolSlug ? poolSlugsToNames[block.poolSlug] || 'Unknown Pool' : 'Unknown Pool'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatBlockTimestamp(block.timestamp)}
                  </TableCell>
                  <TableCell>
                    {block.foundInMinutes ? `${Number(block.foundInMinutes).toFixed(1)}` : 'N/A'}
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
            <Link href="/stats">
              <Button variant="link" className="text-primary">View all blocks</Button>
            </Link>
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
