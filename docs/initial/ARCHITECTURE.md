# System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Mobile App Layer                         │
│                      (React Native + Expo)                       │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │   Auth UI    │  │   Chat UI    │  │   Profile UI          │ │
│  │  - Phone     │  │  - Messages  │  │  - Name/Picture       │ │
│  │  - OTP       │  │  - Typing    │  │  - Settings           │ │
│  │  - Setup     │  │  - Images    │  │                       │ │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬───────────┘ │
└─────────┼──────────────────┼──────────────────────┼─────────────┘
          │                  │                      │
          ▼                  ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Integration Layer                           │
│                                                                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐│
│  │  Clerk Provider │  │  Convex Provider │  │  AsyncStorage   ││
│  │  - useAuth()    │  │  - useQuery()    │  │  - Queue API    ││
│  │  - useUser()    │  │  - useMutation() │  │  - Cache API    ││
│  │  - useSignUp()  │  │  - useAction()   │  │                 ││
│  └────────┬────────┘  └────────┬─────────┘  └────────┬────────┘│
└───────────┼────────────────────┼─────────────────────┼──────────┘
            │                    │                     │
            │                    │                     │
            ▼                    ▼                     ▼
┌───────────────────┐  ┌────────────────────┐  ┌──────────────────┐
│   Clerk Backend   │  │  Convex Backend    │  │  Local Storage   │
│                   │  │                    │  │                  │
│  - Auth Service   │  │  - Database        │  │  - Queue         │
│  - SMS Delivery   │  │  - Real-time Sync  │  │  - Cache         │
│  - User Mgmt      │  │  - File Storage    │  │  - Preferences   │
│  - Webhooks       │──┼─→ HTTP Actions     │  │                  │
└───────────────────┘  └────────────────────┘  └──────────────────┘
```

---

## Data Flow Diagrams

### 1. User Sign Up Flow

```
User Device                 Clerk                    Convex
    │                        │                         │
    │  Enter Phone Number    │                         │
    ├───────────────────────→│                         │
    │                        │                         │
    │  Send SMS OTP          │                         │
    │←───────────────────────┤                         │
    │                        │                         │
    │  Enter OTP Code        │                         │
    ├───────────────────────→│                         │
    │                        │                         │
    │  Verify Success        │  Webhook (user.created) │
    │←───────────────────────┤────────────────────────→│
    │                        │                         │
    │                        │   Create User Record    │
    │                        │←────────────────────────┤
    │                        │                         │
    │  Profile Setup Screen  │                         │
    │                        │                         │
    │  Submit Profile        │                         │
    ├────────────────────────┴────────────────────────→│
    │                                                   │
    │  Success, Navigate to App                        │
    │←──────────────────────────────────────────────────┤
```

### 2. Sending a Message Flow

```
Sender Device              Convex Backend           Recipient Device
    │                          │                         │
    │  Type Message            │                         │
    │                          │                         │
    │  Press Send              │                         │
    ├─────────────────────────→│                         │
    │  (Optimistic Update)     │                         │
    │  Message appears         │  Save to DB             │
    │                          │                         │
    │  Mutation Success        │  Trigger Subscriptions  │
    │←─────────────────────────┤────────────────────────→│
    │                          │                         │
    │                          │   New Message Event     │
    │                          │←────────────────────────┤
    │                          │                         │
    │                          │   Query Re-execution    │
    │                          │────────────────────────→│
    │                          │                         │
    │                          │   Updated Data          │
    │                          │────────────────────────→│
    │                          │                         │
    │                          │    UI Updates           │
    │                          │    Message Appears      │
```

### 3. Offline Message Queue Flow

```
User Device          AsyncStorage            Network              Convex
    │                    │                      │                   │
    │  Send Message      │                      │                   │
    ├───────────────────→│  [No Connection]     │                   │
    │                    │                      X                   │
    │  Store in Queue    │                      │                   │
    │←───────────────────┤                      │                   │
    │                    │                      │                   │
    │  Show "Sending..." │                      │                   │
    │                    │                      │                   │
    │  [Connection Returns]                     │                   │
    │                    │                      │                   │
    │  Flush Queue       │                      │                   │
    ├───────────────────→│                      │                   │
    │                    │  Send All Queued     │                   │
    │                    ├─────────────────────→│──────────────────→│
    │                    │                      │                   │
    │                    │  Success             │  Messages Saved   │
    │                    │←─────────────────────┤←──────────────────┤
    │                    │                      │                   │
    │  Clear Queue       │                      │                   │
    │←───────────────────┤                      │                   │
    │                    │                      │                   │
    │  Update UI         │                      │                   │
