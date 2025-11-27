import { RequestHandler } from "express";
import { getAdminDb, initializeFirebaseAdmin } from "../lib/firebase-admin";

// Initialize Firebase Admin on module load
initializeFirebaseAdmin();

export const handleGetAIConfig: RequestHandler = async (req, res) => {
  try {
    const db = getAdminDb();
    const configSnap = await db.collection("settings").doc("ai_config").get();

    const config = configSnap.exists
      ? configSnap.data()
      : {
          model: "x-ai/grok-4.1-fast:free",
          temperature: 0.7,
          maxTokens: 2048,
        };

    return res.json(config);
  } catch (error) {
    console.error("Error getting AI config:", error);
    return res.json({
      model: "x-ai/grok-4.1-fast:free",
      temperature: 0.7,
      maxTokens: 2048,
    });
  }
};

export const handleUpdateAIConfig: RequestHandler = async (req, res) => {
  // This is now handled in ai.ts with proper authentication
  return res.status(405).json({
    error: "Use POST /api/ai/config with idToken to update settings",
  });
};
