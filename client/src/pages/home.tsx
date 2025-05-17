import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Clock, Database, BarChart2, Scale } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import MiningPoolPieChartWithHashrate from "@/components/data-display/MiningPoolPieChartWithHashrate";
import BlocksTable from "@/components/data-display/BlocksTable";
import MiningStats from "@/components/data-display/MiningStats";
import BettingCard from "@/components/data-display/BettingCard";
import UpcomingBlockCard from "@/components/data-display/UpcomingBlockCard";
import BlockCountdown from "@/components/data-display/BlockCountdown";
import { fetchPublishedBlocks, fetchReserveAddresses, fetchPaymentAddressesByBlock, fetchMiningPools } from "@/lib/api";
import { TimePeriod, BettingOption, PaymentAddress, Block } from "@/lib/types";
import { useState } from "react";

export default function Home() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("24h");

  const { data: publishedBlocks } = useQuery({
    queryKey: ['/api/published-blocks'],
    queryFn: () => fetchPublishedBlocks(true),
  });
  
  const { data: miningPools } = useQuery({
    queryKey: ['/api/mining-pools'],
    queryFn: fetchMiningPools,
  });
  
  // Get pool colors for miner betting options
  const getPoolColor = (poolSlug: string) => {
    const pool = miningPools?.find(p => p.poolSlug === poolSlug);
    return pool?.color || "#6B7280";
  };

  // Find a special block to highlight (or just the first one)
  const featuredBlock = publishedBlocks?.find(block => block.isSpecial) || publishedBlocks?.[0];
  
  // Fetch payment addresses for the featured block
  const { data: paymentAddresses } = useQuery({
    queryKey: [`/api/payment-addresses/${featuredBlock?.height}`],
    queryFn: () => featuredBlock ? fetchPaymentAddressesByBlock(featuredBlock.height) : Promise.resolve([]),
    enabled: !!featuredBlock,
  });
  
  // Fetch recent blocks for countdown calculations
  const { data: latestBlocks = [] } = useQuery<Block[]>({
    queryKey: ['/api/blocks'],
  });
  
  const { data: reserveAddresses } = useQuery({
    queryKey: ['/api/reserve-addresses'],
    queryFn: fetchReserveAddresses,
  });

  // Function moved to top level
  
  // Map payment addresses to betting options
  const featuredBlockOptions = paymentAddresses?.map((address: PaymentAddress) => {
    const option: BettingOption = {
      id: address.id,
      blockHeight: address.betId,
      paymentAddress: address.address,
      ltcPaymentAddress: address.ltcAddress,
      usdcPaymentAddress: address.usdcAddress,
      odds: address.odds || 1.0, // Default to 1.0 if odds are null
      // Set type and value based on betType and outcome
      type: '',
      value: ''
    };
    
    if (address.betType === 'miner') {
      const poolInfo = miningPools?.find(p => p.poolSlug === address.poolSlug);
      if (address.outcome === 'hit') {
        option.type = 'miner';
        option.value = address.poolSlug || '';
        option.displayName = poolInfo?.displayName || address.poolSlug || '';
      } else {
        option.type = 'not_miner';
        option.value = address.poolSlug || '';
        option.displayName = poolInfo?.displayName || address.poolSlug || '';
      }
    } else if (address.betType === 'time') {
      if (address.outcome === 'under') {
        option.type = 'under_time';
        option.value = '10'; // Default time threshold value
      } else {
        option.type = 'over_time';
        option.value = '10'; // Default time threshold value
      }
    }
    
    return option;
  }) || [];

  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-card bg-opacity-80"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              <span className="block">Bet on Bitcoin</span>
              <span className="block text-primary">Mining Blocks</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-muted-foreground sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Predict which mining pool will mine the next Bitcoin block and win rewards. Verify the blockchain, don't trust us.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link href="/place-bets">
                  <Button size="lg" className="w-full">Place a Bet</Button>
                </Link>
              </div>
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                <Link href="/bitcoin-mining">
                  <Button variant="outline" size="lg" className="w-full">Learn More</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background to-transparent opacity-90"></div>
        </div>
      </div>

      {/* Section A: How Bitcoin Mining Works */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Bitcoin Mining 101</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight sm:text-4xl">
              Understanding the Mining Process
            </p>
            <p className="mt-4 max-w-2xl text-xl text-muted-foreground lg:mx-auto">
              Bitcoin mining is a competition where miners compete to solve complex mathematical problems to add new blocks to the blockchain.
            </p>
          </div>

          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                    <Database className="h-6 w-6" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium">Mining Pools</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-muted-foreground">
                  Miners join forces in pools to combine their computing power, increasing their chances of solving blocks and earning rewards consistently.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                    <BarChart2 className="h-6 w-6" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium">Hashrate</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-muted-foreground">
                  The total computing power of a pool determines its hashrate. The higher the hashrate percentage, the higher the chance of mining a block.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                    <Clock className="h-6 w-6" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium">Block Time</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-muted-foreground">
                  On average, a new block is mined every 10 minutes, but the actual time can vary greatly due to the probabilistic nature of mining.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                    <Scale className="h-6 w-6" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium">Luck Factor</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-muted-foreground">
                  Though mining is probabilistic, over long periods pools with higher hashrate will mine a proportional number of blocks. Short-term variations create betting opportunities.
                </dd>
              </div>
            </dl>
          </div>
          
          <div className="mt-10 text-center">
            <Link href="/bitcoin-mining">
              <Button variant="link" className="text-primary">
                Learn more about Bitcoin mining
                <svg className="inline-block ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section B: Mining Pools Distribution */}
      <section className="py-12 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MiningPoolPieChartWithHashrate period={timePeriod} onPeriodChange={setTimePeriod} />
        </div>
      </section>

      {/* Section C: Recent Blocks Table */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BlocksTable limit={5} showViewAllLink={true} />
        </div>
      </section>

      {/* Section D: Mining Pool Statistics */}
      <section className="py-12 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MiningStats initialBlockCount={10} />
        </div>
      </section>

      {/* Section E: Place Your Bets */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Featured Block Header */}
          <div className="lg:text-center mb-6">
            <div className="text-primary font-bold uppercase tracking-wide mb-2">READY TO BET?</div>
            {featuredBlock && (
              <h1 className="text-4xl font-bold mb-2">Place Your Bets on Block #{featuredBlock.height}</h1>
            )}
            {!featuredBlock && (
              <h1 className="text-4xl font-bold mb-2">Place Your Bets on Block #900000</h1>
            )}
            <p className="text-lg text-muted-foreground mb-6">
              Who do you think will mine this milestone block?
            </p>
          </div>
          
          {/* Bitcoin Block Countdown */}
          {featuredBlock && latestBlocks.length > 0 && (
            <BlockCountdown 
              targetBlockHeight={featuredBlock.height} 
              latestBlock={latestBlocks[0]} 
            />
          )}

          {/* Betting Options */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
            {featuredBlockOptions.slice(0, 3).map((option) => (
              <BettingCard 
                key={option.id} 
                option={option} 
                miningPoolColor={option.type === 'miner' ? getPoolColor(option.value) : undefined}
              />
            ))}
          </div>

          <div className="flex justify-center mt-8">
            <Link href="/place-bets">
              <Button>View All Betting Options</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section F: Verify, Don't Trust */}
      <section className="py-12 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-10">
            <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Transparency</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight sm:text-4xl">
              Verify, Don't Trust
            </p>
            <p className="mt-4 max-w-2xl text-xl text-muted-foreground lg:mx-auto">
              BlockBet operates with full transparency. Verify our payment addresses and reserves directly on the blockchain.
            </p>
          </div>

          <div className="mt-10">
            <Card>
              <CardContent className="pt-6">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium">Reserve Addresses</h3>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Verify our cryptocurrency reserves directly on-chain.</p>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                    {reserveAddresses?.map(address => (
                      <div key={address.id} className="sm:col-span-1">
                        <dt className="text-sm font-medium text-muted-foreground">{address.currency}</dt>
                        <dd className="mt-1 text-sm flex items-center">
                          <span className="font-mono bg-muted p-2 rounded overflow-x-auto">{address.address}</span>
                          <a 
                            href={`https://www.blockchain.com/explorer/addresses/${address.currency.toLowerCase()}/${address.address}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-2 text-primary hover:text-primary/80"
                          >
                            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </dd>
                        <dd className="mt-2 text-sm text-muted-foreground">
                          Balance: <span className="font-semibold">{address.balance} {address.currency}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="px-4 py-4 sm:px-6 bg-muted/50 text-center">
                  <a href="#" className="text-primary hover:text-primary/80 text-sm">Learn more about our transparency policy →</a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

// Helper function to get color for a pool
function getPoolColor(poolName: string): string {
  const poolColors: Record<string, string> = {
    "Foundry USA": "#F7931A",
    "Antpool": "#3B82F6",
    "F2Pool": "#10B981",
    "ViaBTC": "#F59E0B",
    "Binance Pool": "#8B5CF6",
    "Luxor": "#EC4899",
  };
  
  return poolColors[poolName] || "#6B7280";
}
