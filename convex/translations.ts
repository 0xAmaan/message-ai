import { v } from "convex/values";
import { action, internalAction, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import Anthropic from "@anthropic-ai/sdk";

// Rate limit: 50 translations per user per hour
const TRANSLATION_RATE_LIMIT = 50;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Top 10 languages for batch translation
const BATCH_TRANSLATION_LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Chinese",
  "Japanese",
  "Arabic",
  "Hindi",
  "Portuguese",
  "Russian",
];

const BATCH_TRANSLATION_SYSTEM_PROMPT = `You are a professional translator and cultural consultant for the International Communicator messaging app.

Your task: Translate the provided message to ALL 10 specified languages in a single response.

CRITICAL JSON STRUCTURE - You MUST return EXACTLY this format:
{
  "detectedSourceLanguage": "ISO_language_name",
  "translations": {
    "English": {
      "text": "translated text here",
      "culturalHints": ["hint1", "hint2"],
      "slangExplanations": [{"term": "word", "explanation": "meaning"}],
      "formality": "formal|casual|neutral"
    },
    "Spanish": { ... },
    ... (repeat for all 10 languages)
  }
}

RULES:
1. If the message is ALREADY in the target language, return the SAME text (don't change it)
2. If there are NO cultural hints, use EMPTY array: []
3. If there is NO slang, use EMPTY array: []
4. Formality MUST be one of: "formal", "casual", or "neutral"
5. All 10 languages MUST be present in the response
6. Preserve emojis and formatting exactly
7. Keep translations natural, not word-for-word

Cultural hints: Only include if genuinely helpful (greetings, idioms, cultural practices)
Slang: Only include terms a non-native speaker wouldn't understand
Formality: Analyze the tone and match it in translation`;

const TRANSLATION_SYSTEM_PROMPT = `You are a professional translator and cultural consultant for the International Communicator messaging app.

Your role:
- Translate messages accurately while preserving tone and intent
- Automatically detect the source language
- Maintain formality level (formal messages stay formal, casual stay casual)
- Identify cultural context that may be misunderstood
- Explain slang, idioms, and regional expressions

Response format (JSON only):
{
  "translation": "Natural translation in target language",
  "detectedLanguage": "ISO_language_code",
  "culturalHints": ["List of cultural context notes"] or [],
  "slangExplanations": [{"term": "word/phrase", "explanation": "meaning"}] or []
}

Guidelines:
- Translations should sound natural, not word-for-word
- Preserve emoji and formatting
- Cultural hints: only include if genuinely helpful for understanding
- Slang explanations: only for terms a non-native speaker wouldn't know
- Empty arrays if no hints/slang detected

Cultural Context Analysis:
Analyze the message for cultural context that might be misunderstood:
- Formality levels (formal vs casual greetings, honorifics)
- Regional language variations (UK vs US English, Latin American vs Spain Spanish)
- Cultural practices embedded in language (religious phrases, politeness customs)
- Date/time format differences
- Gesture or emoji meanings that vary by culture

Only include hints that are genuinely helpful. If the message is straightforward with no cultural nuances, return empty array.

Formality Analysis:
Analyze the formality level of the original message:
- Formal language (honorifics, polite forms, business tone)
- Casual language (contractions, slang, friendly tone)
- Professional vs personal context

Preserve this formality level in the translation. If translating casual Spanish to English, use casual English. If translating formal Japanese to English, use formal English.

Slang/Idiom Detection:
Identify slang, idioms, colloquialisms, and culture-specific expressions:
- Modern slang (internet slang, Gen-Z terms, regional slang)
- Traditional idioms (metaphorical expressions)
- Colloquialisms (informal everyday phrases)
- Cultural references

For each detected term:
{
  "term": "the slang/idiom",
  "explanation": "clear, concise explanation of meaning"
}

Only include terms that a non-native speaker might not understand. Don't explain common words.`;

// Check rate limit for a user
export const checkRateLimit = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const windowStart = now - (now % RATE_LIMIT_WINDOW_MS);

    const rateLimit = await ctx.db
      .query("rateLimits")
      .withIndex("by_user_feature", (q) =>
        q.eq("userId", args.userId).eq("feature", "translation"),
      )
      .first();

    if (!rateLimit) {
      return { allowed: true, remaining: TRANSLATION_RATE_LIMIT };
    }

    // If window has expired, reset count
    if (rateLimit.windowStart < windowStart) {
      return { allowed: true, remaining: TRANSLATION_RATE_LIMIT };
    }

    // Check if limit exceeded
    if (rateLimit.count >= TRANSLATION_RATE_LIMIT) {
      return { allowed: false, remaining: 0 };
    }

    return {
      allowed: true,
      remaining: TRANSLATION_RATE_LIMIT - rateLimit.count,
    };
  },
});

