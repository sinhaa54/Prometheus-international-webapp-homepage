import { jsx as _jsx } from "react/jsx-runtime";
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../src/components/Modal';
describe('Modal', () => {
    it('does not render when closed', () => {
        render(_jsx(Modal, { open: false, onClose: () => { }, title: "Hi", children: _jsx("div", { children: "body" }) }));
        expect(screen.queryByText('Hi')).not.toBeInTheDocument();
    });
    it('renders and closes on Escape', () => {
        const onClose = vi.fn();
        render(_jsx(Modal, { open: true, onClose: onClose, title: "Hi", children: _jsx("div", { children: "body" }) }));
        expect(screen.getByText('Hi')).toBeInTheDocument();
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).toHaveBeenCalled();
    });
    it('closes on backdrop click', () => {
        const onClose = vi.fn();
        const { container } = render(_jsx(Modal, { open: true, onClose: onClose, title: "Hi", children: _jsx("div", { children: "body" }) }));
        const backdrop = container.querySelector('.backdrop');
        fireEvent.mouseDown(backdrop);
        expect(onClose).toHaveBeenCalled();
    });
});
