/** @type {import('jest').Config} */
const config = {
  // Only pick up *.test.ts(x) files — exclude helper/fixture files
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)', '**/?(*.)+(spec|test).[tj]s?(x)'],

  // Use jsdom — admin is a web app, no native runtime needed
  testEnvironment: 'jest-environment-jsdom',

  // Babel transform via babel-preset-expo (handles TS, JSX, RN aliases)
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },

  // Module alias mirrors tsconfig paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Stub native-only modules that have no web equivalent
    '^expo-secure-store$': '<rootDir>/__mocks__/expo-secure-store.js',
    '^expo-sqlite$': '<rootDir>/__mocks__/expo-sqlite.js',
    '^expo-haptics$': '<rootDir>/__mocks__/expo-haptics.js',
    // react-native → react-native-web for DOM rendering
    '^react-native$': 'react-native-web',
  },

  // Transform react-native and expo packages (they ship as untranspiled source)
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|react-native-web|@react-native|expo|@expo|@react-navigation)/)',
  ],

  collectCoverageFrom: [
    'app/(admin)/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!lib/db/turso.ts',
    '!**/*.d.ts',
  ],
};

module.exports = config;


