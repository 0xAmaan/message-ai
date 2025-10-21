# WhatsApp Clone MVP - Complete Implementation Guide

## Project Overview

**Goal**: Build a fully functional WhatsApp-like messaging app with phone authentication, real-time messaging, image sharing, and basic group chat capabilities.

**Tech Stack**:
- **Frontend**: React Native + Expo (iOS first, Android compatible)
- **Backend**: Convex (reactive database, real-time sync, file storage)
- **Auth**: Clerk (phone number + SMS OTP)
- **Storage**: AsyncStorage (offline message queue)

**Timeline**: Single day build
**Target**: 5 users max for MVP demo

---

## MVP Scope

### ✅ MUST-HAVE Features (MVP)

1. **Authentication**
   - Phone number + SMS OTP via Clerk
   - Profile setup (name + profile picture)
   - Secure token storage

2. **Core Messaging**
   - 1-1 conversations
   - Send/receive text messages
   - Real-time message sync
   - Message delivery status
   - Read receipts

3. **Media Sharing**
   - Image upload/download (images only, no video/voice)
   - Image preview in chat

4. **Group Chat**
   - Basic 3-person group chats
   - Add one extra participant to conversation

5. **Real-time Features**
   - Online/offline status
   - Typing indicators ("User is typing...")
   - Live message updates

6. **Offline Support**
   - Message queue with AsyncStorage
   - Queue flush on reconnection
   - Up to 100 queued messages

### ❌ DEFERRED (Post-MVP)

- Voice/video calling (requires WebRTC)
- Voice messages
- Video sharing
- Stories feature
- Large group chats (4+ users)
- Message search
- Advanced features from rubric

---

## Architecture

### System Design

```
┌─────────────────────────────────────────────────────────┐
│                    React Native App                      │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   Clerk     │  │    Convex    │  │  AsyncStorage │  │
│  │  (Auth)     │  │  (Backend)   │  │  (Queue)      │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬───────┘  │
└─────────┼─────────────────┼──────────────────┼──────────┘
          │                 │                  │
          ▼                 ▼                  ▼
    Phone OTP         WebSocket          Local Cache
    Verification      Real-time          Message Queue
                      Sync
```

### Data Flow

**Sending a Message:**
1. User types message → UI updates optimistically
2. If online → Send to Convex mutation
3. If offline → Store in AsyncStorage queue
4. Message syncs to other users via Convex subscription
5. Read receipts update in real-time

**Receiving a Message:**
1. Convex detects new message
2. WebSocket pushes update to all connected clients
3. UI updates automatically
4. Mark as delivered/read

---

## Data Models (Convex Schema)

### Users Table
```typescript
{
  clerkId: string           // From Clerk auth
  phoneNumber: string       // E.164 format (+1234567890)
  name: string
  profilePicUrl?: string    // Convex storage URL
  isOnline: boolean
  lastSeen: number          // timestamp
}
```

**Indexes**: `by_clerk_id`, `by_phone`

### Conversations Table
```typescript
{
  participants: string[]    // array of clerkIds
  type: "direct" | "group"
  lastMessageAt: number
  createdAt: number
}
```

**Indexes**: `by_participant`

### Messages Table
```typescript
{
  conversationId: Id<"conversations">
  senderId: string          // clerkId
  content: string
  imageId?: Id<"_storage">  // Convex file storage
  createdAt: number
  readBy: string[]          // clerkIds who read it
  deliveredTo: string[]     // clerkIds who received it
}
```

**Indexes**: `by_conversation`, `by_sender`

### Typing Indicators Table
```typescript
{
  conversationId: Id<"conversations">
  userId: string            // clerkId
  isTyping: boolean
  updatedAt: number
}
```

**Indexes**: `by_conversation`, `by_user_conversation`

---

## Key User Flows

### A. Onboarding Flow
1. User opens app → Phone input screen
2. Enter phone number → Clerk sends SMS OTP
3. Enter 6-digit code → Verify with Clerk
4. Profile setup → Enter name, upload picture
5. Sync user to Convex via webhook → Navigate to chat list

