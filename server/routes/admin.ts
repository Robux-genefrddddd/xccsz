import { RequestHandler } from "express";
import { z } from "zod";
import {
  initializeFirebaseAdmin,
  FirebaseAdminService,
} from "../lib/firebase-admin";

// Initialize on first use
initializeFirebaseAdmin();

// Helper: Extract and validate idToken from Authorization header
const extractIdToken = (authHeader: string | undefined): string => {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid authorization header");
  }
  const token = authHeader.slice(7).trim();
  if (!token || token.length < 10 || token.length > 3000) {
    throw new Error("Invalid token format");
  }
  return token;
};

// Validation schemas
const UserIdSchema = z.string().regex(/^[a-zA-Z0-9]{28}$/, "Invalid user ID");
const BanReasonSchema = z.string().min(5).max(500);
const DurationSchema = z.number().int().min(1).max(36500).optional();

// ============ USER MANAGEMENT ============

export const handleGetAllUsers: RequestHandler = async (req, res) => {
  try {
    const idToken = extractIdToken(req.headers.authorization);
    const adminUid = await FirebaseAdminService.verifyAdmin(idToken);

    const db = FirebaseAdminService.getAdminDb();
    if (!db) throw new Error("Database not initialized");

    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map((doc) => ({
      uid: doc.id,
      email: doc.data().email,
      displayName: doc.data().displayName,
      plan: doc.data().plan,
      isAdmin: doc.data().isAdmin,
      messagesUsed: doc.data().messagesUsed || 0,
      messagesLimit: doc.data().messagesLimit || 0,
      createdAt: doc.data().createdAt,
      isBanned: doc.data().isBanned || false,
    }));

    res.json({ success: true, users });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(401).json({
      message: error instanceof Error ? error.message : "Operation failed",
    });
  }
};

export const handlePromoteUser: RequestHandler = async (req, res) => {
  try {
    const idToken = extractIdToken(req.headers.authorization);
    await FirebaseAdminService.verifyAdmin(idToken);

    const { userId } = z.object({ userId: UserIdSchema }).parse(req.body);

    const db = FirebaseAdminService.getAdminDb();
    if (!db) throw new Error("Database not initialized");

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new Error("User not found");

    await userRef.update({ isAdmin: true });

    // Log action
    const auth = FirebaseAdminService.getAdminAuth();
    if (auth) {
      try {
        await auth.setCustomUserClaims(userId, { admin: true });
      } catch (e) {
        console.warn("Could not set custom claims:", e);
      }
    }

    res.json({ success: true, message: "User promoted to admin" });
  } catch (error) {
    console.error("Promote user error:", error);
    const status = error instanceof z.ZodError ? 400 : 401;
    res.status(status).json({
      message: error instanceof Error ? error.message : "Operation failed",
    });
  }
};

export const handleDemoteUser: RequestHandler = async (req, res) => {
  try {
    const idToken = extractIdToken(req.headers.authorization);
    await FirebaseAdminService.verifyAdmin(idToken);

    const { userId } = z.object({ userId: UserIdSchema }).parse(req.body);

    const db = FirebaseAdminService.getAdminDb();
    if (!db) throw new Error("Database not initialized");

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new Error("User not found");

    await userRef.update({ isAdmin: false });

    // Remove custom claims
    const auth = FirebaseAdminService.getAdminAuth();
    if (auth) {
      try {
        await auth.setCustomUserClaims(userId, {});
      } catch (e) {
        console.warn("Could not clear custom claims:", e);
      }
    }

    res.json({ success: true, message: "User demoted" });
  } catch (error) {
    console.error("Demote user error:", error);
    const status = error instanceof z.ZodError ? 400 : 401;
    res.status(status).json({
      message: error instanceof Error ? error.message : "Operation failed",
    });
  }
};

export const handleBanUser: RequestHandler = async (req, res) => {
  try {
    const idToken = extractIdToken(req.headers.authorization);
    const adminUid = await FirebaseAdminService.verifyAdmin(idToken);

    const { userId, reason } = z
      .object({
        userId: UserIdSchema,
        reason: BanReasonSchema,
      })
      .parse(req.body);

    const db = FirebaseAdminService.getAdminDb();
    if (!db) throw new Error("Database not initialized");

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new Error("User not found");
    if (userDoc.data()?.isAdmin) throw new Error("Cannot ban admin users");

    await userRef.update({
      isBanned: true,
      bannedAt: new Date(),
      bannedBy: adminUid,
      banReason: reason,
    });

    console.log(`[ADMIN] ${adminUid} banned user ${userId}. Reason: ${reason}`);

    res.json({ success: true, message: "User banned" });
  } catch (error) {
    console.error("Ban user error:", error);
    const status = error instanceof z.ZodError ? 400 : 401;
    res.status(status).json({
      message: error instanceof Error ? error.message : "Operation failed",
    });
  }
};

