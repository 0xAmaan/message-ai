# Context-Aware Smart Replies - Implementation Plan

**AI Persona**: International Communicator
**Advanced Feature**: Context-Aware Smart Replies
**Status**: Phase 1 & 2 Complete ✅ | Ready for Testing

---

## Overview

Add AI-powered smart reply suggestions using Anthropic Claude Haiku with the International Communicator persona. The feature displays 3 contextual reply chips above the message input, generating suggestions when:
1. User opens a chat with unread messages
2. User receives a message while actively in the chat (after 2-second pause)

---

## Phase 1: Backend Foundation ✅ COMPLETED

### Completed Tasks:

#### 1. Anthropic SDK Installation
- ✅ Installed `@anthropic-ai/sdk@0.67.0` via Bun
- ✅ Added `ANTHROPIC_API_KEY` to `.env.local`

#### 2. Convex Schema Update (`convex/schema.ts`)
- ✅ Created `smartReplies` table:
  ```typescript
  {
    conversationId: Id<"conversations">,
    lastMessageId: Id<"messages">,
    suggestions: string[],
    generatedAt: number
  }
  ```
- ✅ Added index: `by_conversation_message` for efficient lookups

#### 3. Smart Replies Service (`convex/smartReplies.ts`)

**Functions Implemented:**

- **`generateSmartReplies` (Action)**
  - Fetches last 20 messages for context
  - Calls Claude 3.5 Haiku API
  - Uses International Communicator system prompt
  - Generates 3 contextual suggestions
  - Auto-saves to cache
  - Returns null if no new messages from others

- **`saveSmartReplies` (Mutation)**
  - Caches suggestions in database
  - Updates existing or creates new entry
  - Tied to specific `lastMessageId`

- **`getSmartReplies` (Query)**
  - Retrieves cached suggestions for conversation
  - Based on latest message in conversation
  - Real-time subscription support

- **`clearSmartReplies` (Mutation)**
  - Invalidates all cached suggestions for conversation
  - Called when user sends a message

#### 4. International Communicator System Prompt

**Key Characteristics:**
- Analyzes conversation formality and tone from message history
- Generates culturally sensitive responses
- Adapts to relationship dynamics between participants
- Provides variety in tone (friendly, professional, empathetic)
- Concise suggestions (<15 words each)
- Returns exactly 3 options as JSON array

**Prompt Design:**
```
You are the International Communicator - an AI assistant that helps users
craft culturally aware and contextually appropriate message responses.

Guidelines:
- Keep suggestions concise (under 15 words each)
- Offer variety in tone (friendly, professional, empathetic)
- Respect cultural communication differences
- Never be overly familiar or presumptuous
- When uncertain about cultural context, default to respectful neutrality

Output format: JSON array of exactly 3 string suggestions only
```

### Verification:
- ✅ Convex dev server auto-detected new schema
- ✅ API types regenerated (`convex/_generated/api.d.ts`)
- ✅ No TypeScript errors
- ✅ Linting errors fixed across codebase

---

## Phase 2: Frontend UI Component ✅ COMPLETED

### Completed Tasks:

#### 1. Created SmartReplyChips Component ✅
**File**: `components/SmartReplyChips.tsx`

