import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import { prisma } from "./server/db";

// Import routes (we will create these next)
import authRoutes from './server/routes/auth';
import userRoutes from './server/routes/users';
import locationRoutes from './server/routes/locations';
import documentRoutes from './server/routes/documents';
import scanRoutes from './server/routes/scan';
import dashboardRoutes from './server/routes/dashboard';
import settingsRoutes from './server/routes/settings';
import mobileRoutes from './server/routes/mobile';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(cors({ origin: true, credentials: true }));
  app.use(helmet({ contentSecurityPolicy: false })); // Disabled CSP for dev preview ease
  app.use(express.json());
  app.use(cookieParser());

  // Define API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/locations", locationRoutes);
  app.use("/api/documents", documentRoutes);
  app.use("/api/scan", scanRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/mobile", mobileRoutes);

  // Serve Vite in development mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Important: Express v4 uses '*' for catch-all
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
