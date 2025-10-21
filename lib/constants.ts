// App-wide constants

export const COLORS = {
  primary: '#25D366', // WhatsApp green
  primaryDark: '#128C7E',
  secondary: '#34B7F1',
  background: '#ECE5DD',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#8696A0',
  lightGray: '#E9EDEF',
  sent: '#D9FDD3', // Sent message bubble
  received: '#FFFFFF', // Received message bubble
  online: '#25D366',
  offline: '#8696A0',
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
  '+15555550100',
  '+15555550101',
  '+15555550102',
  '+15555550103',
  '+15555550104',
];

// For actual testing with real phones during demo
export const DEMO_PHONE_NUMBERS = [
  // Add your real phone numbers here when ready for demo
];
