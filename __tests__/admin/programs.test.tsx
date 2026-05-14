// ─── Programs screen tests ────────────────────────────────────────────────────

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { mockPrograms } from '../helpers/fixtures';

jest.mock('@/lib/api/admin', () => ({
  getPrograms: jest.fn(),
}));

jest.mock('@/components/admin/ProgramCard', () => ({
  ProgramCard: ({ program, onPress }: { program: { name: string; id: string }; onPress: () => void }) => (
    <button data-testid={`program-card-${program.name}`} onClick={onPress}>
      {program.name}
    </button>
  ),
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}));

import ProgramsScreen from '@/app/(admin)/programs/index';
import * as adminApi from '@/lib/api/admin';

describe('ProgramsScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders loaded programs', async () => {
    (adminApi.getPrograms as jest.Mock).mockResolvedValue(mockPrograms);
    await act(async () => { render(<ProgramsScreen />); });
    await waitFor(() => expect(screen.getByText('English Foundations')).toBeTruthy());
  });

  it('shows empty state when no programs exist', async () => {
    (adminApi.getPrograms as jest.Mock).mockResolvedValue([]);
    await act(async () => { render(<ProgramsScreen />); });
    await waitFor(() =>
      expect(screen.getByText('No programs yet. Add one to get started.')).toBeTruthy(),
    );
  });

  it('navigates to program detail on card press', async () => {
    (adminApi.getPrograms as jest.Mock).mockResolvedValue(mockPrograms);
    await act(async () => { render(<ProgramsScreen />); });
    await waitFor(() => screen.getByTestId('program-card-English Foundations'));
    fireEvent.click(screen.getByTestId('program-card-English Foundations'));
    expect(mockPush).toHaveBeenCalledWith('/(admin)/programs/prog-001');
  });

  it('navigates to new-program route when + New is pressed', async () => {
    (adminApi.getPrograms as jest.Mock).mockResolvedValue([]);
    await act(async () => { render(<ProgramsScreen />); });
    await waitFor(() => screen.getByText('+ New'));
    fireEvent.click(screen.getByText('+ New'));
    expect(mockPush).toHaveBeenCalledWith('/(admin)/programs/new');
  });
});