```

---

## Component Architecture

### Screen Hierarchy

```
App Root (_layout.tsx)
│
├─ ClerkProvider
│  └─ ConvexProvider
│     │
│     ├─ (auth)/ ──────────── Unauthenticated Routes
│     │  ├─ phone-input.tsx
│     │  ├─ verify-otp.tsx
│     │  └─ profile-setup.tsx
│     │
│     └─ (tabs)/ ──────────── Authenticated Routes
│        ├─ chats.tsx ──────── Chat List
│        │  └─ Components:
│        │     ├─ ChatListItem
│        │     ├─ NewChatButton
│        │     └─ SearchBar
│        │
│        ├─ profile.tsx ────── User Profile
│        │
│        └─ chat/[id].tsx ──── Individual Chat
│           └─ Components:
│              ├─ MessageBubble
│              ├─ MessageInput
│              ├─ TypingIndicator
│              ├─ OnlineStatus
│              └─ ImageViewer
```

### Component Interaction

```
ChatScreen
    │
    ├─ useQuery(getMessages) ─────→ Convex
    │                                  │
    ├─ useMutation(sendMessage) ──────→ Convex
    │                                  │
    ├─ useQuery(getTypingUsers) ──────→ Convex
    │                                  │
    └─ Components:
        │
        ├─ MessageBubble[] ←─────── messages.map()
        │  ├─ Text Content
        │  ├─ Image (if imageId)
        │  ├─ Timestamp
        │  └─ Read Status
        │
        ├─ TypingIndicator ←────── typingUsers.length > 0
        │  └─ Animated Dots
        │
        └─ MessageInput
           ├─ TextInput ──────────→ onChange → debounce → updateTyping
           ├─ ImagePicker ────────→ onSelect → upload → send
           └─ SendButton ─────────→ onClick → mutation → optimistic UI
```

---

## Database Schema Relationships

```
┌─────────────┐
│    Users    │
│             │
│ - clerkId   │──┐
│ - phone     │  │
│ - name      │  │
│ - photoUrl  │  │
│ - isOnline  │  │
└─────────────┘  │
                 │
                 │ participants[]
                 │
       ┌─────────┴──────────┐
       │                    │
       ▼                    │
┌─────────────────┐         │
│  Conversations  │         │
│                 │         │
│ - participants[]│◄────────┘
│ - type          │
│ - lastMessageAt │
└────────┬────────┘
         │
         │ conversationId
         │
         ▼
┌─────────────────┐
│    Messages     │
│                 │
│ - conversationId│
│ - senderId ─────┼─────→ Users.clerkId
│ - content       │
│ - imageId       │────→ Convex Storage
│ - readBy[]      │────→ Users.clerkId[]
│ - deliveredTo[] │────→ Users.clerkId[]
└─────────────────┘

┌─────────────────────┐
│ Typing Indicators   │
│                     │
│ - conversationId ───┼──→ Conversations._id
│ - userId ───────────┼──→ Users.clerkId
│ - isTyping          │
│ - updatedAt         │
└─────────────────────┘
```

---

## Security Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Security Layers                        │
└──────────────────────────────────────────────────────────┘

Layer 1: Authentication (Clerk)
───────────────────────────────
• Phone number verification (SMS OTP)
• JWT token generation
• Secure token storage (SecureStore)
• Automatic token refresh

Layer 2: Authorization (Convex)
───────────────────────────────
• Validate Clerk JWT on every request
• Check user permissions
• Row-level security (users can only access their convos)
• Rate limiting on mutations

Layer 3: Data Protection
───────────────────────────────
• All network traffic over HTTPS
• Tokens encrypted at rest
• Images stored securely in Convex
• No sensitive data in logs

Layer 4: Client-Side
───────────────────────────────
• No API keys in client code
• Validate all inputs
• Sanitize user content
• XSS protection

Security Flow:
User → [Clerk Auth] → [JWT Token] → [Convex Validation] → [Data Access]
         ✓               ✓               ✓                    ✓
```

---

## Scalability Considerations

### Current Architecture (MVP - 5 users)
```
Single Convex Deployment
├─ Auto-scaling backend
├─ Shared database
└─ Real-time WebSocket per user
```

### Future Scale (100+ users)
```
Convex Production Tier
├─ Horizontal scaling (automatic)
├─ Database sharding (automatic)
├─ CDN for images
├─ Message pagination
└─ Background jobs for cleanup
```

### Future Scale (1000+ users)
```
Enterprise Architecture
├─ Multiple Convex deployments (regions)
├─ Redis cache layer
├─ Dedicated file storage (S3/CloudFlare)
├─ Message search (Elasticsearch)
├─ Push notification service
└─ Analytics pipeline
```

---

## Performance Optimizations

### Client-Side
1. **Optimistic Updates**: Messages appear instantly
2. **Lazy Loading**: Load images on demand
3. **Pagination**: Fetch 50 messages at a time
4. **Debouncing**: Typing indicators batched
5. **Memoization**: Cache computed values

### Backend (Convex)
1. **Indexes**: All queries use proper indexes
2. **Subscriptions**: Only send changed data
3. **Batch Operations**: Group related mutations
4. **Query Limits**: Max 100 messages per query
5. **Cleanup Jobs**: Remove old typing indicators

### Network
1. **WebSocket**: Persistent connection (not polling)
2. **Delta Updates**: Send only changes
3. **Compression**: Gzip for HTTP
4. **Image Optimization**: Compress before upload
5. **Offline Queue**: Batch sends on reconnect

---

This architecture supports:
- ✅ Real-time messaging
- ✅ Offline functionality
- ✅ Scalable design
- ✅ Secure by default
- ✅ Simple to maintain
