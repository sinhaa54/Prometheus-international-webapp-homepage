import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../src/components/Modal';

describe('Modal', () => {
  it('does not render when closed', () => {
    render(<Modal open={false} onClose={() => {}} title="Hi"><div>body</div></Modal>);
    expect(screen.queryByText('Hi')).not.toBeInTheDocument();
  });

  it('renders and closes on Escape', () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="Hi"><div>body</div></Modal>);
    expect(screen.getByText('Hi')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on backdrop click', () => {
    const onClose = vi.fn();
    const { container } = render(<Modal open onClose={onClose} title="Hi"><div>body</div></Modal>);
    const backdrop = container.querySelector('.backdrop') as HTMLElement;
    fireEvent.mouseDown(backdrop);
    expect(onClose).toHaveBeenCalled();
  });
});