### B. Starting a Conversation
1. Chat list → "New Chat" button
2. Enter recipient's phone number
3. Search Convex for user by phone
4. If found → Create/get conversation
5. If not found → Show "User not registered"
6. Navigate to chat screen

### C. Sending a Message
**Text Message:**
1. Type in input → Update local state
2. Press send → Call Convex mutation
3. Optimistic UI update (message appears immediately)
4. Real-time sync to recipients

**Image Message:**
1. Press image icon → Open expo-image-picker
2. Select image → Upload to Convex storage
3. Get file ID → Include in message
4. Send message with imageId reference

### D. Receiving Messages
1. Convex subscription detects new message
2. React component re-renders automatically
3. Mark as delivered immediately
4. When chat is open → Mark as read

### E. Offline Behavior
1. Detect no connection → UI shows offline indicator
2. User sends message → Store in AsyncStorage queue
3. Message shows "sending..." status
4. Connection restored → Flush queue to Convex
5. Update message status to delivered/read

---

## Project Structure

```
whatsapp-clone/
├── app/
│   ├── _layout.tsx              # Root: Clerk + Convex providers
│   ├── (auth)/
│   │   ├── _layout.tsx          # Auth navigation guard
│   │   ├── phone-input.tsx      # Enter phone number
│   │   ├── verify-otp.tsx       # Enter OTP code
│   │   └── profile-setup.tsx    # Name + profile pic
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab navigation
│   │   ├── chats.tsx            # Chat list screen
│   │   └── profile.tsx          # User profile
│   └── chat/
│       └── [id].tsx             # Chat screen (messages)
├── components/
│   ├── ChatListItem.tsx         # Preview in list
│   ├── MessageBubble.tsx        # Individual message
│   ├── MessageInput.tsx         # Text input + image picker
│   ├── TypingIndicator.tsx      # "X is typing..."
│   └── OnlineStatus.tsx         # Dot indicator
├── convex/
│   ├── schema.ts                # Database tables
│   ├── users.ts                 # User queries/mutations
│   ├── conversations.ts         # Conversation logic
│   ├── messages.ts              # Message operations
│   ├── typing.ts                # Typing indicators
│   └── http.ts                  # Clerk webhook endpoint
├── lib/
│   ├── messageQueue.ts          # AsyncStorage queue
│   └── constants.ts             # Colors, sizes, test data
└── .env.example                 # Environment variables
```

---

## Implementation Phases

### Phase 1: Setup (30 min)
**Goal**: Initialize project and configure services

**Tasks**:
1. ✅ Create Expo app with TypeScript
2. ✅ Install dependencies
3. ✅ Set up Convex project (`npx convex dev`)
4. ✅ Set up Clerk project (dashboard.clerk.com)
5. ✅ Configure environment variables (.env)
6. ✅ Create folder structure

**Deliverable**: Running app skeleton with providers configured

---

### Phase 2: Authentication (1-2 hours)
**Goal**: Complete phone auth flow with Clerk

**Tasks**:
1. ✅ Build phone input screen
2. ✅ Build OTP verification screen
3. Build profile setup screen
4. Configure Clerk webhook in Convex
5. Test auth flow end-to-end

**Key Files**:
- `app/auth/phone-input.tsx`
- `app/auth/verify-otp.tsx`
- `app/auth/profile-setup.tsx`
- `convex/http.ts` (webhook)

**Testing Checklist**:
- [ ] Can enter phone number
- [ ] Receives SMS OTP (or use 424242 for test numbers)
- [ ] Code verification works
- [ ] User created in Convex
- [ ] Redirects to profile setup
- [ ] Profile data saved

---

### Phase 3: Core Chat (2-3 hours)
**Goal**: Build messaging foundation

**Tasks**:
1. Build chat list UI
2. Implement "New Chat" flow
3. Build chat screen UI
4. Implement send message
5. Implement receive message
6. Add Convex subscriptions

