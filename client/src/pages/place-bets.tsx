import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import BettingCard from "@/components/data-display/BettingCard";
import { fetchPublishedBlocks, fetchBettingOptions, fetchMiningPools } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlaceBets() {
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
  
  const { data: publishedBlocks, isLoading: isLoadingBlocks } = useQuery({
    queryKey: ['/api/published-blocks'],
    queryFn: () => fetchPublishedBlocks(true),
  });
  
  const { data: miningPools } = useQuery({
    queryKey: ['/api/mining-pools'],
    queryFn: fetchMiningPools,
  });
  
  const { data: bettingOptions, isLoading: isLoadingOptions } = useQuery({
    queryKey: ['/api/betting-options', selectedBlock],
    queryFn: () => selectedBlock ? fetchBettingOptions(selectedBlock) : fetchBettingOptions(),
    enabled: Boolean(selectedBlock) || !selectedBlock,
  });
  
  // Select the first block by default if none is selected
  if (!selectedBlock && publishedBlocks && publishedBlocks.length > 0) {
    setSelectedBlock(publishedBlocks[0].height);
  }
  
  // Group betting options by type
  const minerOptions = bettingOptions?.filter(option => option.type === 'miner' && option.blockHeight === selectedBlock) || [];
  const notMinerOptions = bettingOptions?.filter(option => option.type === 'not_miner' && option.blockHeight === selectedBlock) || [];
  const timeOptions = bettingOptions?.filter(option => (option.type === 'under_time' || option.type === 'over_time') && option.blockHeight === selectedBlock) || [];
  
  // Get pool colors for miner betting options
  const getPoolColor = (poolName: string) => {
    const pool = miningPools?.find(p => p.name === poolName);
    return pool?.color || "#6B7280";
  };
  
  return (
    <MainLayout>
      <div className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-10">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Place Your Bets
            </h1>
            <p className="mt-4 max-w-2xl text-xl text-muted-foreground lg:mx-auto">
              Choose a block and predict who will mine it or how long it will take to be found.
            </p>
          </div>
          
          {/* Block Selection */}
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Select a Block</CardTitle>
                <CardDescription>
                  Choose which future block you want to bet on
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {isLoadingBlocks ? (
                    Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-28" />
                    ))
                  ) : (
                    publishedBlocks?.map(block => (
                      <Button
                        key={block.height}
                        variant={selectedBlock === block.height ? "default" : "outline"}
                        onClick={() => setSelectedBlock(block.height)}
                        className={block.isSpecial ? "border-primary border-2" : ""}
                      >
                        Block #{block.height}
                        {block.isSpecial && <span className="ml-1 text-xs">★</span>}
                      </Button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Selected Block Details */}
          {selectedBlock && publishedBlocks && (
            <div className="mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Block #{selectedBlock}</h2>
                      {publishedBlocks.find(b => b.height === selectedBlock)?.estimatedDate && (
                        <p className="mt-1 text-muted-foreground">
                          Estimated date: {new Date(publishedBlocks.find(b => b.height === selectedBlock)!.estimatedDate).toLocaleDateString()}
                        </p>
                      )}
                      {publishedBlocks.find(b => b.height === selectedBlock)?.description && (
                        <p className="mt-2 text-sm text-muted-foreground/70">
                          {publishedBlocks.find(b => b.height === selectedBlock)?.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Betting Options */}
          <Tabs defaultValue="miners">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="miners">Mining Pools</TabsTrigger>
              <TabsTrigger value="not-miners">Pool Exclusion</TabsTrigger>
              <TabsTrigger value="time">Block Time</TabsTrigger>
            </TabsList>
            
            <TabsContent value="miners" className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Bet on Which Mining Pool Will Find the Block</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {isLoadingOptions ? (
                  Array(6).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))
                ) : minerOptions.length > 0 ? (
                  minerOptions.map(option => (
                    <BettingCard
                      key={option.id}
                      option={option}
                      miningPoolColor={getPoolColor(option.value)}
                    />
                  ))
                ) : (
                  <div className="col-span-3 text-center py-8 text-muted-foreground">
                    No mining pool betting options available for this block.
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="not-miners" className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Bet on Which Mining Pool Will NOT Find the Block</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {isLoadingOptions ? (
                  Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))
                ) : notMinerOptions.length > 0 ? (
                  notMinerOptions.map(option => (
                    <BettingCard
                      key={option.id}
                      option={option}
                      miningPoolColor={getPoolColor(option.value)}
                    />
                  ))
                ) : (
                  <div className="col-span-3 text-center py-8 text-muted-foreground">
                    No pool exclusion betting options available for this block.
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="time" className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Bet on How Long It Will Take to Find the Block</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {isLoadingOptions ? (
                  Array(2).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))
                ) : timeOptions.length > 0 ? (
                  timeOptions.map(option => (
                    <BettingCard
                      key={option.id}
                      option={option}
                    />
                  ))
                ) : (
                  <div className="col-span-3 text-center py-8 text-muted-foreground">
                    No time-based betting options available for this block.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          {/* How Betting Works */}
          <div className="mt-12">
            <Card>
              <CardHeader>
                <CardTitle>How Betting Works</CardTitle>
                <CardDescription>
                  Learn how to place bets on our platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">1. Select a Block</h3>
                  <p className="text-muted-foreground">
                    Choose a future block that you want to bet on. Special milestone blocks are highlighted.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">2. Choose a Bet Type</h3>
                  <p className="text-muted-foreground">
                    You can bet on which mining pool will mine the block, which pool won't mine it, or how long it will take.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">3. Place Your Bet</h3>
                  <p className="text-muted-foreground">
                    Enter your bet amount and send the cryptocurrency to the provided address.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">4. Wait for the Result</h3>
                  <p className="text-muted-foreground">
                    Once the block is mined, your bet will be automatically settled and winnings sent to your address.
                  </p>
                </div>
                <div className="bg-muted p-4 rounded-md mt-4">
                  <p className="text-sm">
                    <strong>Note:</strong> All bets are final once placed. Please gamble responsibly and only bet what you can afford to lose.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
