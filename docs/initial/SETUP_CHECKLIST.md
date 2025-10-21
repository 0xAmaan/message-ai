# Setup Checklist

## Pre-work (Do Once)

### 1. Accounts Setup
- [ ] Create Clerk account at https://dashboard.clerk.com
- [ ] Create new Clerk application
- [ ] Enable "Phone" authentication in Clerk settings
- [ ] Copy Clerk publishable key

- [ ] Create Convex account at https://dashboard.convex.dev
- [ ] Run `npx convex dev` to create project
- [ ] Copy Convex deployment URL

### 2. Project Setup
- [ ] Extract project files
- [ ] Run `npm install --legacy-peer-deps`
- [ ] Create `.env` file from `.env.example`
- [ ] Add Clerk key to `.env`
- [ ] Add Convex URL to `.env`

### 3. Clerk Webhook Configuration
- [ ] In Clerk Dashboard, go to Webhooks
- [ ] Click "Add Endpoint"
- [ ] Enter URL: `https://[YOUR_CONVEX_URL].convex.site/clerk-webhook`
- [ ] Subscribe to events: `user.created`, `user.updated`
- [ ] Save webhook

### 4. Start Development
- [ ] Run `npx convex dev` in terminal 1 (keep running)
- [ ] Run `npm start` in terminal 2
- [ ] Choose platform: iOS (i), Android (a), or scan QR

---

## Testing Checklist

### Phase 1: Authentication
- [ ] Can enter test phone number (+15555550100)
- [ ] Receives OTP screen
- [ ] Can enter code 424242
- [ ] Successfully verifies
- [ ] Reaches profile setup screen
- [ ] Can enter name
- [ ] Can select profile picture
- [ ] Profile saves to Convex
- [ ] Redirects to chat list

### Phase 2: Finding Users
- [ ] Chat list shows empty state
- [ ] Can click "New Chat" button
- [ ] Can enter phone number
- [ ] Can search for existing user
- [ ] Shows "User found" or "Not registered"
- [ ] Creates conversation on success

### Phase 3: Messaging
- [ ] Can type message
- [ ] Can send message
- [ ] Message appears in chat
- [ ] Open second device/simulator
- [ ] Sign in as different user
- [ ] Second user receives message in real-time
- [ ] Can reply
- [ ] First user sees reply

### Phase 4: Real-time Features
- [ ] Online status shows green dot
- [ ] Offline status shows gray dot
- [ ] Typing shows "User is typing..."
- [ ] Typing disappears after stop
- [ ] Messages show delivery checkmark
- [ ] Messages show read checkmark when opened

### Phase 5: Images
- [ ] Can click image icon
- [ ] Image picker opens
- [ ] Can select image
- [ ] Image uploads
- [ ] Image appears in chat
- [ ] Other user receives image
- [ ] Image loads correctly

### Phase 6: Offline
- [ ] Turn off WiFi
- [ ] Send message
- [ ] Message shows "sending..." status
- [ ] Message stored in queue
- [ ] Turn on WiFi
- [ ] Message automatically sends
- [ ] Status updates to delivered/read

### Phase 7: Group Chat
- [ ] Can add 2 users to conversation
- [ ] All 3 users see messages
- [ ] Messages sync in real-time
- [ ] Everyone can send/receive

---

## Quick Reference

### Test Phone Numbers (Dev Mode)
```
+15555550100
+15555550101
+15555550102
+15555550103
+15555550104
```
OTP: Always `424242`

### Common Commands
```bash
# Start Convex backend
npx convex dev

# Start Expo app
npm start

# iOS simulator
npm run ios

# Android emulator
npm run android

# Clear cache
npx expo start -c

# Reinstall deps
rm -rf node_modules && npm install --legacy-peer-deps
```

### Environment Variables
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_CONVEX_URL=https://your-app.convex.cloud
```

### URLs
- Clerk Dashboard: https://dashboard.clerk.com
- Convex Dashboard: https://dashboard.convex.dev
- Expo Dashboard: https://expo.dev

---

## Troubleshooting

**"Module not found"**
→ Run `npm install --legacy-peer-deps`

**"Cannot connect to Convex"**
→ Make sure `npx convex dev` is running
→ Check URL in .env

**"User not syncing from Clerk"**
→ Check webhook in Clerk dashboard
→ Verify webhook URL is correct
→ Check Convex function logs

**"SMS not received"**
→ Use test numbers with 424242 code
→ Check Clerk SMS allowance (20/month free)

**"App crashes on launch"**
→ Clear cache: `npx expo start -c`
→ Check .env file exists
→ Verify all keys are correct

---

## Next Steps After Setup

1. ✅ Complete profile setup screen (in progress)
2. ✅ Test full auth flow
3. ✅ Implement chat list UI
4. ✅ Build message sending/receiving
5. ✅ Add real-time features
6. ✅ Implement image sharing
7. ✅ Add offline support
8. ✅ Test group chat

---

**Need help?** Check the [MVP_IMPLEMENTATION_GUIDE.md](./MVP_IMPLEMENTATION_GUIDE.md)
