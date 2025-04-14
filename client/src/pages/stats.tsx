import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/MainLayout";
import BlocksTable from "@/components/data-display/BlocksTable";
import MiningPoolPieChartWithHashrate from "@/components/data-display/MiningPoolPieChartWithHashrate";
import MiningStats from "@/components/data-display/MiningStats";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TimePeriod } from "@/lib/types";

export default function Stats() {
  const [blockLimit, setBlockLimit] = useState(50);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("24h");
  
  return (
    <MainLayout>
      <div className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-10">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Bitcoin Mining Statistics
            </h1>
            <p className="mt-4 max-w-2xl text-xl text-muted-foreground lg:mx-auto">
              Detailed statistics about mining pools, hashrate distribution, and recent blocks.
            </p>
          </div>
          
          {/* Mining Pool Distribution */}
          <div className="mb-12">
            {/* Real-time Mempool.space Mining Pool Distribution */}
            <div className="mb-6">
              <MiningPoolPieChartWithHashrate 
                period={timePeriod} 
                onPeriodChange={setTimePeriod} 
              />
            </div>
          </div>
          
          {/* Mining Stats */}
          <div className="mb-12">
            <MiningStats initialBlockCount={250} />
          </div>
          
          {/* Recent Blocks Table */}
          <div className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle>Recent Bitcoin Blocks</CardTitle>
                <CardDescription>
                  Showing the last {blockLimit} blocks. Adjust the limit below.
                </CardDescription>
                <div className="flex flex-wrap gap-4 items-end mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="block-limit">
                      Number of blocks to show
                    </label>
                    <div className="flex gap-2">
                      <Input
                        id="block-limit"
                        type="number"
                        min="1"
                        max="1000"
                        value={blockLimit}
                        onChange={e => setBlockLimit(parseInt(e.target.value) || 50)}
                        className="w-24"
                      />
                      <Button size="sm">Apply</Button>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBlockLimit(10)}
                    >
                      10
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBlockLimit(50)}
                    >
                      50
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBlockLimit(100)}
                    >
                      100
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBlockLimit(250)}
                    >
                      250
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <BlocksTable limit={blockLimit} showViewAllLink={false} />
              </CardContent>
            </Card>
          </div>
          
          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Network Hashrate</CardTitle>
                <CardDescription>
                  Total computing power of the Bitcoin network
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center h-48">
                  <div className="text-5xl font-bold">350 EH/s</div>
                  <p className="text-muted-foreground mt-2">Estimated hashrate (24h average)</p>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  The hashrate represents the computing power dedicated to mining Bitcoin. Higher hashrate means more security for the network.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Block Reward & Fees</CardTitle>
                <CardDescription>
                  Current rewards for mining a block
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Block Subsidy</div>
                    <div className="text-2xl font-bold">3.125 BTC</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Average Fees</div>
                    <div className="text-2xl font-bold">0.045 BTC</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Total Reward</div>
                    <div className="text-2xl font-bold">3.170 BTC</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Miners receive the block subsidy plus transaction fees. The subsidy halves approximately every 4 years.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
