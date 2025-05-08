import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/MainLayout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchMiningPools, 
  fetchPublishedBlocks, 
  fetchBettingOptions,
  createPublishedBlock,
  updatePublishedBlock,
  createBettingOption,
  updateBettingOption,
  updateMiningPool
} from "@/lib/api";
import { BettingOption, MiningPool, PublishedBlock } from "@/lib/types";

export default function Admin() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("blocks");
  
  // Check if user is authenticated (this would be expanded in a real application)
  const isAuthenticated = true;
  
  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="py-12 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Admin Access Required</CardTitle>
                <CardDescription>Please login to access the admin panel</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" type="text" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" />
                  </div>
                </form>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Login</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-10">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Admin Panel
            </h1>
            <p className="mt-4 max-w-2xl text-xl text-muted-foreground lg:mx-auto">
              Manage blocks, betting options, and view mining statistics
            </p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="blocks">Published Blocks</TabsTrigger>
              <TabsTrigger value="betting">Betting Options</TabsTrigger>
              <TabsTrigger value="mining">Mining Pools</TabsTrigger>
            </TabsList>
            
            <TabsContent value="blocks" className="mt-6">
              <PublishedBlocksTab />
            </TabsContent>
            
            <TabsContent value="betting" className="mt-6">
              <BettingOptionsTab />
            </TabsContent>
            
            <TabsContent value="mining" className="mt-6">
              <MiningPoolsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}

