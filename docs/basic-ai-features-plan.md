# Basic AI Features Plan - International Communicator

**Status**: Planning Phase
**Required Features**: 5 basic AI features for International Communicator persona

---

## Feature Integration Strategy

Instead of 5 separate features, we'll create a **unified translation system** that incorporates all required capabilities into a seamless UX.

---

## Unified Translation Feature Design

### UI/UX Flow

**Message Display:**
```
┌─────────────────────────────────────┐
│ [Other User's Message Bubble]       │
│ "Hey, can you help me with this?"   │
│                                      │
│ [🌐 Translate] ← Small button       │
└─────────────────────────────────────┘
```

**After Clicking Translate:**
```
┌─────────────────────────────────────┐
│ Original: "Hey, can you help..."    │
│ ─────────────────────────────────── │
│ 🇫🇷 French Translation:             │
│ "Salut, peux-tu m'aider avec ça ?"  │
│                                      │
│ ℹ️ Cultural Context (if relevant):  │
│ "This is a casual greeting among    │
│  friends. In formal contexts, use   │
│  'Bonjour' instead of 'Salut'."     │
│                                      │
│ 📚 Idioms/Slang (if detected):      │
│ • "Hey" - Informal greeting         │
│                                      │
│ [✕ Close Translation]                │
└─────────────────────────────────────┘
```

---

## Feature Breakdown

### 1. Real-Time Translation (Core Feature)

