# Reusable Components & Style Patterns

This document identifies reusable components and style patterns found throughout the app that could be extracted into shared components for better code reuse and consistency.

## Identified Reusable Components

### 1. Avatar Component
**Current Usage Locations:**
- `components/ChatListItem.tsx` - User avatar in chat list
- `app/new-chat.tsx` - User avatar in user selection list
- Previously in `app/chat/[id].tsx` header (now removed in favor of Stack header)

**Proposed API:**
```tsx
interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg"; // 40px, 50px, 80px
  isOnline?: boolean;
  imageUrl?: string;
}

// Usage:
<Avatar name="John Doe" size="md" isOnline={true} />
```

**Style Pattern:**
```
- Small (40px):  className="w-10 h-10 rounded-full bg-violet-600 justify-center items-center"
- Medium (50px): className="w-12 h-12 rounded-full bg-violet-600 justify-center items-center"
- Large (80px):  className="w-20 h-20 rounded-full bg-violet-600 justify-center items-center"
- Text: className="text-gray-50 text-xl font-semibold"
- Online dot: className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-gray-800"
```

---

### 2. Button Component
**Current Usage Locations:**
- All auth screens (phone-input, verify-otp, username-setup, profile-setup)
- `app/(tabs)/index.tsx` - New chat button in empty state, FAB
- `components/MessageInput.tsx` - Send button

**Proposed API:**
```tsx
interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onPress: () => void;
}

// Usage:
<Button variant="primary" onPress={handleSubmit} isLoading={loading}>
  Continue
</Button>
```

**Style Patterns:**
```
Primary: className="bg-violet-600 px-8 py-4 rounded-lg items-center active:bg-violet-700"
Secondary: className="bg-gray-700 px-8 py-4 rounded-lg items-center active:bg-gray-600"
Ghost: className="px-8 py-4 rounded-lg items-center active:bg-gray-800"
Disabled: Add "opacity-60" to any variant
Text: className="text-gray-50 text-base font-semibold"
```

---

### 3. Input Component
**Current Usage Locations:**
- All auth screens
- `app/new-chat.tsx` - Search input
- `components/MessageInput.tsx` - Message text input

**Proposed API:**
```tsx
interface InputProps {
  label?: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  hint?: string;
  keyboardType?: KeyboardType;
  multiline?: boolean;
  maxLength?: number;
  secureTextEntry?: boolean;
}

// Usage:
<Input
  label="Phone Number"
  placeholder="+1234567890"
  value={phone}
  onChangeText={setPhone}
  hint="Include country code"
/>
```

**Style Patterns:**
```
Container: className="mb-8"
Label: className="text-base font-semibold mb-2 text-gray-50"
Input: className="border border-gray-700 bg-gray-800 rounded-lg p-4 text-base text-gray-50"
Hint: className="text-xs text-gray-400 mt-1.5"
Placeholder color: "#9CA3AF" (gray-400)
```

---

### 4. EmptyState Component
**Current Usage Locations:**
- `app/(tabs)/index.tsx` - No chats state
- `app/new-chat.tsx` - No users found state

**Proposed API:**
```tsx
interface EmptyStateProps {
  icon: string; // Emoji
  title: string;
  subtitle: string;
  actionButton?: {
    label: string;
    onPress: () => void;
  };
}

// Usage:
<EmptyState
  icon="💬"
  title="No chats yet"
  subtitle="Start a conversation by tapping the button below"
  actionButton={{ label: "+ New Chat", onPress: handleNewChat }}
/>
```

**Style Patterns:**
```
Container: className="flex-1 justify-center items-center px-10"
Icon: className="text-6xl mb-4"
Title: className="text-xl font-bold text-gray-50 mb-2"
Subtitle: className="text-sm text-gray-400 text-center mb-8"
```

---

### 5. LoadingSpinner Component
**Current Usage Locations:**
- Multiple screens showing loading states
- Buttons with loading states

**Proposed API:**
```tsx
interface LoadingSpinnerProps {
  size?: "small" | "large";
  color?: string;
}

// Usage:
<LoadingSpinner size="large" color="#8B5CF6" />
```

**Style Pattern:**
```
Container for centered: className="flex-1 justify-center items-center"
Default color: "#8B5CF6" (violet-500)
```

---

## Reusable Style Patterns

### Color Classes
```
Primary Purple: bg-violet-600, text-violet-600, border-violet-600
Secondary Purple: bg-violet-500, text-violet-500
Active Purple: bg-violet-700, text-violet-700

Background Dark: bg-gray-900
Surface Dark: bg-gray-800
Surface Light Dark: bg-gray-700

Text Primary: text-gray-50
Text Secondary: text-gray-400
Text Tertiary: text-gray-500

Border: border-gray-700
Border Light: border-gray-600

Online Indicator: bg-emerald-500
Success: text-emerald-500, bg-emerald-500
```

### Layout Patterns
```
Full Screen Container: className="flex-1 bg-gray-900"
Card/Surface: className="bg-gray-800 rounded-lg p-4 border border-gray-700"
Header: className="flex-row justify-between items-center p-5 bg-gray-800 border-b border-gray-700"
List Item: className="flex-row items-center p-4 bg-gray-800 border-b border-gray-700 active:bg-gray-700"
```

### Typography Patterns
```
Page Title: className="text-3xl font-bold text-gray-50"
Section Title: className="text-xl font-bold text-gray-50"
Body Text: className="text-base text-gray-50"
Secondary Text: className="text-sm text-gray-400"
Caption/Hint: className="text-xs text-gray-400"
Label: className="text-base font-semibold text-gray-50"
```

### Spacing Patterns
```
Page Padding: className="p-5"
Section Margin: className="mb-8"
Element Margin: className="mb-4"
Small Gap: className="mb-2"
Horizontal Spacing: className="mr-3" or className="ml-3"
```

### Interactive Patterns
```
Touchable Active State: className="active:bg-gray-700"
Button Active: className="active:bg-violet-700"
Disabled State: Add "opacity-60"
Shadow (FAB): className="shadow-lg"
```

### Border Radius Patterns
```
Small: className="rounded"
Medium: className="rounded-lg"
Large: className="rounded-xl"
Full (pills, avatars): className="rounded-full"
Custom rounded corners: className="rounded-br-sm" (message bubbles)
```

---

## Priority for Extraction

### High Priority (Immediate)
1. **Avatar** - Used in 3+ places, highly repetitive
2. **Button** - Used in 7+ places, consistent pattern needed
3. **Input** - Used in 6+ places, forms are common

### Medium Priority (Near Future)
4. **EmptyState** - Used in 2 places, will grow
5. **LoadingSpinner** - Simple but frequently needed

### Low Priority (Future)
- Badge component (for online status)
- Card/Surface wrapper component
- List item wrapper component

---

## Benefits of Extraction

1. **Consistency**: All avatars/buttons look the same across the app
2. **Maintainability**: Change styling in one place
3. **Type Safety**: Strongly typed props prevent errors
4. **Accessibility**: Add accessibility features in one place
5. **Theming**: Easier to update colors/styles globally
6. **Testing**: Test components in isolation

---

## Next Steps

1. Create `components/ui/` directory
2. Extract Avatar component first (most reusable)
3. Extract Button component (high impact)
4. Extract Input component (forms consistency)
5. Update existing code to use new components
6. Add Storybook or similar for component documentation

