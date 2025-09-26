// CRITICAL: Load environment variables FIRST
import 'dotenv/config';

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// 1. MIDDLEWARES ESSENCIAIS (Security & Body Parsing)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// CORS configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Request logging middleware with response protection
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;
  let responseEnded = false;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    if (responseEnded) {
      console.warn('⚠️ Attempt to send response after headers sent:', path);
      return this;
    }
    responseEnded = true;
    capturedJsonResponse = bodyJson;
    return originalResJson.call(this, bodyJson, ...args);
  };

  const originalEnd = res.end;
  res.end = function(...args) {
    responseEnded = true;
    return originalEnd.apply(res, args);
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

  // Attach response ended flag to request for middleware use
  (req as any).responseEnded = () => responseEnded;

  next();
});

(async () => {
  console.log("🚀 Starting Fi.V App Server...");
  
  // 2. REGISTRAR ROTAS DA API PRIMEIRO
  console.log("📡 Registering API routes...");
  const server = await registerRoutes(app);
  
  // 3. MIDDLEWARE DE ARQUIVOS ESTÁTICOS (Frontend)
  console.log("📁 Setting up static file serving...");
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  
  // 4. MIDDLEWARE DE TRATAMENTO DE ERROS (DEVE SER O ÚLTIMO)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('❌ Server Error:', err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Prevent multiple responses
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // Initialize Evolution API service
  try {
    const { evolutionService } = await import('./evolution-service');
    console.log('✅ Evolution API service initialized');
  } catch (error) {
    console.warn('⚠️  Evolution API service initialization failed:', error);
    console.log('💡 WhatsApp features will be unavailable until Evolution API is properly configured');
  }
  
  // Initialize WebSocket service
  try {
    const { websocketService } = await import('./websocket-service');
    websocketService.initialize(server);
    console.log('✅ WebSocket service initialized');
  } catch (error) {
    console.warn('⚠️  WebSocket service initialization failed:', error);
  }

  // 5. INICIAR O SERVIDOR
  const port = parseInt(process.env.PORT || '3000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    console.log(`✅ Server running on port ${port}`);
    console.log(`🌍 Environment: ${app.get("env")}`);
    log(`serving on port ${port}`);
  });
})();
