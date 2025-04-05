import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function BitcoinMining() {
  return (
    <MainLayout>
      <div className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-10">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Understanding Bitcoin Mining
            </h1>
            <p className="mt-4 max-w-2xl text-xl text-muted-foreground lg:mx-auto">
              Learn about the process that secures the Bitcoin network and how mining pools work.
            </p>
          </div>

          {/* Hero Image Section */}
          <div className="relative w-full h-64 sm:h-80 lg:h-96 mb-12 rounded-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80 z-10"></div>
            <div className="absolute inset-0 flex items-end justify-start p-8 z-20">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  The Backbone of the Bitcoin Network
                </h2>
                <p className="mt-2 text-lg text-white/80">
                  Mining is essential for transaction validation and network security
                </p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"></div>
          </div>

          {/* What is Bitcoin Mining */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">What is Bitcoin Mining?</CardTitle>
              <CardDescription>
                The process that secures the network and processes transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p>
                Bitcoin mining is the process by which new bitcoins are introduced into circulation, but it is also a critical component of the maintenance and development of the blockchain ledger.
              </p>

              <p>
                At its core, mining is performed using specialized high-powered computers (known as ASICs) that solve complex computational math problems. These problems are so complex that they cannot be solved by hand and are difficult enough to tax even incredibly powerful computers.
              </p>

              <h3>The Purpose of Mining</h3>
              <p>
                Mining serves several important purposes:
              </p>
              <ul>
                <li>Issues new bitcoins</li>
                <li>Confirms transactions</li>
                <li>Secures the Bitcoin network against attacks</li>
                <li>Maintains consensus about the state of the blockchain</li>
              </ul>

              <h3>The Mining Process</h3>
              <ol>
                <li>Miners compile recent transactions into blocks</li>
                <li>They solve a computationally difficult puzzle known as a proof of work</li>
                <li>When they solve the puzzle, they add the block to the blockchain</li>
                <li>The first miner to solve the puzzle receives the block reward, which currently consists of newly created bitcoins plus transaction fees</li>
              </ol>

              <p>
                The difficulty of mining adjusts every 2,016 blocks (approximately every two weeks) to ensure that new blocks are added to the blockchain at a steady rate, regardless of how much mining power is on the network.
              </p>
            </CardContent>
          </Card>

          {/* Mining Pools Explained */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">Mining Pools Explained</CardTitle>
              <CardDescription>
                Why miners join forces and how pools distribute rewards
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p>
                As Bitcoin's difficulty increased over time, individual miners found it harder to successfully mine a block. This led to the creation of mining pools, where miners combine their computational resources to increase their chances of finding a block.
              </p>

              <h3>How Mining Pools Work</h3>
              <p>
                In a mining pool:
              </p>
              <ul>
                <li>Multiple miners combine their hash power</li>
                <li>When the pool successfully mines a block, the reward is split among participants</li>
                <li>Rewards are typically distributed based on how much computing power each miner contributed</li>
                <li>Pools charge a small fee for their services (usually 1-3%)</li>
              </ul>

              <h3>Major Mining Pools</h3>
              <p>
                The Bitcoin mining landscape is dominated by several major pools:
              </p>
              <ul>
                <li><strong>Foundry USA</strong>: Currently the largest pool, primarily based in North America</li>
                <li><strong>Antpool</strong>: One of the oldest and largest mining pools, operated by Bitmain</li>
                <li><strong>F2Pool</strong>: A major pool with significant global hashrate share</li>
                <li><strong>ViaBTC</strong>: Popular pool known for stable payouts</li>
                <li><strong>Binance Pool</strong>: Mining pool operated by the Binance exchange</li>
              </ul>

              <h3>Hashrate Distribution</h3>
              <p>
                A healthier Bitcoin network has a more distributed hashrate across various mining pools. Too much concentration in one pool could potentially lead to a 51% attack, where a single entity controls the majority of the network's mining power.
              </p>
            </CardContent>
          </Card>

          {/* The Mathematics of Mining */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">The Mathematics of Mining</CardTitle>
              <CardDescription>
                Understanding probability, hashrate, and luck in Bitcoin mining
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <h3>Mining Probability</h3>
              <p>
                Bitcoin mining is a probabilistic process. A mining pool with 20% of the network's hashrate has approximately a 20% chance of finding the next block. However, due to the random nature of the mining process, actual results can vary significantly in the short term.
              </p>

              <h3>Expected vs. Actual Blocks</h3>
              <p>
                If a mining pool has 20% of the network hashrate, we would expect them to mine approximately 20% of all blocks over a long period. However:
              </p>
              <ul>
                <li>In the short term (e.g., days or weeks), a pool might find more or fewer blocks than expected due to random chance</li>
                <li>Over longer periods (months or years), results tend to converge toward the expected value</li>
              </ul>

              <h3>The Concept of "Luck"</h3>
              <p>
                In mining, "luck" refers to the ratio of actual blocks found versus expected blocks:
              </p>
              <ul>
                <li>Luck = (Actual Blocks / Expected Blocks) × 100%</li>
                <li>100% luck means exactly as many blocks as expected</li>
                <li>Values over 100% indicate better than expected results (lucky)</li>
                <li>Values under 100% indicate worse than expected results (unlucky)</li>
              </ul>

              <p>
                This variance in luck is what creates betting opportunities. You can bet on whether a particular pool will be lucky or unlucky in finding a specific block.
              </p>
            </CardContent>
          </Card>

          {/* Mining Economics */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">Mining Economics</CardTitle>
              <CardDescription>
                Block rewards, transaction fees, and the economics of mining
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <h3>Block Rewards</h3>
              <p>
                Miners receive two types of rewards:
              </p>
              <ol>
                <li>
                  <strong>Block Subsidy</strong>: Currently 3.125 BTC per block (as of the 4th halving in 2024). This amount halves approximately every four years in an event called the "halving."
                </li>
                <li>
                  <strong>Transaction Fees</strong>: Fees paid by users to have their transactions included in a block. These vary based on network congestion.
                </li>
              </ol>

              <h3>Mining Costs</h3>
              <p>
                Mining operations face several major costs:
              </p>
              <ul>
                <li>Electricity costs (often the largest ongoing expense)</li>
                <li>Hardware costs (ASICs have high upfront costs and depreciate quickly)</li>
                <li>Infrastructure (cooling, maintenance, facilities)</li>
                <li>Staff and operations</li>
              </ul>

              <h3>Profitability Factors</h3>
              <p>
                Several factors influence mining profitability:
              </p>
              <ul>
                <li>Bitcoin price</li>
                <li>Mining difficulty</li>
                <li>Electricity costs</li>
                <li>Hardware efficiency</li>
                <li>Transaction fee levels</li>
              </ul>

              <p>
                Mining operations must constantly adapt to these changing conditions to remain profitable.
              </p>
            </CardContent>
          </Card>

          {/* Environmental Considerations */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">Environmental Considerations</CardTitle>
              <CardDescription>
                Energy consumption and sustainability efforts in Bitcoin mining
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p>
                Bitcoin mining has faced criticism for its energy consumption. However, the industry has been evolving in several important ways:
              </p>

              <h3>Renewable Energy Usage</h3>
              <p>
                Many mining operations now utilize renewable energy sources:
              </p>
              <ul>
                <li>Hydroelectric power (especially in regions like Quebec and Sichuan)</li>
                <li>Solar and wind power</li>
                <li>Stranded or flared natural gas that would otherwise be wasted</li>
              </ul>

              <p>
                According to some industry reports, Bitcoin mining has one of the highest renewable energy mixes of any large-scale industry, with estimates ranging from 40-75% renewable energy usage.
              </p>

              <h3>Energy Grid Benefits</h3>
              <p>
                Bitcoin mining offers some unique benefits to energy grids:
              </p>
              <ul>
                <li>Ability to act as a "buyer of last resort" for excess renewable energy</li>
                <li>Support for grid stability through flexible load management</li>
                <li>Financial incentive to develop renewable energy in remote locations</li>
              </ul>

              <h3>Hardware Efficiency Improvements</h3>
              <p>
                Mining hardware has become dramatically more energy-efficient over time:
              </p>
              <ul>
                <li>Early miners used CPUs, then GPUs, then FPGAs, and now specialized ASICs</li>
                <li>Modern ASICs are hundreds of times more efficient per hash than earlier hardware</li>
                <li>This trend continues with each new generation of mining equipment</li>
              </ul>
            </CardContent>
          </Card>

          {/* Getting Started with Betting */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Start Betting on Mining Pools</CardTitle>
              <CardDescription>
                Ready to put your knowledge to the test?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-6">
                Now that you understand how Bitcoin mining works, why not try predicting which mining pool will mine the next block? Use your knowledge of hashrates, luck factors, and historical performance to make informed bets.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/place-bets">
                  <Button size="lg">Place Your Bets</Button>
                </Link>
                <Link href="/stats">
                  <Button variant="outline" size="lg">View Mining Statistics</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Separator className="my-16" />

          {/* Additional Resources */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Additional Resources</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <a 
                href="https://mempool.space" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-6 bg-card rounded-lg hover:bg-card/80 transition-colors"
              >
                <h3 className="text-lg font-semibold mb-2">Mempool.space</h3>
                <p className="text-muted-foreground">
                  Explore real-time Bitcoin blockchain data, transactions, and mining information.
                </p>
              </a>
              <a 
                href="https://bitcoinmining.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-6 bg-card rounded-lg hover:bg-card/80 transition-colors"
              >
                <h3 className="text-lg font-semibold mb-2">BitcoinMining.com</h3>
                <p className="text-muted-foreground">
                  Educational resources about Bitcoin mining technology and industry.
                </p>
              </a>
              <a 
                href="https://braiins.com/blog" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-6 bg-card rounded-lg hover:bg-card/80 transition-colors"
              >
                <h3 className="text-lg font-semibold mb-2">Braiins Blog</h3>
                <p className="text-muted-foreground">
                  Technical articles about Bitcoin mining from a leading mining pool operator.
                </p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