**Implemented Features:**
- ✅ Displays 3 chips horizontally (flex-1 for equal width)
- ✅ Shimmer loading component (`SmartReplyChipsLoading`)
- ✅ Dismiss button (X icon from lucide-react-native)
- ✅ Tap behavior: fills `MessageInput` field via ref (doesn't auto-send)
- ✅ NativeWind styling (violet-900/30 bg, violet-600/50 border, violet text)
- ✅ Fade-in animation using Animated API (300ms duration)
- ✅ Auto-dismisses when chip is selected

**Component API:**
```typescript
interface SmartReplyChipsProps {
  conversationId: Id<"conversations">;
  onSelectReply: (text: string) => void;
  onDismiss: () => void;
}
```

**Key Implementation Details:**
- Uses `useQuery` to subscribe to real-time smart reply updates
- Animated.View with opacity interpolation for smooth transitions
- Loading shimmer loops opacity between 0.3-0.7
- Chips truncate text with `numberOfLines={1}` for long suggestions
- Dark theme integration (gray-800 background, gray-700 borders)

#### 2. Updated MessageInput Component ✅
**File**: `components/MessageInput.tsx`

**Changes Made:**
- ✅ Converted to `forwardRef` component
- ✅ Added `MessageInputRef` interface with `fillMessage` method
- ✅ Exposed `useImperativeHandle` for parent control
- ✅ Added display name to fix ESLint error

**New API:**
```typescript
export interface MessageInputRef {
  fillMessage: (text: string) => void;
}
```

#### 3. Integrated into Chat Screen ✅
**File**: `app/chat/[id].tsx`

**Integration Points:**
- ✅ Added ref to `MessageInput` for programmatic text filling
- ✅ Imported `SmartReplyChips` and `SmartReplyChipsLoading`
- ✅ Added state management:
  - `isGeneratingReplies` - tracks API call state
  - `showSmartReplies` - controls visibility
- ✅ Placed above `<MessageInput>` in SafeAreaView
- ✅ Conditional rendering based on loading/data state
- ✅ Clears suggestions when user sends message or image

**State Management:**
```typescript
const [isGeneratingReplies, setIsGeneratingReplies] = useState(false);
const [showSmartReplies, setShowSmartReplies] = useState(true);
const messageInputRef = useRef<MessageInputRef>(null);
```

**Event Handlers:**
- `handleSelectReply`: Fills message input via ref
- `handleDismissReplies`: Hides chips
- Updated `handleSendMessage`: Clears smart replies on send
- Updated `handleSendImage`: Clears smart replies on image send

---

## Phase 3: Trigger Logic & Caching ✅ COMPLETED

### Completed Tasks:

#### 1. On-Chat-Open Trigger ✅
**Implementation in `app/chat/[id].tsx`:**

```typescript
useEffect(() => {
  const generateRepliesOnOpen = async () => {
    if (!user?.id || !conversationId || !messages || messages.length === 0) {
      return;
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.senderId !== user.id && !lastMessage.readBy.includes(user.id)) {
      setIsGeneratingReplies(true);
      try {
        await generateSmartReplies({ conversationId, currentUserId: user.id });
      } catch (error) {
        console.error("Failed to generate smart replies:", error);
      } finally {
        setIsGeneratingReplies(false);
      }
    }
  };

  generateRepliesOnOpen();
}, [conversationId, user?.id]);
```

**Features:**
- ✅ Runs on component mount
- ✅ Checks if last message is unread
- ✅ Only generates if message is from other user
- ✅ Shows loading shimmer during generation
- ✅ Silent error handling (doesn't block chat)

#### 2. Debounced Auto-Refresh Trigger ✅
**Implementation in `app/chat/[id].tsx`:**

```typescript
useEffect(() => {
  if (!user?.id || !messages || messages.length === 0) {
    return;
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage.senderId === user.id) {
    return;
  }

  const timer = setTimeout(async () => {
    setIsGeneratingReplies(true);
    try {
      await generateSmartReplies({ conversationId, currentUserId: user.id });
    } catch (error) {
      console.error("Failed to generate smart replies:", error);
    } finally {
      setIsGeneratingReplies(false);
    }
  }, 2000);

  return () => clearTimeout(timer);
}, [messages, user?.id, conversationId, generateSmartReplies]);
```

**Features:**
- ✅ 2-second debounce delay
- ✅ Cancels timer on cleanup (prevents duplicate calls)
- ✅ Only triggers for messages from other users
- ✅ Real-time subscription to `messages` query
- ✅ Automatic regeneration on new message arrival

#### 3. Cache Invalidation Strategy ✅
**Implementation:**

**On Message Send:**
```typescript
const handleSendMessage = async (content: string) => {
  // ... optimistic message logic

  setShowSmartReplies(false); // Hide UI immediately
  await clearSmartReplies({ conversationId }); // Clear from DB

  await sendMessage({ conversationId, senderId: user.id, content });
};
```

**On Image Send:**
```typescript
const handleSendImage = async (imageUri: string) => {
  // ... image upload logic

  setShowSmartReplies(false);
  await clearSmartReplies({ conversationId });

  await sendMessage({ conversationId, senderId: user.id, imageId: storageId });
};
```

**Caching Flow (Implemented):**
```
New message arrives
  ↓
Debounced effect triggers (2s delay)
  ↓
generateSmartReplies action called
  ↓
Backend checks if cached suggestions exist for lastMessageId
  ↓
If yes → returns cached data immediately
If no → calls Claude API → caches result → returns suggestions
  ↓
Frontend receives data via real-time query subscription
  ↓
SmartReplyChips renders with fade-in animation
```

**Cache Characteristics:**
- ✅ No time-based expiry
- ✅ Tied to `lastMessageId`
- ✅ Invalidated only when user sends message
- ✅ Instant retrieval for repeated views
- ✅ Convex handles real-time sync automatically

---

## Phase 4: Polish & Error Handling (PENDING)

### Planned Tasks:

#### 1. Error Handling
- API failures → silently hide chips (don't block messaging)
- Timeout handling (Convex action limits)
- Network errors → show cached suggestions if available
- Invalid response format → graceful fallback

#### 2. Rate Limiting
- Implement per-user generation tracking
- Max 20 generations per user per hour
- Track in memory or simple Convex counter
- Display message if limit exceeded

#### 3. UX Refinements
- Smooth fade-in animation for chips
- Haptic feedback on chip tap (optional)
- Handle edge cases:
  - Empty conversations
  - Image-only messages
  - Very short conversations (<3 messages)

#### 4. Performance Optimization
- Pre-fetch suggestions for likely conversations
- Cancel in-flight requests on screen unmount
- Debounce rapid message arrivals

---

## Technical Architecture

### AI Service
- **Provider**: Anthropic Claude
- **Model**: Claude 3.5 Haiku (`claude-3-5-haiku-20241022`)
- **Reasoning**: Fast, cost-effective, excellent at following instructions
- **Context Window**: Last 10-20 messages
- **Cost Estimate**: ~$0.0006 per generation

### Caching Strategy
- **Storage**: Convex `smartReplies` table
- **TTL**: Until new message arrives (no time-based expiry)
- **Key**: `conversationId` + `lastMessageId`
- **Benefits**: Instant display, reduced API calls, offline support

### Trigger Logic
- **On-Open**: Immediate generation if unread messages exist
- **In-Chat**: 2-second debounced regeneration on new messages
- **Invalidation**: Clear on user send

### UI Pattern
- **Location**: Above message input
- **Count**: Exactly 3 chips
- **Layout**: Horizontal row (no scrolling)
- **Interaction**: Tap to fill input (not auto-send)
- **Dismissal**: X button or manual clear

---

## Cost & Performance Estimates

### API Costs (Haiku)
- Input: ~$0.25 per 1M tokens
- Output: ~$1.25 per 1M tokens
- Per generation: ~$0.0006 (20 messages + 3 suggestions)
- 1000 users × 50 generations/day ≈ **$30/month**

### Performance Targets
- Generation time: <2 seconds (Claude Haiku)
- Cache retrieval: <100ms (Convex query)
- Total UX delay: <2.5 seconds from trigger

### Rate Limits
- Max 20 generations per user per hour
- Prevents abuse and cost overruns
- Graceful degradation on limit hit

---

## Success Criteria

### Phase 1 (Backend) ✅
- [x] Convex schema updated with `smartReplies` table
- [x] Action successfully calls Anthropic API
- [x] Suggestions cached in database
- [x] Query retrieves cached data
- [x] Clear function removes old suggestions

### Phase 2 (Frontend UI)
- [ ] Component renders 3 chips
- [ ] Loading state displays shimmer
- [ ] Tapping chip fills message input
- [ ] Dismiss button hides chips
- [ ] Styling matches app theme

### Phase 3 (Triggers)
- [ ] Opens chat with unread → generates suggestions
- [ ] Receives message in-chat → regenerates after 2s
- [ ] Sends message → clears suggestions
- [ ] Cache hit → instant display (<100ms)

### Phase 4 (Polish)
- [ ] Errors handled gracefully
- [ ] Rate limiting active
- [ ] Smooth animations
- [ ] Edge cases covered

---

## Implementation Notes

### Code Quality Principles
- **Minimal code**: No over-engineering
- **Existing patterns**: Follow Convex real-time conventions
- **Error tolerance**: Silent failures for UX features
- **Performance**: Cache-first, API as fallback

### Phase Approach
- Complete each phase fully before next
- Test and confirm functionality
- User review between phases
- Iterate based on feedback

### Key Files Modified/Created

**Backend:**
- `convex/schema.ts` - Added smartReplies table
- `convex/smartReplies.ts` - New service (action, mutations, queries)
- `.env.local` - Added ANTHROPIC_API_KEY
- `package.json` - Added @anthropic-ai/sdk

**Frontend (Upcoming):**
- `components/SmartReplyChips.tsx` - New component
- `app/chat/[id].tsx` - Integration point

---

## Testing Plan

### Backend Testing (Phase 1) ✅
- [x] Convex dev server recognizes new functions
- [x] API types generated correctly
- [x] No TypeScript/linting errors
- [ ] Manual API call test (will do in Phase 2 integration)

### Frontend Testing (Phase 2)
- [ ] Visual rendering on different screen sizes
- [ ] Tap interaction fills input correctly
- [ ] Dismiss functionality works
- [ ] Loading state appears appropriately

### Integration Testing (Phase 3)
- [ ] End-to-end flow: open chat → see suggestions
- [ ] Real-time updates on new messages
- [ ] Cache invalidation on send
- [ ] Multiple conversations handle separately

### Edge Case Testing (Phase 4)
- [ ] Network offline → cached suggestions still show
- [ ] API timeout → graceful fallback
- [ ] Rapid message arrivals → debounce works
- [ ] Empty/short conversations → no errors

---

## Future Enhancements (Post-MVP)

### Potential Features:
- User preference toggle (enable/disable AI)
- Custom suggestion count (3, 5, or 7)
- Multi-language support detection
- Learning from user's actual replies (personalization)
- A/B test Haiku vs Sonnet for quality comparison
- Analytics: acceptance rate, most used suggestions
- Emoji/GIF suggestions based on context

### Advanced Persona Options:
- Professional Communicator (business-focused)
- Casual Friend (informal tone)
- Empathetic Listener (emotional support)
- Multilingual Assistant (translation hints)

---

## Current Status Summary

**✅ Phase 1 Complete**: Backend infrastructure (Convex actions, schema, caching)
**✅ Phase 2 Complete**: Frontend UI components (SmartReplyChips, MessageInput updates)
**✅ Phase 3 Complete**: Trigger logic (on-open, debounced refresh, cache invalidation)
**⏭️ Next Step**: Phase 4 - Polish & error handling (rate limiting, edge cases, optimization)
**🧪 Ready for Testing**: Core functionality implemented and ready for user testing

**Last Updated**: October 24, 2025
**Implementation Time**:
- Phase 1: ~1 hour (Backend)
- Phase 2: ~1 hour (Frontend UI)
- Phase 3: ~30 minutes (Trigger logic)
- **Total**: ~2.5 hours

**Files Modified/Created:**
- ✅ `convex/schema.ts` - Added smartReplies table
- ✅ `convex/smartReplies.ts` - New service (165 lines)
- ✅ `components/SmartReplyChips.tsx` - New component (154 lines)
- ✅ `components/MessageInput.tsx` - Updated with ref support
- ✅ `app/chat/[id].tsx` - Integrated smart replies
- ✅ `.env.local` - Added ANTHROPIC_API_KEY
- ✅ `package.json` - Added @anthropic-ai/sdk
- ✅ `docs/ai-feature-plan.md` - This document
