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
import { fetchMempoolMiningPools, MiningPoolHashrateData } from "@/lib/api";

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

  // Use provided data or API data
  const rawData = propData || hashrateData || [];
  
  // Group smaller pools into an "Others" category
  // Only display top 8 individually, combine the rest
  const OTHERS_THRESHOLD = 1.5; // Pools with less than 1.5% get grouped into Others
  const MAX_INDIVIDUAL_POOLS = 8; // Show at most this many pools individually
  
  const totalValue = rawData.reduce((sum, item) => sum + item.value, 0);
  
  // Calculate percentage for each pool
  const dataWithPercentage = rawData.map(item => ({
    ...item,
    percentage: (item.value / totalValue) * 100
  }));
  
  // Sort by size (largest first)
  const sortedData = [...dataWithPercentage].sort((a, b) => b.value - a.value);
  
  let data: MiningPoolHashrateData[] = [];
  let othersValue = 0;
  let othersCount = 0;
  
  // Take the larger pools and group smaller ones
  sortedData.forEach((pool, index) => {
    if (index < MAX_INDIVIDUAL_POOLS && pool.percentage >= OTHERS_THRESHOLD) {
      data.push(pool);
    } else {
      othersValue += pool.value;
      othersCount++;
    }
  });
  
  // Add "Others" category if we grouped any pools
  if (othersValue > 0) {
    data.push({
      name: `Others (${othersCount} pools)`,
      value: othersValue,
      color: '#71717A' // Gray color for "Others"
    });
  }
  
  // Re-sort to ensure "Others" is displayed at the end
  data = data.sort((a, b) => {
    // Move "Others" to the end
    if (a.name.includes('Others')) return 1;
    if (b.name.includes('Others')) return -1;
    // Otherwise sort by value (largest first)
    return b.value - a.value;
  });
  
  // Calculate total hashrate
  const totalHashrate = totalValue;

  // Get the list of all smaller pools that were grouped into "Others"
  const smallPools = sortedData.filter((pool, index) => 
    index >= MAX_INDIVIDUAL_POOLS || pool.percentage < OTHERS_THRESHOLD
  ).sort((a, b) => b.value - a.value);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalHashrate) * 100).toFixed(2);
      
      // Check if this is the "Others" category
      if (data.name.includes('Others')) {
        return (
          <div className="bg-background p-3 border rounded-md shadow-md max-w-md">
            <p className="font-semibold">{data.name}</p>
            <p className="text-sm mb-2">
              <span className="font-medium">Total blocks: </span>
              {data.value} ({percentage}%)
            </p>
            <div className="max-h-64 overflow-y-auto">
              <p className="text-sm font-semibold mb-1">Included pools:</p>
              {smallPools.slice(0, 15).map((pool, i) => {
                const poolPct = ((pool.value / totalValue) * 100).toFixed(1);
                return (
                  <div key={i} className="text-xs flex justify-between mb-1">
                    <span className="mr-2">{pool.name}</span>
                    <span>{poolPct}%</span>
                  </div>
                );
              })}
              {smallPools.length > 15 && (
                <p className="text-xs text-muted-foreground mt-1">
                  ...and {smallPools.length - 15} more
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
                      // For the "Others" category, just show percentage
                      if (name.includes('Others')) {
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
            
            {/* Summary stats - Top 3 pools */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              {data.slice(0, 3).map((pool, index) => {
                const percentage = ((pool.value / totalHashrate) * 100).toFixed(1);
                return (
                  <div key={index} className="flex items-center space-x-2 p-2 border rounded-md">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: pool.color }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{pool.name}</p>
                      <p className="text-xs text-muted-foreground">{percentage}% of blocks</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}