**Key Files**:
- `app/(tabs)/chats.tsx`
- `app/chat/[id].tsx`
- `components/ChatListItem.tsx`
- `components/MessageBubble.tsx`
- `components/MessageInput.tsx`
- `convex/conversations.ts`
- `convex/messages.ts`

**Testing Checklist**:
- [ ] Can search user by phone
- [ ] Can create 1-1 conversation
- [ ] Can send text message
- [ ] Message appears in sender's chat
- [ ] Message syncs to recipient in real-time
- [ ] Messages ordered chronologically

---

### Phase 4: Real-time Features (1-2 hours)
**Goal**: Add online status, typing, and read receipts

**Tasks**:
1. Implement online status updates
2. Build typing indicator logic
3. Add read receipt tracking
4. Show delivery status

**Key Files**:
- `convex/users.ts` (online status)
- `convex/typing.ts`
- `components/TypingIndicator.tsx`
- `components/OnlineStatus.tsx`

**Testing Checklist**:
- [ ] Green dot shows when user online
- [ ] "User is typing..." appears
- [ ] Typing indicator disappears after 3s
- [ ] Read receipts show checkmarks
- [ ] Delivered status tracked

---

### Phase 5: Images (1 hour)
**Goal**: Add image sharing capability

**Tasks**:
1. Integrate expo-image-picker
2. Upload images to Convex storage
3. Display images in messages
4. Handle image loading states

**Key Files**:
- `components/MessageInput.tsx` (picker)
- `components/MessageBubble.tsx` (display)
- `convex/messages.ts` (upload/storage)

**Testing Checklist**:
- [ ] Can select image from library
- [ ] Image uploads to Convex
- [ ] Image displays in chat
- [ ] Image syncs to recipient
- [ ] Images load properly

---

### Phase 6: Offline & Polish (1-2 hours)
**Goal**: Handle offline scenarios and edge cases

**Tasks**:
1. Implement message queue with AsyncStorage
2. Add connection status indicator
3. Auto-flush queue on reconnect
4. Error handling
5. Loading states

**Key Files**:
- `lib/messageQueue.ts`
- Update message sending logic with queue

**Testing Checklist**:
- [ ] Messages queue when offline
- [ ] Queue flushes when back online
- [ ] Offline indicator shows
- [ ] Error messages display
- [ ] Loading spinners work

---

### Phase 7: Group Chat (1 hour)
**Goal**: Add basic group messaging

**Tasks**:
1. Multi-select users for group
2. Create group conversation
3. Test 3-person chat

**Key Files**:
- Update conversation creation flow
- Handle group message display

**Testing Checklist**:
- [ ] Can add 2 people to conversation
- [ ] All 3 see messages
- [ ] Group chat works like 1-1

---

## Technical Details

### Clerk + Convex Integration

**Webhook Setup:**
1. Convex exposes endpoint: `https://your-deployment.convex.site/clerk-webhook`
2. In Clerk dashboard → Webhooks → Add endpoint
3. Subscribe to: `user.created`, `user.updated`
4. Webhook syncs user data to Convex database

**User Sync Flow:**
```
Clerk (Auth) → Webhook → Convex HTTP Action → Convex Mutation → Users Table
```

### Real-time Updates with Convex

**How it works:**
- Convex tracks dependencies of all queries
- When data changes, Convex re-runs affected queries
- React components with `useQuery()` re-render automatically
- No manual WebSocket management needed

**Example:**
```typescript
// This query automatically updates when new messages arrive
const messages = useQuery(api.messages.getMessages, {
  conversationId: chatId,
});
```

### Typing Indicators

**Implementation:**
1. User types → Debounce for 500ms
2. Send `updateTypingStatus(true)` to Convex
3. Other users subscribe to typing status
4. Show "User is typing..." with animation
5. After 3 seconds of no typing → Send `updateTypingStatus(false)`

