module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@gash/types$': '<rootDir>/../../libs/types/src/index.ts',
    '^@gash/schemas$': '<rootDir>/../../libs/schemas/src/index.ts',
    '^@gash/constants$': '<rootDir>/../../libs/constants/src/index.ts',
    '^@gash/api-client$': '<rootDir>/../../libs/api-client/src/index.ts',
  },
  collectCoverageFrom: [
    'stores/**/*.ts',
    '!**/*.d.ts',
  ],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo|expo-modules-core|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|@supabase|zustand|@react-native-async-storage|react-native-reanimated|react-native-toast-message)/)',
  ],
}
