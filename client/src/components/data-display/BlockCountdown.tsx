import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { calculateEstimatedBlockTime, calculateTimeRemaining, calculateBlocksRemaining } from '@/utils/block-calculations';
import { Block } from '@/lib/types';

interface BlockCountdownProps {
  targetBlockHeight: number;
  latestBlock: Block | null;
}

export function BlockCountdown({ targetBlockHeight, latestBlock }: BlockCountdownProps) {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });
  const [blocksRemaining, setBlocksRemaining] = useState(0);
  const [estimatedDate, setEstimatedDate] = useState<Date | null>(null);

  // Calculate initial values
  useEffect(() => {
    if (latestBlock) {
      // Calculate estimated time when the block will be mined
      const estimatedTime = calculateEstimatedBlockTime(targetBlockHeight, latestBlock);
      setEstimatedDate(estimatedTime);
      
      // Calculate blocks remaining
      const blocks = calculateBlocksRemaining(targetBlockHeight, latestBlock.number);
      setBlocksRemaining(blocks);
    }
  }, [targetBlockHeight, latestBlock]);

  // Update countdown every second
  useEffect(() => {
    // Initial calculation
    if (estimatedDate) {
      setCountdown(calculateTimeRemaining(estimatedDate));
    }

    // Set up the interval
    const timer = setInterval(() => {
      if (estimatedDate) {
        const timeRemaining = calculateTimeRemaining(estimatedDate);
        setCountdown(timeRemaining);
        
        // Stop the timer if we've reached zero
        if (timeRemaining.totalSeconds <= 0) {
          clearInterval(timer);
        }
      }
    }, 1000);

    // Clean up
    return () => clearInterval(timer);
  }, [estimatedDate]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
      {/* Predicted Date */}
      <Card className="bg-gray-900 border-0 text-center overflow-hidden">
        <CardContent className="p-4">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground border-b border-gray-800 pb-2 mb-3">
            Predicted Date
          </h3>
          <div className="flex flex-col items-center">
            <div className="text-xl sm:text-2xl font-bold text-primary">
              {estimatedDate 
                ? estimatedDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  }) 
                : "Loading..."}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {estimatedDate 
                ? estimatedDate.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit', 
                    hour12: true,
                    timeZoneName: 'short'
                  }) 
                : ""}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Est. Time Remaining */}
      <Card className="bg-gray-900 border-0 text-center overflow-hidden">
        <CardContent className="p-4">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground border-b border-gray-800 pb-2 mb-3">
            Est. Time Remaining
          </h3>
          <div className="grid grid-cols-4 gap-1 text-center">
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-bold text-primary">{countdown.days}</span>
              <span className="text-xs text-muted-foreground">DAYS</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-bold text-primary">{countdown.hours}</span>
              <span className="text-xs text-muted-foreground">HOURS</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-bold text-primary">{countdown.minutes}</span>
              <span className="text-xs text-muted-foreground">MINS</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-bold text-primary">{countdown.seconds}</span>
              <span className="text-xs text-muted-foreground">SECS</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blocks Remaining */}
      <Card className="bg-gray-900 border-0 text-center overflow-hidden">
        <CardContent className="p-4">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground border-b border-gray-800 pb-2 mb-3">
            Blocks Remaining
          </h3>
          <div className="flex flex-col items-center">
            <div className="text-xl sm:text-2xl font-bold text-primary">
              {blocksRemaining.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Target #{targetBlockHeight.toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BlockCountdown;