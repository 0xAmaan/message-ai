# MessageAI

A real-time messaging application built with React Native (Expo), featuring direct messaging, group chats, typing indicators, read receipts, and image sharing.

### MVP Testing Installation
- Clone Repo — `git clone https://github.com/0xAmaan/message-ai.git`
- Install Packages — `bun i`
- Add keys I provided to .env
- Open two separate terminals and run:
  - `bun run convex-dev`
  - `bun start`

## Features

### Core Messaging
- One-on-one direct messaging
- Group chat support (3+ participants)
- Real-time message delivery
- Message persistence (survives app restarts)
- Optimistic UI updates (instant message display)
- Image sending and receiving
- Message timestamps

### User Experience
- Read receipts (checkmark for sent, double checkmark for read)
- Typing indicators ("[Name] is typing...")
- Online/offline status indicators
- Push notifications (foreground)
- Phone number authentication

## Tech Stack

- **Frontend:** React Native with Expo SDK 54
- **Routing:** Expo Router (file-based routing)
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Authentication:** Clerk
- **Backend:** Convex (real-time backend-as-a-service)
- **State Management:** Convex real-time subscriptions
- **Images:** Expo Image, Expo Image Picker
- **Notifications:** expo-notifications

## Prerequisites

- Node.js 18+ or Bun 1.0+
- iOS Simulator (macOS) or Android Emulator
- Expo Go app (for physical device testing)
- Clerk account (for authentication)
- Convex account (for backend)

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd message-ai
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```bash
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   EXPO_PUBLIC_CONVEX_URL=https://...convex.cloud
   ```

4. **Set up Convex**
   ```bash
   npx convex dev
   ```

   This will:
   - Create a new Convex project (first time only)
   - Deploy your backend functions
   - Generate TypeScript types
   - Start watching for changes

5. **Set up Clerk**
   - Go to [clerk.com](https://clerk.com) and create a project
   - Enable phone number authentication
   - Copy your publishable key to `.env.local`

## Running the App

### Development Mode

**Start both Expo and Convex servers:**
```bash
bun run dev
```

This runs both `expo start` and `npx convex dev` concurrently.

**Or run them separately:**
```bash
# Terminal 1: Expo
bun run start

# Terminal 2: Convex
bun run convex-dev
```

### Platform-Specific Commands

```bash
# iOS Simulator
bun run ios

# Android Emulator
bun run android

# Web Browser
bun run web
```

## Project Structure

```
message-ai/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication flow
│   │   ├── phone-input.tsx
│   │   ├── verify-otp.tsx
│   │   ├── username-setup.tsx
│   │   └── profile-setup.tsx
│   ├── (tabs)/            # Main app (authenticated)
│   │   └── index.tsx      # Chat list
│   ├── chat/[id].tsx      # Individual chat screen
│   ├── new-chat.tsx       # Create new chat/group
│   └── _layout.tsx        # Root layout
│
├── components/            # Reusable components
│   ├── ChatListItem.tsx   # Conversation preview
│   ├── MessageBubble.tsx  # Individual message
│   ├── MessageInput.tsx   # Text input + image picker
│   └── SignOutButton.tsx
│
├── convex/               # Backend (Convex)
│   ├── schema.ts         # Database schema
│   ├── users.ts          # User operations
│   ├── conversations.ts  # Conversation management
│   ├── messages.ts       # Message CRUD
│   ├── typing.ts         # Typing indicators
│   └── auth.config.ts    # Clerk integration
│
├── lib/                  # Utilities
│   ├── constants.ts      # App constants
│   ├── notifications.ts  # Push notification setup
│   └── network.ts        # Network status hook
│
└── docs/                 # Documentation
    ├── MVP_TESTING_CHECKLIST.md
    ├── IMPLEMENTATION_SUMMARY.md
    └── BUG_FIXES.md
```

## Key Features Explained

### Real-Time Messaging
- Uses Convex subscriptions for instant updates - no manual polling needed.

### Optimistic UI
When you send a message, it appears instantly in your chat with a pending indicator (clock). The app:
1. Shows the message immediately (optimistic update)
2. Sends to server in the background
3. Updates indicator to checkmark when confirmed
4. Changes to double checkmark when recipient reads it

### Read Receipts
- **Single checkmark** = Message sent and delivered
- **Double checkmark** = Message read by recipient(s)
- **Clock icon** = Message pending/sending

### Group Chats
To create a group chat:
1. Tap the "+" button
2. Select 2 or more users (checkboxes appear)
3. Tap "Create Group (X people)"
4. Start chatting!

### Online Status
- Green dot on avatar = User is online
- No dot = User is offline
- Updates automatically when users open/close the app

## Development Commands

```bash
# Install dependencies
bun install

# Start development servers
bun run dev

# Run linter
bun run lint

# Deploy Convex functions
npx convex deploy

# Clear Expo cache
expo start -c
```

## Environment Variables

Required in `.env.local`:

```bash
# Clerk Authentication
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx

# Convex Backend
EXPO_PUBLIC_CONVEX_URL=https://xxxxx.convex.cloud
```

## Database Schema

### Tables:
- User profiles, online status, phone numbers
- Chat metadata (direct/group, participants)
- Message content, images, read receipts
- Real-time typing status

See `convex/schema.ts` for full schema definition.

## Architecture

### Authentication Flow
```
Phone Input -> OTP Verification -> Username Setup -> Profile Setup -> Main App
```

### Message Flow
```
User types -> Optimistic Update -> Convex Mutation -> Database Update -> Real-time Sync to All Clients
```

### Image Upload Flow
```
Pick Image -> Request Upload URL -> Upload to Convex Storage -> Send Message with Storage ID -> Recipients Fetch Image URL
```

## Deployment

### Convex Backend
```bash
# Deploy to production
npx convex deploy

# Set production environment variables
npx convex env set CLERK_PUBLISHABLE_KEY pk_live_xxxxx
```

### Mobile App

**iOS (TestFlight):**
```bash
# Install EAS CLI
npm install -g eas-cli

# Build for iOS
eas build --platform ios

# Submit to TestFlight
eas submit --platform ios
```

**Android (APK/Play Store):**
```bash
# Build for Android
eas build --platform android

# Submit to Play Store
eas submit --platform android
```



## Tech Stack

- Built with [Expo](https://expo.dev)
- Backend by [Convex](https://convex.dev)
- Authentication by [Clerk](https://clerk.com)
- Styled with [NativeWind](https://nativewind.dev)
