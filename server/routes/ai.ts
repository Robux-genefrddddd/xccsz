import { RequestHandler } from "express";
import { z } from "zod";
import { getAdminAuth, getAdminDb } from "../lib/firebase-admin";
import { AIChatSchema } from "../middleware/security";

export const handleAIChat: RequestHandler = async (req, res) => {
  try {
    // Validate input schema
    const validated = AIChatSchema.parse(req.body);
    const {
      idToken,
      userMessage,
      conversationHistory = [],
      model = "x-ai/grok-4.1-fast:free",
      temperature = 0.7,
      maxTokens = 2048,
    } = validated;

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

    const userId = decoded.uid;

    // Get user data and verify credits
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

    // Check if user has credits
    const messagesUsed = userData.messagesUsed || 0;
    const messagesLimit = userData.messagesLimit || 10;

    if (messagesUsed >= messagesLimit) {
      return res.status(403).json({
        error: "No credits available. Please activate a license.",
        messagesUsed,
        messagesLimit,
      });
    }

    // Check if user is banned
    if (userData.banned === true) {
      return res.status(403).json({
        error: "Your account has been banned.",
      });
    }

    // Validate model is allowed
    const allowedModels = [
      "x-ai/grok-4.1-fast:free",
      "gpt-4",
      "gpt-3.5-turbo",
      "claude-3-opus",
      "claude-3-sonnet",
    ];

    if (!allowedModels.includes(model)) {
      return res.status(400).json({
        error: "Model not allowed",
      });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error("OPENROUTER_API_KEY not configured");
      return res.status(500).json({
        error:
          "Service d'IA non disponible. Veuillez contacter l'administrateur.",
      });
    }

    // Call OpenRouter API
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.APP_URL || "http://localhost:5173",
          "X-Title": "Chat AI",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "Tu es un assistant utile et amical. Réponds toujours en français.",
            },
            ...conversationHistory.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            {
              role: "user",
              content: userMessage,
            },
          ],
          temperature,
          max_tokens: maxTokens,
        }),
      },
    );

    let responseText: string;
    try {
      responseText = await response.text();
    } catch (readError) {
      console.error("Failed to read OpenRouter response:", readError);
      return res.status(500).json({
        error: "Failed to read response from AI service",
      });
    }

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse OpenRouter response:", parseError);
      console.error("Response text:", responseText.substring(0, 500));
      return res.status(500).json({
        error: "Invalid response from AI service",
      });
    }

    if (!response.ok) {
      console.error("OpenRouter API error:", data);
      return res.status(response.status).json({
        error: data?.error?.message || data?.error || "OpenRouter API error",
      });
    }

    const content = data?.choices?.[0]?.message?.content || "Pas de réponse";

    // Update user message count in Firestore
    try {
      await userDocRef.update({
        messagesUsed: messagesUsed + 1,
      });
    } catch (updateError) {
      console.error("Failed to update message count:", updateError);
      // Log but don't fail the response - user got their answer
    }

    return res.json({
      content,
      messagesUsed: messagesUsed + 1,
      messagesLimit,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request body",
        details: error.errors,
      });
    }

    console.error("AI route error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const handleGetAIConfig: RequestHandler = async (req, res) => {
  try {
    const db = getAdminDb();
    const configDoc = await db.collection("settings").doc("ai_config").get();

    const config = configDoc.exists ? configDoc.data() : {};

    return res.json({
      model: config.model || "x-ai/grok-4.1-fast:free",
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 2048,
      // Never return system prompt to client
    });
  } catch (error) {
    console.error("Get AI config error:", error);
    return res.status(500).json({
      error: "Failed to get AI config",
    });
  }
};

export const handleUpdateAIConfig: RequestHandler = async (req, res) => {
  try {
    const { idToken, model, temperature, maxTokens } = req.body;

    // Validate idToken
    if (!idToken || typeof idToken !== "string") {
      return res.status(400).json({
        error: "Invalid token",
      });
    }

    // Verify admin
    const auth = getAdminAuth();
    let decoded;
    try {
      decoded = await auth.verifyIdToken(idToken);
    } catch (error) {
      return res.status(401).json({
        error: "Unauthorized: Invalid token",
      });
    }

    const db = getAdminDb();
    const userDoc = await db.collection("users").doc(decoded.uid).get();

    if (!userDoc.exists || !userDoc.data()?.isAdmin) {
      return res.status(403).json({
        error: "Forbidden: Admin access required",
      });
    }

    // Update config
    const updateData: Record<string, any> = {};
    if (model && typeof model === "string") {
      updateData.model = model;
    }
    if (
      temperature !== undefined &&
      typeof temperature === "number" &&
      temperature >= 0 &&
      temperature <= 2
    ) {
      updateData.temperature = temperature;
    }
    if (
      maxTokens !== undefined &&
      typeof maxTokens === "number" &&
      maxTokens >= 1 &&
      maxTokens <= 4096
    ) {
      updateData.maxTokens = maxTokens;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: "No valid fields to update",
      });
    }

    await db.collection("settings").doc("ai_config").set(updateData, {
      merge: true,
    });

    console.log(`[ADMIN_ACTION] ${decoded.uid} updated AI configuration`);

    return res.json({
      success: true,
      config: updateData,
    });
  } catch (error) {
    console.error("Update AI config error:", error);
    return res.status(500).json({
      error: "Failed to update AI config",
    });
  }
};
