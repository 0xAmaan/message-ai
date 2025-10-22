# MVP Testing Checklist

## MVP Requirements Status

### ✅ Core Features Implemented
- [x] One-on-one chat functionality
- [x] Real-time message delivery between 2+ users
- [x] Message persistence (survives app restarts)
- [x] Optimistic UI updates (messages appear instantly)
- [x] Online/offline status indicators
- [x] Message timestamps
- [x] User authentication (Clerk)
- [x] Basic group chat functionality (3+ users)
- [x] Message read receipts
- [x] Push notifications (foreground handler)
- [x] Typing indicators
- [x] Image sending/receiving

### 🧪 Testing Scenarios (from MVP requirements)

#### 1. Two Devices Chatting in Real-Time
**Setup:**
- Device A: Sign in as User 1
- Device B: Sign in as User 2
- Create a conversation between them

**Test Steps:**
- [ ] User 1 sends a text message → User 2 receives it instantly
- [ ] User 2 sends a text message → User 1 receives it instantly
- [ ] User 1 starts typing → User 2 sees "User 1 is typing..."
- [ ] User 1 sends an image → User 2 receives and can view it
- [ ] Both users see correct timestamps on all messages
- [ ] Read receipts update (✓ → ✓✓) when messages are read

**Expected Results:**
- Messages appear in < 1 second
- Typing indicators show/hide correctly
- Images load and display properly
- Timestamps are accurate

---

#### 2. One Device Going Offline, Then Coming Back Online
**Setup:**
- Device A: Online and in a conversation
- Device B: Will be taken offline

**Test Steps:**
- [ ] Device B: Enable airplane mode
- [ ] Device B: Online indicator should show offline status
- [ ] Device A: Send 5 messages to the conversation
- [ ] Device A: Verify messages show as sent (✓) but not read (no ✓✓)
- [ ] Device B: Disable airplane mode (come back online)
- [ ] Device B: Should receive all 5 messages automatically
- [ ] Device B: Open the conversation
- [ ] Device A: Read receipts should update to ✓✓
- [ ] Device B: Online indicator should show online status

**Expected Results:**
- Messages queue while offline
- All messages delivered when back online
- No messages lost
- Online status updates correctly

---

#### 3. Messages Sent While App is Backgrounded
**Setup:**
- Device A: App is open in conversation
- Device B: App is open in conversation

**Test Steps:**
- [ ] Device B: Switch to home screen (background the app)
- [ ] Device A: Send 3 messages
- [ ] Device B: Should receive push notification (if in foreground mode)
- [ ] Device B: Tap notification or reopen app
- [ ] Device B: All 3 messages should be visible in the conversation

**Expected Results:**
- Notifications appear for backgrounded app
- Messages persist when app is reopened
- Conversation state is maintained

---

#### 4. App Force-Quit and Reopened (Persistence Test)
**Setup:**
- Device A: Active conversation with messages

**Test Steps:**
- [ ] Device A: Note the last 5 messages in the conversation
- [ ] Device A: Force-quit the app (swipe up in app switcher)
- [ ] Wait 10 seconds
- [ ] Device A: Reopen the app
- [ ] Device A: Navigate to the same conversation
- [ ] Verify all previous messages are still visible
- [ ] Verify conversation list shows correct last message

**Expected Results:**
- All messages persist after force-quit
- Conversation history is intact
- Last message preview is accurate
- No data loss

---

#### 5. Poor Network Conditions
**Setup:**
- Use network throttling or slow connection

**Test Steps:**
- [ ] Enable network throttling (slow 3G simulation)
- [ ] Send a text message
- [ ] Message should show pending state (⏱) initially
- [ ] Message should eventually show sent (✓) when uploaded
- [ ] Try sending an image
- [ ] Image should upload eventually (may take longer)
- [ ] Receive messages from another device
- [ ] Messages should still arrive, just slower

**Expected Results:**
- Optimistic UI shows messages immediately
- Messages eventually send despite slow connection
- No crashes or errors
- User can still interact with app

---

#### 6. Rapid-Fire Messages (20+ Messages Sent Quickly)
**Setup:**
- Device A and Device B in same conversation

