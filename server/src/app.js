import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { config } from "./config/env.js";
import { connectDB } from "./config/db.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import libraryRoutes from "./routes/library.routes.js";
import userRoutes from "./routes/user.routes.js";
import documentRoutes from "./routes/document.routes.js";
import promptRoutes from "./routes/prompt.routes.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error.middleware.js";

const app = express();

// Initialize MongoDB connection asynchronously
connectDB();

// Security middleware
app.use(helmet());

// CORS configuration for local development and production
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        config.frontendUrl,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
      ];
      if (
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV !== "production"
      ) {
        return callback(null, true);
      }
      return callback(new Error("Blocked by CORS policy"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Base health route directly and via health router
app.use("/", healthRoutes);

// Auth routes
app.use("/auth", authRoutes);

// Chat routes (streaming & session CRUD)
app.use("/chat", chatRoutes);

// Knowledge Library routes (save, review, confirm, RAG index)
app.use("/library", libraryRoutes);

// User and Settings routes
app.use("/users", userRoutes);

// Document Studio routes (generate, CRUD, index)
app.use("/documents", documentRoutes);

// Prompt Vault routes
app.use("/prompts", promptRoutes);

// Catch-all 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

import { fileURLToPath } from "url";

// Start server if executed directly as entrypoint
const isDirectRun =
  process.argv[1] &&
  (fileURLToPath(import.meta.url) === process.argv[1] ||
    fileURLToPath(import.meta.url).replace(/\\/g, "/") ===
      process.argv[1].replace(/\\/g, "/"));

if (isDirectRun && process.env.NODE_ENV !== "test") {
  app.listen(config.port, () => {
    console.log(
      `[NexAI Server] Running on http://localhost:${config.port} in ${config.nodeEnv} mode`,
    );
  });
}

export default app;
