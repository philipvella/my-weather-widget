module.exports = {
  test: {
    environment: 'node',
    include: ['__tests__/**/*.test.js'],
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
  },
};

