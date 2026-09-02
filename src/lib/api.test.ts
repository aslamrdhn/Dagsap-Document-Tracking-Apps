import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchApi } from './api';

describe('fetchApi Utility', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should include Authorization header when token is in localStorage', async () => {
    const mockToken = 'mock-jwt-token';
    vi.mocked(localStorage.getItem).mockReturnValue(mockToken);

    // Setup fetch mock
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ success: true })));

    await fetchApi('/api/test');

    expect(localStorage.getItem).toHaveBeenCalledWith('token');
    expect(fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.any(Headers),
      })
    );

    // Check if the header was set correctly
    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const requestHeaders = fetchCall[1]?.headers as Headers;
    expect(requestHeaders.get('Authorization')).toBe(`Bearer ${mockToken}`);
  });

  it('should not include Authorization header if token is missing', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ success: true })));

    await fetchApi('/api/test');

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const requestHeaders = fetchCall[1]?.headers as Headers;
    expect(requestHeaders.get('Authorization')).toBeNull();
  });

  it('should set Content-Type to application/json for stringified bodies', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ success: true })));

    await fetchApi('/api/test', {
      method: 'POST',
      body: JSON.stringify({ data: 123 }),
    });

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const requestHeaders = fetchCall[1]?.headers as Headers;
    expect(requestHeaders.get('Content-Type')).toBe('application/json');
  });
});
