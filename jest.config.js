module.exports = {
  // jest-expo compatible: babel-preset-expo for Expo React Native transforms
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'stores/**/*.ts',
    '!**/*.d.ts',
  ],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  transformIgnorePatterns: [
    'node_modules/(?!(@supabase|zustand|@react-native-async-storage|react-native-reanimated)/)',
  ],
}
