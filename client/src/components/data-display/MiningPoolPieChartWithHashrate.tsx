import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  PieChart, 
  Pie, 
  ResponsiveContainer, 
  Cell, 
  Legend, 
  Tooltip 
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TimePeriod } from "@/lib/types";
import { fetchMempoolMiningPools, MiningPoolHashrateData, NetworkStats } from "@/lib/api";

interface MiningPoolPieChartWithHashrateProps {
  data?: MiningPoolHashrateData[];
  period?: TimePeriod;
  onPeriodChange?: (period: TimePeriod) => void;
}

/**
 * A pie chart component that fetches hashrate data from mempool.space API via server
 */
export default function MiningPoolPieChartWithHashrate({ 
  data: propData, 
  period = "1w", 
  onPeriodChange 
}: MiningPoolPieChartWithHashrateProps) {
  const [activePeriod, setActivePeriod] = useState<TimePeriod>(period);

  const { data: hashrateData, isLoading, error } = useQuery({
    queryKey: ['/api/mempool/mining-pools', activePeriod],
    queryFn: () => fetchMempoolMiningPools(activePeriod),
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  useEffect(() => {
    console.log("Hashrate history state:", hashrateData);
    console.log("Hashrate loading state:", isLoading);
    console.log("Hashrate error state:", error);
  }, [hashrateData, isLoading, error]);

  const handlePeriodChange = (newPeriod: TimePeriod) => {
    setActivePeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };

  // Helper function to format hashrate (convert to EH/s)
  const formatHashrate = (hashrate: number): string => {
    const ehashrate = hashrate / 1000000000000000000; // Convert to EH/s
    return ehashrate.toFixed(2);
  };
  
  // Extract pools data and network stats from the API response
  const poolsData = propData || (hashrateData?.pools || []);
  const networkStats = hashrateData?.networkStats || { lastEstimatedHashrate: 0, blockCount: 0 };
  
  // Group all but top 3 pools into an "Others" category as requested
  // This matches the business logic for the rest of the app for betting
  const MAX_INDIVIDUAL_POOLS = 3; // Only show top 3 pools individually
  
  const totalValue = poolsData.reduce((sum, item) => sum + item.value, 0);
  
  // Calculate percentage for each pool
  const dataWithPercentage = poolsData.map(item => ({
    ...item,
    percentage: (item.value / totalValue) * 100
  }));
  
  // Sort by size (largest first)
  const sortedData = [...dataWithPercentage].sort((a, b) => b.value - a.value);
  
  let data: MiningPoolHashrateData[] = [];
  let othersValue = 0;
  let othersCount = 0;
  
  // Take only the top 3 pools and group all others
  sortedData.forEach((pool, index) => {
    if (index < MAX_INDIVIDUAL_POOLS) {
      data.push(pool);
    } else {
      othersValue += pool.value;
      othersCount++;
    }
  });
  
  // Add "Other" category if we grouped any pools
  if (othersValue > 0) {
    data.push({
      name: `Other (${othersCount} pools)`,
      value: othersValue,
      color: '#71717A' // Gray color for "Other"
    });
  }
  
  // Re-sort to ensure "Other" is displayed at the end
  data = data.sort((a, b) => {
    // Move "Other" to the end
    if (a.name.includes('Other')) return 1;
    if (b.name.includes('Other')) return -1;
    // Otherwise sort by value (largest first)
    return b.value - a.value;
  });
  
  // Calculate total hashrate
  const totalHashrate = totalValue;

  // Get the list of all smaller pools that were grouped into "Others"
  const smallPools = sortedData.filter((pool, index) => 
    index >= MAX_INDIVIDUAL_POOLS
  ).sort((a, b) => b.value - a.value);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalHashrate) * 100).toFixed(2);
      
      // Check if this is the "Other" category
      if (data.name.includes('Other')) {
        // Create a 2-column layout for small pools
        const leftColumnPools = smallPools.filter((_, i) => i % 2 === 0);
        const rightColumnPools = smallPools.filter((_, i) => i % 2 === 1);
        
        return (
          <div className="bg-background p-4 border rounded-md shadow-md" style={{ width: '520px', maxWidth: '100vw' }}>
            <div className="flex justify-between items-center mb-2">
              <p className="font-semibold">{data.name}</p>
              <p className="text-xs bg-muted px-1.5 py-0.5 rounded-sm">
                Total blocks: <span className="font-semibold">{data.value}</span>
              </p>
            </div>
            <p className="text-sm mb-2">
              <span className="font-medium">Block share: </span>
              {percentage}% of all blocks
            </p>
            
            <div className="max-h-64 overflow-y-auto pr-1">
              <p className="text-sm font-semibold mb-2 border-b pb-1">Included pools:</p>
              <div className="flex gap-4">
                <div className="flex-1">
                  {leftColumnPools.slice(0, 10).map((pool, i) => {
                    const poolPct = ((pool.value / totalValue) * 100).toFixed(1);
                    return (
                      <div key={i} className="text-xs flex items-center mb-1.5">
                        <div 
                          className="w-2 h-2 rounded-full mr-1 flex-shrink-0" 
                          style={{ backgroundColor: pool.color }}
                        />
                        <span className="truncate mr-1 min-w-20">{pool.name}</span>
                        <span className="ml-auto text-muted-foreground whitespace-nowrap">
                          {pool.value} blocks ({poolPct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex-1">
                  {rightColumnPools.slice(0, 10).map((pool, i) => {
                    const poolPct = ((pool.value / totalValue) * 100).toFixed(1);
                    return (
                      <div key={i} className="text-xs flex items-center mb-1.5">
                        <div 
                          className="w-2 h-2 rounded-full mr-1 flex-shrink-0" 
                          style={{ backgroundColor: pool.color }}
                        />
                        <span className="truncate mr-1 min-w-20">{pool.name}</span>
                        <span className="ml-auto text-muted-foreground whitespace-nowrap">
                          {pool.value} blocks ({poolPct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {smallPools.length > 20 && (
                <p className="text-xs text-muted-foreground mt-2 border-t pt-1 text-center">
                  ...and {smallPools.length - 20} more pools
                </p>
              )}
            </div>
          </div>
        );
      }
      
      // Regular tooltip for normal pools
      return (
        <div className="bg-background p-3 border rounded-md shadow-md">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">
            <span className="font-medium">Blocks mined: </span>
            {data.value}
          </p>
          <p className="text-sm">
            <span className="font-medium">Percentage: </span>
            {percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">Mining Pool Distribution</CardTitle>
        <CardDescription className="text-center">
          Real-time hashrate distribution from mempool.space
        </CardDescription>
        
        {/* Network Statistics */}
        {!isLoading && !error && (
          <div className="flex flex-col sm:flex-row justify-between gap-2 mt-3 mb-2 text-center">
            <div className="bg-muted/30 px-3 py-2 rounded-md flex-1">
              <p className="text-xs text-muted-foreground">Total Blocks</p>
              <p className="text-lg font-semibold">{networkStats.blockCount}</p>
            </div>
            <div className="bg-muted/30 px-3 py-2 rounded-md flex-1">
              <p className="text-xs text-muted-foreground">Network Hashrate</p>
              <p className="text-lg font-semibold">
                {/* Use the appropriate period-specific hashrate or fallback to the standard one */}
                {activePeriod === "24h" && formatHashrate(networkStats.lastEstimatedHashrate)}
                {activePeriod === "3d" && formatHashrate(networkStats.lastEstimatedHashrate3d || networkStats.lastEstimatedHashrate)}
                {activePeriod === "1w" && formatHashrate(networkStats.lastEstimatedHashrate1w || networkStats.lastEstimatedHashrate)} EH/s
              </p>
            </div>
          </div>
        )}
        
        <div className="flex justify-center mt-4 space-x-2">
          <Button
            size="sm"
            variant={activePeriod === "24h" ? "default" : "outline"}
            onClick={() => handlePeriodChange("24h")}
          >
            24h
          </Button>
          <Button
            size="sm"
            variant={activePeriod === "3d" ? "default" : "outline"}
            onClick={() => handlePeriodChange("3d")}
          >
            3d
          </Button>
          <Button
            size="sm"
            variant={activePeriod === "1w" ? "default" : "outline"}
            onClick={() => handlePeriodChange("1w")}
          >
            1w
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center">
            <Skeleton className="h-80 w-80 rounded-full" />
            <div className="grid grid-cols-2 gap-4 mt-6 w-full">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-destructive">
            <p>Failed to load mining pool data</p>
            <p className="text-sm text-muted-foreground mt-2">Please try again later</p>
          </div>
        ) : (
          <div>
            <div className="h-[350px] relative mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    outerRadius={125}
                    innerRadius={50} // Adding inner radius for donut effect
                    dataKey="value"
                    label={({ name, percent }) => {
                      // For the "Other" category, just show percentage
                      if (name.includes('Other')) {
                        return `${(percent * 100).toFixed(1)}%`;
                      }
                      // For main pools, show name and percentage
                      // Extract just the pool name without any extra text
                      const poolName = name.split(' ')[0]; // Just take first word to keep it short
                      return `${poolName} ${(percent * 100).toFixed(1)}%`;
                    }}
                    labelLine={false}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#27272A" strokeWidth={1} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{
                      paddingTop: "20px",
                      fontSize: "12px",
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "center"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Summary stats - "Others" pool info card */}
            <div className="w-full mt-4">
              {data.map((pool, index) => {
                if (pool.name.includes('Others')) {
                  const percentage = ((pool.value / totalHashrate) * 100).toFixed(1);
                  return (
                    <div key={index} className="flex items-center p-3 border rounded-md bg-muted/30">
                      <div className="w-full">
                        <div className="flex items-center mb-2">
                          <div 
                            className="w-4 h-4 rounded-full mr-2" 
                            style={{ backgroundColor: pool.color }}
                          />
                          <p className="text-sm font-medium">{pool.name}</p>
                          <span className="ml-auto text-sm font-medium">{percentage}% of blocks</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                          {smallPools.slice(0, 10).map((smallPool, i) => {
                            const poolPct = ((smallPool.value / totalValue) * 100).toFixed(1);
                            return (
                              <div key={i} className="text-xs flex items-center">
                                <div 
                                  className="w-2 h-2 rounded-full mr-1 flex-shrink-0" 
                                  style={{ backgroundColor: smallPool.color }}
                                />
                                <span className="truncate mr-1">{smallPool.name}</span>
                                <span className="text-muted-foreground ml-auto">
                                  {poolPct}%
                                </span>
                              </div>
                            );
                          })}
                          {smallPools.length > 10 && (
                            <div className="text-xs text-muted-foreground col-span-full text-center mt-1">
                              ...and {smallPools.length - 10} more pools (hover pie chart for details)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}