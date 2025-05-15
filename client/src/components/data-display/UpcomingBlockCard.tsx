import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublishedBlock, Block } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { calculateEstimatedBlockTime, formatBlockDate } from "@/utils/block-calculations";

interface UpcomingBlockCardProps {
  block: PublishedBlock;
}

export default function UpcomingBlockCard({ block }: UpcomingBlockCardProps) {
  const [formattedDate, setFormattedDate] = useState<string>("");
  const [formattedTime, setFormattedTime] = useState<string>("");
  
  // Get the latest block to use as reference for dynamic calculations
  const { data: latestBlocks = [] } = useQuery<Block[]>({
    queryKey: ['/api/blocks']
  });
  
  // Get the actual latest block (first one in the array)
  const latestBlock = latestBlocks.length > 0 ? latestBlocks[0] : null;

  useEffect(() => {
    if (block) {
      // Attempt to calculate a dynamic date if we have the latest block
      let dateToUse: Date | null = null;
      
      if (latestBlock) {
        // Calculate dynamic date based on latest block
        dateToUse = calculateEstimatedBlockTime(block.height, latestBlock);
      }
      
      // Fallback to stored date if dynamic calculation failed
      if (!dateToUse) {
        const dateString = block.estimatedTime;
        if (dateString) {
          dateToUse = new Date(dateString);
        }
      }
      
      // Format the date if we have one
      if (dateToUse) {
        try {
          // Format the date as MM/DD/YYYY
          setFormattedDate(formatBlockDate(dateToUse, false));
          
          // Format the time as HH:MM AM/PM
          setFormattedTime(dateToUse.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }));
        } catch (error) {
          console.error("Error formatting date:", error);
          setFormattedDate("Date pending");
          setFormattedTime("");
        }
      } else {
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