// Increment rate limit counter
export const incrementRateLimit = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const windowStart = now - (now % RATE_LIMIT_WINDOW_MS);

    const rateLimit = await ctx.db
      .query("rateLimits")
      .withIndex("by_user_feature", (q) =>
        q.eq("userId", args.userId).eq("feature", "translation"),
      )
      .first();

    if (!rateLimit || rateLimit.windowStart < windowStart) {
      // Create new rate limit entry or reset if window expired
      if (rateLimit) {
        await ctx.db.patch(rateLimit._id, {
          count: 1,
          windowStart,
        });
      } else {
        await ctx.db.insert("rateLimits", {
          userId: args.userId,
          feature: "translation",
          count: 1,
          windowStart,
        });
      }
    } else {
      // Increment existing counter
      await ctx.db.patch(rateLimit._id, {
        count: rateLimit.count + 1,
      });
    }
  },
});

// Translate a message using Anthropic Claude
export const translateMessage = action({
  args: {
    messageId: v.id("messages"),
    targetLanguage: v.string(),
    userId: v.string(), // clerkId for rate limiting
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    translation: string;
    detectedLanguage: string;
    culturalHints: string[];
    slangExplanations: { term: string; explanation: string }[];
  } | null> => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    // Check if translation already exists in cache
    const cached = await ctx.runQuery(api.translations.getTranslation, {
      messageId: args.messageId,
      targetLanguage: args.targetLanguage,
    });

    if (cached) {
      return {
        translation: cached.translatedText,
        detectedLanguage: cached.detectedSourceLanguage,
        culturalHints: cached.culturalHints,
        slangExplanations: cached.slangExplanations,
      };
    }

    // Check rate limit (only if not cached)
    const rateLimitCheck = await ctx.runQuery(api.translations.checkRateLimit, {
      userId: args.userId,
    });

    if (!rateLimitCheck.allowed) {
      throw new Error(
        "Translation rate limit exceeded. Please try again later.",
      );
    }

    // Fetch the message to translate
    const message: Doc<"messages"> | null = await ctx.runQuery(
      api.messages.getMessage,
      {
        messageId: args.messageId,
      },
    );

    if (!message) {
      return null;
    }

    try {
      const anthropic = new Anthropic({ apiKey });

      const response = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1000,
        system: TRANSLATION_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Translate this message to ${args.targetLanguage}:\n\n${message.content}`,
          },
        ],
      });

      // Parse the response
      const content = response.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response type from Claude");
      }

      // Extract JSON from the response (handle markdown code blocks and extra text)
      let jsonText = content.text.trim();

      // Remove markdown code blocks if present
      if (jsonText.startsWith("```")) {
        const jsonMatch = jsonText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
          jsonText = jsonMatch[1].trim();
        }
      }

      // Extract only the JSON object (remove any text after the closing brace)
      // Find the first { and the matching closing }
      const firstBrace = jsonText.indexOf("{");
      if (firstBrace !== -1) {
        let braceCount = 0;
        let endIndex = firstBrace;

        for (let i = firstBrace; i < jsonText.length; i++) {
          if (jsonText[i] === "{") braceCount++;
          if (jsonText[i] === "}") braceCount--;

          if (braceCount === 0) {
            endIndex = i + 1;
            break;
          }
        }

        jsonText = jsonText.substring(firstBrace, endIndex);
      }

      console.log("Raw Claude response:", content.text);
      console.log("Extracted JSON text:", jsonText);

      const result = JSON.parse(jsonText);

      if (
        !result.translation ||
        !result.detectedLanguage ||
        !Array.isArray(result.culturalHints) ||
        !Array.isArray(result.slangExplanations)
      ) {
        throw new Error("Invalid translation format from Claude");
      }

      // Save translation to cache
      await ctx.runMutation(api.translations.saveTranslation, {
        messageId: args.messageId,
        targetLanguage: args.targetLanguage,
        translatedText: result.translation,
        detectedSourceLanguage: result.detectedLanguage,
        culturalHints: result.culturalHints,
        slangExplanations: result.slangExplanations,
      });

      // Increment rate limit counter
      await ctx.runMutation(api.translations.incrementRateLimit, {
        userId: args.userId,
      });

      return {
        translation: result.translation,
        detectedLanguage: result.detectedLanguage,
        culturalHints: result.culturalHints,
        slangExplanations: result.slangExplanations,
      };
    } catch (error) {
      console.error("Error translating message:", error);
      return null;
    }
  },
});

