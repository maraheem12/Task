import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectToMongoDB, closeConnection } from './mongodb.js';
import { initializeStorage } from './storage.js';
import { setupRoutes } from './routes.js';

// const __dirname = path.resolve();
// if (process.env.NODE_ENV === "production") {
// 	app.use(express.static(path.join(__dirname, "/frontend/dist")));

// 	app.get("*", (req, res) => {
// 		res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
// 	});
// }

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist/public')));

// Initialize MongoDB and storage
async function startServer() {
  try {
    // Connect to MongoDB
    await connectToMongoDB();
    
    // Initialize storage with MongoDB
    initializeStorage(true);
    
    // Setup API routes
    setupRoutes(app);
    
    // Serve React app for all other routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../dist/public/index.html'));
    });

    app.listen(PORT, '127.0.0.1', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Frontend: http://localhost:${PORT}`);
      console.log(`🔗 API: http://localhost:${PORT}/api`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    
    // Fallback to in-memory storage if MongoDB fails
    console.log('🔄 Falling back to in-memory storage...');
    initializeStorage(false);
    setupRoutes(app);
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../dist/public/index.html'));
    });

    app.listen(PORT, '127.0.0.1', () => {
      console.log(`🚀 Server running on port ${PORT} (in-memory mode)`);
      console.log(`📱 Frontend: http://localhost:${PORT}`);
      console.log(`🔗 API: http://localhost:${PORT}/api`);
    });
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  await closeConnection();
  process.exit(0);
});

startServer();