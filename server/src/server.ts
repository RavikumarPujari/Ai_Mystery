import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";

async function startServer() {
  try {
    // Attempt database connection (non-fatal in development so server can run standalone if needed)
    try {
      await connectDatabase();
    } catch (dbErr) {
      console.warn("Database connection could not be established at startup. Waiting for retry or local daemon.");
    }

    const server = app.listen(env.PORT, () => {
      console.log(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      console.log(`Health endpoint available at http://localhost:${env.PORT}/health`);
    });

    const gracefulShutdown = async (signal: string) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDatabase();
        console.log("Process terminated gracefully.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}

