import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

// Helper: Calculate if user is online based on lastSeen timestamp
// User is considered online if lastSeen is within 30 seconds
const ONLINE_THRESHOLD_MS = 30 * 1000; // 30 seconds

const isUserOnline = (lastSeen: number): boolean => {
  const now = Date.now();
  const isOnline = now - lastSeen < ONLINE_THRESHOLD_MS;
  return isOnline;
};

// Create or update user from Clerk webhook (internal - called by webhook)
export const upsertFromClerkInternal = internalMutation({
  args: {
    clerkId: v.string(),
    phoneNumber: v.string(),
    name: v.optional(v.string()),
    profilePicUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        phoneNumber: args.phoneNumber,
        name: args.name ?? existingUser.name,
        profilePicUrl: args.profilePicUrl ?? existingUser.profilePicUrl,
        lastSeen: Date.now(),
      });
      return existingUser._id;
    } else {
      // Create new user
      return await ctx.db.insert("users", {
        clerkId: args.clerkId,
        phoneNumber: args.phoneNumber,
        name: args.name ?? "User",
        profilePicUrl: args.profilePicUrl,
        isOnline: true,
        lastSeen: Date.now(),
        preferredLanguage: "English", // Default language
      });
    }
  },
});

// Create or update user (public - called from client)
export const upsertFromClerk = mutation({
  args: {
    clerkId: v.string(),
    phoneNumber: v.string(),
    name: v.optional(v.string()),
    profilePicUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        phoneNumber: args.phoneNumber,
        name: args.name ?? existingUser.name,
        profilePicUrl: args.profilePicUrl ?? existingUser.profilePicUrl,
        lastSeen: Date.now(),
      });
      return existingUser._id;
    } else {
      // Create new user
      return await ctx.db.insert("users", {
        clerkId: args.clerkId,
        phoneNumber: args.phoneNumber,
        name: args.name ?? "User",
        profilePicUrl: args.profilePicUrl,
        isOnline: true,
        lastSeen: Date.now(),
        preferredLanguage: "English", // Default language
      });
    }
  },
});

// Get current user
export const getCurrentUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) return null;

    // Calculate online status dynamically
    return {
      ...user,
      isOnline: isUserOnline(user.lastSeen),
    };
  },
});

// Search users by phone number
export const findByPhone = query({
  args: { phoneNumber: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phoneNumber", args.phoneNumber))
      .first();

    if (!user) return null;

    // Calculate online status dynamically
    return {
      ...user,
      isOnline: isUserOnline(user.lastSeen),
    };
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    clerkId: v.string(),
    name: v.optional(v.string()),
    profilePicUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      name: args.name ?? user.name,
      profilePicUrl: args.profilePicUrl ?? user.profilePicUrl,
    });
  },
});

// Update online status (legacy - keeping for backward compatibility)
export const updateOnlineStatus = mutation({
  args: {
    clerkId: v.string(),
    isOnline: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      isOnline: args.isOnline,
      lastSeen: Date.now(),
    });
  },
});

// Heartbeat - updates lastSeen timestamp (called every 15 seconds)
export const heartbeat = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      lastSeen: Date.now(),
      isOnline: true, // Set to true when heartbeat is received
    });
  },
});

// Get all users (for contact list)
export const listUsers = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();

    // Calculate online status dynamically for each user
    return users.map((user) => ({
      ...user,
      isOnline: isUserOnline(user.lastSeen),
    }));
  },
});

// Update user's preferred language for translations
export const updatePreferredLanguage = mutation({
  args: {
    clerkId: v.string(),
    preferredLanguage: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      preferredLanguage: args.preferredLanguage,
    });

    return user._id;
  },
});

// Generate upload URL for profile picture
export const generateProfilePicUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Get profile picture URL from storage ID
export const getProfilePicUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Update profile picture
export const updateProfilePicture = mutation({
  args: {
    clerkId: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    // Get the URL for the uploaded image
    const imageUrl = await ctx.storage.getUrl(args.storageId);

    if (!imageUrl) throw new Error("Failed to get image URL");

    await ctx.db.patch(user._id, {
      profilePicUrl: imageUrl,
    });

    return imageUrl;
  },
});
