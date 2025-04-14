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
    await redisClient.connect();
    console.log('Redis client connected successfully');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }
}

// Close Redis connection
export async function closeRedis() {
  await redisClient.disconnect();
  console.log('Redis client disconnected');
}