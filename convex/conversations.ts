import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper: Calculate if user is online based on lastSeen timestamp
// User is considered online if lastSeen is within 30 seconds
const ONLINE_THRESHOLD_MS = 30 * 1000; // 30 seconds

const isUserOnline = (lastSeen: number): boolean => {
  const now = Date.now();
  const isOnline = now - lastSeen < ONLINE_THRESHOLD_MS;
  return isOnline;
};

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
        .filter((q) => q.eq(q.field("type"), "direct"))
        .collect();

      const found = existing.find((conv) => {
        return (
          conv.participants.length === 2 &&
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

    // Filter conversations where user is a participant AND hasn't deleted it
    const userConversations = allConversations.filter((conv) => {
      const isParticipant = conv.participants.includes(args.clerkId);
      const hasDeleted = conv.deletedBy?.includes(args.clerkId) ?? false;
      return isParticipant && !hasDeleted;
    });

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
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
          .first();

        if (!user) return null;

        // Calculate online status dynamically based on lastSeen
        const isOnline = isUserOnline(user.lastSeen);

        return {
          ...user,
          isOnline, // Override with calculated status
        };
      }),
    );

    const filteredParticipants = participants.filter((p) => p !== null);

    return filteredParticipants;
  },
});

// Soft delete conversation (hide from user's view)
export const softDeleteConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return;

    const deletedBy = conversation.deletedBy ?? [];
    if (!deletedBy.includes(args.userId)) {
      await ctx.db.patch(args.conversationId, {
        deletedBy: [...deletedBy, args.userId],
      });
    }
  },
});
