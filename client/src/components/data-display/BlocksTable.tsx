import { useQuery } from "@tanstack/react-query";
import { fetchBlocks, fetchMiningPools } from "@/lib/api";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
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
import { ExternalLink } from "lucide-react";

interface BlocksTableProps {
  limit?: number;
  showViewAllLink?: boolean;
}

export default function BlocksTable({ limit = 5, showViewAllLink = true }: BlocksTableProps) {
  const { data: blocks, isLoading } = useQuery({
    queryKey: ['/api/blocks', limit],
    queryFn: () => fetchBlocks(limit),
  });

  // Fetch mining pools to get their names and colors
  const { data: miningPools } = useQuery({
    queryKey: ['/api/mining-pools'],
    queryFn: fetchMiningPools
  });

  // Function to get pool name from the pool slug or ID
  const getPoolName = (poolSlug: string | null, minerId: number): string => {
    if (poolSlug && miningPools) {
      const pool = miningPools.find(p => p.slug === poolSlug);
      if (pool) return pool.name;
    }
    
    // Fallback to miners by ID if no pool slug or not found
    if (miningPools) {
      const pool = miningPools.find(p => p.id === minerId);
      if (pool) return pool.name;
    }
    
    return 'Unknown Pool';
  };

  return (
    <Card className="w-full">
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
              <TableRow>
                <TableHead>Block Height</TableHead>
                <TableHead>Mining Pool</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Found In (min)</TableHead>
                <TableHead>Block Reward</TableHead>
                <TableHead>Transactions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(limit).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  </TableRow>
                ))
              ) : blocks?.map(block => {
                const poolName = getPoolName(block.poolSlug, block.minerId);
                return (
                  <TableRow 
                    key={block.id} 
                    className="hover:bg-primary/5 cursor-pointer transition-colors"
                  >
                    <TableCell className="font-medium text-primary">
                      <Link href={`/block-details/${block.number}`}>
                        <a className="flex items-center">
                          {block.number}
                        </a>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ 
                            backgroundColor: getPoolColor(poolName)
                          }}
                        ></div>
                        {poolName}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatBlockTimestamp(block.timestamp)}
                    </TableCell>
                    <TableCell>
                      {block.foundInMinutes ? `${Number(block.foundInMinutes).toFixed(1)}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {block.totalOutputAmount ? `${(block.totalOutputAmount / 100000000).toFixed(3)} BTC` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {block.txCount?.toLocaleString() || 'N/A'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {showViewAllLink && (
          <div className="flex justify-center mt-6">
            <Link href="/stats">
              <Button variant="link">View all blocks</Button>
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
  return `${formatDistanceToNow(date, { addSuffix: true })}`;
}

// Helper function to get pool color
function getPoolColor(poolName: string) {
  const poolColors: Record<string, string> = {
    "Foundry USA": "#F7931A",
    "Antpool": "#3B82F6",
    "F2Pool": "#10B981",
    "ViaBTC": "#F59E0B",
    "Binance Pool": "#8B5CF6",
    "Luxor": "#EC4899",
    "SECPOOL": "#2563EB",
    "MARA Pool": "#EF4444", 
    "Braiins Pool": "#14B8A6",
    "Poolin": "#8B5CF6",
    "BTC.com": "#DB2777",
    "SBI Crypto": "#047857",
    "ULTIMUSPOOL": "#4F46E5",
    "OCEAN": "#1E40AF",
    "Mining Squared": "#7C3AED",
    "SpiderPool": "#DB2777",
  };

  return poolColors[poolName] || "#6B7280";
}
