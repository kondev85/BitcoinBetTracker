import { useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, FileText, Hash, Package, Coins, ArrowLeft } from "lucide-react";
import { fetchBlockByHeight, fetchPublishedBlockByHeight, fetchBettingOptions } from "@/lib/api";
import BettingCard from "@/components/data-display/BettingCard";

export default function BlockDetails() {
  const [, params] = useRoute("/block-details/:height");
  const blockHeight = params?.height ? parseInt(params.height) : null;

  const { data: block, isLoading: isLoadingBlock } = useQuery({
    queryKey: [`/api/blocks/${blockHeight}`],
    queryFn: () => fetchBlockByHeight(blockHeight!),
    enabled: blockHeight !== null,
  });

  const { data: publishedBlock, isLoading: isLoadingPublishedBlock } = useQuery({
    queryKey: [`/api/published-blocks/${blockHeight}`],
    queryFn: () => fetchPublishedBlockByHeight(blockHeight!),
    enabled: blockHeight !== null,
    retry: false,
    // This will fail for past blocks that weren't published for betting, which is expected
    onError: () => {}
  });

  const { data: bettingOptions, isLoading: isLoadingBettingOptions } = useQuery({
    queryKey: [`/api/betting-options`, blockHeight],
    queryFn: () => fetchBettingOptions(blockHeight!),
    enabled: blockHeight !== null && publishedBlock !== undefined,
  });

  const isFutureBlock = !block && publishedBlock;
  const isPastBlock = block && !publishedBlock;
  const isCurrentBettingBlock = block && publishedBlock;

  useEffect(() => {
    if (blockHeight) {
      document.title = `Block #${blockHeight} - BlockBet`;
    }
  }, [blockHeight]);

  if (!blockHeight) {
    return (
      <MainLayout>
        <div className="py-12 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl font-extrabold">Invalid Block</h1>
            <p className="mt-4 text-muted-foreground">
              The requested block height is invalid.
            </p>
            <Link href="/">
              <Button className="mt-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return Home
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>

          <div className="lg:text-center mb-10">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Bitcoin Block #{blockHeight}
            </h1>
            <p className="mt-4 max-w-2xl text-xl text-muted-foreground lg:mx-auto">
              {isFutureBlock && "Upcoming block available for betting"}
              {isPastBlock && "Historical block details"}
              {isCurrentBettingBlock && "Active block with betting options"}
            </p>
          </div>

          {/* Block Overview */}
          <Card className="mb-10">
            <CardHeader>
              <CardTitle>Block Overview</CardTitle>
              <CardDescription>
                {isFutureBlock 
                  ? "Estimated details for this future block" 
                  : "Details for this Bitcoin block"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingBlock && isLoadingPublishedBlock ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                        <Hash className="h-4 w-4 mr-2" />
                        Height
                      </h3>
                      <p className="mt-1 text-2xl font-semibold">#{blockHeight}</p>
                    </div>

                    {block && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                          <Package className="h-4 w-4 mr-2" />
                          Mined By
                        </h3>
                        <p className="mt-1 text-2xl font-semibold flex items-center">
                          <span 
                            className="inline-block w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: getPoolColor(block.miningPool) }}
                          ></span>
                          {block.miningPool}
                        </p>
                      </div>
                    )}

                    {(block || publishedBlock) && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {isFutureBlock ? "Estimated Time" : "Timestamp"}
                        </h3>
                        <p className="mt-1 text-2xl font-semibold">
                          {isFutureBlock 
                            ? new Date(publishedBlock!.estimatedDate).toLocaleString()
                            : new Date(block!.timestamp).toLocaleString()
                          }
                        </p>
                      </div>
                    )}

                    {publishedBlock && publishedBlock.description && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          Description
                        </h3>
                        <p className="mt-1 text-lg">
                          {publishedBlock.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {block && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                          <Coins className="h-4 w-4 mr-2" />
                          Block Reward
                        </h3>
                        <p className="mt-1 text-2xl font-semibold">
                          {block.blockReward ? `${block.blockReward.toFixed(6)} BTC` : "N/A"}
                        </p>
                      </div>

                      {block.foundInMinutes !== null && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Time to Mine
                          </h3>
                          <p className="mt-1 text-2xl font-semibold">
                            {block.foundInMinutes} minutes
                          </p>
                        </div>
                      )}

                      {block.txCount !== null && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Transactions
                          </h3>
                          <p className="mt-1 text-2xl font-semibold">
                            {block.txCount.toLocaleString()}
                          </p>
                        </div>
                      )}

                      {block.size !== null && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Size
                          </h3>
                          <p className="mt-1 text-2xl font-semibold">
                            {block.size.toFixed(2)} MB
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col items-start">
              {publishedBlock && publishedBlock.isSpecial && (
                <Badge className="bg-primary text-primary-foreground mb-2">Special Block</Badge>
              )}
              <p className="text-sm text-muted-foreground">
                {isFutureBlock ? (
                  <>
                    This block has not been mined yet. You can place bets on which mining pool will mine it.
                  </>
                ) : (
                  <>
                    View complete details on{" "}
                    <a
                      href={`https://mempool.space/block/${blockHeight}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      mempool.space
                    </a>
                  </>
                )}
              </p>
            </CardFooter>
          </Card>

          {/* Betting Options - for future or active betting blocks */}
          {(isFutureBlock || isCurrentBettingBlock) && (
            <>
              <h2 className="text-2xl font-bold mb-6">Betting Options</h2>
              
              {isLoadingBettingOptions ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-72" />
                  ))}
                </div>
              ) : bettingOptions && bettingOptions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {bettingOptions.map((option) => (
                    <BettingCard
                      key={option.id}
                      option={option}
                      miningPoolColor={
                        option.type === "miner" || option.type === "not_miner"
                          ? getPoolColor(option.value)
                          : undefined
                      }
                    />
                  ))}
                </div>
              ) : (
                <Card className="mb-12">
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No betting options available for this block yet.
                      </p>
                      <Button className="mt-4" asChild>
                        <Link href="/place-bets">View Other Betting Options</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Results - for past blocks */}
          {isPastBlock && (
            <Card>
              <CardHeader>
                <CardTitle>Block Results</CardTitle>
                <CardDescription>
                  This block has already been mined
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-6 border border-border rounded-lg bg-muted/30 text-center">
                    <h3 className="text-xl font-semibold">Mined by</h3>
                    <div className="mt-4 flex items-center justify-center">
                      <div 
                        className="w-12 h-12 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: getPoolColor(block!.miningPool) }}
                      >
                        <span className="text-white text-lg font-bold">
                          {block!.miningPool.charAt(0)}
                        </span>
                      </div>
                      <span className="ml-3 text-2xl font-bold">{block!.miningPool}</span>
                    </div>
                    <p className="mt-4 text-muted-foreground">
                      This block was mined on {new Date(block!.timestamp).toLocaleString()}
                    </p>
                  </div>

                  <Separator />

                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">
                      Sorry, you missed betting on this block. Check out upcoming blocks for betting opportunities!
                    </p>
                    <Button asChild>
                      <Link href="/place-bets">View Betting Options</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

// Helper function to get mining pool color
function getPoolColor(poolName: string): string {
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
