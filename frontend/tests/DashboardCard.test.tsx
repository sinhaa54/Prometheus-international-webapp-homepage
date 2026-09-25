import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardCard } from '../src/components/DashboardCard';
import type { Dashboard } from '../src/types/api';

const d: Dashboard = {
  dashboard_id: 'X-1', dashboard_name: 'Test Dashboard', tableau_url: 'https://tableau.pfizer.com/x',
  platform: 'T&C Global', category: 'Commercial', market: 'Global',
  display_order: 1, is_active: true, tags: [],
};

describe('DashboardCard', () => {
  it('renders the dashboard name', () => {
    render(<DashboardCard dashboard={d} pinned={false} onOpen={() => {}} onTogglePin={() => {}} />);
    expect(screen.getByText('Test Dashboard')).toBeInTheDocument();
  });

  it('fires onOpen when clicked', () => {
    const onOpen = vi.fn();
    render(<DashboardCard dashboard={d} pinned={false} onOpen={onOpen} onTogglePin={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Open Test Dashboard/i }));
    expect(onOpen).toHaveBeenCalledWith(d);
  });

  it('toggle pin does not fire onOpen', () => {
    const onOpen = vi.fn();
    const onTogglePin = vi.fn();
    render(<DashboardCard dashboard={d} pinned={false} onOpen={onOpen} onTogglePin={onTogglePin} />);
    fireEvent.click(screen.getByRole('button', { name: /pin dashboard/i }));
    expect(onTogglePin).toHaveBeenCalledWith(d);
    expect(onOpen).not.toHaveBeenCalled();
  });
});
