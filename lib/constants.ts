// App-wide constants
// Note: Colors have been moved to app/global.css as CSS variables
// Use NativeWind classes instead (e.g., text-gray-50, bg-violet-600, etc.)

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
