import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock import.meta.env
const mockEnv = {
  VITE_API_BASE_URL: 'http://test-api.com/api/v1',
  VITE_BLOG_TITLE: 'Test Blog',
  VITE_ENABLE_SEARCH: 'true',
  VITE_POSTS_PER_PAGE: '10',
  VITE_DEBUG_MODE: 'false',
};

vi.stubGlobal('import', {
  meta: {
    env: mockEnv,
  },
});

describe('Environment Configuration', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should load configuration from environment variables', async () => {
    const { config } = await import('../env');
    
    expect(config.apiBaseUrl).toBe('http://test-api.com/api/v1');
    expect(config.blogTitle).toBe('Test Blog');
    expect(config.enableSearch).toBe(true);
    expect(config.postsPerPage).toBe(10);
    expect(config.debugMode).toBe(false);
  });

  it('should use default values when environment variables are not set', async () => {
    vi.stubGlobal('import', {
      meta: {
        env: {},
      },
    });

    const { config } = await import('../env');
    
    expect(config.apiBaseUrl).toBe('http://localhost:8000/api/v1');
    expect(config.blogTitle).toBe('Reddit Trends Blog');
    expect(config.enableSearch).toBe(true);
    expect(config.postsPerPage).toBe(12);
  });

  it('should handle boolean environment variables correctly', async () => {
    vi.stubGlobal('import', {
      meta: {
        env: {
          VITE_ENABLE_COMMENTS: 'true',
          VITE_ENABLE_SEARCH: 'false',
          VITE_DEBUG_MODE: '1',
          VITE_MOCK_API: '0',
        },
      },
    });

    const { config } = await import('../env');
    
    expect(config.enableComments).toBe(true);
    expect(config.enableSearch).toBe(false);
    expect(config.debugMode).toBe(true);
    expect(config.mockApi).toBe(false);
  });
});