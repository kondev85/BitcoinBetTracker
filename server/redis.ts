import { createClient } from 'redis';

// Create Redis client
export const redisClient = createClient();

// Connect to Redis and handle errors
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

// Initialize Redis client
export async function initRedis() {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log('Redis client connected successfully');
    } else {
      console.log('Redis client already connected');
    }
    return true;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    return false;
  }
}

// Close Redis connection
export async function closeRedis() {
  await redisClient.disconnect();
  console.log('Redis client disconnected');
}