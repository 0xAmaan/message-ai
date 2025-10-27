import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

// Send a message
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.string(),
    content: v.string(),
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    // Create the message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      content: args.content,
      imageId: args.imageId,
      createdAt: Date.now(),
      readBy: [args.senderId], // Sender has read it
      deliveredTo: [args.senderId],
    });

    // Update conversation's last message time and clear deletedBy
    // (restore conversation for users who soft-deleted it)
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: Date.now(),
      deletedBy: [], // Clear deletedBy so conversation reappears
    });

    // Schedule batch translation to all 10 languages in background (non-blocking)
    if (args.content.trim()) {
      await ctx.scheduler.runAfter(
        0,
        internal.translations.batchTranslateMessage,
        {
          messageId,
          messageContent: args.content,
        },
      );
    }

    return messageId;
  },
});

// Get messages for a conversation
export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("desc")
      .take(args.limit ?? 100);

    return messages.reverse(); // Return in chronological order
  },
});

// Get a single message by ID
export const getMessage = query({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.messageId);
  },
});

// Mark message as delivered
export const markAsDelivered = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return;

    if (!message.deliveredTo.includes(args.userId)) {
      await ctx.db.patch(args.messageId, {
        deliveredTo: [...message.deliveredTo, args.userId],
      });
    }
  },
});

// Mark message as read
export const markAsRead = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return;

    const updates: any = {};

    // Add to readBy if not already there
    if (!message.readBy.includes(args.userId)) {
      updates.readBy = [...message.readBy, args.userId];
    }

    // Add to deliveredTo if not already there
    if (!message.deliveredTo.includes(args.userId)) {
      updates.deliveredTo = [...message.deliveredTo, args.userId];
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.messageId, updates);
    }
  },
});

// Mark all messages in a conversation as read
export const markConversationAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    // Mark all unread messages as read
    await Promise.all(
      messages
        .filter((msg) => !msg.readBy.includes(args.userId))
        .map((msg) =>
          ctx.db.patch(msg._id, {
            readBy: [...msg.readBy, args.userId],
            deliveredTo: msg.deliveredTo.includes(args.userId)
              ? msg.deliveredTo
              : [...msg.deliveredTo, args.userId],
          }),
        ),
    );
  },
});

// Generate upload URL for images
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Get image URL
export const getImageUrl = query({
  args: { imageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.imageId);
  },
});

// Check if conversation has unread messages for a user
export const hasUnreadMessages = query({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    // Check if any message is not read by this user (and not sent by them)
    const hasUnread = messages.some(
      (msg) =>
        msg.senderId !== args.userId && !msg.readBy.includes(args.userId),
    );

    return hasUnread;
  },
});

// Mark all messages in multiple conversations as read
export const markMultipleConversationsAsRead = mutation({
  args: {
    conversationIds: v.array(v.id("conversations")),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // For each conversation, mark all messages as read
    for (const conversationId of args.conversationIds) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", conversationId),
        )
        .collect();

      // Mark all messages as read
      await Promise.all(
        messages.map((msg) => {
          const updates: any = {};

          // Add to readBy if not already there
          if (!msg.readBy.includes(args.userId)) {
            updates.readBy = [...msg.readBy, args.userId];
          }

          // Add to deliveredTo if not already there
          if (!msg.deliveredTo.includes(args.userId)) {
            updates.deliveredTo = [...msg.deliveredTo, args.userId];
          }

          if (Object.keys(updates).length > 0) {
            return ctx.db.patch(msg._id, updates);
          }
        }),
      );
    }
  },
});
