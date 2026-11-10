require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB then start Express HTTP server
const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`[FolkBoard API Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });

    // Handle unexpected termination gracefully
    const gracefulShutdown = () => {
      console.log('\n[FolkBoard API Server] Shutting down gracefully...');
      server.close(() => {
        console.log('[FolkBoard API Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  } catch (error) {
    console.error(`[FolkBoard Server Failure] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

