#!/usr/bin/env bun

/**
 * Migration script to batch-translate all existing messages
 *
 * Usage:
 *   bun scripts/migrate-messages.ts                    # Run migration
 *   bun scripts/migrate-messages.ts --dry-run          # Check what would be migrated
 *   bun scripts/migrate-messages.ts --batch-size 20    # Process 20 messages at a time
 *   bun scripts/migrate-messages.ts --stats            # Just show stats
 */

const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ Error: EXPO_PUBLIC_CONVEX_URL not found in environment");
  console.error(
    "Make sure you have .env.local configured with your Convex URL",
  );
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const showStatsOnly = args.includes("--stats");
const batchSizeArg = args.find((arg) => arg.startsWith("--batch-size"));
const batchSize = batchSizeArg ? parseInt(batchSizeArg.split("=")[1]) : 10;

const siteUrl = CONVEX_URL.replace("/api", "");

console.log("🚀 Message Migration Script");
console.log("============================\n");
console.log(`Convex URL: ${siteUrl}`);
console.log(`Mode: ${isDryRun ? "DRY RUN (no changes)" : "LIVE MIGRATION"}`);
console.log(`Batch size: ${batchSize}\n`);

async function getStats() {
  try {
    const response = await fetch(`${siteUrl}/migrationStats`);

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);

    const text = await response.text();
    console.log("Response body:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("❌ Failed to parse JSON response");
      console.error("Raw response:", text);
      throw new Error("Invalid JSON response from server");
    }

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch stats");
    }

    return data.stats;
  } catch (error) {
    console.error("❌ Failed to fetch migration stats:", error);
    process.exit(1);
  }
}

async function runMigration() {
  try {
    const url = `${siteUrl}/runMigration?dryRun=${isDryRun}&batchSize=${batchSize}`;

    console.log("📊 Fetching current stats...\n");
    const beforeStats = await getStats();

    console.log("Current database state:");
    console.log(`  Total messages: ${beforeStats.total}`);
    console.log(`  Already migrated: ${beforeStats.migrated}`);
    console.log(`  Need migration: ${beforeStats.needsMigration}`);
    console.log(`  Empty messages: ${beforeStats.emptyMessages}`);
    console.log(`  Progress: ${beforeStats.percentComplete}%\n`);

    if (beforeStats.needsMigration === 0) {
      console.log("✅ All messages are already migrated!");
      process.exit(0);
    }

    if (showStatsOnly) {
      process.exit(0);
    }

    const estimatedCost = beforeStats.needsMigration * 0.003;
    console.log(`💰 Estimated cost: $${estimatedCost.toFixed(2)}\n`);

    if (isDryRun) {
      console.log(
        "🧪 Running in DRY RUN mode - no actual translations will occur\n",
      );
    } else {
      console.log(
        "⚠️  WARNING: This will translate all messages and incur API costs!",
      );
      console.log("⚠️  Press Ctrl+C within 5 seconds to cancel...\n");
      await new Promise((resolve) => setTimeout(resolve, 5000));
      console.log("🏃 Starting migration...\n");
    }

    const response = await fetch(url, { method: "POST" });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Migration failed");
    }

    console.log("\n✅ Migration complete!");
    console.log("============================\n");
    console.log("Results:");
    console.log(`  Total processed: ${data.result.totalMessages}`);
    console.log(`  Successfully translated: ${data.result.translated}`);
    console.log(`  Failed: ${data.result.failed}`);
    console.log(`  Skipped (empty): ${data.result.skipped}\n`);

    if (!isDryRun && data.result.translated > 0) {
      const actualCost = data.result.translated * 0.003;
      console.log(`💰 Approximate cost: $${actualCost.toFixed(2)}\n`);
    }
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

// Show stats only if requested
if (showStatsOnly) {
  getStats().then((stats) => {
    console.log("Current database state:");
    console.log(`  Total messages: ${stats.total}`);
    console.log(`  Already migrated: ${stats.migrated}`);
    console.log(`  Need migration: ${stats.needsMigration}`);
    console.log(`  Empty messages: ${stats.emptyMessages}`);
    console.log(`  Progress: ${stats.percentComplete}%\n`);
    process.exit(0);
  });
} else {
  runMigration();
}
