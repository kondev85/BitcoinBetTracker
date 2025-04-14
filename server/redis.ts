import { createClient, type RedisClientType } from 'redis';

// Create a Redis client, but don't connect immediately
let redisClient: RedisClientType | null = null;

// Maximum connection attempts
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_INTERVAL_MS = 1000; // 1 second

/**
 * Gets the Redis client if it's connected, otherwise returns null
 */
export function getRedisClient(): RedisClientType | null {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }
  return null;
}

/**
 * Initializes the Redis client with connection retries
 * Returns true if connection was successful, false otherwise
 */
export async function initRedis(): Promise<boolean> {
  // If we already have a connected client, return it
  if (redisClient && redisClient.isOpen) {
    console.log('Redis client already connected');
    return true;
  }
  
  // Try to create a new client
  try {
    // Always create a new client if we don't have one or if it's not open
    if (!redisClient || !redisClient.isOpen) {
      redisClient = createClient({
        socket: {
          reconnectStrategy: (retries) => {
            // Don't retry more than MAX_RETRY_ATTEMPTS times
            if (retries >= MAX_RETRY_ATTEMPTS) {
              console.log(`Maximum Redis connection attempts (${MAX_RETRY_ATTEMPTS}) reached. Giving up.`);
              return false;
            }
            return RETRY_INTERVAL_MS;
          }
        }
      });
      
      // Set up error handler
      redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });
    }
    
    // Try to connect with timeout
    const connectionTimeout = new Promise<boolean>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Redis connection timeout'));
      }, 5000); // 5 second timeout
    });
    
    // Try to connect
    await Promise.race([
      redisClient.connect(),
      connectionTimeout
    ]);
    
    console.log('Redis client connected successfully');
    return true;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    
    // Clean up the client if connection failed
    if (redisClient) {
      try {
        if (redisClient.isOpen) {
          await redisClient.disconnect();
        }
      } catch (cleanupError) {
        console.error('Error cleaning up Redis client:', cleanupError);
      }
    }
    
    return false;
  }
}

/**
 * Safely closes the Redis connection if it's open
 */
export async function closeRedis(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    try {
      await redisClient.disconnect();
      console.log('Redis client disconnected');
    } catch (error) {
      console.error('Error disconnecting Redis client:', error);
    }
  }
}