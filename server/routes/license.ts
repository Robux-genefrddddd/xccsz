import { Request, Response } from "express";
import { z } from "zod";
import { getAdminAuth, getAdminDb } from "../lib/firebase-admin";
import { ActivateLicenseSchema } from "../middleware/security";
import { Timestamp } from "firebase-admin/firestore";

export async function handleActivateLicense(req: Request, res: Response) {
  try {
    // Validate input
    const validated = ActivateLicenseSchema.parse(req.body);
    const { idToken, userId, licenseKey } = validated;

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

    // Security: Only allow users to activate licenses for themselves
    if (decoded.uid !== userId) {
      return res.status(403).json({
        error: "Forbidden: Can only activate licenses for yourself",
      });
    }

    // Get database instance
    const db = getAdminDb();

    // Query Firestore for licenses with matching key
    const licenseQuery = await db
      .collection("licenses")
      .where("key", "==", licenseKey.trim())
      .get();

    if (licenseQuery.empty) {
      return res.status(400).json({
        message: "Clé de licence invalide",
      });
    }

    const licenseDoc = licenseQuery.docs[0];
    const licenseData = licenseDoc.data();

    if (!licenseData) {
      return res.status(400).json({
        message: "Clé de licence invalide",
      });
    }

    // Check if license is active
    const isActive = licenseData.isActive !== false;
    if (!isActive) {
      return res.status(400).json({
        message: "Clé de licence désactivée",
      });
    }

    // Check if license has expired
    const expiresAt = licenseData.expiresAt;
    const expiresAtMs = expiresAt?.toMillis?.() || expiresAt;

    if (expiresAtMs && expiresAtMs < Date.now()) {
      return res.status(400).json({
        message: "Clé de licence expirée",
      });
    }

    // Extract license plan info
    const plan = licenseData.plan || "Classic";
    const validityDays = licenseData.validityDays || 30;

    // Plan message limits
    const planLimits: Record<string, number> = {
      Free: 10,
      Classic: 500,
      Pro: 1000,
    };

    const messageLimit = planLimits[plan] || 500;
    const licenseId = licenseDoc.id;

    // Update user data with license info
    const now = Date.now();
    const userDocRef = db.collection("users").doc(userId);

    await userDocRef.update({
      messagesUsed: 0,
      messagesLimit: messageLimit,
      plan,
      licenseKey: licenseKey.trim(),
      licenseExpiresAt: Timestamp.fromDate(
        new Date(expiresAtMs || now + validityDays * 24 * 60 * 60 * 1000),
      ),
      lastMessageReset: Timestamp.now(),
    });

    // Update the license with usage info
    await licenseDoc.ref.update({
      usedBy: userId,
      usedAt: Timestamp.now(),
      used: true,
    });

    console.log(`[LICENSE] User ${userId} activated license ${licenseKey}`);

    return res.status(200).json({
      message: "Licence activée avec succès",
      licenseId,
      plan,
      messageLimit,
      messagesUsed: 0,
      expiresAt: expiresAtMs,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request body",
        details: error.errors,
      });
    }

    console.error("Error activating license:", error);
    return res.status(500).json({
      message: "Erreur serveur lors de l'activation",
    });
  }
}