export const handleUnbanUser: RequestHandler = async (req, res) => {
  try {
    const idToken = extractIdToken(req.headers.authorization);
    await FirebaseAdminService.verifyAdmin(idToken);

    const { userId } = z.object({ userId: UserIdSchema }).parse(req.body);

    const db = FirebaseAdminService.getAdminDb();
    if (!db) throw new Error("Database not initialized");

    await db.collection("users").doc(userId).update({ isBanned: false });

    res.json({ success: true, message: "User unbanned" });
  } catch (error) {
    console.error("Unban user error:", error);
    const status = error instanceof z.ZodError ? 400 : 401;
    res.status(status).json({
      message: error instanceof Error ? error.message : "Operation failed",
    });
  }
};

export const handleResetMessages: RequestHandler = async (req, res) => {
  try {
    const idToken = extractIdToken(req.headers.authorization);
    await FirebaseAdminService.verifyAdmin(idToken);

    const { userId } = z.object({ userId: UserIdSchema }).parse(req.body);

    const db = FirebaseAdminService.getAdminDb();
    if (!db) throw new Error("Database not initialized");

    await db.collection("users").doc(userId).update({ messagesUsed: 0 });

    res.json({ success: true, message: "Messages reset" });
  } catch (error) {
    console.error("Reset messages error:", error);
    const status = error instanceof z.ZodError ? 400 : 401;
    res.status(status).json({
      message: error instanceof Error ? error.message : "Operation failed",
    });
  }
};

export const handleDeleteUser: RequestHandler = async (req, res) => {
  try {
    const idToken = extractIdToken(req.headers.authorization);
    const adminUid = await FirebaseAdminService.verifyAdmin(idToken);

    const { userId } = z.object({ userId: UserIdSchema }).parse(req.body);

    const db = FirebaseAdminService.getAdminDb();
    const auth = FirebaseAdminService.getAdminAuth();
    if (!db || !auth) throw new Error("Firebase not initialized");

    // Delete from Firestore
    await db.collection("users").doc(userId).delete();

    // Delete from Auth
    try {
      await auth.deleteUser(userId);
    } catch (e) {
      console.warn("User not in Auth, continuing...");
    }

    console.log(`[ADMIN] ${adminUid} deleted user ${userId}`);

    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    console.error("Delete user error:", error);
    const status = error instanceof z.ZodError ? 400 : 401;
    res.status(status).json({
      message: error instanceof Error ? error.message : "Operation failed",
    });
  }
};

// ============ LICENSE MANAGEMENT ============

export const handleGetLicenses: RequestHandler = async (req, res) => {
  try {
    const idToken = extractIdToken(req.headers.authorization);
    await FirebaseAdminService.verifyAdmin(idToken);

    const db = FirebaseAdminService.getAdminDb();
    if (!db) throw new Error("Database not initialized");

    const snapshot = await db.collection("licenses").get();
    const licenses = snapshot.docs.map((doc) => ({
      key: doc.id,
      plan: doc.data().plan,
      valid: doc.data().valid || true,
      usedBy: doc.data().usedBy || null,
      usedAt: doc.data().usedAt || null,
      createdAt: doc.data().createdAt,
    }));

    res.json({ success: true, licenses });
  } catch (error) {
    console.error("Get licenses error:", error);
    res.status(401).json({
      message: error instanceof Error ? error.message : "Operation failed",
    });
  }
};

