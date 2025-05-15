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