import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are the International Communicator - an AI assistant that helps users craft culturally aware and contextually appropriate message responses.

Your role:
- Analyze the conversation context and relationship dynamics
- Generate 3 smart reply suggestions that are culturally sensitive
- **MATCH THE FORMALITY LEVEL** of the conversation (formal, casual, or neutral)
- **GENERATE REPLIES IN THE USER'S TARGET LANGUAGE** (specified in the user message)
- Consider communication styles and relationship between participants
- Use detected formality and cultural hints from recent messages

Guidelines:
- Keep suggestions concise (under 15 words each)
- Offer variety in tone while MAINTAINING the conversation's formality level
- If conversation is formal, use formal language (no contractions, polite phrasing)
- If conversation is casual, use casual language (contractions OK, friendly tone)
- Respect cultural communication differences
- Never be overly familiar or presumptuous
- When uncertain about cultural context, default to respectful neutrality
- **CRITICAL: Always generate suggestions in the TARGET LANGUAGE specified, NOT in English (unless English is the target language)**

Output format: Return ONLY a JSON array of exactly 3 string suggestions in the target language, no explanation or additional text.
Example (casual English): ["Thanks for letting me know!", "Sounds good to me", "I appreciate that"]
Example (formal English): ["Thank you for informing me.", "That sounds acceptable.", "I appreciate your consideration."]
Example (casual German): ["Danke für die Info!", "Klingt gut", "Das freut mich"]
Example (formal German): ["Vielen Dank für die Information.", "Das klingt akzeptabel.", "Ich schätze Ihre Rücksicht."]`;

// Generate smart reply suggestions using Anthropic Claude
export const generateSmartReplies = action({
  args: {
    conversationId: v.id("conversations"),
    currentUserId: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    suggestions: string[];
    lastMessageId: Id<"messages">;
  } | null> => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    // Fetch last 20 messages for context
    const messages: Doc<"messages">[] | null = await ctx.runQuery(
      api.messages.getMessages,
      {
        conversationId: args.conversationId,
        limit: 20,
      },
    );

    if (!messages || messages.length === 0) {
      return null;
    }

    const lastMessage: Doc<"messages"> = messages[messages.length - 1];

    // Don't generate suggestions for messages sent by current user
    if (lastMessage.senderId === args.currentUserId) {
      return null;
    }

    // Get current user's preferred language to fetch relevant translations
    const currentUser = await ctx.runQuery(api.users.getCurrentUser, {
      clerkId: args.currentUserId,
    });
    const preferredLanguage = currentUser?.preferredLanguage || "English";

    // Fetch translation data for recent messages to determine formality
    const translationDataPromises = messages.map(async (msg) => {
      if (typeof msg._id === "string") return null;

      const translation = await ctx.runQuery(api.translations.getTranslation, {
        messageId: msg._id,
        targetLanguage: preferredLanguage,
      });
      return translation;
    });

    const translationData = await Promise.all(translationDataPromises);

    // Determine overall formality level from recent messages
    const formalityLevels = translationData
      .filter(
        (t): t is NonNullable<typeof t> =>
          t !== null && t.formality !== undefined,
      )
      .map((t) => t.formality as string);

    const dominantFormality =
      formalityLevels.length > 0
        ? formalityLevels[formalityLevels.length - 1] // Use most recent
        : "neutral";

    // Build conversation context for the AI (use translations if available)
    const conversationContextPromises = messages.map(
      async (msg: Doc<"messages">, idx) => {
        const sender = msg.senderId === args.currentUserId ? "You" : "Other";

        // Get translated version if available for this message
        const translatedData = translationData[idx];
        const messageText = translatedData?.translatedText || msg.content;

        return `${sender}: ${messageText}`;
      },
    );

    const conversationContextArray = await Promise.all(
      conversationContextPromises,
    );
    const conversationContext = conversationContextArray.join("\n");

    try {
      const anthropic = new Anthropic({ apiKey });

      const response = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 200,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Based on this conversation, generate 3 contextually appropriate reply suggestions.

DETECTED FORMALITY LEVEL: ${dominantFormality}
TARGET LANGUAGE: ${preferredLanguage}

IMPORTANT:
1. Match the formality level in your suggestions!
2. Generate ALL suggestions in ${preferredLanguage} (not English, unless ${preferredLanguage} is English)
3. Keep suggestions natural and conversational in ${preferredLanguage}

Conversation:
${conversationContext}`,
          },
        ],
      });

      // Parse the response
      const content = response.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response type from Claude");
      }

      const suggestions = JSON.parse(content.text);

      if (!Array.isArray(suggestions) || suggestions.length !== 3) {
        throw new Error("Invalid suggestions format from Claude");
      }

      // Save suggestions to database
      await ctx.runMutation(api.smartReplies.saveSmartReplies, {
        conversationId: args.conversationId,
        lastMessageId: lastMessage._id,
        suggestions,
      });

      return {
        suggestions,
        lastMessageId: lastMessage._id,
      };
    } catch (error) {
      console.error("Error generating smart replies:", error);
      return null;
    }
  },
});

// Save smart replies to database
export const saveSmartReplies = mutation({
  args: {
    conversationId: v.id("conversations"),
    lastMessageId: v.id("messages"),
    suggestions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if suggestions already exist for this message
    const existing = await ctx.db
      .query("smartReplies")
      .withIndex("by_conversation_message", (q) =>
        q
          .eq("conversationId", args.conversationId)
          .eq("lastMessageId", args.lastMessageId),
      )
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        suggestions: args.suggestions,
        generatedAt: Date.now(),
      });
    } else {
      // Create new
      await ctx.db.insert("smartReplies", {
        conversationId: args.conversationId,
        lastMessageId: args.lastMessageId,
        suggestions: args.suggestions,
        generatedAt: Date.now(),
      });
    }
  },
});

// Get smart replies for a conversation
export const getSmartReplies = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    // Get the latest message in the conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("desc")
      .take(1);

    if (messages.length === 0) {
      return null;
    }

    const latestMessage = messages[0];

    // Get smart replies for this message
    const smartReply = await ctx.db
      .query("smartReplies")
      .withIndex("by_conversation_message", (q) =>
        q
          .eq("conversationId", args.conversationId)
          .eq("lastMessageId", latestMessage._id),
      )
      .first();

    return smartReply;
  },
});

// Clear smart replies for a conversation (when user sends a message)
export const clearSmartReplies = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const smartReplies = await ctx.db
      .query("smartReplies")
      .withIndex("by_conversation_message", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    await Promise.all(smartReplies.map((reply) => ctx.db.delete(reply._id)));
  },
});
