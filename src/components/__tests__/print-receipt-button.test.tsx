// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const printSpy = vi.fn();
vi.stubGlobal('window', Object.assign(window, { print: printSpy }));

import { PrintReceiptButton } from '@/components/print-receipt-button';

describe('PrintReceiptButton', () => {
    it('renders the receipt label', () => {
        const { getByRole } = render(<PrintReceiptButton />);
        expect(
            getByRole('button', { name: /download receipt/i }),
        ).toBeInTheDocument();
    });

    it('calls window.print on click', async () => {
        const { getByRole } = render(<PrintReceiptButton />);
        await userEvent.click(getByRole('button', { name: /download receipt/i }));
        expect(printSpy).toHaveBeenCalled();
    });
});
