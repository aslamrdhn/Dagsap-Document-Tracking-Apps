import express from 'express';
import { createServer as createHttpServer } from 'http';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { prisma } from './server/db';
import { validateEnv } from './server/config/validateEnv';
import { publicLimiter, protectedLimiter } from './server/middleware/rateLimiter';

// Import configuration and middleware
import { setupSwagger } from './server/swagger';
import { errorHandler } from './server/middleware/errorMiddleware';
import { requestLogger } from './server/middleware/loggerMiddleware';
import { connectRedis } from './server/redis';
import { logger } from './server/logger';
import { initSocketIO } from './server/socket';

// Import routes
import authRoutes from './server/routes/auth';
import userRoutes from './server/routes/users';
import locationRoutes from './server/routes/locations';
import documentRoutes from './server/routes/documents';
import scanRoutes from './server/routes/scan';
import dashboardRoutes from './server/routes/dashboard';
import settingsRoutes from './server/routes/settings';
import mobileRoutes from './server/routes/mobile';
import metricsRoutes from './server/routes/metrics';
import { metricsMiddleware } from './server/middleware/metrics';

export async function buildApp() {
  validateEnv();
  
  const app = express();

  // Trust the first proxy (Nginx/Cloud Run) to ensure rate limiter gets correct IPs
  app.set('trust proxy', 1);

  // Connect to Redis Cache
  await connectRedis();

  // Middleware
  app.use(metricsMiddleware());
  app.use(cors({ origin: true, credentials: true }));
  app.use(helmet({ contentSecurityPolicy: false })); // Disabled CSP for dev preview ease
  app.use(express.json());
  app.use(cookieParser());
  app.use(requestLogger);

  // Setup Swagger API Documentation (accessible at /api-docs)
  setupSwagger(app);

  // Define API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Apply rate limiters
  app.use('/api/auth', publicLimiter, authRoutes);
  app.use('/api/users', protectedLimiter, userRoutes);
  app.use('/api/locations', protectedLimiter, locationRoutes);
  app.use('/api/documents', protectedLimiter, documentRoutes);
  app.use('/api/scan', protectedLimiter, scanRoutes);
  app.use('/api/dashboard', protectedLimiter, dashboardRoutes);
  app.use('/api/settings', protectedLimiter, settingsRoutes);
  app.use('/api/mobile', protectedLimiter, mobileRoutes);
  app.use('/api/metrics', protectedLimiter, metricsRoutes);

  // Global Error Handler (must be registered after routes)
  app.use(errorHandler);

  // Serve Vite in development mode (skip in test environment to avoid vite compilation during tests)
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (process.env.NODE_ENV === 'production') {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));

    // Important: Express v4 uses '*' for catch-all
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

async function startServer() {
  const app = await buildApp();
  const server = createHttpServer(app);
  
  // Initialize Socket.IO
  initSocketIO(server);

  const PORT = 3000;

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Only start the server if not running in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer().catch(console.error);
}
