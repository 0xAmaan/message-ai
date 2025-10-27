# Message Translation Migration Guide

This guide will help you migrate all existing messages to have batch translations in all 10 supported languages.

## What This Migration Does

The migration will:
1. ✅ Find all messages without `detectedSourceLanguage`
2. ✅ Batch-translate each message to all 10 languages
3. ✅ Save translations with formality data to the database
4. ✅ Update each message with its detected source language

**Result:** Seamless language switching for all messages (old and new)!

---

## Prerequisites

- Convex dev server must be running (`bun run convex-dev`)
- `.env.local` file must have `EXPO_PUBLIC_CONVEX_URL` set
- `ANTHROPIC_API_KEY` must be configured in Convex environment

---

## Step 1: Check Current Status

First, see how many messages need migration:

```bash
bun scripts/migrate-messages.ts --stats
```

**Output:**
```
Current database state:
  Total messages: 150
  Already migrated: 0
  Need migration: 145
  Empty messages: 5
  Progress: 0%
```

---

## Step 2: Run a Dry Run

Test the migration without making changes:

```bash
bun scripts/migrate-messages.ts --dry-run
```

**What happens:**
- ✅ Counts messages that need migration
- ✅ Shows estimated cost
- ❌ Does NOT call translation API
- ❌ Does NOT modify database

---

## Step 3: Run the Migration

**⚠️ WARNING: This will incur API costs!**

Cost estimate: ~$0.003 per message
- 100 messages = $0.30
- 500 messages = $1.50
- 1,000 messages = $3.00

**Run the migration:**

```bash
bun scripts/migrate-messages.ts
```

**What happens:**
1. Shows current stats
2. Calculates estimated cost
3. Gives you 5 seconds to cancel (Ctrl+C)
4. Processes messages in batches of 10
5. Logs progress in real-time
6. Shows final summary

**Sample output:**
```
🚀 Message Migration Script
============================

Convex URL: https://your-app.convex.cloud
Mode: LIVE MIGRATION
Batch size: 10

📊 Fetching current stats...

Current database state:
  Total messages: 145
  Already migrated: 0
  Need migration: 145
  Empty messages: 0
  Progress: 0%

💰 Estimated cost: $0.44

⚠️  WARNING: This will translate all messages and incur API costs!
⚠️  Press Ctrl+C within 5 seconds to cancel...

🏃 Starting migration...

📦 Processing batch 1/15
🌐 Translating message j57abc123: "Hey, how are you?"
✅ Successfully translated message j57abc123
...

✅ Migration complete!
============================

Results:
  Total processed: 145
  Successfully translated: 145
  Failed: 0
  Skipped (empty): 0

💰 Approximate cost: $0.44
```

---

## Advanced Options

### Custom Batch Size

Process more messages at once (faster but more memory):

```bash
bun scripts/migrate-messages.ts --batch-size=20
```

### Resume Failed Migration

If migration fails halfway, just run it again:
- Already-migrated messages are skipped automatically
- Only remaining messages are processed
- No duplicate work or charges

---

## Monitoring Progress

While migration is running, you can check progress in another terminal:

```bash
bun scripts/migrate-messages.ts --stats
```

---

## Troubleshooting

### Error: "EXPO_PUBLIC_CONVEX_URL not found"
**Solution:** Make sure `.env.local` exists and has:
```
EXPO_PUBLIC_CONVEX_URL=https://your-app.convex.cloud
```

### Error: "ANTHROPIC_API_KEY not configured"
**Solution:** Add API key to Convex:
1. Go to Convex Dashboard → Settings → Environment Variables
2. Add `ANTHROPIC_API_KEY` with your Anthropic API key

### Migration is slow
**Solution:** Increase batch size:
```bash
bun scripts/migrate-messages.ts --batch-size=20
```

### Some messages failed
**Solution:**
- Check Convex logs for error details
- Re-run migration (it will only process failed messages)
- Failed messages can be manually fixed later

---

## After Migration

Once complete:
1. ✅ All messages have translations in 10 languages
2. ✅ Language switching works instantly for all messages
3. ✅ No more "Translate" buttons needed
4. ✅ Formality data available for smart replies

**Test it:**
1. Change language in settings
2. Open old conversations
3. Messages should auto-translate instantly!

---

## Cost Summary

**Current batch translation pricing (Anthropic Claude Haiku):**
- ~$0.003 per message
- Translates to all 10 languages in 1 API call
- One-time cost for migration
- Future messages auto-translate on send

**Example costs:**
- 100 messages: $0.30
- 500 messages: $1.50
- 1,000 messages: $3.00
- 5,000 messages: $15.00
- 10,000 messages: $30.00

---

## Questions?

- Check Convex logs: `bun run convex-dev` terminal
- Check migration stats: `bun scripts/migrate-messages.ts --stats`
- Test with dry run: `bun scripts/migrate-messages.ts --dry-run`
