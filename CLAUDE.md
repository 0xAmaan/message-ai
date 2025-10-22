# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MessageAI is a real-time messaging application built with React Native (Expo), using Clerk for authentication and Convex as the backend-as-a-service. The app supports direct messaging, typing indicators, read receipts, and real-time updates.

## Development Commands

### Package Management
- **Always use `bun`** for all commands (this is a bun project, not npm/yarn)
- `bun install` - Install dependencies
- `bun add <package>` - Add a new dependency
- `bun remove <package>` - Remove a dependency

### Running the Application
- `bun run dev` - Start both Expo and Convex dev servers concurrently (most common)
- `bun run start` - Start only Expo development server
- `bun run convex-dev` - Start only Convex backend server
- `bun run ios` - Start Expo on iOS simulator
- `bun run android` - Start Expo on Android emulator
- `bun run web` - Start Expo web version

### Development Tools
- `bun run lint` - Run ESLint on the codebase
- `npx convex dev` - Alternative way to run Convex dev server (if needed standalone)

## Architecture

### Tech Stack
- **Frontend**: React Native with Expo (SDK 54)
- **Router**: Expo Router (file-based routing with typed routes)
- **Authentication**: Clerk (@clerk/clerk-expo)
- **Backend**: Convex (real-time backend-as-a-service)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **TypeScript**: Strict mode enabled

### Application Structure

```
app/
├── _layout.tsx              # Root layout with auth routing logic
├── (auth)/                  # Unauthenticated routes (group)
│   ├── phone-input.tsx      # Phone number entry
│   ├── verify-otp.tsx       # OTP verification
│   ├── username-setup.tsx   # Username creation
│   └── profile-setup.tsx    # Profile setup (name, photo)
├── (tabs)/                  # Authenticated routes (tabs group)
│   └── index.tsx           # Main chat list screen
├── chat/[id].tsx           # Individual chat conversation
└── new-chat.tsx            # Create new conversation

convex/                     # Backend functions
├── schema.ts              # Database schema (4 tables)
├── users.ts               # User operations
├── conversations.ts       # Conversation management
├── messages.ts            # Message operations
├── typing.ts              # Typing indicators
└── auth.config.ts         # Clerk integration config

components/
├── ChatListItem.tsx       # Conversation preview in list
├── MessageBubble.tsx      # Individual message display
├── MessageInput.tsx       # Text input with send button
└── SignOutButton.tsx      # Logout functionality

lib/
└── constants.ts           # App-wide constants (colors, sizes)
```

### Routing Pattern (Expo Router)

- **Route Groups**: Folders in parentheses like `(auth)` and `(tabs)` don't appear in URLs, they're organizational
- **Dynamic Routes**: `[id].tsx` creates parameterized routes (e.g., `/chat/123`)
- **Root Layout**: `app/_layout.tsx` handles authentication-based routing
  - Unauthenticated → redirects to `/(auth)/phone-input`
  - Authenticated → redirects to `/(tabs)`
- **Typed Routes**: Expo Router generates TypeScript types for all routes (enabled in app.json)

### Authentication Flow

1. **Phone Input** → User enters phone number in E.164 format
2. **OTP Verification** → 6-digit SMS code verification
3. **Username Setup** → Create unique username (3-20 chars, alphanumeric + underscore)
4. **Profile Setup** → Optional name and profile picture upload
5. **Main App** → Access to chat features

**Key Points:**
- Clerk manages auth state and tokens
- `useAuth()` hook provides auth state in root layout
- `useUser()` hook provides current user data
- Auth token automatically passed to Convex via `ConvexProviderWithClerk`
- Users identified by `clerkId` throughout Convex functions

### Convex Backend Architecture

**Database Schema (4 tables):**

1. **users**
   - Stores: `clerkId`, `phoneNumber`, `name`, `profilePicUrl`, `isOnline`, `lastSeen`
   - Indexes: `by_clerk_id`, `by_phone`
   - Search users by phone number for creating chats

2. **conversations**
   - Stores: `participants[]` (clerkIds), `type` (direct/group), `lastMessageAt`, `createdAt`
   - Index: `by_participant`
   - Represents chat conversations

3. **messages**
   - Stores: `conversationId`, `senderId`, `content`, `imageId`, `createdAt`, `readBy[]`, `deliveredTo[]`
   - Indexes: `by_conversation`, `by_sender`
   - Individual messages with read receipts

