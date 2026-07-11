import http from 'http';
import dotenv from 'dotenv';
dotenv.config();
import app from './app';
import { connectDB } from './config/db';
import { initSocket } from './config/socket';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Create HTTP Server
    const server = http.createServer(app);

    // 3. Initialize Socket.io
    initSocket(server);

    // 4. Start Listening
    server.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
