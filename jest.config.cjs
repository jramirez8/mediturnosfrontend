module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: [
    'src/utils/date.ts',
    'src/utils/errors.ts',
    'src/utils/doctorAccess.ts',
    'src/utils/turnos.ts',
    'src/utils/documentValidation.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
};
