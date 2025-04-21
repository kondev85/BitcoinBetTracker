#!/bin/bash

# Script to catch up with the blockchain in batches
# Usage: ./catch-up.sh [batch_size] [total_blocks]
# Example: ./catch-up.sh 100 800

# Default batch size
BATCH_SIZE=${1:-100}

# Default total blocks to catch up
TOTAL_BLOCKS=${2:-800}

# Calculate number of batches
BATCHES=$((TOTAL_BLOCKS / BATCH_SIZE))
if [ $((TOTAL_BLOCKS % BATCH_SIZE)) -ne 0 ]; then
  BATCHES=$((BATCHES + 1))
fi

echo "Starting catch-up process:"
echo "- Total blocks to process: $TOTAL_BLOCKS"
echo "- Batch size: $BATCH_SIZE"
echo "- Number of batches: $BATCHES"
echo ""

# Process each batch
for ((i=1; i<=$BATCHES; i++)); do
  echo "Processing batch $i of $BATCHES..."
  npx tsx scripts/fetch-blocks.ts $BATCH_SIZE
  
  # Check result
  if [ $? -ne 0 ]; then
    echo "Error in batch $i. Exiting."
    exit 1
  fi
  
  echo "Batch $i completed. Waiting 10 seconds before next batch..."
  sleep 10
done

echo "Catch-up process completed!"