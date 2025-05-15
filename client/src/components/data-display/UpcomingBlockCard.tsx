import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublishedBlock } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

interface UpcomingBlockCardProps {
  block: PublishedBlock;
}

// Function to dynamically calculate estimated block time
function calculateDynamicBlockTime(blockHeight: number, latestBlock: any): Date | null {
  if (!latestBlock) return null;
  
  // Get the block difference
  const blockDiff = blockHeight - latestBlock.number;
  
  // Each block takes about 10 minutes on average
  const minutesToAdd = blockDiff * 10;
  
  // Use the latest block's timestamp as base
  const baseTime = new Date(latestBlock.timestamp);
  const estimatedTime = new Date(baseTime);
  estimatedTime.setMinutes(estimatedTime.getMinutes() + minutesToAdd);
  
  console.log(`Dynamic calculation for block ${blockHeight}:`, {
    latestBlockNum: latestBlock.number,
    blockDiff,
    minutesToAdd,
    baseTime: baseTime.toISOString(),
    estimatedTime: estimatedTime.toISOString()
  });
  
  return estimatedTime;
}

export default function UpcomingBlockCard({ block }: UpcomingBlockCardProps) {
  const [formattedDate, setFormattedDate] = useState<string>("");
  const [formattedTime, setFormattedTime] = useState<string>("");
  
  // Get the latest block to use as reference for dynamic calculations
  const { data: latestBlocks = [] } = useQuery({
    queryKey: ['/api/blocks']
  });
  
  // Get the actual latest block (first one in the array)
  const latestBlock = latestBlocks && latestBlocks.length > 0 ? latestBlocks[0] : null;

  useEffect(() => {
    if (block) {
      console.log("UpcomingBlockCard - Block data:", block);
      
      // Attempt to calculate a dynamic date if we have the latest block
      let dateToUse: Date | null = null;
      
      if (latestBlock) {
        // Calculate dynamic date based on latest block
        dateToUse = calculateDynamicBlockTime(block.height, latestBlock);
        console.log("Dynamic date calculated:", dateToUse);
      }
      
      // Fallback to stored date if dynamic calculation failed
      if (!dateToUse) {
        console.log("Using saved date from database");
        const dateString = block.estimatedTime;
        if (dateString) {
          dateToUse = new Date(dateString);
        }
      }
      
      // Format the date if we have one
      if (dateToUse) {
        try {
          // Format the date as MM/DD/YYYY
          setFormattedDate(dateToUse.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
          }));
          
          // Format the time as HH:MM AM/PM
          setFormattedTime(dateToUse.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }));
        } catch (error) {
          console.error("UpcomingBlockCard - Error formatting date:", error);
          setFormattedDate("Date pending");
          setFormattedTime("");
        }
      } else {
        console.warn("UpcomingBlockCard - No date available for block", block.height);
        setFormattedDate("Date pending");
        setFormattedTime("");
      }
    }
  }, [block, latestBlock]);

  if (!block) return null;

  return (
    <div className="max-w-3xl mx-auto text-center py-8">
      <div className="text-primary font-bold uppercase tracking-wide mb-2">READY TO BET?</div>
      <h1 className="text-4xl font-bold mb-2">Place Your Bets on Block #{block.height}</h1>
      <p className="text-lg text-muted-foreground mb-6">
        Block #{block.height} is coming up soon. Who do you think will mine this 
        {block.isSpecial ? " milestone " : " "}
        block?
      </p>
      
      <div className="flex flex-col md:flex-row items-center justify-center md:space-x-8 space-y-4 md:space-y-0 mb-6">
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-bold">Block #{block.height}</h2>
          <div className="flex items-center text-muted-foreground mt-2">
            <Clock className="h-4 w-4 mr-2" />
            <span>Estimated date: {formattedDate}</span>
          </div>
          {block.description && (
            <p className="text-sm text-muted-foreground/70 mt-1 max-w-md">
              {block.description}
            </p>
          )}
          {!block.description && block.isSpecial && (
            <p className="text-sm text-muted-foreground/70 mt-1 max-w-md">
              Milestone blocks receive extra attention and often contain special messages.
            </p>
          )}
        </div>
      </div>
      
      <div className="flex justify-center">
        <Button asChild className="px-8">
          <Link href={`/block-details/${block.height}`}>View Block Details</Link>
        </Button>
      </div>
    </div>
  );
}