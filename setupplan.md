# WhatsApp Clone MVP Setup Plan

## Overview

Transform the current scaffolded app into a working WhatsApp clone with phone authentication, Convex integration, and basic messaging functionality.

## Phase 1: Install Dependencies & Configure NativeWind

**Install NativeWind and required dependencies:**

- Install: `nativewind`, `tailwindcss`, and peer dependencies
- Create `tailwind.config.js` with React Native preset
- Update `app/_layout.tsx` to import NativeWind CSS
- Add TypeScript types for Tailwind classes

**Files to modify:**

- `package.json` (add dependencies)
- `tailwind.config.js` (create)
- `app/_layout.tsx` (import styles)
- `global.css` (create for NativeWind base styles)

## Phase 2: Integrate Convex with Clerk

**Add ConvexProviderWithClerk to root layout:**

- Import `ConvexProviderWithClerk` from `convex/react-clerk`
- Create Convex client with deployment URL from env
- Wrap the app with both ClerkProvider and ConvexProviderWithClerk
- Ensure proper provider nesting order

**Files to modify:**

- `app/_layout.tsx` - Add Convex integration

**Verify:**

- Check that `EXPO_PUBLIC_CONVEX_URL` is in .env
- Ensure Convex is properly initialized

## Phase 3: Fix Authentication Flow

**Remove email-based auth screens:**

- Delete `app/(auth)/sign-in.tsx`
- Delete `app/(auth)/sign-up.tsx`

**Create profile-setup screen:**

- Build `app/(auth)/profile-setup.tsx` for name and profile picture entry
- Add image picker for profile photo
- Save profile data to Convex using `updateProfile` mutation
- Navigate to home after completion

**Update auth layout:**

- Remove references to sign-in/sign-up routes
- Ensure phone-input → verify-otp → profile-setup flow

**Files to create:**

- `app/(auth)/profile-setup.tsx`

**Files to delete:**

- `app/(auth)/sign-in.tsx`
- `app/(auth)/sign-up.tsx`

## Phase 4: Fix Navigation Structure

**Replace (home) with (tabs) structure:**

- Delete `app/(home)/` folder entirely
- Create `app/(tabs)/` folder with proper authenticated routes
- Create `app/(tabs)/_layout.tsx` with bottom tabs navigator
- Create `app/(tabs)/index.tsx` (chat list screen)
- Add auth guard in `app/_layout.tsx` to redirect based on auth state

**Files to create:**

- `app/(tabs)/_layout.tsx`
- `app/(tabs)/index.tsx`

**Files to delete:**

- `app/(home)/_layout.tsx`
- `app/(home)/index.tsx`

**Update root layout:**

- Add proper routing logic to show `(auth)` when logged out, `(tabs)` when logged in
- Remove hardcoded Stack screens, use Slot for dynamic routing

## Phase 5: Build Chat List Screen

**Create main chat list UI:**

- Build `app/(tabs)/index.tsx` with FlatList of conversations
- Query Convex for user's conversations
- Add "New Chat" button to start conversations
- Show empty state when no chats exist

**Create components:**

- `components/ChatListItem.tsx` - Individual chat preview with avatar, name, last message
- `components/NewChatButton.tsx` - Floating action button to start new chat

**Convex integration:**

- Use `useQuery(api.conversations.list)` to fetch conversations
- Subscribe to real-time updates

## Phase 6: Build Individual Chat Screen

**Create chat screen with dynamic routing:**

- Build `app/chat/[id].tsx` for individual conversations
- Display messages with FlatList (inverted for chat UX)
- Show chat header with user name and online status
- Add message input at bottom

**Create message components:**

- `components/MessageBubble.tsx` - Individual message display with sender/receiver styling
- `components/MessageInput.tsx` - Text input with send button and image picker
- `components/TypingIndicator.tsx` - Animated "User is typing..." indicator

**Convex integration:**

- Use `useQuery(api.messages.getMessages)` to fetch messages
- Use `useMutation(api.messages.sendMessage)` to send messages
- Subscribe to typing indicators
- Handle optimistic updates

## Phase 7: Implement New Chat Flow

**Create new chat screen/modal:**

- Build UI to search users by phone number
- Use `useQuery(api.users.findByPhone)` to search
- Create or get existing conversation
- Navigate to chat screen

**Can be implemented as:**

- Modal overlay on chat list, or
- Separate screen with back navigation

## Phase 8: Add Real-Time Features

**Online status:**

- Update user's online status on app focus/blur
- Use `useMutation(api.users.updateOnlineStatus)`
- Display green dot in chat list and chat header

**Typing indicators:**

- Debounce text input changes (500ms)
- Send typing status to Convex
- Show "User is typing..." in chat screen

**Read receipts:**

- Mark messages as read when chat is opened
- Show checkmarks in message bubbles

## Phase 9: Test End-to-End Flow

**Test complete user journey:**

1. Enter test phone number (+15555550100)
2. Verify with code 424242
3. Complete profile setup
4. See chat list (empty state)
5. Create new chat with another test user
6. Send message
7. Receive message in real-time (test with 2 devices/simulators)
8. Verify typing indicators work
9. Verify online status shows correctly

**Fix any bugs found during testing**

## Critical Files Summary

**To Create:**

- `tailwind.config.js`
- `global.css`
- `app/(auth)/profile-setup.tsx`
- `app/(tabs)/_layout.tsx`
- `app/(tabs)/index.tsx` (chat list)
- `app/chat/[id].tsx` (individual chat)
- `components/ChatListItem.tsx`
- `components/MessageBubble.tsx`
- `components/MessageInput.tsx`
- `components/TypingIndicator.tsx`
- `components/NewChatButton.tsx`

**To Modify:**

- `app/_layout.tsx` (add Convex + routing logic)
- `app/(auth)/_layout.tsx` (update navigation)
- `app/(auth)/phone-input.tsx` (ensure proper routing)
- `app/(auth)/verify-otp.tsx` (navigate to profile-setup)

**To Delete:**

- `app/(auth)/sign-in.tsx`
- `app/(auth)/sign-up.tsx`
- `app/(home)/` (entire folder)

## Success Criteria

MVP is complete when:

- ✅ User can enter phone number (test number)
- ✅ User receives OTP screen with code 424242
- ✅ User can verify and reach profile setup
- ✅ User can enter name and optional profile picture
- ✅ User lands on chat list after profile setup
- ✅ User can search for another user by phone
- ✅ User can create/open a conversation
- ✅ User can send text messages
- ✅ Messages appear in real-time on both devices
- ✅ Typing indicators show when user is typing
- ✅ Online status displays correctly
- ✅ App properly handles auth state (shows auth screens when logged out, tabs when logged in)