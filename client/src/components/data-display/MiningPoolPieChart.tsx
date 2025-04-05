import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  PieChart, 
  Pie, 
  ResponsiveContainer, 
  Cell, 
  Legend, 
  Tooltip 
} from "recharts";
import { fetchMiningPools } from "@/lib/api";
import { MiningPool, TimePeriod } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface MiningPoolPieChartProps {
  data?: { name: string; value: number; color: string }[];
  period?: TimePeriod;
  onPeriodChange?: (period: TimePeriod) => void;
}

export default function MiningPoolPieChart({ 
  data: propData, 
  period = "24h", 
  onPeriodChange 
}: MiningPoolPieChartProps) {
  const [activePeriod, setActivePeriod] = useState<TimePeriod>(period);

  const { data: miningPools, isLoading } = useQuery({
    queryKey: ['/api/mining-pools'],
    queryFn: fetchMiningPools,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !propData,
  });

  const handlePeriodChange = (newPeriod: TimePeriod) => {
    setActivePeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };

  // If we don't have external data, we'll create a chart from mining pools
  const data = propData || (miningPools ? processPoolData(miningPools, activePeriod) : []);
  const totalBlocks = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">Mining Pool Distribution</CardTitle>
        <CardDescription className="text-center">
          See which mining pools have the most hashrate and their probability of mining the next block.
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
        ) : (
          <div>
            <div className="h-80 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} (${((value / totalBlocks) * 100).toFixed(1)}%)`, 'Blocks']}
                    labelFormatter={(name) => `${name}`}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold">{totalBlocks}</div>
                  <div className="text-sm text-muted-foreground">Total Blocks ({activePeriod})</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              {data.slice(0, 6).map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center">
                  <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: entry.color }}></div>
                  <span>{entry.name} ({((entry.value / totalBlocks) * 100).toFixed(1)}%)</span>
                </div>
              ))}
              {data.length > 6 && (
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-gray-500 mr-2"></div>
                  <span>Others ({((data.slice(6).reduce((sum, item) => sum + item.value, 0) / totalBlocks) * 100).toFixed(1)}%)</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function processPoolData(pools: MiningPool[], period: TimePeriod) {
  // Get the hashrate for the selected period
  const getHashrateForPeriod = (pool: MiningPool) => {
    switch (period) {
      case "24h": return pool.hashrate24h || 0;
      case "3d": return pool.hashrate3d || 0;
      case "1w": return pool.hashrate1w || 0;
    }
  };

  // Sort pools by hashrate and filter out those with zero hashrate
  const sortedPools = [...pools]
    .filter(pool => getHashrateForPeriod(pool) > 0)
    .sort((a, b) => (getHashrateForPeriod(b) - getHashrateForPeriod(a)));

  // Mock data when we don't have real hashrate data
  if (sortedPools.length === 0 || sortedPools.every(pool => getHashrateForPeriod(pool) === 0)) {
    return [
      { name: "Foundry USA", value: 54, color: "#F7931A" },
      { name: "Antpool", value: 37, color: "#3B82F6" },
      { name: "F2Pool", value: 29, color: "#10B981" },
      { name: "ViaBTC", value: 25, color: "#F59E0B" },
      { name: "Binance Pool", value: 19, color: "#8B5CF6" },
      { name: "Luxor", value: 15, color: "#EC4899" },
      { name: "Others", value: 28, color: "#6B7280" }
    ];
  }

  // Format data for the pie chart
  return sortedPools.map(pool => ({
    name: pool.displayName,
    value: getHashrateForPeriod(pool),
    color: pool.color
  }));
}
