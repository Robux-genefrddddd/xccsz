import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleGetIP, handleCheckVPN } from "./routes/ip-detection";
import { handleActivateLicense } from "./routes/license";
import { handleDailyReset } from "./routes/daily-reset";
import {
  handleAIChat,
  handleGetAIConfig,
  handleUpdateAIConfig,
} from "./routes/ai";
import {
  handleVerifyAdmin,
  handleBanUser,
  handleGetAllUsers,
  handleCreateLicense,
  handleBanIP,
  handleDeleteUser,
} from "./routes/admin";
import {
  handleCheckIPBan,
  handleCheckIPLimit,
  handleRecordUserIP,
  handleUpdateUserIPLogin,
} from "./routes/ip-management";
import { handleGetAIConfig as handleGetAIConfigSettings } from "./routes/settings";
import {
  validateContentType,
  validateRequestSize,
  validateInput,
  serverRateLimit,
  authMiddleware,
} from "./middleware/security";

export function createServer() {
  const app = express();

  // Trust proxy (for rate limiting to work correctly)
  app.set("trust proxy", 1);

  // Middleware - Order matters!
  // 1. CORS first (allow trusted origins)
  const corsOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .filter(Boolean);
  app.use(
    cors({
      origin: corsOrigins.length > 0 ? corsOrigins : true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // 2. Security headers
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Content-Security-Policy", "default-src 'self'");
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
    next();
  });

  // 3. Request size validation
  app.use(validateRequestSize);

  // 4. Parse JSON
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // 5. Content-Type validation
  app.use(validateContentType);

  // 6. Input validation (check for suspicious patterns)
  app.use(validateInput);

  // 7. Authentication middleware (extract token from request)
  app.use(authMiddleware);

  // 8. Global rate limiting (100 requests per minute per IP)
  app.use(serverRateLimit(60000, 100));

  // Create API router to handle all API routes
  const apiRouter = express.Router();

  // Example API routes
  apiRouter.get("/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  apiRouter.get("/demo", handleDemo);

  // IP detection routes (public, with rate limiting)
  apiRouter.get("/get-ip", serverRateLimit(60000, 30), handleGetIP);
  apiRouter.post("/check-vpn", serverRateLimit(60000, 10), handleCheckVPN);

  // IP management routes
  apiRouter.post("/check-ip-ban", handleCheckIPBan);
  apiRouter.post("/check-ip-limit", handleCheckIPLimit);
  apiRouter.post("/record-user-ip", handleRecordUserIP);
  apiRouter.post("/update-user-ip-login", handleUpdateUserIPLogin);

  // License activation route (requires auth, strict rate limit)
  apiRouter.post(
    "/activate-license",
    serverRateLimit(60000, 5),
    handleActivateLicense,
  );

  // Daily reset route (requires auth, strict rate limit)
  apiRouter.post("/daily-reset", serverRateLimit(60000, 5), handleDailyReset);

  // AI chat route (requires auth, very strict rate limit - 10 requests per minute per user)
  apiRouter.post("/ai/chat", serverRateLimit(60000, 10), handleAIChat);
  apiRouter.get("/ai/config", handleGetAIConfigSettings);
  apiRouter.put("/ai/config", serverRateLimit(60000, 5), handleUpdateAIConfig);

  // Admin routes (require authentication + stricter rate limiting)
  const adminRateLimit = serverRateLimit(60000, 10); // 10 requests per minute per user
  apiRouter.post("/admin/verify", adminRateLimit, handleVerifyAdmin);
  apiRouter.post("/admin/ban-user", adminRateLimit, handleBanUser);
  apiRouter.post("/admin/ban-ip", adminRateLimit, handleBanIP);
  apiRouter.post("/admin/delete-user", adminRateLimit, handleDeleteUser);
  apiRouter.get("/admin/users", adminRateLimit, handleGetAllUsers);
  apiRouter.post("/admin/create-license", adminRateLimit, handleCreateLicense);

  // Mount API router
  app.use("/api", apiRouter);

  // 404 handler for API routes only
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // Error handler
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error("Unhandled error:", err);
      res.status(500).json({ error: "Internal server error" });
    },
  );

  return app;
}
