import { RequestHandler } from "express";
import { adminDB } from "@/server/lib/firebase-admin";
import { doc, getDoc, setDoc } from "firebase-admin/firestore";

export interface AIConfig {
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

const DEFAULT_CONFIG: AIConfig = {
  model: "x-ai/grok-4.1-fast:free",
  systemPrompt: "Tu es un assistant utile et amical. Réponds en français.",
  temperature: 0.7,
  maxTokens: 2048,
};

export const handleGetAIConfig: RequestHandler = async (req, res) => {
  try {
    const configRef = doc(adminDB, "settings", "ai");
    const configSnap = await getDoc(configRef);

    if (configSnap.exists()) {
      return res.json({ ...DEFAULT_CONFIG, ...configSnap.data() });
    }
    res.json(DEFAULT_CONFIG);
  } catch (error) {
    console.error("Error getting AI config:", error);
    res.json(DEFAULT_CONFIG);
  }
};

export const handleUpdateAIConfig: RequestHandler = async (req, res) => {
  try {
    const config = req.body;

    if (!config || typeof config !== "object") {
      res.status(400).json({ error: "Invalid config" });
      return;
    }

    const configRef = doc(adminDB, "settings", "ai");
    await setDoc(configRef, config, { merge: true });

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating AI config:", error);
    res.status(500).json({ error: "Failed to update AI config" });
  }
};