export const handleCreateLicense: RequestHandler = async (req, res) => {
  try {
    const idToken = extractIdToken(req.headers.authorization);
    const adminUid = await FirebaseAdminService.verifyAdmin(idToken);

    const { plan, validityDays } = z
      .object({
        plan: z.enum(["Free", "Classic", "Pro"]),
        validityDays: z.number().int().min(1).max(3650),
      })
      .parse(req.body);

    const db = FirebaseAdminService.getAdminDb();
    if (!db) throw new Error("Database not initialized");

    const licenseKey = `LIC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    await db.collection("licenses").doc(licenseKey).set({
      key: licenseKey,
      plan,
      validityDays,
      valid: true,
      createdBy: adminUid,
      createdAt: new Date(),
      usedBy: null,
      usedAt: null,
    });

    console.log(
      `[ADMIN] ${adminUid} created license ${licenseKey} for ${plan}`,
    );

    res.json({ success: true, license: { key: licenseKey, plan } });
  } catch (error) {
    console.error("Create license error:", error);
    const status = error instanceof z.ZodError ? 400 : 401;
    res.status(status).json({
      message: error instanceof Error ? error.message : "Operation failed",
    });
  }
};

// ============ AI CONFIGURATION ============

export const handleGetAIConfig: RequestHandler = async (req, res) => {
  try {
    const db = FirebaseAdminService.getAdminDb();
    if (!db) throw new Error("Database not initialized");

    const doc = await db.collection("settings").doc("ai_config").get();

    if (!doc.exists) {
      return res.json({
        model: "gpt-4",
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt: "You are a helpful assistant.",
      });
    }

    res.json(doc.data());
  } catch (error) {
    console.error("Get AI config error:", error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Operation failed",
    });
  }
};

export const handleUpdateAIConfig: RequestHandler = async (req, res) => {
  try {
    const idToken = extractIdToken(req.headers.authorization);
    await FirebaseAdminService.verifyAdmin(idToken);

    const config = z
      .object({
        model: z.string().min(1).max(100),
        temperature: z.number().min(0).max(2),
        maxTokens: z.number().int().min(100).max(4000),
        systemPrompt: z.string().max(2000),
      })
      .parse(req.body);

    const db = FirebaseAdminService.getAdminDb();
    if (!db) throw new Error("Database not initialized");

    await db.collection("settings").doc("ai_config").set(config);

    res.json({ success: true, config });
  } catch (error) {
    console.error("Update AI config error:", error);
    const status = error instanceof z.ZodError ? 400 : 401;
    res.status(status).json({
      message: error instanceof Error ? error.message : "Operation failed",
    });
  }
};

// ============ SYSTEM STATS ============

export const handleGetSystemStats: RequestHandler = async (req, res) => {
  try {
    const idToken = extractIdToken(req.headers.authorization);
    await FirebaseAdminService.verifyAdmin(idToken);

    const db = FirebaseAdminService.getAdminDb();
    if (!db) throw new Error("Database not initialized");

    // Get user stats
    const usersSnap = await db.collection("users").get();
    const users = usersSnap.docs.map((d) => d.data());
    const totalUsers = users.length;
    const adminUsers = users.filter((u) => u.isAdmin).length;
    const bannedUsers = users.filter((u) => u.isBanned).length;
    const freeUsers = users.filter((u) => u.plan === "Free").length;
    const proUsers = users.filter((u) => u.plan !== "Free").length;
    const totalMessages = users.reduce(
      (sum, u) => sum + (u.messagesUsed || 0),
      0,
    );

    // Get license stats
    const licensesSnap = await db.collection("licenses").get();
    const licenses = licensesSnap.docs.map((d) => d.data());
    const totalLicenses = licenses.length;
    const usedLicenses = licenses.filter((l) => l.usedBy).length;

    res.json({
      totalUsers,
      adminUsers,
      bannedUsers,
      freeUsers,
      proUsers,
      totalMessages,
      totalLicenses,
      usedLicenses,
      avgMessagesPerUser:
        totalUsers > 0 ? Math.round(totalMessages / totalUsers) : 0,
    });
  } catch (error) {
    console.error("Get system stats error:", error);
    res.status(401).json({
      message: error instanceof Error ? error.message : "Operation failed",
    });
  }
};

// ============ MAINTENANCE ============

export const handlePurgeLicenses: RequestHandler = async (req, res) => {
  try {
    const idToken = extractIdToken(req.headers.authorization);
    const adminUid = await FirebaseAdminService.verifyAdmin(idToken);

    const db = FirebaseAdminService.getAdminDb();
    if (!db) throw new Error("Database not initialized");

    const snapshot = await db
      .collection("licenses")
      .where("valid", "==", false)
      .get();
    let deleted = 0;

    for (const doc of snapshot.docs) {
      await doc.ref.delete();
      deleted++;
    }

    console.log(`[ADMIN] ${adminUid} purged ${deleted} invalid licenses`);

    res.json({ success: true, deleted });
  } catch (error) {
    console.error("Purge licenses error:", error);
    res.status(401).json({
      message: error instanceof Error ? error.message : "Operation failed",
    });
  }
};

export const handleVerifyAdmin: RequestHandler = async (req, res) => {
  try {
    const idToken = extractIdToken(req.headers.authorization);
    const adminUid = await FirebaseAdminService.verifyAdmin(idToken);
    res.json({ success: true, adminUid });
  } catch (error) {
    console.error("Verify admin error:", error);
    res.status(401).json({
      message: error instanceof Error ? error.message : "Unauthorized",
    });
  }
};

// Legacy exports for backward compatibility
export const handleBanIP = handleBanUser;
export const handleGetAllLicenses = handleGetLicenses;
