export default {
  clearMocks: true,
  collectCoverage: false,
  coverageThreshold: {
    global: {
      // lines: 1,
      branches: 2
      // functions: 0,
      // statements: 0
    }
  },
  collectCoverageFrom: ['**/*.{js,jsx,ts,tsx}'],
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts', '<rootDir>/src/__mocks__/localStorage.ts']
};
