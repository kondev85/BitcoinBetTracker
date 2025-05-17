import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BettingOption } from "@/lib/types";
import { Clock, User, Bitcoin, Coins, Copy, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface BettingCardProps {
  option: BettingOption;
  miningPoolColor?: string;
}

export default function BettingCard({ option, miningPoolColor = "#6B7280" }: BettingCardProps) {
  const [showBetDialog, setShowBetDialog] = useState(false);
  const [betAmount, setBetAmount] = useState("");
  const [activeCurrency, setActiveCurrency] = useState<"btc" | "ltc" | "usdc">("btc");
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const { toast } = useToast();

  // Function to get the current payment address based on selected currency
  const getCurrentPaymentAddress = (): string => {
    if (activeCurrency === "ltc" && option.ltcPaymentAddress) {
      return option.ltcPaymentAddress;
    } else if (activeCurrency === "usdc" && option.usdcPaymentAddress) {
      return option.usdcPaymentAddress;
    }
    return option.paymentAddress;
  };

  // Function to copy address to clipboard
  const handleCopyAddress = async () => {
    const paymentAddress = getCurrentPaymentAddress();
    
    try {
      await navigator.clipboard.writeText(paymentAddress);
      setCopySuccess(true);
      
      toast({
        title: "Address copied",
        description: "Payment address has been copied to your clipboard",
      });
      
      // Reset the copy success indicator after a short delay
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy address. Please try again or copy manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card className="bg-card rounded-lg shadow-lg overflow-hidden transition-all hover:translate-y-[-2px] hover:shadow-lg">
        <CardContent className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            {option.type.includes('miner') ? (
              <div 
                className="w-10 h-10 rounded-md flex items-center justify-center"
                style={{ backgroundColor: miningPoolColor }}
              >
                <span className="text-white text-lg font-bold">
                  {option.value ? option.value.charAt(0).toUpperCase() : "?"}
                </span>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-md bg-purple-500 flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
            )}
            <h3 className="ml-3 text-lg leading-6 font-medium">
              {getBetTitle(option)}
            </h3>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              {getBetDescription(option)}
            </p>
          </div>
          <div className="mt-5">
            <div className="bg-background rounded-md px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Odds</span>
              <span className="text-xl font-bold">{option.odds.toFixed(2)}x</span>
            </div>
            
            {/* Payment method indicators */}
            <div className="mt-2 flex items-center justify-end space-x-1">
              <Bitcoin className="h-4 w-4 text-amber-500" />
              {option.ltcPaymentAddress && <Coins className="h-4 w-4 text-blue-500" />}
              {option.usdcPaymentAddress && (
                <svg className="h-4 w-4 text-cyan-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M12 6v12M8 12h8" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}
            </div>
            
            <Button 
              className="mt-3 w-full" 
              onClick={() => setShowBetDialog(true)}
            >
              Place Bet
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showBetDialog} onOpenChange={setShowBetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Place Your Bet</DialogTitle>
            <DialogDescription>
              Choose your preferred cryptocurrency to bet on {getBetTitle(option)}.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs 
            defaultValue="btc" 
            className="mt-4" 
            onValueChange={(value) => setActiveCurrency(value as "btc" | "ltc" | "usdc")}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="btc" className="flex items-center justify-center">
                <Bitcoin className="h-4 w-4 mr-2" />
                Bitcoin
              </TabsTrigger>
              <TabsTrigger 
                value="ltc" 
                disabled={!option.ltcPaymentAddress}
                className="flex items-center justify-center"
              >
                <Coins className="h-4 w-4 mr-2" />
                Litecoin
              </TabsTrigger>
              <TabsTrigger 
                value="usdc" 
                disabled={!option.usdcPaymentAddress}
                className="flex items-center justify-center"
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M12 6v12M8 12h8" stroke="currentColor" strokeWidth="2" />
                </svg>
                USDC
              </TabsTrigger>
            </TabsList>
            
            {/* Bitcoin Tab Content */}
            <TabsContent value="btc" className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="btc-amount">Bet Amount (BTC)</Label>
                <Input
                  id="btc-amount"
                  placeholder="0.01"
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Potential Payout</Label>
                <div className="p-2 bg-background rounded-md">
                  {betAmount ? (parseFloat(betAmount) * option.odds).toFixed(8) : '0.00000000'} BTC
                </div>
              </div>
              <div className="space-y-2">
                <Label>Bitcoin Payment Address</Label>
                <div className="p-2 bg-background rounded-md overflow-x-auto font-mono text-sm break-all flex items-center justify-between">
                  <span className="overflow-x-auto mr-2">{option.paymentAddress}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-shrink-0" 
                    onClick={() => {
                      navigator.clipboard.writeText(option.paymentAddress);
                      toast({
                        title: "BTC Address copied",
                        description: "Payment address has been copied to your clipboard",
                      });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* Litecoin Tab Content */}
            <TabsContent value="ltc" className="space-y-4 py-2">
              {option.ltcPaymentAddress ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="ltc-amount">Bet Amount (LTC)</Label>
                    <Input
                      id="ltc-amount"
                      placeholder="0.1"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Potential Payout</Label>
                    <div className="p-2 bg-background rounded-md">
                      {betAmount ? (parseFloat(betAmount) * option.odds).toFixed(8) : '0.00000000'} LTC
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Litecoin Payment Address</Label>
                    <div className="p-2 bg-background rounded-md overflow-x-auto font-mono text-sm break-all flex items-center justify-between">
                      <span className="overflow-x-auto mr-2">{option.ltcPaymentAddress}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-shrink-0" 
                        onClick={() => {
                          navigator.clipboard.writeText(option.ltcPaymentAddress || '');
                          toast({
                            title: "LTC Address copied",
                            description: "Payment address has been copied to your clipboard",
                          });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-4 text-center text-muted-foreground">
                  Litecoin payments are not available for this bet.
                </div>
              )}
            </TabsContent>
            
            {/* USDC Tab Content */}
            <TabsContent value="usdc" className="space-y-4 py-2">
              {option.usdcPaymentAddress ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="usdc-amount">Bet Amount (USDC)</Label>
                    <Input
                      id="usdc-amount"
                      placeholder="50"
                      type="number"
                      step="1"
                      min="10"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Potential Payout</Label>
                    <div className="p-2 bg-background rounded-md">
                      {betAmount ? (parseFloat(betAmount) * option.odds).toFixed(2) : '0.00'} USDC
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>USDC Payment Address</Label>
                    <div className="p-2 bg-background rounded-md overflow-x-auto font-mono text-sm break-all flex items-center justify-between">
                      <span className="overflow-x-auto mr-2">{option.usdcPaymentAddress}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-shrink-0" 
                        onClick={() => {
                          navigator.clipboard.writeText(option.usdcPaymentAddress || '');
                          toast({
                            title: "USDC Address copied",
                            description: "Payment address has been copied to your clipboard",
                          });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-4 text-center text-muted-foreground">
                  USDC payments are not available for this bet.
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <p className="text-xs text-muted-foreground mt-2">
            Copy the payment address and send funds directly through your wallet. Your bet will be automatically processed once the transaction is confirmed on the blockchain.
          </p>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowBetDialog(false)}>Close</Button>
            <Button 
              onClick={handleCopyAddress} 
              className="gap-2"
            >
              {copySuccess ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Address
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function getBetTitle(option: BettingOption): string {
  // Use displayName if available, otherwise fallback to value
  const displayText = option.displayName || option.value;
  
  switch (option.type) {
    case 'miner':
      if (option.value.toLowerCase() === 'other') {
        return `Other Will Mine`;
      }
      return `${displayText} Will Mine`;
    case 'not_miner':
      if (option.value.toLowerCase() === 'other') {
        return `Other Won't Mine`;
      }
      return `${displayText} Won't Mine`;
    case 'under_time':
      return `Block Time Under ${option.value}min`;
    case 'over_time':
      return `Block Time Over ${option.value}min`;
    default:
      return displayText;
  }
}

function getBetDescription(option: BettingOption): string {
  // Use displayName if available, otherwise fallback to value
  const displayText = option.displayName || option.value;
  
  switch (option.type) {
    case 'miner':
      if (option.value.toLowerCase() === 'other') {
        return `Bet that a mining pool different than Foundry USA, AntPool and ViaBTC will mine block #${option.blockHeight}.`;
      }
      return `Bet that ${displayText} will mine block #${option.blockHeight}.`;
    case 'not_miner':
      if (option.value.toLowerCase() === 'other') {
        return `Bet that a mining pool different than Foundry USA, AntPool and ViaBTC will NOT mine block #${option.blockHeight}.`;
      }
      return `Bet that ${displayText} will NOT mine block #${option.blockHeight}.`;
    case 'under_time':
      return `Bet that block #${option.blockHeight} will be mined in less than ${option.value} minutes after the previous block.`;
    case 'over_time':
      return `Bet that block #${option.blockHeight} will be mined in more than ${option.value} minutes after the previous block.`;
    default:
      return '';
  }
}