// Batch translate a message to all 10 supported languages at once
export const batchTranslateMessage = internalAction({
  args: {
    messageId: v.id("messages"),
    messageContent: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ detectedLanguage: string; translationCount: number }> => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    try {
      const anthropic = new Anthropic({ apiKey });

      const response = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 8000, // Increased for all 10 languages
        system: BATCH_TRANSLATION_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Translate this message to ALL 10 languages (English, Spanish, French, German, Chinese, Japanese, Arabic, Hindi, Portuguese, Russian):\n\n${args.messageContent}`,
          },
        ],
      });

      // Parse the response
      const content = response.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response type from Claude");
      }

      // Extract JSON from the response
      let jsonText = content.text.trim();

      // Remove markdown code blocks if present
      if (jsonText.startsWith("```")) {
        const jsonMatch = jsonText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
          jsonText = jsonMatch[1].trim();
        }
      }

      // Extract only the JSON object
      const firstBrace = jsonText.indexOf("{");
      if (firstBrace !== -1) {
        let braceCount = 0;
        let endIndex = firstBrace;

        for (let i = firstBrace; i < jsonText.length; i++) {
          if (jsonText[i] === "{") braceCount++;
          if (jsonText[i] === "}") braceCount--;

          if (braceCount === 0) {
            endIndex = i + 1;
            break;
          }
        }

        jsonText = jsonText.substring(firstBrace, endIndex);
      }

      console.log("Batch translation raw response:", content.text);
      console.log("Extracted JSON:", jsonText);

      const result = JSON.parse(jsonText);

      // Validate response structure
      if (
        !result.detectedSourceLanguage ||
        !result.translations ||
        typeof result.translations !== "object"
      ) {
        throw new Error("Invalid batch translation format from Claude");
      }

      const detectedLanguage = result.detectedSourceLanguage;
      let translationCount = 0;

      // Save each translation to database
      for (const lang of BATCH_TRANSLATION_LANGUAGES) {
        const translation = result.translations[lang];

        if (!translation || !translation.text) {
          console.warn(`Missing translation for ${lang}`);
          continue;
        }

        await ctx.runMutation(api.translations.saveTranslation, {
          messageId: args.messageId,
          targetLanguage: lang,
          translatedText: translation.text,
          detectedSourceLanguage: detectedLanguage,
          culturalHints: translation.culturalHints || [],
          slangExplanations: translation.slangExplanations || [],
          formality: translation.formality || "neutral",
        });

        translationCount++;
      }

      console.log(
        `Batch translated to ${translationCount} languages. Detected: ${detectedLanguage}`,
      );

      // Update the message with the detected language
      await ctx.runMutation(api.translations.updateMessageLanguage, {
        messageId: args.messageId,
        detectedLanguage,
      });

      return { detectedLanguage, translationCount };
    } catch (error) {
      console.error("Error in batch translation:", error);
      throw error;
    }
  },
});

// Update message with detected language
export const updateMessageLanguage = mutation({
  args: {
    messageId: v.id("messages"),
    detectedLanguage: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      detectedSourceLanguage: args.detectedLanguage,
    });
  },
});

// Save translation to database
export const saveTranslation = mutation({
  args: {
    messageId: v.id("messages"),
    targetLanguage: v.string(),
    translatedText: v.string(),
    detectedSourceLanguage: v.string(),
    culturalHints: v.array(v.string()),
    slangExplanations: v.array(
      v.object({
        term: v.string(),
        explanation: v.string(),
      }),
    ),
    formality: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if translation already exists
    const existing = await ctx.db
      .query("messageTranslations")
      .withIndex("by_message_language", (q) =>
        q
          .eq("messageId", args.messageId)
          .eq("targetLanguage", args.targetLanguage),
      )
      .first();

    if (existing) {
      // Update existing translation
      await ctx.db.patch(existing._id, {
        translatedText: args.translatedText,
        detectedSourceLanguage: args.detectedSourceLanguage,
        culturalHints: args.culturalHints,
        slangExplanations: args.slangExplanations,
        formality: args.formality,
        generatedAt: Date.now(),
      });
    } else {
      // Create new translation
      await ctx.db.insert("messageTranslations", {
        messageId: args.messageId,
        targetLanguage: args.targetLanguage,
        translatedText: args.translatedText,
        detectedSourceLanguage: args.detectedSourceLanguage,
        culturalHints: args.culturalHints,
        slangExplanations: args.slangExplanations,
        formality: args.formality,
        generatedAt: Date.now(),
      });
    }
  },
});

