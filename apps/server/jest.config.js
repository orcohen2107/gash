/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@gash/types$': '<rootDir>/../../libs/types/src/index.ts',
    '^@gash/schemas$': '<rootDir>/../../libs/schemas/src/index.ts',
    '^@gash/constants$': '<rootDir>/../../libs/constants/src/index.ts',
    '^@gash/api-client$': '<rootDir>/../../libs/api-client/src/index.ts',
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
}