**Why ephemeral:**
- Typing indicators don't need permanent storage
- Automatically clean up stale indicators
- Low database impact

### Message Queue (Offline Support)

**Queue Structure:**
```typescript
{
  id: string,
  conversationId: string,
  content: string,
  imageId?: string,
  timestamp: number,
  attempts: number
}
```

**Flush Strategy:**
1. On app open → Check queue
2. On connection restored → Check queue
3. For each queued message:
   - Try to send
   - If success → Remove from queue
   - If failure → Increment attempts
   - After 3 attempts → Show error, keep in queue

---

## Environment Setup

### Required Accounts
1. **Clerk**: https://dashboard.clerk.com
   - Create new application
   - Enable "Phone" authentication
   - Copy publishable key

2. **Convex**: https://dashboard.convex.dev
   - Run `npx convex dev`
   - Copy deployment URL

### Environment Variables

Create `.env` file:
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_CONVEX_URL=https://your-app.convex.cloud
```

---

## Testing Strategy

### Development Phase
- Use Clerk test phone numbers:
  - Format: `+15555550100` through `+15555550104`
  - OTP code is always `424242`
  - No SMS sent, instant verification

### Demo Phase
- Use real phone numbers
- Actual SMS delivery
- Test with 2-3 devices simultaneously

### Test Scenarios
1. **Happy Path**: Sign up → Send message → Receive message
2. **Offline**: Send while offline → Reconnect → Message delivers
3. **Group**: Create 3-person chat → All receive messages
4. **Images**: Send image → Recipient sees image
5. **Typing**: Type → Other user sees indicator
6. **Read Receipts**: Open chat → Sender sees checkmarks

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "User not found" when searching | User must sign up first (in-app only) |
| SMS not received | Check Clerk SMS limit (20/month in dev) |
| Messages not syncing | Verify Convex WebSocket connection |
| Images not uploading | Check file size (<5MB) |
| Offline queue not working | Verify AsyncStorage permissions |
| Webhook not firing | Check Clerk dashboard webhook logs |

---

## Messaging Clarification

**THIS IS NOT SMS/iMessage:**
- Users can ONLY message other users who have the app
- Messages go through Convex database, NOT cellular network
- Like WhatsApp/Signal: need phone number to find user in app database
- Cannot send to random phone numbers outside the app

**Flow:**
1. User A signs up with +1234567890
2. User A enters User B's number: +1987654321
3. App searches Convex for that phone number
4. If found → Create conversation
5. If not found → "User not registered, invite them!"

---

## Next Steps After MVP

### Post-MVP Features
1. **Voice Messages**: Add audio recording
2. **Video Sharing**: Extend image upload to video
3. **Voice Calling**: Integrate WebRTC
4. **Video Calling**: WebRTC with video
5. **Stories**: Ephemeral content feature
6. **Large Groups**: Support 10+ person chats
7. **Message Search**: Full-text search
8. **Push Notifications**: Native notifications when app closed

### Production Readiness
1. Add proper error boundaries
2. Implement analytics
3. Add crash reporting
4. Optimize image compression
5. Add pagination for message history
6. Implement message deletion
7. Add user blocking
8. Enable E2E encryption

---

## Success Criteria

**MVP is complete when:**
- [x] User can sign up with phone number
- [x] User can complete profile setup
- [ ] User can find other users by phone
- [ ] User can send text messages
- [ ] Messages sync in real-time
- [ ] User can send images
- [ ] User sees online status
- [ ] User sees typing indicators
- [ ] User sees read receipts
- [ ] Messages queue when offline
- [ ] User can create 3-person group

**Demo-ready when:**
- All above ✅
- Tested on real devices
- Works with real phone numbers
- No major bugs
- Smooth UX

---

## Resources

- **Convex Docs**: https://docs.convex.dev
- **Clerk Docs**: https://clerk.com/docs
- **Expo Docs**: https://docs.expo.dev
- **React Native**: https://reactnative.dev

---

**Last Updated**: October 21, 2025