4. **typing_indicators**
   - Stores: `conversationId`, `userId`, `isTyping`, `updatedAt`
   - Indexes: `by_conversation`, `by_user_conversation`
   - Real-time typing status

**Data Flow Pattern:**
- Convex functions in `convex/` directory are automatically deployed
- Frontend uses `useQuery()` for real-time subscriptions (auto-updates)
- Frontend uses `useMutation()` for write operations
- All queries return `undefined` while loading
- No manual polling needed - subscriptions handle real-time updates

**Key Convex Operations:**
```typescript
// Query (real-time subscription)
const conversations = useQuery(api.conversations.getUserConversations, { clerkId });

// Mutation (write operation)
const sendMessage = useMutation(api.messages.sendMessage);
await sendMessage({ conversationId, senderId, content });
```

### State Management

- **Convex Queries**: All data fetching uses real-time subscriptions via `useQuery()`
- **Local State**: React `useState()` only for UI state (form inputs, loading spinners)
- **No Redux/Context**: Convex handles all persistent state
- **Automatic Updates**: Components re-render when Convex data changes

### Styling

- **NativeWind**: Tailwind CSS classes work in React Native
- **Dark Theme**: Default color scheme with gray-900 background
- **Primary Color**: Violet-600 for accent/interactive elements
- **Constants**: Centralized in `lib/constants.ts`
- **Responsive**: Uses Tailwind's responsive utilities

## Common Development Patterns

### Creating New Convex Functions

When adding backend functionality:
1. Create function in appropriate `convex/*.ts` file
2. Export with `query()`, `mutation()`, or `action()`
3. Use `ctx.auth.getUserIdentity()` to get authenticated user
4. Import in frontend via `api.<file>.<function>` from `@/convex/_generated/api`

Example:
```typescript
// convex/messages.ts
export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();
  },
});

// app/chat/[id].tsx
import { api } from "@/convex/_generated/api";
const messages = useQuery(api.messages.getMessages, { conversationId });
```

### Adding New Screens

1. Create file in `app/` directory (follows file-based routing)
2. Use `<Stack.Screen>` in parent `_layout.tsx` to configure header
3. Import necessary Convex queries/mutations
4. Use `router.push()` from `expo-router` for navigation

### User Identification

- **Primary ID**: Always use `clerkId` (string) to identify users in Convex
- **Phone Number**: Secondary identifier for searching users
- **Don't use**: Email or other identifiers (not collected in this app)

### Real-Time Features

- Typing indicators: Update `typing_indicators` table with `isTyping` boolean
- Read receipts: Add `clerkId` to message's `readBy` array
- Online status: Update user's `isOnline` and `lastSeen` fields
- All use Convex subscriptions for instant updates

## Important Conventions

- **TypeScript**: Use strict mode, arrow functions exclusively
- **Imports**: Use `@/` alias for absolute imports (configured in tsconfig.json)
- **Error Handling**: Wrap async operations in try-catch, show user-facing alerts
- **Loading States**: Check for `undefined` from `useQuery()` before rendering
- **Path Aliases**: `@/` maps to project root
- **Expo New Architecture**: Enabled (`newArchEnabled: true` in app.json)
- **React Compiler**: Experimental feature enabled in app.json

## Environment Variables

Required in `.env.local`:
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk authentication key
- `EXPO_PUBLIC_CONVEX_URL` - Convex backend URL

## Testing Notes

- No test framework currently configured
- Manual testing via Expo Go app on physical device or simulator
- Use `console.log()` for debugging (appears in terminal)
- React Developer Tools available for web platform

## Convex Development

- Convex backend runs on `localhost:3210` by default
- Dashboard available at `https://dashboard.convex.dev`
- Schema changes require running `npx convex dev`
- Functions auto-reload on file save
- Check Convex logs in terminal for backend errors

## Common Issues

1. **Auth Routing Loop**: Root layout checks auth state - ensure proper conditional logic
2. **Query Returns Undefined**: Normal while loading, always check before rendering
3. **Phone Number Format**: Must use E.164 format (e.g., +14155552671)
4. **Convex Not Running**: Both Expo and Convex must run (`bun run dev` starts both)
5. **TypeScript Errors**: Run `npx convex dev` to regenerate Convex types
