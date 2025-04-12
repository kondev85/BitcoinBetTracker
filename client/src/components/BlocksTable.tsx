import React, { useEffect, useState } from 'react';
import { Block, Miner } from '../../shared/schema';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface BlocksTableProps {
  limit?: number;
  showTitle?: boolean;
}

const BlocksTable: React.FC<BlocksTableProps> = ({ limit = 10, showTitle = true }) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [miners, setMiners] = useState<Record<number, Miner>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch blocks from our database
        const blocksResponse = await fetch(`/api/blocks?limit=${limit}`);
        if (!blocksResponse.ok) {
          throw new Error(`Failed to fetch blocks: ${blocksResponse.statusText}`);
        }
        const blocksData = await blocksResponse.json();
        setBlocks(blocksData);
        
        // Fetch miners to get names
        const minersResponse = await fetch('/api/miners');
        if (minersResponse.ok) {
          const minersData = await minersResponse.json();
          // Create a lookup map of miner ID to miner object
          const minersMap = minersData.reduce((acc: Record<number, Miner>, miner: Miner) => {
            acc[miner.id] = miner;
            return acc;
          }, {});
          setMiners(minersMap);
        }
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load blockchain data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [limit]);

  // Get miner name from the minerId
  const getMinerName = (minerId: number): string => {
    return miners[minerId]?.name || `Miner #${minerId}`;
  };

  // Generate color based on the miner's hashrate
  const getMinerColor = (minerId: number): string => {
    const miner = miners[minerId];
    if (!miner) return "#6B7280"; // Default gray
    
    // Bitcoin orange for the largest miners, blue shades for smaller ones
    if (miner.hashrate > 30) return "#F7931A"; // Bitcoin orange
    if (miner.hashrate > 20) return "#F59E0B";
    if (miner.hashrate > 15) return "#3B82F6"; 
    if (miner.hashrate > 10) return "#60A5FA";
    if (miner.hashrate > 5) return "#93C5FD";
    return "#BFDBFE";
  };

  const content = () => {
    if (loading) {
      return (
        <TableBody>
          {Array(limit).fill(0).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-12" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      );
    }

    if (error) {
      return (
        <TableBody>
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-red-500">
              {error}
            </TableCell>
          </TableRow>
        </TableBody>
      );
    }

    if (blocks.length === 0) {
      return (
        <TableBody>
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8">
              No blocks found in the database.
            </TableCell>
          </TableRow>
        </TableBody>
      );
    }

    return (
      <TableBody>
        {blocks.map(block => (
          <TableRow key={block.id}>
            <TableCell className="font-medium text-primary">
              {block.number}
            </TableCell>
            <TableCell style={{ color: getMinerColor(block.minerId) }}>
              {getMinerName(block.minerId)}
            </TableCell>
            <TableCell>
              {new Date(block.timestamp).toLocaleString()}
            </TableCell>
            <TableCell>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                block.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
              }`}>
                {block.status}
              </span>
            </TableCell>
            <TableCell>
              {block.foundInMinutes ? `${Number(block.foundInMinutes).toFixed(1)} min` : 'N/A'}
            </TableCell>
            <TableCell>
              {block.txCount ?? 'N/A'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    );
  };

  return (
    <Card className="w-full">
      {showTitle && (
        <CardHeader>
          <CardTitle className="text-center">Latest Bitcoin Blocks</CardTitle>
          <CardDescription className="text-center">
            See the most recently mined blocks and which pools found them.
          </CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Block Height</TableHead>
                <TableHead>Mining Pool</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Found In</TableHead>
                <TableHead>Transactions</TableHead>
              </TableRow>
            </TableHeader>
            {content()}
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default BlocksTable;