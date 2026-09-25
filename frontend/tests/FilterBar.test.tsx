import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar, type FilterState } from '../src/components/FilterBar';

const AVAILABLE = {
  platforms: [
    { name: 'T&C Global', label: 'T&C Global', accent: '#0033A0', blurb: 'g', dashboard_count: 3 },
    { name: 'ELVIS Solutions', label: 'ELVIS Solutions', accent: '#0093D0', blurb: 'e', dashboard_count: 5 },
  ],
  categories: [{ value: 'Commercial', label: 'Commercial', count: 4 }],
  markets: [{ value: 'Germany', label: 'Germany', count: 2 }],
};

describe('FilterBar', () => {
  it('renders platform and category chips with counts', () => {
    const value: FilterState = { platform: null, category: null, market: null, pinnedOnly: false };
    render(<FilterBar available={AVAILABLE} value={value} onChange={() => {}} />);
    expect(screen.getByText('T&C Global')).toBeInTheDocument();
    expect(screen.getByText('Commercial')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('selecting a platform chip calls onChange', () => {
    let state: FilterState = { platform: null, category: null, market: null, pinnedOnly: false };
    render(<FilterBar available={AVAILABLE} value={state} onChange={(n) => { state = n; }} />);
    fireEvent.click(screen.getByText('T&C Global'));
    expect(state.platform).toBe('T&C Global');
  });
});
