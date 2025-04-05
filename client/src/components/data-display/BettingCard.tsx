import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BettingOption } from "@/lib/types";
import { Clock, User } from "lucide-react";

interface BettingCardProps {
  option: BettingOption;
  miningPoolColor?: string;
}

export default function BettingCard({ option, miningPoolColor = "#6B7280" }: BettingCardProps) {
  const [showBetDialog, setShowBetDialog] = useState(false);
  const [betAmount, setBetAmount] = useState("");

  const handlePlaceBet = () => {
    // In a real app, this would handle the betting logic
    setShowBetDialog(false);
    alert(`Bet placed! Please send ${betAmount} BTC to ${option.paymentAddress}`);
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
                <User className="h-5 w-5 text-white" />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place Your Bet</DialogTitle>
            <DialogDescription>
              Enter how much BTC you'd like to bet on {getBetTitle(option)}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bet-amount">Bet Amount (BTC)</Label>
              <Input
                id="bet-amount"
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
              <Label>Payment Address</Label>
              <div className="p-2 bg-background rounded-md overflow-x-auto font-mono text-sm">
                {option.paymentAddress}
              </div>
              <p className="text-xs text-muted-foreground">
                Send funds to this address to place your bet. The transaction will be confirmed on the blockchain.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBetDialog(false)}>Cancel</Button>
            <Button onClick={handlePlaceBet}>Place Bet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function getBetTitle(option: BettingOption): string {
  switch (option.type) {
    case 'miner':
      return `${option.value} Will Mine`;
    case 'not_miner':
      return `${option.value} Won't Mine`;
    case 'under_time':
      return `Block Time Under ${option.value}min`;
    case 'over_time':
      return `Block Time Over ${option.value}min`;
    default:
      return option.value;
  }
}

function getBetDescription(option: BettingOption): string {
  switch (option.type) {
    case 'miner':
      return `Bet that ${option.value} will mine block #${option.blockHeight}.`;
    case 'not_miner':
      return `Bet that ${option.value} will NOT mine block #${option.blockHeight}.`;
    case 'under_time':
      return `Bet that block #${option.blockHeight} will be mined in less than ${option.value} minutes after the previous block.`;
    case 'over_time':
      return `Bet that block #${option.blockHeight} will be mined in more than ${option.value} minutes after the previous block.`;
    default:
      return '';
  }
}
