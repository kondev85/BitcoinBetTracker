import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { fetchBlocks, fetchMiners } from '@/lib/api-client';
import { Block, TimeBets, BlockMinerOdds } from '@/shared/schema';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

// Top mining pools to show individually
const TOP_POOLS = ['foundryusa', 'antpool', 'viabtc'];
const OTHERS_POOL = 'others'; // Special pool slug for the combined "Others" category

const Admin = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [miners, setMiners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [blockMinerOdds, setBlockMinerOdds] = useState<BlockMinerOdds[]>([]);
  const [timeBet, setTimeBet] = useState<TimeBets | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const { toast } = useToast();

  // Default odds for new betting options
  const defaultOdds = {
    hit: 2.0,
    noHit: 2.0,
    under: 2.0,
    over: 2.0
  };

  // Custom odds for each pool
  const [oddsValues, setOddsValues] = useState({
    foundryusa: { hit: 2.0, noHit: 2.0 },
    antpool: { hit: 2.0, noHit: 2.0 },
    viabtc: { hit: 2.0, noHit: 2.0 },
    others: { hit: 2.0, noHit: 2.0 },
    time: { under: 2.0, over: 2.0 }
  });

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [blocksData, minersData] = await Promise.all([
          fetchBlocks(10), // Get the 10 most recent blocks
          fetchMiners()
        ]);
        
        setBlocks(blocksData);
        setMiners(minersData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load data. Please try again.',
          variant: 'destructive'
        });
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle block selection
  const handleSelectBlock = async (block: Block) => {
    setSelectedBlock(block);
    try {
      // Check if block is already published
      const publishedResponse = await axios.get(`/api/published-blocks/${block.number}`);
      if (publishedResponse.data) {
        setIsPublished(true);
        toast({
          title: 'Block Already Published',
          description: `Block #${block.number} is already available for betting.`
        });
      } else {
        setIsPublished(false);
      }

      // Try to get existing odds
      try {
        const oddsResponse = await axios.get(`/api/admin/block-miner-odds/${block.number}`);
        if (oddsResponse.data && oddsResponse.data.length > 0) {
          setBlockMinerOdds(oddsResponse.data);
          
          // Update odds values from the existing data
          const newOddsValues = { ...oddsValues };
          
          oddsResponse.data.forEach((odds: BlockMinerOdds) => {
            if (TOP_POOLS.includes(odds.poolSlug)) {
              newOddsValues[odds.poolSlug as keyof typeof oddsValues] = {
                hit: odds.hitOdds,
                noHit: odds.noHitOdds
              };
            } else if (odds.poolSlug === OTHERS_POOL) {
              newOddsValues.others = {
                hit: odds.hitOdds,
                noHit: odds.noHitOdds
              };
            }
          });
          
          setOddsValues(newOddsValues);
        }
      } catch (error) {
        // No existing odds found, that's okay
      }

      // Try to get existing time bet
      try {
        const timeBetResponse = await axios.get(`/api/admin/time-bets/${block.number}`);
        if (timeBetResponse.data) {
          setTimeBet(timeBetResponse.data);
          
          // Update time odds values
          setOddsValues(prev => ({
            ...prev,
            time: {
              under: timeBetResponse.data.underMinutesOdds,
              over: timeBetResponse.data.overMinutesOdds
            }
          }));
        }
      } catch (error) {
        // No existing time bet found, that's okay
        setTimeBet(null);
      }

    } catch (error) {
      // Block not published yet
      setIsPublished(false);
      setBlockMinerOdds([]);
      setTimeBet(null);
      
      // Reset odds to defaults
      setOddsValues({
        foundryusa: { hit: 2.0, noHit: 2.0 },
        antpool: { hit: 2.0, noHit: 2.0 },
        viabtc: { hit: 2.0, noHit: 2.0 },
        others: { hit: 2.0, noHit: 2.0 },
        time: { under: 2.0, over: 2.0 }
      });
    }
  };

  // Handle odds change
  const handleOddsChange = (pool: string, type: 'hit' | 'noHit' | 'under' | 'over', value: string) => {
    const numValue = parseFloat(value);
    
    if (isNaN(numValue) || numValue <= 1.0) {
      // Invalid odds, must be greater than 1.0
      return;
    }
    
    if (type === 'under' || type === 'over') {
      setOddsValues(prev => ({
        ...prev,
        time: {
          ...prev.time,
          [type]: numValue
        }
      }));
    } else {
      setOddsValues(prev => ({
        ...prev,
        [pool]: {
          ...prev[pool as keyof typeof prev],
          [type]: numValue
        }
      }));
    }
  };

  // Publish block for betting
  const handlePublishBlock = async () => {
    if (!selectedBlock) return;
    
    try {
      // 1. Publish the block
      if (!isPublished) {
        await axios.post('/api/admin/published-blocks', {
          height: selectedBlock.number,
          status: 'active',
          publishedAt: new Date().toISOString()
        });
      }
      
      // 2. Create mining pool odds for top pools + others
      const poolPromises = [...TOP_POOLS, OTHERS_POOL].map(poolSlug => {
        const oddsData = {
          blockNumber: selectedBlock.number,
          poolSlug,
          hitOdds: oddsValues[poolSlug as keyof typeof oddsValues].hit,
          noHitOdds: oddsValues[poolSlug as keyof typeof oddsValues].noHit
        };
        
        return axios.post('/api/admin/block-miner-odds', oddsData);
      });
      
      // 3. Create time-based betting option
      const timeBetData = {
        blockNumber: selectedBlock.number,
        underMinutesOdds: oddsValues.time.under,
        overMinutesOdds: oddsValues.time.over
      };
      
      await Promise.all([
        ...poolPromises,
        axios.post('/api/admin/time-bets', timeBetData)
      ]);
      
      toast({
        title: 'Success',
        description: `Block #${selectedBlock.number} has been published for betting!`
      });
      
      setIsPublished(true);
    } catch (error) {
      console.error('Error publishing block:', error);
      toast({
        title: 'Error',
        description: 'Failed to publish block. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Update existing odds
  const handleUpdateOdds = async () => {
    if (!selectedBlock || !isPublished) return;
    
    try {
      // 1. Update mining pool odds
      const poolPromises = blockMinerOdds.map(odds => {
        const poolSlug = odds.poolSlug;
        let hitOdds = odds.hitOdds;
        let noHitOdds = odds.noHitOdds;
        
        if (TOP_POOLS.includes(poolSlug)) {
          hitOdds = oddsValues[poolSlug as keyof typeof oddsValues].hit;
          noHitOdds = oddsValues[poolSlug as keyof typeof oddsValues].noHit;
        } else if (poolSlug === OTHERS_POOL) {
          hitOdds = oddsValues.others.hit;
          noHitOdds = oddsValues.others.noHit;
        }
        
        return axios.put(`/api/admin/block-miner-odds/${odds.id}`, {
          hitOdds,
          noHitOdds
        });
      });
      
      // 2. Update time-based betting option
      const timeBetPromise = timeBet 
        ? axios.put(`/api/admin/time-bets/${timeBet.id}`, {
            underMinutesOdds: oddsValues.time.under,
            overMinutesOdds: oddsValues.time.over
          })
        : Promise.resolve();
      
      await Promise.all([...poolPromises, timeBetPromise]);
      
      toast({
        title: 'Success',
        description: `Odds for block #${selectedBlock.number} have been updated!`
      });
    } catch (error) {
      console.error('Error updating odds:', error);
      toast({
        title: 'Error',
        description: 'Failed to update odds. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Recent Blocks</CardTitle>
              <CardDescription>Select a block to set up betting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {blocks.map(block => (
                  <Button
                    key={block.id}
                    variant={selectedBlock?.id === block.id ? "default" : "outline"}
                    className="w-full justify-between"
                    onClick={() => handleSelectBlock(block)}
                  >
                    <span>Block #{block.number}</span>
                    <span className="text-xs opacity-70">{block.poolSlug || 'Unknown'}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          {selectedBlock ? (
            <Card>
              <CardHeader>
                <CardTitle>Block #{selectedBlock.number} Settings</CardTitle>
                <CardDescription>
                  Mined by: {selectedBlock.poolSlug || 'Unknown'} | 
                  Status: {isPublished ? 'Published' : 'Not Published'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="miners">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="miners">Mining Pool Betting</TabsTrigger>
                    <TabsTrigger value="time">Time-Based Betting</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="miners" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Foundry USA */}
                      <div className="space-y-2">
                        <Label htmlFor="foundryusa-hit">Foundry USA Hit Odds</Label>
                        <Input
                          id="foundryusa-hit"
                          type="number"
                          min="1.01"
                          step="0.01"
                          value={oddsValues.foundryusa.hit}
                          onChange={(e) => handleOddsChange('foundryusa', 'hit', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="foundryusa-nohit">Foundry USA No-Hit Odds</Label>
                        <Input
                          id="foundryusa-nohit"
                          type="number"
                          min="1.01"
                          step="0.01"
                          value={oddsValues.foundryusa.noHit}
                          onChange={(e) => handleOddsChange('foundryusa', 'noHit', e.target.value)}
                        />
                      </div>
                      
                      {/* AntPool */}
                      <div className="space-y-2">
                        <Label htmlFor="antpool-hit">AntPool Hit Odds</Label>
                        <Input
                          id="antpool-hit"
                          type="number"
                          min="1.01"
                          step="0.01"
                          value={oddsValues.antpool.hit}
                          onChange={(e) => handleOddsChange('antpool', 'hit', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="antpool-nohit">AntPool No-Hit Odds</Label>
                        <Input
                          id="antpool-nohit"
                          type="number"
                          min="1.01"
                          step="0.01"
                          value={oddsValues.antpool.noHit}
                          onChange={(e) => handleOddsChange('antpool', 'noHit', e.target.value)}
                        />
                      </div>
                      
                      {/* ViaBTC */}
                      <div className="space-y-2">
                        <Label htmlFor="viabtc-hit">ViaBTC Hit Odds</Label>
                        <Input
                          id="viabtc-hit"
                          type="number"
                          min="1.01"
                          step="0.01"
                          value={oddsValues.viabtc.hit}
                          onChange={(e) => handleOddsChange('viabtc', 'hit', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="viabtc-nohit">ViaBTC No-Hit Odds</Label>
                        <Input
                          id="viabtc-nohit"
                          type="number"
                          min="1.01"
                          step="0.01"
                          value={oddsValues.viabtc.noHit}
                          onChange={(e) => handleOddsChange('viabtc', 'noHit', e.target.value)}
                        />
                      </div>
                      
                      {/* Others */}
                      <div className="space-y-2">
                        <Label htmlFor="others-hit">Others Hit Odds</Label>
                        <Input
                          id="others-hit"
                          type="number"
                          min="1.01"
                          step="0.01"
                          value={oddsValues.others.hit}
                          onChange={(e) => handleOddsChange('others', 'hit', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="others-nohit">Others No-Hit Odds</Label>
                        <Input
                          id="others-nohit"
                          type="number"
                          min="1.01"
                          step="0.01"
                          value={oddsValues.others.noHit}
                          onChange={(e) => handleOddsChange('others', 'noHit', e.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="time" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="time-under">Under Minutes Odds</Label>
                        <Input
                          id="time-under"
                          type="number"
                          min="1.01"
                          step="0.01"
                          value={oddsValues.time.under}
                          onChange={(e) => handleOddsChange('time', 'under', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time-over">Over Minutes Odds</Label>
                        <Input
                          id="time-over"
                          type="number"
                          min="1.01"
                          step="0.01"
                          value={oddsValues.time.over}
                          onChange={(e) => handleOddsChange('time', 'over', e.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedBlock(null)}
                >
                  Cancel
                </Button>
                
                {isPublished ? (
                  <Button onClick={handleUpdateOdds}>Update Odds</Button>
                ) : (
                  <Button onClick={handlePublishBlock}>Publish for Betting</Button>
                )}
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Block Selected</CardTitle>
                <CardDescription>
                  Select a block from the list on the left to set up betting options
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
      
      <div className="mt-6">
        <Button asChild variant="outline">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
};

export default Admin;