module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', { configFile: './babel.config.js' }],
  },
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
    'node_modules/(?!(@supabase|zustand|@react-native-async-storage|react-native-reanimated)/)',
  ],
}