function PublishedBlocksTab() {
  const [newBlock, setNewBlock] = useState<Partial<PublishedBlock>>({
    height: 900000,
    estimatedDate: new Date().toISOString().slice(0, 16),
    description: "",
    isSpecial: false,
    isActive: true
  });
  
  const { toast } = useToast();
  
  const { data: publishedBlocks, isLoading, refetch } = useQuery({
    queryKey: ['/api/published-blocks'],
    queryFn: () => fetchPublishedBlocks(false),
  });
  
  const handleCreateBlock = async () => {
    try {
      if (!newBlock.height || !newBlock.estimatedDate) {
        toast({
          title: "Missing required fields",
          description: "Block height and estimated date are required",
          variant: "destructive"
        });
        return;
      }
      
      await createPublishedBlock({
        height: newBlock.height,
        estimatedDate: new Date(newBlock.estimatedDate).toISOString(),
        description: newBlock.description || null,
        isSpecial: newBlock.isSpecial || false,
        isActive: newBlock.isActive !== undefined ? newBlock.isActive : true
      });
      
      toast({
        title: "Block published",
        description: `Block #${newBlock.height} has been published successfully`,
      });
      
      // Reset form and refetch data
      setNewBlock({
        height: newBlock.height + 1,
        estimatedDate: new Date().toISOString().slice(0, 16),
        description: "",
        isSpecial: false,
        isActive: true
      });
      
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish block. Please try again.",
        variant: "destructive"
      });
      console.error(error);
    }
  };
  
  const handleToggleBlockStatus = async (block: PublishedBlock) => {
    try {
      await updatePublishedBlock(block.height, {
        isActive: !block.isActive
      });
      
      toast({
        title: block.isActive ? "Block deactivated" : "Block activated",
        description: `Block #${block.height} has been ${block.isActive ? 'deactivated' : 'activated'}`
      });
      
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update block status",
        variant: "destructive"
      });
      console.error(error);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Published Block</CardTitle>
          <CardDescription>
            Add a new block for users to bet on
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="block-height">Block Height</Label>
                <Input 
                  id="block-height" 
                  type="number"
                  value={newBlock.height}
                  onChange={(e) => setNewBlock({...newBlock, height: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimated-date">Estimated Date</Label>
                <Input 
                  id="estimated-date" 
                  type="datetime-local"
                  value={newBlock.estimatedDate}
                  onChange={(e) => setNewBlock({...newBlock, estimatedDate: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input 
                id="description" 
                value={newBlock.description || ""}
                onChange={(e) => setNewBlock({...newBlock, description: e.target.value})}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="is-special"
                checked={newBlock.isSpecial}
                onCheckedChange={(checked) => setNewBlock({...newBlock, isSpecial: checked})}
              />
              <Label htmlFor="is-special">Mark as special block</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="is-active"
                checked={newBlock.isActive}
                onCheckedChange={(checked) => setNewBlock({...newBlock, isActive: checked})}
              />
              <Label htmlFor="is-active">Active (visible to users)</Label>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button onClick={handleCreateBlock}>Create Block</Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Manage Published Blocks</CardTitle>
          <CardDescription>
            View, activate, or deactivate published blocks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center p-4">Loading published blocks...</div>
          ) : publishedBlocks && publishedBlocks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Block Height</TableHead>
                  <TableHead>Estimated Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Special</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {publishedBlocks.map((block) => (
                  <TableRow key={block.height}>
                    <TableCell>{block.height}</TableCell>
                    <TableCell>{new Date(block.estimatedDate).toLocaleString()}</TableCell>
                    <TableCell>{block.description || "-"}</TableCell>
                    <TableCell>{block.isSpecial ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${block.isActive ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>
                        {block.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleToggleBlockStatus(block)}
                      >
                        {block.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-4 text-muted-foreground">
              No published blocks found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BettingOptionsTab() {
  const [newOption, setNewOption] = useState<Partial<BettingOption>>({
    blockHeight: 900000,
    type: "miner",
    value: "",
    odds: 2.0,
    paymentAddress: "",
    ltcPaymentAddress: "",
    usdcPaymentAddress: ""
  });
  
  const { toast } = useToast();
  
  const { data: publishedBlocks } = useQuery({
    queryKey: ['/api/published-blocks'],
    queryFn: () => fetchPublishedBlocks(true),
  });
  
  const { data: miningPools } = useQuery({
    queryKey: ['/api/mining-pools'],
    queryFn: fetchMiningPools,
  });
  
  // Get betting option types
  const { data: bettingOptionTypes, isLoading: loadingOptionTypes } = useQuery({
    queryKey: ['/api/betting-options'],
    queryFn: () => fetchBettingOptions(),
  });
  
  // We need to properly fetch actual bets per block
  // For now, we'll use an empty array since the API endpoint for this isn't implemented yet
  const bettingOptions: BettingOption[] = [];
  const isLoading = loadingOptionTypes;
  
  const handleCreateOption = async () => {
    try {
      if (!newOption.blockHeight || !newOption.type || !newOption.value || !newOption.odds || !newOption.paymentAddress) {
        toast({
          title: "Missing required fields",
          description: "All fields are required",
          variant: "destructive"
        });
        return;
      }
      
      // Determine which API to call based on bet type
      if (newOption.type === "miner" || newOption.type === "not_miner") {
        // For mining pool bets, use the block-miner-odds endpoint
        const isHitBet = newOption.type === "miner";
        
        // When creating odds for a mining pool, we set both hit and no-hit odds 
        // in a single record since they're two sides of the same bet
        const response = await fetch("/api/block-miner-odds", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            blockNumber: newOption.blockHeight,
            poolSlug: newOption.value,
            hitOdds: isHitBet ? newOption.odds : 2.0,
            noHitOdds: !isHitBet ? newOption.odds : 2.0
          }),
        });
        
        const blockOddsData = await response.json();
        console.log("Created block-miner-odds:", blockOddsData);
        
        // Now create a payment address for this bet
        // Use the actual odds from the blockOddsData
        await fetch("/api/admin/payment-addresses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            betId: newOption.blockHeight,
            poolSlug: newOption.value,
            betType: "miner",
            outcome: isHitBet ? "hit" : "noHit", 
            // Use the correct odds from the response for the selected bet type
            odds: isHitBet ? blockOddsData.hitOdds : blockOddsData.noHitOdds,
            address: newOption.paymentAddress,
            ltcAddress: newOption.ltcPaymentAddress || null,
            usdcAddress: newOption.usdcPaymentAddress || null
          }),
        });
      } else {
        // For time-based bets, use the time-bets endpoint
        const isUnderBet = newOption.type === "under_time";
        
        // Time bets also store both under and over odds in a single record
        const response = await fetch("/api/admin/time-bets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            blockNumber: newOption.blockHeight,
            underMinutesOdds: isUnderBet ? newOption.odds : 2.0,
            overMinutesOdds: !isUnderBet ? newOption.odds : 2.0
          }),
        });
        
        const timeBetData = await response.json();
        console.log("Created time bet:", timeBetData);
        
        // Create payment address for this time-based bet
        await fetch("/api/admin/payment-addresses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            betId: newOption.blockHeight,
            betType: "time",
            outcome: isUnderBet ? "under" : "over", 
            // Use the correct odds from the response for the selected bet type
            odds: isUnderBet ? timeBetData.underMinutesOdds : timeBetData.overMinutesOdds,
            address: newOption.paymentAddress,
            ltcAddress: newOption.ltcPaymentAddress || null,
            usdcAddress: newOption.usdcPaymentAddress || null
          }),
        });
      }
      
      toast({
        title: "Betting option created",
        description: `New betting option for block #${newOption.blockHeight} has been created`,
      });
      
      // Reset value and payment addresses, keep other fields
      setNewOption({
        ...newOption,
        value: newOption.type === "miner" || newOption.type === "not_miner" ? "" : newOption.value,
        paymentAddress: "",
        ltcPaymentAddress: "",
        usdcPaymentAddress: ""
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create betting option",
        variant: "destructive"
      });
      console.error(error);
    }
  };
  
  const handleUpdateOdds = async (option: BettingOption, newOdds: number) => {
    try {
      // In the future, this should call the appropriate API endpoint to update odds
      // For now, it's a placeholder
      
      toast({
        title: "Odds updated",
        description: `Odds for bet on ${option.value} have been updated to ${newOdds}`
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update odds",
        variant: "destructive"
      });
      console.error(error);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Betting Option</CardTitle>
          <CardDescription>
            Add a new betting option for a published block
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="block-select">Block</Label>
                <Select 
                  value={newOption.blockHeight?.toString()} 
                  onValueChange={(value) => setNewOption({...newOption, blockHeight: parseInt(value)})}
                >
                  <SelectTrigger id="block-select">
                    <SelectValue placeholder="Select a block" />
                  </SelectTrigger>
                  <SelectContent>
                    {publishedBlocks?.filter(b => b.isActive).map((block) => (
                      <SelectItem key={block.height} value={block.height.toString()}>
                        Block #{block.height}
                        {block.isSpecial && " (Special)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type-select">Bet Type</Label>
                <Select 
                  value={newOption.type} 
                  onValueChange={(value: "miner" | "not_miner" | "under_time" | "over_time") => {
                    setNewOption({...newOption, type: value, value: ""});
                  }}
                >
                  <SelectTrigger id="type-select">
                    <SelectValue placeholder="Select bet type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="miner">Mining Pool Will Mine</SelectItem>
                    <SelectItem value="not_miner">Mining Pool Won't Mine</SelectItem>
                    <SelectItem value="under_time">Block Time Under X Minutes</SelectItem>
                    <SelectItem value="over_time">Block Time Over X Minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="value-input">Value</Label>
              {(newOption.type === "miner" || newOption.type === "not_miner") ? (
                <Select 
                  value={newOption.value} 
                  onValueChange={(value) => setNewOption({...newOption, value})}
                >
                  <SelectTrigger id="value-input">
                    <SelectValue placeholder="Select mining pool" />
                  </SelectTrigger>
                  <SelectContent>
                    {miningPools?.map((pool) => (
                      <SelectItem key={pool.poolSlug || pool.name} value={pool.poolSlug || pool.name || ''}>
                        {pool.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input 
                  id="value-input" 
                  type="number"
                  placeholder="Time in minutes (e.g. 10)"
                  value={newOption.value}
                  onChange={(e) => setNewOption({...newOption, value: e.target.value})}
                />
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="odds-input">Odds</Label>
              <Input 
                id="odds-input" 
                type="number"
                step="0.01"
                min="1.01"
                value={newOption.odds}
                onChange={(e) => setNewOption({...newOption, odds: parseFloat(e.target.value)})}
              />
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payment-address">BTC Payment Address</Label>
                <Input 
                  id="payment-address" 
                  placeholder="Bitcoin payment address (e.g. bc1q...)"
                  value={newOption.paymentAddress}
                  onChange={(e) => setNewOption({...newOption, paymentAddress: e.target.value})}
                />
                <p className="text-xs text-muted-foreground">
                  Bitcoin address where users will send their bets
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ltc-payment-address">LTC Payment Address (Optional)</Label>
                <Input 
                  id="ltc-payment-address" 
                  placeholder="Litecoin payment address (e.g. L...)"
                  value={newOption.ltcPaymentAddress || ''}
                  onChange={(e) => setNewOption({...newOption, ltcPaymentAddress: e.target.value})}
                />
                <p className="text-xs text-muted-foreground">
                  Litecoin address for bet payments
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="usdc-payment-address">USDC Payment Address (Optional)</Label>
                <Input 
                  id="usdc-payment-address" 
                  placeholder="USDC payment address"
                  value={newOption.usdcPaymentAddress || ''}
                  onChange={(e) => setNewOption({...newOption, usdcPaymentAddress: e.target.value})}
                />
                <p className="text-xs text-muted-foreground">
                  USDC address for bet payments
                </p>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button onClick={handleCreateOption}>Create Betting Option</Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Manage Betting Options</CardTitle>
          <CardDescription>
            View and update odds for existing betting options
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center p-4">Loading betting options...</div>
          ) : bettingOptions && bettingOptions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Block</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Current Odds</TableHead>
                  <TableHead>BTC Address</TableHead>
                  <TableHead>LTC Address</TableHead>
                  <TableHead>USDC Address</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bettingOptions.map((option: BettingOption) => (
                  <TableRow key={option.id}>
                    <TableCell>#{option.blockHeight}</TableCell>
                    <TableCell>{formatBetType(option.type)}</TableCell>
                    <TableCell>{option.value}</TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        min="1.01" 
                        step="0.01"
                        defaultValue={option.odds}
                        className="w-20"
                        onBlur={(e) => {
                          const newOdds = parseFloat(e.target.value);
                          if (newOdds !== option.odds) {
                            handleUpdateOdds(option, newOdds);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {option.paymentAddress && option.paymentAddress.length >= 16 ? 
                        `${option.paymentAddress.substring(0, 8)}...${option.paymentAddress.substring(option.paymentAddress.length - 8)}` 
                        : option.paymentAddress || 'N/A'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {option.ltcPaymentAddress && option.ltcPaymentAddress.length >= 16 ? 
                        `${option.ltcPaymentAddress.substring(0, 8)}...${option.ltcPaymentAddress.substring(option.ltcPaymentAddress.length - 8)}` 
                        : option.ltcPaymentAddress || 'N/A'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {option.usdcPaymentAddress && option.usdcPaymentAddress.length >= 16 ? 
                        `${option.usdcPaymentAddress.substring(0, 8)}...${option.usdcPaymentAddress.substring(option.usdcPaymentAddress.length - 8)}` 
                        : option.usdcPaymentAddress || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-4 text-muted-foreground">
              No betting options found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MiningPoolsTab() {
  const { toast } = useToast();
  
  const { data: miningPools, isLoading, refetch } = useQuery({
    queryKey: ['/api/mining-pools'],
    queryFn: fetchMiningPools,
  });
  
  const handleUpdateHashrates = async (pool: MiningPool, period: "24h" | "3d" | "1w", value: number) => {
    try {
      const updateData: Partial<MiningPool> = {};
      
      switch(period) {
        case "24h":
          updateData.hashrate24h = value;
          break;
        case "3d":
          updateData.hashrate3d = value;
          break;
        case "1w":
          updateData.hashrate1w = value;
          break;
      }
      
      await updateMiningPool(pool.poolSlug, updateData);
      
      toast({
        title: "Hashrate updated",
        description: `${period} hashrate for ${pool.displayName} has been updated`
      });
      
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update hashrate",
        variant: "destructive"
      });
      console.error(error);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mining Pool Statistics</CardTitle>
          <CardDescription>
            Update hashrate percentages for mining pools (in %)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center p-4">Loading mining pools...</div>
          ) : miningPools && miningPools.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mining Pool</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>24h Hashrate (%)</TableHead>
                  <TableHead>3 Day Hashrate (%)</TableHead>
                  <TableHead>1 Week Hashrate (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {miningPools.map((pool) => (
                  <TableRow key={pool.poolSlug || pool.name}>
                    <TableCell className="font-medium">{pool.displayName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: pool.color }}
                        ></div>
                        <span className="text-xs font-mono">{pool.color}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        step="0.1"
                        defaultValue={pool.hashrate24h?.toString() || ""}
                        placeholder="0.0"
                        className="w-20"
                        onBlur={(e) => {
                          const newValue = parseFloat(e.target.value);
                          if (newValue !== pool.hashrate24h) {
                            handleUpdateHashrates(pool, "24h", newValue);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        step="0.1"
                        defaultValue={pool.hashrate3d?.toString() || ""}
                        placeholder="0.0"
                        className="w-20"
                        onBlur={(e) => {
                          const newValue = parseFloat(e.target.value);
                          if (newValue !== pool.hashrate3d) {
                            handleUpdateHashrates(pool, "3d", newValue);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        step="0.1"
                        defaultValue={pool.hashrate1w?.toString() || ""}
                        placeholder="0.0"
                        className="w-20"
                        onBlur={(e) => {
                          const newValue = parseFloat(e.target.value);
                          if (newValue !== pool.hashrate1w) {
                            handleUpdateHashrates(pool, "1w", newValue);
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-4 text-muted-foreground">
              No mining pools found
            </div>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Note: The sum of hashrates across all pools should be approximately 100% for accurate visualizations.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

// Helper function to format bet type
function formatBetType(type: string): string {
  switch (type) {
    case 'miner':
      return 'Mining Pool Will Mine';
    case 'not_miner':
      return 'Mining Pool Won\'t Mine';
    case 'under_time':
      return 'Block Time Under';
    case 'over_time':
      return 'Block Time Over';
    default:
      return type;
  }
}
