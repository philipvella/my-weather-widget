const baseUrl = process.env.LHCI_BASE_URL || 'http://localhost:3000';

module.exports = {
  ci: {
    collect: {
      url: [`${baseUrl}/city/london`, `${baseUrl}/coordinates/50.447086/5.962080`],
      numberOfRuns: 1,
      settings: {
        preset: 'desktop',
        throttlingMethod: 'provided',
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 1 }],
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:best-practices': ['error', { minScore: 1 }],
        'categories:seo': ['error', { minScore: 1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
