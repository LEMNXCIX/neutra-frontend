// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';

vi.mock('@/lib/theme', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/theme')>()),
    applyTenantTheme: vi.fn(),
    clearTenantTheme: vi.fn(),
    ensureFontLoaded: vi.fn(),
}));

import { BrandingEditor } from '@/components/admin/tenants/BrandingEditor';

describe('BrandingEditor', () => {
    it('renders the live preview and field labels', () => {
        render(<BrandingEditor value={{ primaryColor: '#7c3aed' }} onChange={vi.fn()} />);

        expect(screen.getByText('Vista previa en vivo')).toBeInTheDocument();
        expect(screen.getByText('Color Primario')).toBeInTheDocument();
        expect(screen.getByText('URL del logo')).toBeInTheDocument();
    });

    it('emits the changed token via onChange', async () => {
        const onChange = vi.fn();
        render(<BrandingEditor value={{}} onChange={onChange} />);

        const hexInputs = screen.getAllByPlaceholderText('valor predeterminado del sitio');
        const { fireEvent } = await import('@testing-library/dom');
        fireEvent.change(hexInputs[0], { target: { value: '#7c3aed' } });

        expect(onChange).toHaveBeenCalledWith({ primaryColor: '#7c3aed' });
    });

    it('reset link removes the token', async () => {
        const onChange = vi.fn();
        render(<BrandingEditor value={{ primaryColor: '#7c3aed' }} onChange={onChange} />);

        await userEvent.click(screen.getByText('restablecer'));

        expect(onChange).toHaveBeenCalledWith({});
    });

    it('radius slider emits a rem value', async () => {
        const onChange = vi.fn();
        render(<BrandingEditor value={{}} onChange={onChange} />);

        const slider = screen.getByLabelText('Radio de las esquinas');
        const { fireEvent } = await import('@testing-library/dom');
        fireEvent.change(slider, { target: { value: '0.5' } });

        const lastCall = onChange.mock.calls.at(-1)?.[0];
        expect(lastCall.radius).toBe('0.50rem');
    });

    it('shows the reset link only for configured tokens', () => {
        render(<BrandingEditor value={{ primaryColor: '#7c3aed' }} onChange={vi.fn()} />);

        expect(screen.getByText('restablecer')).toBeInTheDocument();
        expect(screen.queryByText('valor predeterminado del sitio')).not.toBeInTheDocument();
    });
});
