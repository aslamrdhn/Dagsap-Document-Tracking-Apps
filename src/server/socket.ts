import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from './logger';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';

let io: SocketIOServer;

export function initSocketIO(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: true,
      credentials: true
    }
  });

  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    const pubClient = new Redis(redisUrl);
    const subClient = pubClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
    logger.info('Socket.IO configured with Redis Adapter for multi-instance sync');
  }

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join room based on user role/location for targeted broadcasts (optional)
    socket.on('join', (room: string) => {
      socket.join(room);
      logger.info(`Socket ${socket.id} joined room ${room}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    if (process.env.NODE_ENV === 'test') {
      // Return a dummy object for testing purposes
      return { emit: () => {} } as unknown as SocketIOServer;
    }
    throw new Error('Socket.IO is not initialized!');
  }
  return io;
}
