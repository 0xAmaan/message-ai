import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are the International Communicator - an AI assistant that helps users craft culturally aware and contextually appropriate message responses.

Your role:
- Analyze the conversation context and relationship dynamics
- Generate 3 smart reply suggestions that are culturally sensitive
- Adapt tone based on conversation formality and context
- Consider communication styles and relationship between participants

Guidelines:
- Keep suggestions concise (under 15 words each)
- Offer variety in tone (friendly, professional, empathetic)
- Respect cultural communication differences
- Never be overly familiar or presumptuous
- When uncertain about cultural context, default to respectful neutrality

Output format: Return ONLY a JSON array of exactly 3 string suggestions, no explanation or additional text.
Example: ["Thanks for letting me know!", "Sounds good to me", "I appreciate that"]`;

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

    // Build conversation context for the AI
    const conversationContext = messages
      .map((msg: Doc<"messages">) => {
        const sender = msg.senderId === args.currentUserId ? "You" : "Other";
        return `${sender}: ${msg.content}`;
      })
      .join("\n");

    try {
      const anthropic = new Anthropic({ apiKey });

      const response = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 200,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Based on this conversation, generate 3 contextually appropriate reply suggestions:\n\n${conversationContext}`,
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
