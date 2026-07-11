import { Server as HTTPServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';

let io: SocketServer | null = null;
const userSockets = new Map<string, string>(); // Maps userId -> socketId

export const initSocket = (server: HTTPServer): SocketServer => {
  io = new SocketServer(server, {
    cors: {
      origin: '*', // Configure correctly for production environments
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Register client session mapping
    socket.on('register', (userId: string) => {
      userSockets.set(userId, socket.id);
      console.log(`User ${userId} linked to socket ${socket.id}`);
    });

    // Handle typing status
    socket.on('typing', (data: { senderId: string; receiverId: string; isTyping: boolean }) => {
      const recipientSocketId = userSockets.get(data.receiverId);
      if (recipientSocketId) {
        socket.to(recipientSocketId).emit('typing_status', data);
      }
    });

    socket.on('disconnect', () => {
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          console.log(`User ${userId} connection closed`);
          break;
        }
      }
    });
  });

  return io;
};

export const getIO = (): SocketServer => {
  if (!io) {
    throw new Error('Socket.io server instance is not initialized yet');
  }
  return io;
};

export const emitToUser = (userId: string, eventName: string, data: any): boolean => {
  if (!io) return false;
  const socketId = userSockets.get(userId);
  if (socketId) {
    io.to(socketId).emit(eventName, data);
    return true;
  }
  return false;
};