**Test Steps:**
- [ ] Device A: Send 20 messages as fast as possible (type "test 1", "test 2", etc.)
- [ ] Verify all 20 messages appear in Device A's chat
- [ ] Device B: Verify all 20 messages are received in correct order
- [ ] Check that timestamps are sequential
- [ ] Verify read receipts work for all messages
- [ ] No duplicate messages appear
- [ ] No messages are skipped or lost

**Expected Results:**
- All 20 messages delivered successfully
- Messages appear in correct chronological order
- No performance degradation
- No duplicate or lost messages

---

#### 7. Group Chat with 3+ Participants
**Setup:**
- Device A: User 1
- Device B: User 2
- Device C: User 3 (or use web browser for third user)

**Test Steps:**
- [ ] User 1: Create a group conversation with User 2 and User 3
- [ ] User 1: Send a message → All users receive it
- [ ] User 2: Send a message → All users receive it
- [ ] User 3: Send a message → All users receive it
- [ ] Verify all participants see online/offline status
- [ ] User 1: Send an image → All users can view it
- [ ] Check that read receipts work (✓✓ when 2+ people read)
- [ ] Verify group shows as "Group (3)" in conversation list

**Expected Results:**
- All participants receive all messages
- Group chat displays correctly
- Attribution shows who sent each message
- Read receipts reflect multiple readers

---

## Additional Features to Test

### Typing Indicators
- [ ] Start typing in text input → Other user sees "[Name] is typing..."
- [ ] Stop typing → Indicator disappears after 5 seconds
- [ ] Send message → Indicator disappears immediately

### Image Messages
- [ ] Tap image picker button (camera icon)
- [ ] Grant photo library permissions
- [ ] Select an image
- [ ] Image appears in message bubble
- [ ] Image is properly sized (200x200)
- [ ] Can send image + text in same message
- [ ] Recipient can view image

### Push Notifications
- [ ] Receive message while app is in foreground → Notification appears
- [ ] Tap notification → Navigates to correct conversation
- [ ] Notification shows sender name and message preview

### Online/Offline Status
- [ ] User comes online → Green dot appears on avatar
- [ ] User goes offline → Green dot disappears
- [ ] Last seen timestamp updates

### Authentication
- [ ] Phone number input works
- [ ] OTP verification succeeds
- [ ] Username creation works
- [ ] Profile setup (name + photo) works
- [ ] Sign out works
- [ ] Sign back in restores previous conversations

---

## Known Issues / Edge Cases to Watch

### Potential Issues:
1. **Image upload on slow networks** - May timeout or fail silently
2. **Typing indicator timeout** - Should clear after 5s of inactivity
3. **Read receipts in groups** - May not update correctly with 3+ users
4. **Optimistic message duplicates** - Might show twice if send is very fast
5. **Push notifications on physical device** - May require TestFlight/APK build

### Performance Concerns:
- Large images should be compressed (quality: 0.7)
- Many rapid messages (50+) might cause UI lag
- Long conversations (500+ messages) may need pagination

---

## Pre-Testing Setup

### Required:
- [ ] Two physical devices OR one device + one simulator
- [ ] Both devices logged into different accounts
- [ ] Convex backend is deployed and running
- [ ] Clerk authentication is configured
- [ ] Both `.env.local` variables set:
  - `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `EXPO_PUBLIC_CONVEX_URL`

### Recommended:
- [ ] Third device/simulator for group chat testing
- [ ] Network throttling tools ready
- [ ] Screenshots/screen recording for documentation

---

## Running the App

```bash
# Start both Expo and Convex dev servers
bun run dev

# OR separately:
bun run start        # Expo only
bun run convex-dev   # Convex only

# Platform-specific:
bun run ios          # iOS simulator
bun run android      # Android emulator
```

---

## Testing Notes

**Date Tested:** _________________

**Devices Used:**
- Device A: _________________
- Device B: _________________
- Device C: _________________

**Test Results Summary:**
- Scenarios Passed: ___ / 7
- Critical Issues Found: _________________
- Minor Issues Found: _________________

**Notes:**
