import { describe, expect, it } from 'vitest';
import { getCreditCardInvoiceCycle } from './credit_card_invoice_cycle.ts';

describe('getCreditCardInvoiceCycle', () => {
    it('uses the actual statement boundaries instead of the display month', () => {
        expect(getCreditCardInvoiceCycle({
            start: new Date(2026, 6, 29),
            end: new Date(2026, 7, 28, 23, 59, 59)
        })).toBe('2026-07-29/2026-08-28');
    });
});