// Get cached translation for a message
export const getTranslation = query({
  args: {
    messageId: v.id("messages"),
    targetLanguage: v.string(),
  },
  handler: async (ctx, args) => {
    const translation = await ctx.db
      .query("messageTranslations")
      .withIndex("by_message_language", (q) =>
        q
          .eq("messageId", args.messageId)
          .eq("targetLanguage", args.targetLanguage),
      )
      .first();

    return translation;
  },
});

// Clear translation cache for a message (if user wants to re-translate)
export const clearTranslation = mutation({
  args: {
    messageId: v.id("messages"),
    targetLanguage: v.string(),
  },
  handler: async (ctx, args) => {
    const translation = await ctx.db
      .query("messageTranslations")
      .withIndex("by_message_language", (q) =>
        q
          .eq("messageId", args.messageId)
          .eq("targetLanguage", args.targetLanguage),
      )
      .first();

    if (translation) {
      await ctx.db.delete(translation._id);
    }
  },
});

// Auto-translate a new message for all recipients based on their language preferences
export const autoTranslateForRecipients = internalAction({
  args: {
    messageId: v.id("messages"),
    conversationId: v.id("conversations"),
    senderId: v.string(), // clerkId of sender
  },
  handler: async (ctx, args) => {
    // Get conversation to find participants
    const conversation = await ctx.runQuery(api.conversations.getConversation, {
      conversationId: args.conversationId,
    });

    if (!conversation) {
      console.error("Conversation not found");
      return { translatedCount: 0 };
    }

    let translatedCount = 0;

    // For each participant (except sender), translate to their preferred language
    for (const participantId of conversation.participants) {
      // Skip the sender
      if (participantId === args.senderId) continue;

      // Get participant's user data to check preferred language
      const participantUser = await ctx.runQuery(api.users.getCurrentUser, {
        clerkId: participantId,
      });

      if (!participantUser || !participantUser.preferredLanguage) continue;

      try {
        // Check if translation already exists
        const existing = await ctx.runQuery(api.translations.getTranslation, {
          messageId: args.messageId,
          targetLanguage: participantUser.preferredLanguage,
        });

        // Only translate if not already translated
        if (!existing) {
          await ctx.runAction(api.translations.translateMessage, {
            messageId: args.messageId,
            targetLanguage: participantUser.preferredLanguage,
            userId: participantId,
          });
          translatedCount++;
        }
      } catch (error) {
        console.error(
          `Failed to translate for participant ${participantId}:`,
          error,
        );
        // Continue with next participant
      }
    }

    return { translatedCount };
  },
});

// Batch translate recent messages when user changes language preference
export const batchTranslateRecentMessages = action({
  args: {
    userId: v.string(), // clerkId
    targetLanguage: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ translatedCount: number; conversationCount: number }> => {
    // Get all conversations for this user
    const conversations = await ctx.runQuery(
      api.conversations.getUserConversations,
      {
        clerkId: args.userId,
      },
    );

    if (!conversations || conversations.length === 0) {
      return { translatedCount: 0, conversationCount: 0 };
    }

    let totalTranslated = 0;

    // Process each conversation
    for (const conversation of conversations) {
      // Get last 10 messages from this conversation
      const messages = await ctx.runQuery(api.messages.getMessages, {
        conversationId: conversation._id,
        limit: 10,
      });

      // Filter out messages sent by the user (they wrote it in their language)
      // and messages already translated to target language
      const messagesToTranslate = [];

      for (const message of messages) {
        // Skip user's own messages
        if (message.senderId === args.userId) continue;

        // Skip empty messages
        if (!message.content.trim()) continue;

        // Check if translation already exists
        const existing = await ctx.runQuery(api.translations.getTranslation, {
          messageId: message._id,
          targetLanguage: args.targetLanguage,
        });

        if (!existing) {
          messagesToTranslate.push(message);
        }
      }

      // Translate each message
      for (const message of messagesToTranslate) {
        try {
          await ctx.runAction(api.translations.translateMessage, {
            messageId: message._id,
            targetLanguage: args.targetLanguage,
            userId: args.userId,
          });
          totalTranslated++;
        } catch (error) {
          console.error(`Failed to translate message ${message._id}:`, error);
          // Continue with next message even if one fails
        }
      }
    }

    return {
      translatedCount: totalTranslated,
      conversationCount: conversations.length,
    };
  },
});
