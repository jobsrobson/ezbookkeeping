export interface CreditCardInvoiceCyclePeriod {
    readonly start: Date;
    readonly end: Date;
}

function toCanonicalDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getCreditCardInvoiceCycle(period: CreditCardInvoiceCyclePeriod): string {
    return `${toCanonicalDate(period.start)}/${toCanonicalDate(period.end)}`;
}
