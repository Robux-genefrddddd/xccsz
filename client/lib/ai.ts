import { auth } from "@/lib/firebase";

export interface AIConfig {
  model: string;
  temperature: number;
  maxTokens: number;
}

const DEFAULT_CONFIG: AIConfig = {
  model: "x-ai/grok-4.1-fast:free",
  temperature: 0.7,
  maxTokens: 2048,
};

export class AIService {
  static async getConfig(): Promise<AIConfig> {
    try {
      const response = await fetch("/api/ai/config");
      if (!response.ok) {
        console.debug("Failed to fetch AI config, using default");
        return DEFAULT_CONFIG;
      }
      return await response.json();
    } catch (error) {
      console.debug("Error fetching AI config, using default:", error);
      return DEFAULT_CONFIG;
    }
  }

  static async updateConfig(config: Partial<AIConfig>): Promise<void> {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/ai/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          ...config,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update AI config");
      }
    } catch (error) {
      throw new Error("Erreur lors de la mise à jour de la configuration IA");
    }
  }

  static async sendMessage(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }> = [],
  ): Promise<string> {
    const config = await this.getConfig();

    try {
      // Get current user's ID token
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error("Not authenticated. Please log in again.");
      }

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken,
          userMessage,
          conversationHistory,
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
        }),
      });

      // Try to read response as JSON directly, or arrayBuffer if stream is consumed
      let data: any;

      try {
        // First try: direct JSON parsing
        data = await response.json();
      } catch (firstError) {
        console.error("Failed to parse JSON directly:", firstError);

        // Fallback: try to read as arrayBuffer and decode
        try {
          const buffer = await response.arrayBuffer();
          const decoder = new TextDecoder();
          const responseText = decoder.decode(buffer);
          console.error("Response text:", responseText.substring(0, 500));
          data = JSON.parse(responseText);
        } catch (fallbackError) {
          console.error("Failed with arrayBuffer fallback:", fallbackError);
          throw new Error("Erreur serveur: réponse invalide");
        }
      }

      // Check HTTP status
      if (!response.ok) {
        const errorMessage = data?.error || `API error: ${response.status}`;
        throw new Error(errorMessage);
      }

      return data.content || "Pas de réponse";
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error("Erreur lors de la requête IA");
    }
  }

  static getAvailableModels(): string[] {
    return [
      "openrouter/auto",
      "gpt-4-turbo-preview",
      "gpt-3.5-turbo",
      "claude-3-opus",
      "claude-3-sonnet",
      "mistral-large",
    ];
  }
}
