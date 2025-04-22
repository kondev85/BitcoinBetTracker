import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMiningStats } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface MiningStatCardProps {
  title: string;
  subtitle: string;
  color: string;
  hashrate: number;
  expected: number;
  actual: number;
  luck: number;
}

interface MiningStatsProps {
  initialBlockCount?: number;
}

export default function MiningStats({ initialBlockCount = 10 }: MiningStatsProps) {
  const [blockCount, setBlockCount] = useState<number>(initialBlockCount);
  
  const { data: miningStats, isLoading } = useQuery({
    queryKey: ['/api/mining-stats', blockCount],
    queryFn: () => fetchMiningStats(blockCount),
  });

  const handleBlockCountChange = (newCount: number) => {
    setBlockCount(newCount);
  };

  // We want to show specific top 3 pools: Foundry USA, AntPool, ViaBTC
  // Note that the API returns lowercase names like "foundryusa", "antpool", "viabtc"
  const foundryPool = miningStats?.find(pool => 
    pool.name.toLowerCase() === "foundryusa" || 
    pool.displayName === "Foundry USA"
  ) || {
    name: "foundryusa",
    displayName: "Foundry USA",
    color: "#F7931A",
    hashratePct: 0,
    expectedBlocks: 0,
    actualBlocks: 0,
    luck: 0
  };
  
  const antPool = miningStats?.find(pool => 
    pool.name.toLowerCase() === "antpool" || 
    pool.displayName === "AntPool"
  ) || {
    name: "antpool",
    displayName: "AntPool",
    color: "#3B82F6",
    hashratePct: 0,
    expectedBlocks: 0,
    actualBlocks: 0,
    luck: 0
  };
  
  const viabtcPool = miningStats?.find(pool => 
    pool.name.toLowerCase() === "viabtc" || 
    pool.displayName === "ViaBTC"
  ) || {
    name: "viabtc",
    displayName: "ViaBTC",
    color: "#6D28D9",
    hashratePct: 0,
    expectedBlocks: 0,
    actualBlocks: 0,
    luck: 0
  };
  
  // All other pools will be combined
  const otherPools = miningStats?.filter(pool => 
    pool.name.toLowerCase() !== "foundryusa" && 
    pool.name.toLowerCase() !== "antpool" && 
    pool.name.toLowerCase() !== "viabtc" &&
    pool.displayName !== "Foundry USA" &&
    pool.displayName !== "AntPool" &&
    pool.displayName !== "ViaBTC"
  ) || [];
  
  // Calculate stats for "Others" combined
  const othersHashrate = otherPools.reduce((sum, pool) => sum + pool.hashratePct, 0);
  const othersExpected = otherPools.reduce((sum, pool) => sum + pool.expectedBlocks, 0);
  const othersActual = otherPools.reduce((sum, pool) => sum + pool.actualBlocks, 0);
  const othersLuck = othersExpected > 0 ? (othersActual / othersExpected) * 100 : 0;
  
  const poolsToDisplay = [
    foundryPool,
    antPool,
    viabtcPool,
    {
      name: "Others",
      displayName: "Others",
      color: "#6B7280",
      hashratePct: othersHashrate,
      expectedBlocks: othersExpected,
      actualBlocks: othersActual,
      luck: othersLuck
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">Long-term Performance</CardTitle>
        <CardDescription className="text-center">
          See how mining pools perform over time compared to their expected share.
        </CardDescription>
        
        <div className="flex justify-center mt-4 space-x-2">
          <Button
            size="sm"
            variant={blockCount === 10 ? "default" : "outline"}
            onClick={() => handleBlockCountChange(10)}
          >
            Last 10 Blocks
          </Button>
          <Button
            size="sm"
            variant={blockCount === 50 ? "default" : "outline"}
            onClick={() => handleBlockCountChange(50)}
          >
            Last 50 Blocks
          </Button>
          <Button
            size="sm"
            variant={blockCount === 250 ? "default" : "outline"}
            onClick={() => handleBlockCountChange(250)}
          >
            Last 250 Blocks
          </Button>
          <Button
            size="sm"
            variant={blockCount === 1000 ? "default" : "outline"}
            onClick={() => handleBlockCountChange(1000)}
          >
            Last 1000 Blocks
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-card rounded-lg shadow p-5">
                <div className="flex items-center">
                  <Skeleton className="w-12 h-12 rounded-md" />
                  <div className="ml-5">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-16 mt-1" />
                  </div>
                </div>
                <div className="mt-5">
                  <dl className="grid grid-cols-2 gap-5">
                    {Array(4).fill(0).map((_, j) => (
                      <div key={j}>
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-6 w-12 mt-2" />
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            ))
          ) : (
            poolsToDisplay.map((pool, index) => (
              <MiningStatCard
                key={pool.name}
                title={pool.displayName}
                subtitle={index < 3 
                  ? `${index + 1}${getOrdinalSuffix(index + 1)} Mining Pool` 
                  : "Combined Smaller Pools"}
                color={pool.color}
                hashrate={pool.hashratePct}
                expected={pool.expectedBlocks}
                actual={pool.actualBlocks}
                luck={pool.luck}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MiningStatCard({ title, subtitle, color, hashrate, expected, actual, luck }: MiningStatCardProps) {
  return (
    <div className="bg-card rounded-lg shadow p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div 
            className="w-12 h-12 rounded-md flex items-center justify-center"
            style={{ backgroundColor: color }}
          >
            <span className="text-white text-lg font-bold">
              {title.charAt(0)}
            </span>
          </div>
        </div>
        <div className="ml-5">
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5">
        <dl className="grid grid-cols-2 gap-5">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Hashrate</dt>
            <dd className="mt-1 text-2xl font-semibold">{hashrate.toFixed(1)}%</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Expected</dt>
            <dd className="mt-1 text-2xl font-semibold">{expected.toFixed(1)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Actual</dt>
            <dd className="mt-1 text-2xl font-semibold">{actual}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Luck</dt>
            <dd className={`mt-1 text-2xl font-semibold ${getLuckColor(luck)}`}>{luck.toFixed(0)}%</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) {
    return "st";
  }
  if (j === 2 && k !== 12) {
    return "nd";
  }
  if (j === 3 && k !== 13) {
    return "rd";
  }
  return "th";
}

function getLuckColor(luck: number): string {
  if (luck >= 110) return "text-green-500";
  if (luck >= 100) return "text-green-400";
  if (luck >= 90) return "text-amber-500";
  return "text-red-500";
}
