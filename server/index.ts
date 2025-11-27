import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleGetIP, handleCheckVPN } from "./routes/ip-detection";
import { handleActivateLicense } from "./routes/license";
import { handleDailyReset } from "./routes/daily-reset";
import { handleAIChat } from "./routes/ai";
import {
  handleVerifyAdmin,
  handleBanUser,
  handleGetAllUsers,
  handleCreateLicense,
} from "./routes/admin";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Security headers
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // IP detection routes
  app.get("/api/get-ip", handleGetIP);
  app.post("/api/check-vpn", handleCheckVPN);

  // License activation route
  app.post("/api/activate-license", handleActivateLicense);

  // Daily reset route
  app.post("/api/daily-reset", handleDailyReset);

  // AI chat route
  app.post("/api/ai/chat", handleAIChat);

  // Admin routes (require authentication)
  app.post("/api/admin/verify", handleVerifyAdmin);
  app.post("/api/admin/ban-user", handleBanUser);
  app.get("/api/admin/users", handleGetAllUsers);
  app.post("/api/admin/create-license", handleCreateLicense);

  return app;
}
