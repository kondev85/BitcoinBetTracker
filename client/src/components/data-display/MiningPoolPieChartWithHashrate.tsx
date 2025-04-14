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

interface MiningPoolHashrateData {
  name: string;
  value: number;
  color: string;
}

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
  const data = propData || hashrateData || [];
  const totalHashrate = data.reduce((sum, item) => sum + item.value, 0);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalHashrate) * 100).toFixed(2);
      return (
        <div className="bg-background p-3 border rounded-md shadow-md">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">
            <span className="font-medium">Hashrate: </span>
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
            <div className="h-80 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    labelLine={false}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}