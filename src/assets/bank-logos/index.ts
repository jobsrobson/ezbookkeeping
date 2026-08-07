export type BankLogoRegion = 'BR' | 'US' | 'UK' | 'EU' | 'IN' | 'GLOBAL';

export interface BankLogo {
    readonly id: string;
    readonly name: string;
    readonly region: BankLogoRegion;
    readonly brandColor: string;
    readonly assetUrl: string;
}

const logoModules = import.meta.glob<string>('./*.svg', {
    eager: true,
    query: '?url',
    import: 'default'
});

function logo(id: string, name: string, region: BankLogoRegion, brandColor: string): BankLogo {
    return {
        id,
        name,
        region,
        brandColor,
        assetUrl: logoModules[`./${id}.svg`] as string
    };
}

export const BRAZILIAN_BANK_LOGOS: readonly BankLogo[] = [
    logo('nubank', 'Nubank', 'BR', '#820AD1'),
    logo('picpay', 'PicPay', 'BR', '#21C25E'),
    logo('mercadopago', 'Mercado Pago', 'BR', '#00B1EA')
];

export const INTERNATIONAL_BANK_LOGOS: readonly BankLogo[] = [
    logo('bankofamerica', 'Bank of America', 'US', '#012169'),
    logo('chase', 'Chase', 'US', '#117ACA'),
    logo('wellsfargo', 'Wells Fargo', 'US', '#D71E28'),
    logo('goldmansachs', 'Goldman Sachs', 'US', '#7399C6'),
    logo('americanexpress', 'American Express', 'US', '#2E77BC'),
    logo('cashapp', 'Cash App', 'US', '#00C244'),
    logo('venmo', 'Venmo', 'US', '#008CFF'),
    logo('hsbc', 'HSBC', 'UK', '#DB0011'),
    logo('barclays', 'Barclays', 'UK', '#00AEEF'),
    logo('starlingbank', 'Starling Bank', 'UK', '#6935D3'),
    logo('wise', 'Wise', 'UK', '#9FE870'),
    logo('deutschebank', 'Deutsche Bank', 'EU', '#0018A8'),
    logo('revolut', 'Revolut', 'EU', '#191C1F'),
    logo('bunq', 'bunq', 'EU', '#3394D7'),
    logo('caixabank', 'CaixaBank', 'EU', '#007EAE'),
    logo('axisbank', 'Axis Bank', 'IN', '#971A4D'),
    logo('icicibank', 'ICICI Bank', 'IN', '#AE282E'),
    logo('paypal', 'PayPal', 'GLOBAL', '#002991'),
    logo('westernunion', 'Western Union', 'GLOBAL', '#FFDD00')
];

export const ALL_BANK_LOGOS: readonly BankLogo[] = [
    ...BRAZILIAN_BANK_LOGOS,
    ...INTERNATIONAL_BANK_LOGOS
];

export const BANK_LOGOS_BY_ID: Readonly<Record<string, BankLogo>> = Object.freeze(
    Object.fromEntries(ALL_BANK_LOGOS.map(bankLogo => [bankLogo.id, bankLogo]))
);
