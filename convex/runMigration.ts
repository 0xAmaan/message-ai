import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { api } from "./_generated/api";

// HTTP endpoint to run the migration
// Usage: POST to your-convex-url/runMigration?dryRun=true
export const runMigration = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun") === "true";
  const batchSize = parseInt(url.searchParams.get("batchSize") || "10", 10);

  console.log("🔧 Migration endpoint called");
  console.log(`Parameters: dryRun=${dryRun}, batchSize=${batchSize}`);

  try {
    // First, get migration stats
    const stats = await ctx.runQuery(api.migrations.getMigrationStats);

    console.log("📊 Current migration stats:", stats);

    if (stats.needsMigration === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No messages need migration!",
          stats,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Run the migration
    const result = await ctx.runAction(
      internal.migrations.migrateExistingMessages,
      {
        batchSize,
        dryRun,
      },
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: dryRun
          ? "Dry run completed successfully"
          : "Migration completed successfully",
        result,
        beforeStats: stats,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("❌ Migration failed:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});

// HTTP endpoint to check migration stats
// Usage: GET to your-convex-url/migrationStats
export const migrationStats = httpAction(async (ctx) => {
  try {
    const stats = await ctx.runQuery(api.migrations.getMigrationStats);

    return new Response(
      JSON.stringify({
        success: true,
        stats,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("❌ Failed to get stats:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
