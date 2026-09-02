// @vitest-environment jsdom
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from './Dashboard';
import * as ApiLib from '../../lib/api';
import toast from 'react-hot-toast';

vi.mock('../../lib/api', () => ({
  fetchApi: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn() },
}));

// Provide a fake matchMedia on window because Dashboard might use responsive logic internally
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('Admin Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders stats correctly from API mock', async () => {
    const mockData = {
      stats: { total: 1042, inTransit: 15, atTransit: 5, overdue: 2 },
      activeDocs: [],
      recentEvents: [],
    };

    vi.mocked(ApiLib.fetchApi).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as any);

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('1,042')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('handles API failure gracefully', async () => {
    vi.mocked(ApiLib.fetchApi).mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load dashboard data');
    });
  });
});
