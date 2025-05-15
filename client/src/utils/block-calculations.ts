import { Block } from "@/lib/types";

/**
 * Calculates the estimated date and time for a future Bitcoin block
 * based on the current latest block and Bitcoin's average block time.
 * 
 * @param targetBlockHeight - The height of the block to estimate time for
 * @param latestBlock - The most recent Bitcoin block with timestamp
 * @param minutesPerBlock - Average minutes per block (defaults to 10 minutes)
 * @returns The estimated Date object or null if calculation cannot be performed
 */
export function calculateEstimatedBlockTime(
  targetBlockHeight: number, 
  latestBlock: Block | null,
  minutesPerBlock: number = 10
): Date | null {
  // Cannot calculate without a reference block
  if (!latestBlock) return null;

  // Calculate the difference in blocks
  const blockDiff = targetBlockHeight - latestBlock.number;
  
  // If the block is in the past, we can't estimate (or could return the actual time if we had it)
  if (blockDiff < 0) return null;
  
  // Calculate minutes to add based on average block time
  const minutesToAdd = blockDiff * minutesPerBlock;
  
  // Use the latest block's timestamp as our base
  const baseTime = new Date(latestBlock.timestamp);
  const estimatedTime = new Date(baseTime);
  
  // Add the calculated minutes
  estimatedTime.setMinutes(estimatedTime.getMinutes() + minutesToAdd);
  
  return estimatedTime;
}

/**
 * Formats a date for display in the application UI
 * 
 * @param date - The date to format
 * @param includeTime - Whether to include the time in the formatted string
 * @returns Formatted date string or null if date is invalid
 */
export function formatBlockDate(date: Date | null | string, includeTime: boolean = true): string {
  if (!date) return "Date pending";
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (includeTime) {
      return dateObj.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } else {
      return dateObj.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
    }
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Date pending";
  }
}

/**
 * Interface for countdown time components
 */
export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

/**
 * Calculate the time remaining until a specific date
 * 
 * @param targetDate - The target date to calculate countdown to
 * @returns An object containing days, hours, minutes, and seconds remaining
 */
export function calculateTimeRemaining(targetDate: Date | null): CountdownTime {
  if (!targetDate) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
  }

  const now = new Date();
  const difference = targetDate.getTime() - now.getTime();
  
  // If the target date is in the past, return zeros
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
  }
  
  const totalSeconds = Math.floor(difference / 1000);
  
  // Calculate days, hours, minutes, seconds
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  
  return { days, hours, minutes, seconds, totalSeconds };
}

/**
 * Calculate blocks remaining between target block and current block
 * 
 * @param targetBlockHeight - The target block height
 * @param currentBlockHeight - The current block height
 * @returns The number of blocks remaining, or 0 if in the past
 */
export function calculateBlocksRemaining(
  targetBlockHeight: number, 
  currentBlockHeight: number
): number {
  const blocksRemaining = targetBlockHeight - currentBlockHeight;
  return blocksRemaining > 0 ? blocksRemaining : 0;
}