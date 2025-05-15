import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublishedBlock } from "@/lib/types";

interface UpcomingBlockCardProps {
  block: PublishedBlock;
}

export default function UpcomingBlockCard({ block }: UpcomingBlockCardProps) {
  const [formattedDate, setFormattedDate] = useState<string>("");
  const [formattedTime, setFormattedTime] = useState<string>("");

  useEffect(() => {
    if (block) {
      console.log("UpcomingBlockCard - Block data:", block);
      
      // Use estimatedTime as the source of truth, fallback to estimatedDate
      const dateString = block.estimatedTime;
      
      if (dateString) {
        console.log("UpcomingBlockCard - Using date:", dateString);
        try {
          const date = new Date(dateString);
          // Format the date as MM/DD/YYYY
          setFormattedDate(date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
          }));
          
          // Format the time as HH:MM AM/PM
          setFormattedTime(date.toLocaleTimeString('en-US', {
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
  }, [block]);

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