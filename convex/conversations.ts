import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create or get existing conversation
export const createOrGetConversation = mutation({
  args: {
    participants: v.array(v.string()), // clerkIds
    type: v.union(v.literal("direct"), v.literal("group")),
  },
  handler: async (ctx, args) => {
    // For direct chats, check if conversation already exists
    if (args.type === "direct" && args.participants.length === 2) {
      const existing = await ctx.db
        .query("conversations")
        .filter((q) =>
          q.and(
            q.eq(q.field("type"), "direct"),
            q.eq(q.field("participants").length(), 2)
          )
        )
        .collect();

      const found = existing.find((conv) => {
        return (
          conv.participants.includes(args.participants[0]) &&
          conv.participants.includes(args.participants[1])
        );
      });

      if (found) return found._id;
    }

    // Create new conversation
    return await ctx.db.insert("conversations", {
      participants: args.participants,
      type: args.type,
      lastMessageAt: Date.now(),
      createdAt: Date.now(),
    });
  },
});

// Get user's conversations
export const getUserConversations = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const allConversations = await ctx.db.query("conversations").collect();
    
    // Filter conversations where user is a participant
    const userConversations = allConversations.filter((conv) =>
      conv.participants.includes(args.clerkId)
    );

    // Sort by last message time
    return userConversations.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  },
});

// Get conversation by ID
export const getConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId);
  },
});

// Get conversation participants' details
export const getConversationParticipants = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return [];

    const participants = await Promise.all(
      conversation.participants.map(async (clerkId) => {
        return await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
          .first();
      })
    );

    return participants.filter((p) => p !== null);
  },
});
