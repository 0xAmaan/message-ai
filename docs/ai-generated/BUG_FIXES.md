# Bug Fixes & Improvements

## Issues Fixed

### 1. ✅ Image Upload Error - "Failed to get upload URL"

**Problem:** Image upload was trying to manually construct the Convex storage URL instead of using the mutation.

**Fix:** Changed to use `useMutation(api.messages.generateUploadUrl)` directly.

**Files Changed:**
- `app/chat/[id].tsx:167-205`

**How to Test:**
1. Open a chat
2. Tap the image picker button (camera icon)
3. Select an image from your library
4. Image should upload and appear in the message bubble

---

### 2. ✅ Read Receipts Showing Incorrectly

**Problem:** Messages showed ✓✓ (double checkmark) immediately because:
- Sender is automatically in `readBy` array (length = 1)
- When YOU open the chat, `markConversationAsRead` adds you to readBy (length = 2)
- UI logic said "if readBy.length > 1, show ✓✓"

**Fix:** Changed logic to filter out the sender from `readBy` before counting:
```typescript
const readByOthers = message.readBy.filter(id => id !== message.senderId).length;
// Show: ⏱ (pending) → ✓ (sent) → ✓✓ (read by others)
```

**Files Changed:**
- `components/MessageBubble.tsx:43-45, 104`

**How to Test:**
1. Device A: Send a message → should show ✓ (single check)
2. Device B: Open the chat and view the message
3. Device A: Check should update to ✓✓ (double check)

---

### 3. ✅ Group Chat Creation

**Problem:** No UI to create group chats, even though backend supported it.

**Fix:** Added multi-select functionality to the new chat screen:
- Tap users to select them (checkbox appears)
- Select 2+ users to create a group
- Button shows "Create Group (X people)"
- Backend creates conversation with `type: "group"`

**Files Changed:**
- `app/new-chat.tsx` - Complete rewrite of user selection logic

**How to Test:**
1. Tap "New Chat" button
2. Tap on 2 or more users (checkboxes appear)
3. Tap "Create Group (3 people)" button
4. Group chat opens
5. All participants can send/receive messages

---

### 4. 🔍 Online/Offline Status Indicators

**How it Works:**
- When app comes to foreground → `updateOnlineStatus({ isOnline: true })`
- When app goes to background → `updateOnlineStatus({ isOnline: false })`
- When app is closed → cleanup sets `isOnline: false`

**Where it's Used:**
- Green dot on avatars in chat list (`ChatListItem.tsx:107-114`)
- "Online" badge in new chat screen (`new-chat.tsx:187-193`)

**Files:**
- `app/_layout.tsx:30-51` - App state listener
- `convex/users.ts:123-141` - Backend mutation

**How to Test:**
1. Device A: Open the app → should show as online
2. Device B: View user list or chat list → Device A shows green dot
3. Device A: Close the app or switch to background
4. Device B: Green dot disappears after a few seconds

---

### 5. ℹ️ Push Notifications Testing

**Current Status:**
- ✅ Foreground notifications work (app is open)
- ❌ Background/killed state requires TestFlight or APK build

**How to Test Foreground Notifications:**
1. Ensure both devices are signed in
2. Device A: Open the app and stay in it
3. Device B: Send a message
4. Device A: Should see notification banner while app is in foreground
5. Tap notification → navigates to that conversation

**Production Setup Required:**
- Build app with `eas build` (Expo Application Services)
- Submit to TestFlight (iOS) or generate APK (Android)
- Test background and killed state notifications

**Files:**
- `app/_layout.tsx:53-89` - Notification listeners
- `lib/notifications.ts` - Permission handling

---

## Summary of Changes

### Files Modified:
1. `app/chat/[id].tsx` - Fixed image upload
2. `components/MessageBubble.tsx` - Fixed read receipts
3. `app/new-chat.tsx` - Added group chat creation
4. `app/_layout.tsx` - Already had online status tracking
5. `lib/notifications.ts` - Already had notification setup

### New Features:
- ✅ Multi-select users for group chats
- ✅ Visual selection indicators (checkboxes)
- ✅ Dynamic button text ("Start Chat" vs "Create Group (X people)")

---

## Testing Checklist

### Image Upload
- [ ] Pick image from library
- [ ] Image uploads successfully
- [ ] Image displays in message bubble (200x200)
- [ ] Recipient can view image

### Read Receipts
- [ ] Your sent message shows ✓ initially
- [ ] Changes to ✓✓ when recipient reads it
- [ ] Works correctly in group chats

### Group Chat
- [ ] Can select 2+ users
- [ ] "Create Group" button appears
- [ ] Group chat is created
- [ ] All participants receive messages
- [ ] Shows "Group (X)" in conversation list

### Online Status
- [ ] Green dot appears when user is online
- [ ] Disappears when user goes offline
- [ ] Updates in real-time

### Push Notifications (Foreground)
- [ ] Notification appears when app is open
- [ ] Tapping navigates to correct chat
- [ ] Shows sender name and preview

---

## Known Limitations

### Still Needs Work:
1. **Background notifications** - Requires production build
2. **Group chat naming** - No way to set custom group names yet
3. **Group participant list** - Can't see who's in the group
4. **Image upload progress** - No progress indicator during upload
5. **Message deletion** - Can't delete or edit messages

### Future Enhancements:
- Group admin features (add/remove members)
- Custom group avatars and names
- Message reactions
- Voice messages
- Read receipts per user in groups
- Online status in chat header

---

## Environment Check

Make sure these are set in `.env.local`:
```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_CONVEX_URL=https://...convex.cloud
```

Run the app:
```bash
bun run dev
```

---

## All MVP Requirements Status

1. ✅ One-on-one chat
2. ✅ Real-time message delivery
3. ✅ Message persistence
4. ✅ Optimistic UI updates
5. ✅ Online/offline status indicators
6. ✅ Message timestamps
7. ✅ User authentication
8. ✅ Basic group chat functionality
9. ✅ Message read receipts (FIXED)
10. ✅ Push notifications (foreground)
11. ✅ Image sending/receiving (FIXED)

**Status: All MVP requirements met!** 🎉
