import { internalAction, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// Migration: Batch translate all existing messages to 10 languages
export const migrateExistingMessages = internalAction({
  args: {
    batchSize: v.optional(v.number()), // How many messages to process per batch (default: 10)
    dryRun: v.optional(v.boolean()), // If true, just counts messages without translating
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    totalMessages: number;
    translated: number;
    failed: number;
    skipped: number;
    dryRun: boolean;
  }> => {
    const batchSize = args.batchSize || 10;
    const dryRun = args.dryRun || false;

    console.log("🚀 Starting migration of existing messages...");
    console.log(`Batch size: ${batchSize}, Dry run: ${dryRun}`);

    // Get all messages that need migration
    const messagesToMigrate: Array<{
      _id: any;
      content: string;
    }> = await ctx.runQuery(internal.migrations.getMessagesNeedingMigration);

    console.log(`📊 Found ${messagesToMigrate.length} messages to migrate`);

    if (dryRun) {
      console.log("✅ Dry run complete. No translations performed.");
      return {
        totalMessages: messagesToMigrate.length,
        translated: 0,
        failed: 0,
        skipped: 0,
        dryRun: true,
      };
    }

    let translated = 0;
    let failed = 0;
    let skipped = 0;

    // Process in batches to avoid overwhelming the system
    for (let i = 0; i < messagesToMigrate.length; i += batchSize) {
      const batch = messagesToMigrate.slice(i, i + batchSize);

      console.log(
        `\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(messagesToMigrate.length / batchSize)}`,
      );

      for (const message of batch) {
        try {
          // Skip empty messages
          if (!message.content || !message.content.trim()) {
            console.log(`⏭️  Skipping empty message ${message._id}`);
            skipped++;
            continue;
          }

          console.log(
            `🌐 Translating message ${message._id}: "${message.content.substring(0, 50)}..."`,
          );

          // Run batch translation
          await ctx.runAction(internal.translations.batchTranslateMessage, {
            messageId: message._id,
            messageContent: message.content,
          });

          translated++;
          console.log(`✅ Successfully translated message ${message._id}`);
        } catch (error) {
          failed++;
          console.error(
            `❌ Failed to translate message ${message._id}:`,
            error,
          );
          // Continue with next message even if one fails
        }
      }

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < messagesToMigrate.length) {
        console.log("⏸️  Pausing 2 seconds before next batch...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    const summary = {
      totalMessages: messagesToMigrate.length,
      translated,
      failed,
      skipped,
      dryRun: false,
    };

    console.log("\n🎉 Migration complete!");
    console.log("📊 Summary:", JSON.stringify(summary, null, 2));

    return summary;
  },
});

// Get all messages that need migration (no detectedSourceLanguage)
export const getMessagesNeedingMigration = internalQuery({
  handler: async (ctx) => {
    const allMessages = await ctx.db.query("messages").collect();

    // Filter messages that don't have detectedSourceLanguage or have empty content
    const needsMigration = allMessages.filter(
      (msg) => !msg.detectedSourceLanguage && msg.content && msg.content.trim(),
    );

    return needsMigration;
  },
});

// Helper: Get migration progress/stats (public query for HTTP endpoint)
export const getMigrationStats = query({
  handler: async (ctx) => {
    const allMessages = await ctx.db.query("messages").collect();

    const total = allMessages.length;
    const migrated = allMessages.filter(
      (msg) => msg.detectedSourceLanguage,
    ).length;
    const needsMigration = allMessages.filter(
      (msg) => !msg.detectedSourceLanguage && msg.content && msg.content.trim(),
    ).length;
    const emptyMessages = allMessages.filter(
      (msg) => !msg.content || !msg.content.trim(),
    ).length;

    return {
      total,
      migrated,
      needsMigration,
      emptyMessages,
      percentComplete: total > 0 ? Math.round((migrated / total) * 100) : 100,
    };
  },
});
