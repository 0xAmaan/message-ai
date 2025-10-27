import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - synced from Clerk
  users: defineTable({
    clerkId: v.string(),
    phoneNumber: v.string(),
    name: v.string(),
    profilePicUrl: v.optional(v.string()),
    isOnline: v.boolean(),
    lastSeen: v.number(),
    preferredLanguage: v.optional(v.string()), // User's preferred language for translations (default: "English")
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_phone", ["phoneNumber"]),

  // Conversations - handles both 1-1 and group chats
  conversations: defineTable({
    participants: v.array(v.string()), // array of clerkIds
    type: v.union(v.literal("direct"), v.literal("group")),
    lastMessageAt: v.number(),
    createdAt: v.number(),
    deletedBy: v.optional(v.array(v.string())), // array of clerkIds who soft-deleted this conversation
  }).index("by_participant", ["participants"]),

  // Messages
  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.string(), // clerkId
    content: v.string(),
    imageId: v.optional(v.id("_storage")), // Convex file storage ID
    createdAt: v.number(),
    readBy: v.array(v.string()), // array of clerkIds
    deliveredTo: v.array(v.string()), // array of clerkIds
    detectedSourceLanguage: v.optional(v.string()), // Auto-detected language of original message
  })
    .index("by_conversation", ["conversationId", "createdAt"])
    .index("by_sender", ["senderId"]),

  // Typing indicators (ephemeral data for real-time UX)
  typingIndicators: defineTable({
    conversationId: v.id("conversations"),
    userId: v.string(), // clerkId
    isTyping: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_user_conversation", ["userId", "conversationId"]),

  // Smart replies (AI-generated suggestions)
  smartReplies: defineTable({
    conversationId: v.id("conversations"),
    lastMessageId: v.id("messages"), // Which message triggered this
    userId: v.optional(v.string()), // clerkId of the user these replies are for (optional for migration)
    suggestions: v.array(v.string()), // Array of 3 reply options
    generatedAt: v.number(),
  })
    .index("by_conversation_message", ["conversationId", "lastMessageId"])
    .index("by_user_conversation_message", [
      "userId",
      "conversationId",
      "lastMessageId",
    ]),

  // Message translations (cached AI translations)
  messageTranslations: defineTable({
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
    formality: v.optional(v.string()), // "formal", "casual", or "neutral"
    generatedAt: v.number(),
  }).index("by_message_language", ["messageId", "targetLanguage"]),

  // Rate limiting for AI features (tracks usage per user per hour)
  rateLimits: defineTable({
    userId: v.string(), // clerkId
    feature: v.string(), // "translation" or "smartReplies"
    count: v.number(),
    windowStart: v.number(), // Timestamp of the start of the current hour
  }).index("by_user_feature", ["userId", "feature"]),
});
