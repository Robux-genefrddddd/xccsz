import { Request, Response } from "express";
import { z } from "zod";
import { getAdminAuth, getAdminDb } from "../lib/firebase-admin";
import { DailyResetSchema } from "../middleware/security";
import { Timestamp } from "firebase-admin/firestore";

export async function handleDailyReset(req: Request, res: Response) {
  try {
    // Validate input
    const validated = DailyResetSchema.parse(req.body);
    const { idToken, userId } = validated;

    // Verify authentication
    const auth = getAdminAuth();
    let decoded;
    try {
      decoded = await auth.verifyIdToken(idToken);
    } catch (error) {
      return res.status(401).json({
        error: "Unauthorized: Invalid or expired token",
      });
    }

    // Security: Only allow users to reset their own data, or admins
    if (decoded.uid !== userId) {
      const userDoc = await getAdminDb()
        .collection("users")
        .doc(decoded.uid)
        .get();

      if (!userDoc.exists || !userDoc.data()?.isAdmin) {
        return res.status(403).json({
          error: "Forbidden: Can only reset your own data",
        });
      }
    }

    // Get user data
    const db = getAdminDb();
    const userDocRef = db.collection("users").doc(userId);
    const userDocSnap = await userDocRef.get();

    if (!userDocSnap.exists) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const userData = userDocSnap.data();
    if (!userData) {
      return res.status(404).json({
        error: "User data not found",
      });
    }

    const now = Date.now();
    const licenseExpiresAt = userData.licenseExpiresAt
      ? userData.licenseExpiresAt.toMillis?.() || userData.licenseExpiresAt
      : null;
    const lastMessageReset = userData.lastMessageReset
      ? userData.lastMessageReset.toMillis?.() || userData.lastMessageReset
      : null;
    const plan = userData.plan || "Free";

    // Check if license has expired
    if (licenseExpiresAt && licenseExpiresAt <= now) {
      // License expired, reset to Free plan
      await userDocRef.update({
        plan: "Free",
        messagesLimit: 10,
        messagesUsed: 0,
        licenseKey: "",
        licenseExpiresAt: null,
      });

      console.log(`[RESET] User ${userId} license expired, reverted to Free`);

      return res.status(200).json({
        message: "Licence expirée - reverted to Free",
        plan: "Free",
        messagesLimit: 10,
        messagesUsed: 0,
      });
    }

    // Check if we need to reset messages for daily limit
    if (plan !== "Free" && lastMessageReset) {
      const lastResetDate = new Date(lastMessageReset).toDateString();
      const todayDate = new Date(now).toDateString();

      if (lastResetDate !== todayDate) {
        // Reset messages for the new day
        await userDocRef.update({
          messagesUsed: 0,
          lastMessageReset: Timestamp.now(),
        });

        const messageLimit = userData.messagesLimit || 500;

        console.log(`[RESET] User ${userId} messages reset for new day`);

        return res.status(200).json({
          message: "Messages réinitialisés pour aujourd'hui",
          messagesUsed: 0,
          messagesLimit: messageLimit,
        });
      }
    }

    return res.status(200).json({
      message: "Aucun reset nécessaire",
      messagesUsed: userData.messagesUsed || 0,
      messagesLimit: userData.messagesLimit || 10,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request body",
        details: error.errors,
      });
    }

    console.error("Error in daily reset:", error);
    return res.status(500).json({
      message: "Erreur serveur lors du reset",
    });
  }
}
