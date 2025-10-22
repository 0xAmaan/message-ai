// App-wide constants - Dark Mode Theme

export const COLORS = {
  // Purple accent colors
  primary: "#8B5CF6", // violet-500
  primaryDark: "#7C3AED", // violet-600
  primaryLight: "#A78BFA", // violet-400

  // Dark backgrounds
  background: "#111827", // gray-900
  surface: "#1F2937", // gray-800
  surfaceLight: "#374151", // gray-700

  // Text colors
  textPrimary: "#F9FAFB", // gray-50
  textSecondary: "#9CA3AF", // gray-400
  textTertiary: "#6B7280", // gray-500

  // Legacy compatibility (kept for gradual migration)
  white: "#F9FAFB",
  black: "#111827",
  gray: "#9CA3AF",
  lightGray: "#374151",

  // Message bubbles
  sent: "#8B5CF6", // violet-500 for sent messages
  received: "#374151", // gray-700 for received messages

  // Status colors
  online: "#10B981", // emerald-500
  offline: "#6B7280", // gray-500

  // Borders
  border: "#374151", // gray-700
  borderLight: "#4B5563", // gray-600
};

export const SIZES = {
  padding: 16,
  radius: 8,
  avatarSmall: 40,
  avatarLarge: 80,
};

export const TYPING_TIMEOUT = 3000; // 3 seconds
export const MESSAGE_FETCH_LIMIT = 50;
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// Test phone numbers for development (no SMS sent, code is always 424242)
export const TEST_PHONE_NUMBERS = [
  "+15555550100",
  "+15555550101",
  "+15555550102",
  "+15555550103",
  "+15555550104",
];

// For actual testing with real phones during demo
export const DEMO_PHONE_NUMBERS = [
  // Add your real phone numbers here when ready for demo
];
