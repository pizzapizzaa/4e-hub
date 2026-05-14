// ─── Schools screen tests ─────────────────────────────────────────────────────

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { mockSchools } from '../helpers/fixtures';

jest.mock('@/lib/api/admin', () => ({
  getSchools: jest.fn(),
}));

jest.mock('@/components/admin/SchoolCard', () => ({
  SchoolCard: ({ school, onPress }: { school: { name: string; id: string }; onPress: () => void }) => (
    <button data-testid={`school-card-${school.name}`} onClick={onPress}>
      {school.name}
    </button>
  ),
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}));

import SchoolsScreen from '@/app/(admin)/schools/index';
import * as adminApi from '@/lib/api/admin';

describe('SchoolsScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows loaded schools', async () => {
    (adminApi.getSchools as jest.Mock).mockResolvedValue(mockSchools);
    await act(async () => { render(<SchoolsScreen />); });
    await waitFor(() => expect(screen.getByText('Springfield Elementary')).toBeTruthy());
    expect(screen.getByText('Shelbyville Middle')).toBeTruthy();
  });

  it('shows empty state when no schools exist', async () => {
    (adminApi.getSchools as jest.Mock).mockResolvedValue([]);
    await act(async () => { render(<SchoolsScreen />); });
    await waitFor(() => expect(screen.getByText('No schools registered yet.')).toBeTruthy());
  });

  it('navigates to school detail on card press', async () => {
    (adminApi.getSchools as jest.Mock).mockResolvedValue(mockSchools);
    await act(async () => { render(<SchoolsScreen />); });
    await waitFor(() => screen.getByTestId('school-card-Springfield Elementary'));
    fireEvent.click(screen.getByTestId('school-card-Springfield Elementary'));
    expect(mockPush).toHaveBeenCalledWith('/(admin)/schools/school-001');
  });

  it('navigates to add-school route when + Add School is pressed', async () => {
    (adminApi.getSchools as jest.Mock).mockResolvedValue([]);
    await act(async () => { render(<SchoolsScreen />); });
    await waitFor(() => screen.getByText('+ Add School'));
    fireEvent.click(screen.getByText('+ Add School'));
    expect(mockPush).toHaveBeenCalledWith('/(admin)/schools/new');
  });
});
