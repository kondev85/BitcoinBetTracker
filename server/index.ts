import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { setupVite, serveStatic, log } from "./vite";
import { apiRouter, setRedisConnected } from "./apis";
import { checkDbConnection, resetConnectionPool } from "./db";
import { initRedis } from "./redis";
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Register API routes
app.use('/api', apiRouter);

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  console.error(`Error handled: ${err.message}`);
});

(async () => {
  // Create HTTP server
  const server = createServer(app);

  // Check database connection
  const isDbConnected = await checkDbConnection();
  if (!isDbConnected) {
    console.error("Failed to connect to the database. Attempting to reset connection pool...");
    const reset = await resetConnectionPool();
    if (!reset) {
      console.error("Failed to reset connection pool. Please check your DATABASE_URL.");
    }
  } else {
    console.log("Successfully connected to the database.");
  }
  
  // Initialize Redis
  const redisConnected = await initRedis();
  setRedisConnected(redisConnected);
  console.log('Redis connection status:', redisConnected ? 'Connected' : 'Not connected');

  // Set up Vite or serve static files
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start the server
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`Server running on port ${port}`);
    log(`Using Neon database connection with the provided DATABASE_URL`);
  });
})();
