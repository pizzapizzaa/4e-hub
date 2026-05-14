// ─── Admin Dashboard tests ────────────────────────────────────────────────────

import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { mockPrograms, mockSchools, mockSyncStatus } from '../helpers/fixtures';

// ── Module mocks ──────────────────────────────────────────────────────────────

jest.mock('@/lib/api/admin', () => ({
  getSchools: jest.fn(),
  getPrograms: jest.fn(),
  getTeachers: jest.fn(),
  getLearners: jest.fn(),
  getSyncStatus: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('@/lib/auth/session', () => ({
  getCurrentUser: jest.fn(),
  getCurrentRole: jest.fn(),
  getSession: jest.fn(),
  isSessionExpired: jest.fn(() => false),
}));

jest.mock('@/components/admin/SyncStatus', () => ({
  SyncStatusCard: ({ status }: { status: { isPending: boolean } }) => (
    <span data-testid="sync-card">{status.isPending ? 'Syncing...' : 'Up to date'}</span>
  ),
}));

import AdminDashboard from '@/app/(admin)/index';
import * as adminApi from '@/lib/api/admin';

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockTeachers = [{ id: 't1' }, { id: 't2' }];
const mockLearners = [{ id: 's1' }];

function setupSuccessfulLoad() {
  (adminApi.getSchools as jest.Mock).mockResolvedValue(mockSchools);
  (adminApi.getPrograms as jest.Mock).mockResolvedValue(mockPrograms);
  (adminApi.getTeachers as jest.Mock).mockResolvedValue(mockTeachers);
  (adminApi.getLearners as jest.Mock).mockResolvedValue(mockLearners);
  (adminApi.getSyncStatus as jest.Mock).mockResolvedValue(mockSyncStatus);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AdminDashboard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the heading after load', async () => {
    setupSuccessfulLoad();
    await act(async () => { render(<AdminDashboard />); });
    await waitFor(() => expect(screen.getByText('4E Global Admin')).toBeTruthy());
  });

  it('renders correct school count after load', async () => {
    setupSuccessfulLoad();
    await act(async () => { render(<AdminDashboard />); });
    await waitFor(() => expect(screen.getByText('Schools')).toBeTruthy());
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the sync status card after load', async () => {
    setupSuccessfulLoad();
    await act(async () => { render(<AdminDashboard />); });
    await waitFor(() => expect(screen.getByTestId('sync-card')).toBeTruthy());
    expect(screen.getByText('Up to date')).toBeTruthy();
  });

  it('shows an error message when an API call fails', async () => {
    (adminApi.getSchools as jest.Mock).mockRejectedValue(new Error('Network error'));
    (adminApi.getPrograms as jest.Mock).mockResolvedValue([]);
    (adminApi.getTeachers as jest.Mock).mockResolvedValue([]);
    (adminApi.getLearners as jest.Mock).mockResolvedValue([]);
    (adminApi.getSyncStatus as jest.Mock).mockResolvedValue(mockSyncStatus);

    await act(async () => { render(<AdminDashboard />); });
    await waitFor(() => expect(screen.getByText('Network error')).toBeTruthy());
  });

  it('calls all five API endpoints on mount', async () => {
    setupSuccessfulLoad();
    await act(async () => { render(<AdminDashboard />); });
    await waitFor(() => expect(adminApi.getSchools).toHaveBeenCalledTimes(1));
    expect(adminApi.getPrograms).toHaveBeenCalledTimes(1);
    expect(adminApi.getTeachers).toHaveBeenCalledTimes(1);
    expect(adminApi.getLearners).toHaveBeenCalledTimes(1);
    expect(adminApi.getSyncStatus).toHaveBeenCalledTimes(1);
  });
});
