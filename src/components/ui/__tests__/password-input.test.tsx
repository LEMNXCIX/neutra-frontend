// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';

import { PasswordInput } from '@/components/ui/password-input';

describe('PasswordInput', () => {
    it('masks the value by default and reveals it on click', async () => {
        render(<PasswordInput aria-label="Contraseña" defaultValue="secreto123" />);

        const field = screen.getByLabelText('Contraseña');
        expect(field).toHaveAttribute('type', 'password');

        await userEvent.click(screen.getByRole('button'));

        expect(field).toHaveAttribute('type', 'text');
    });

    it('toggles back to masked', async () => {
        render(<PasswordInput aria-label="Contraseña" defaultValue="secreto123" />);

        const toggle = screen.getByRole('button');
        await userEvent.click(toggle);
        await userEvent.click(toggle);

        expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password');
    });

    it('labels the toggle in Spanish and exposes its pressed state', async () => {
        render(<PasswordInput aria-label="Contraseña" />);

        const toggle = screen.getByRole('button', { name: 'Mostrar contraseña' });
        expect(toggle).toHaveAttribute('aria-pressed', 'false');

        await userEvent.click(toggle);

        expect(
            screen.getByRole('button', { name: 'Ocultar contraseña' }),
        ).toHaveAttribute('aria-pressed', 'true');
    });

    it('is type="button" so it cannot submit the form it sits in', () => {
        const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
        render(
            <form onSubmit={onSubmit}>
                <PasswordInput aria-label="Contraseña" />
            </form>,
        );

        // Five of the six call sites are inside a <form>; a default submit button
        // would post the form every time the user checks their password.
        expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('does not toggle while the field is disabled', async () => {
        render(<PasswordInput aria-label="Contraseña" disabled />);

        const field = screen.getByLabelText('Contraseña');
        expect(screen.getByRole('button')).toBeDisabled();

        await userEvent.click(screen.getByRole('button'), { pointerEventsCheck: 0 });
        expect(field).toHaveAttribute('type', 'password');
    });

    it('renders the leading icon only when one is passed', () => {
        // The toggle always renders an svg, so match the leading icon by its
        // positioning class rather than counting svg elements.
        const leading = () => document.querySelector('svg.left-4');

        const { rerender } = render(<PasswordInput aria-label="Contraseña" />);
        expect(leading()).toBeNull();

        const Lock = (props: { className?: string }) => (
            <svg data-testid="lock" {...props} />
        );
        rerender(<PasswordInput aria-label="Contraseña" icon={Lock} />);
        expect(screen.getByTestId('lock')).toBeInTheDocument();
    });

    it('keeps the caller className and adds room for the toggle', () => {
        render(<PasswordInput aria-label="Contraseña" className="h-12 pl-11" />);

        const field = screen.getByLabelText('Contraseña');
        expect(field).toHaveClass('h-12');
        expect(field).toHaveClass('pl-11');
        expect(field).toHaveClass('pr-11');
    });
});
