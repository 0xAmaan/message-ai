import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import Anthropic from "@anthropic-ai/sdk";

// Rate limit: 50 translations per user per hour
const TRANSLATION_RATE_LIMIT = 50;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

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

      const result = JSON.parse(content.text);

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