**Implementation:**
- Add `[🌐 Translate]` button below each message bubble (excluding user's own messages)
- Button appears for all messages by default
- On click, call Convex action that uses Claude API
- Display translated text in expandable overlay within the message bubble
- Translation persists (caches in Convex DB) to avoid re-translating

**Technical Details:**
- **Convex Action**: `translateMessage`
  - Input: `messageId`, `targetLanguage` (user's preferred language)
  - Output: `translation`, `detectedLanguage`, `culturalHints[]`, `slangExplanations[]`
- **Cache Table**: `message_translations`
  ```typescript
  {
    messageId: Id<"messages">,
    targetLanguage: string,
    translatedText: string,
    detectedSourceLanguage: string,
    culturalHints: string[],
    slangExplanations: { term: string, explanation: string }[],
    generatedAt: number
  }
  ```
- **Target Language**: Default to English (can be made user-configurable later)

**System Prompt Strategy:**
```
You are a professional translator and cultural consultant for the International Communicator.

Task: Translate the following message to {targetLanguage}.

Requirements:
1. Provide accurate, natural translation
2. Detect the source language automatically
3. Adjust formality appropriately based on context
4. Identify any cultural context that should be noted
5. Highlight slang, idioms, or region-specific expressions

Return JSON format:
{
  "translation": "translated text",
  "detectedLanguage": "language_code",
  "culturalHints": ["hint1", "hint2"] or [],
  "slangExplanations": [{"term": "word", "explanation": "meaning"}] or []
}
```

---

### 2. Automatic Language Detection

**Implementation:**
- Embedded within the translation action
- Claude API automatically detects source language
- Display detected language in translation overlay: "🇫🇷 French Translation"
- No user action required - happens transparently

**Visual Indicator:**
```
Detected: Spanish 🇪🇸 → English 🇺🇸
```

**Technical Details:**
- Claude automatically identifies source language
- Map language codes to flag emojis for visual clarity
- Store `detectedSourceLanguage` in cache for future reference

---

### 3. Cultural Context Hints

**Implementation:**
- Shown automatically when relevant cultural nuances are detected
- Appears in the translation overlay as an "ℹ️ Cultural Context" section
- Only displays if Claude identifies something culturally significant

**Examples of When to Show:**

1. **Formality Differences:**
   - Original (Japanese): "おはようございます" → "Good morning"
   - Hint: "This is a formal morning greeting. Casual would be 'おはよう'."

2. **Regional Variations:**
   - Original (UK English): "Can you post this letter?"
   - Hint: "In British English, 'post' means 'mail'. Americans would say 'mail this letter'."

3. **Cultural Practices:**
   - Original (Arabic): "إن شاء الله سأكون هناك" → "I'll be there, God willing"
   - Hint: "In Arabic culture, 'Inshallah' (God willing) is commonly added to future plans as a cultural practice."

4. **Time/Date Formats:**
   - Original: "Let's meet 10/12/2024"
   - Hint: "Date format varies: US uses MM/DD/YYYY, most others use DD/MM/YYYY."

**System Prompt Section:**
```
Analyze the message for cultural context that might be misunderstood:
- Formality levels (formal vs casual greetings, honorifics)
- Regional language variations (UK vs US English, Latin American vs Spain Spanish)
- Cultural practices embedded in language (religious phrases, politeness customs)
- Date/time format differences
- Gesture or emoji meanings that vary by culture

Only include hints that are genuinely helpful. If the message is straightforward with no cultural nuances, return empty array.
```

---

### 4. Formality Adjustment

**Implementation:**
- Not a separate button/feature
- Automatically embedded in translation quality
- Claude analyzes formality level of original message
- Preserves formality in translation (casual → casual, formal → formal)

**How It Works:**
- **Formality Detection**: Claude determines if original message is:
  - Very formal (business, official)
  - Formal (polite, respectful)
  - Neutral (standard conversation)
  - Casual (friends, family)
  - Very casual (slang, informal)

- **Formality Preservation**: Translation maintains the same tone
  - Japanese formal "お願いします" → English formal "I would kindly request"
  - Japanese casual "よろしく" → English casual "Thanks!"

**Visual Indicator (Optional):**
```
Formality Level: Casual 👕
```

**System Prompt Section:**
```
Analyze the formality level of the original message:
- Formal language (honorifics, polite forms, business tone)
- Casual language (contractions, slang, friendly tone)
- Professional vs personal context

Preserve this formality level in the translation. If translating casual Spanish to English, use casual English. If translating formal Japanese to English, use formal English.
```

---

### 5. Slang/Idiom Explanations

**Implementation:**
- Automatically detects slang, idioms, colloquialisms in the original message
- Shows explanations in "📚 Slang & Idioms" section of translation overlay
- Only appears if slang/idioms are detected

**Examples:**

1. **English Slang:**
   - Original: "That's fire! 🔥"
   - Translation (Spanish): "¡Eso está increíble!"
   - Slang Explanation:
     - **"fire"** - Modern slang meaning "excellent" or "amazing"

2. **Idioms:**
   - Original: "It's raining cats and dogs"
   - Translation (French): "Il pleut des cordes"
   - Idiom Explanation:
     - **"raining cats and dogs"** - English idiom meaning "raining very heavily"
     - **Note**: French has different idiom: "Il pleut des cordes" (literally "raining ropes")

3. **Regional Slang:**
   - Original (UK): "That's proper cheeky, innit?"
   - Translation (US English): "That's really bold, isn't it?"
   - Slang Explanation:
     - **"proper"** - British slang for "very" or "really"
     - **"cheeky"** - Bold or impudent in a playful way
     - **"innit"** - British slang contraction of "isn't it"

4. **Internet/Gen-Z Slang:**
   - Original: "no cap fr fr 💯"
   - Translation (German): "ehrlich gesagt, wirklich wahr"
   - Slang Explanation:
     - **"no cap"** - Internet slang meaning "no lie" or "for real"
     - **"fr fr"** - "for real for real" (emphasis)

**System Prompt Section:**
```
Identify slang, idioms, colloquialisms, and culture-specific expressions:
- Modern slang (internet slang, Gen-Z terms, regional slang)
- Traditional idioms (metaphorical expressions)
- Colloquialisms (informal everyday phrases)
- Cultural references

For each detected term:
{
  "term": "the slang/idiom",
  "explanation": "clear, concise explanation of meaning"
}

Only include terms that a non-native speaker might not understand. Don't explain common words.
```

---

## Technical Implementation Plan

### Phase 1: Backend (Convex + Claude API)

**New Files:**
- `convex/translations.ts`

**New Schema Table:**
```typescript
message_translations: defineTable({
  messageId: v.id("messages"),
  targetLanguage: v.string(),
  translatedText: v.string(),
  detectedSourceLanguage: v.string(),
  culturalHints: v.array(v.string()),
  slangExplanations: v.array(v.object({
    term: v.string(),
    explanation: v.string()
  })),
  generatedAt: v.number()
}).index("by_message_language", ["messageId", "targetLanguage"])
```

**Convex Functions:**
1. `translateMessage` (action)
   - Calls Claude API with specialized system prompt
   - Returns translation + metadata
   - Caches result

2. `getTranslation` (query)
   - Retrieves cached translation for a message
   - Returns null if not translated yet

3. `clearTranslation` (mutation)
   - Removes translation cache (if user wants to re-translate)

**System Prompt (Full):**
```typescript
const TRANSLATION_SYSTEM_PROMPT = `You are a professional translator and cultural consultant for the International Communicator messaging app.

Your role:
- Translate messages accurately while preserving tone and intent
- Automatically detect the source language
- Maintain formality level (formal messages stay formal, casual stay casual)
- Identify cultural context that may be misunderstood
- Explain slang, idioms, and regional expressions

Response format (JSON only):
{
  "translation": "Natural translation in target language",
  "detectedLanguage": "ISO_language_code",
  "culturalHints": ["List of cultural context notes"] or [],
  "slangExplanations": [{"term": "word/phrase", "explanation": "meaning"}] or []
}

Guidelines:
- Translations should sound natural, not word-for-word
- Preserve emoji and formatting
- Cultural hints: only include if genuinely helpful for understanding
- Slang explanations: only for terms a non-native speaker wouldn't know
- Empty arrays if no hints/slang detected`;
```

---

### Phase 2: Frontend UI

**New Component:**
- `components/TranslateButton.tsx`
  - Small button with globe icon
  - Shown below message bubbles
  - Only for messages from other users

**Updated Component:**
- `components/MessageBubble.tsx`
  - Add translation state (collapsed/expanded)
  - Render TranslateButton
  - Show translation overlay when expanded
  - Display: translated text, cultural hints, slang explanations

**UI States:**

1. **Not Translated (Default):**
   ```
   ┌────────────────────────┐
   │ Original message text  │
   │ [🌐 Translate]         │
   └────────────────────────┘
   ```

2. **Loading:**
   ```
   ┌────────────────────────┐
   │ Original message text  │
   │ [⏳ Translating...]    │
   └────────────────────────┘
   ```

3. **Translated (Expanded):**
   ```
   ┌──────────────────────────────┐
   │ Original message text        │
   │ ──────────────────────────── │
   │ 🇪🇸 Spanish → 🇺🇸 English    │
   │                              │
   │ "Translated text here"       │
   │                              │
   │ ℹ️ Cultural Context:         │
   │ • Hint 1                     │
   │ • Hint 2                     │
   │                              │
   │ 📚 Slang & Idioms:           │
   │ • "term" - explanation       │
   │                              │
   │ [✕ Hide Translation]         │
   └──────────────────────────────┘
   ```

**Styling:**
- Translation overlay: light purple/violet background to match app theme
- Cultural hints: light blue info icon
- Slang explanations: book icon
- Collapsed/expanded with smooth animation

---

## User Settings (Future Enhancement)

Later, we can add user preferences:
- Default target language (currently hardcoded to English)
- Auto-translate toggle (translate all incoming messages automatically)
- Show/hide cultural hints
- Show/hide slang explanations

---

## Performance Considerations

1. **Caching**: Translations are cached per message + target language
   - First translation: ~2-3 seconds (API call)
   - Subsequent views: Instant (from cache)

2. **Cost Management**:
   - Only translate on user request (not automatic)
   - Cache prevents duplicate API calls
   - Haiku model keeps costs low (~$0.0003 per translation)

3. **Rate Limiting**:
   - Reuse existing rate limit infrastructure
   - Max 50 translations per user per hour (can adjust)

---

## Success Criteria (Rubric Alignment)

**Required AI Features for International Communicator (15 points):**

1. ✅ **Real-time translation accurate and natural**
   - Natural-sounding translations via Claude
   - Fast response (<3 seconds)

2. ✅ **Language detection works automatically**
   - Claude auto-detects source language
   - Displayed with flag emoji

3. ✅ **Cultural context hints actually helpful**
   - Shows formality differences
   - Explains regional variations
   - Highlights cultural practices

4. ✅ **Formality adjustment produces appropriate tone**
   - Analyzes formality of original message
   - Preserves tone in translation

5. ✅ **Slang/idiom explanations clear**
   - Detects modern slang, idioms, colloquialisms
   - Provides clear, concise explanations

**Advanced AI Capability (10 points):**
- ✅ Context-aware smart replies (already implemented)

---

## Implementation Timeline

**Phase 1 - Backend (1-1.5 hours):**
1. Update Convex schema with `message_translations` table
2. Create `convex/translations.ts` with action/query/mutation
3. Implement Claude API integration with system prompt
4. Test with various languages and message types

**Phase 2 - Frontend (1.5-2 hours):**
1. Create `TranslateButton` component
2. Update `MessageBubble` to support translation overlay
3. Implement expand/collapse animation
4. Wire up to Convex backend
5. Add loading states and error handling

**Testing (30 minutes):**
- Test multiple languages
- Test slang/idiom detection
- Test cultural hints
- Test caching
- Edge cases (emoji-only messages, very long messages)

**Total Time Estimate: 3-4 hours**

---

## Example Test Cases

1. **Casual Spanish → English:**
   - Input: "¡Hola amigo! ¿Qué onda? 😎"
   - Expected: Translation + casual formality note

2. **Formal Japanese → English:**
   - Input: "お世話になっております。"
   - Expected: Translation + formality explanation

3. **English Slang → French:**
   - Input: "That's cap, bro. It's mid at best."
   - Expected: Translation + slang explanations for "cap", "bro", "mid"

4. **British English → American English:**
   - Input: "Can you bin that rubbish and grab a lift to the flat?"
   - Expected: Translation + regional variation explanations

5. **Idiom Heavy:**
   - Input: "It's raining cats and dogs, so let's take a rain check."
   - Expected: Idiom explanations for both phrases

---

## Notes

- All 5 required basic features are integrated into a single cohesive translation system
- User just clicks one button and gets all relevant information
- Cleaner UX than 5 separate features
- Meets all rubric requirements for International Communicator persona
- Extensible for future enhancements (auto-translate, custom languages, etc.)
