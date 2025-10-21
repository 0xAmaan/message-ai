import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Update typing status
export const updateTypingStatus = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check if typing indicator exists
    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", args.userId).eq("conversationId", args.conversationId)
      )
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        isTyping: args.isTyping,
        updatedAt: Date.now(),
      });
    } else {
      // Create new
      await ctx.db.insert("typingIndicators", {
        conversationId: args.conversationId,
        userId: args.userId,
        isTyping: args.isTyping,
        updatedAt: Date.now(),
      });
    }
  },
});

// Get typing users for a conversation (excluding current user)
export const getTypingUsers = query({
  args: {
    conversationId: v.id("conversations"),
    currentUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const indicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    // Filter for active typing indicators (last 5 seconds) and exclude current user
    const now = Date.now();
    const activeTyping = indicators.filter(
      (ind) =>
        ind.isTyping &&
        ind.userId !== args.currentUserId &&
        now - ind.updatedAt < 5000 // 5 seconds timeout
    );

    // Get user details for those typing
    const typingUsers = await Promise.all(
      activeTyping.map(async (ind) => {
        return await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", ind.userId))
          .first();
      })
    );

    return typingUsers.filter((u) => u !== null);
  },
});
