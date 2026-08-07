# Bank logo assets

Local, runtime-independent SVG collection for account branding.

## Coverage

- Brazil: Nubank, PicPay and Mercado Pago.
- United States: Bank of America, Chase, Wells Fargo, Goldman Sachs, American Express, Cash App and Venmo.
- United Kingdom: HSBC, Barclays, Starling Bank and Wise.
- Europe: Deutsche Bank, Revolut, bunq and CaixaBank.
- India: Axis Bank and ICICI Bank.
- Global payment services: PayPal and Western Union.

The upstream catalog does not currently provide Itaú, Bradesco, Banco do Brasil, Caixa Econômica Federal, Banco Inter, C6 Bank, BTG Pactual, Safra, Sicoob or Sicredi. These brands should only be added from an authorized source with suitable trademark usage terms.

## Source and version

The SVG paths and brand colors were extracted from [Simple Icons](https://simpleicons.org/) package version `16.28.0`. Assets are stored locally and no CDN or network request is made at runtime.

See `SIMPLE_ICONS_LICENSE.md` and the upstream [legal disclaimer](https://github.com/simple-icons/simple-icons/blob/develop/DISCLAIMER.md) before distributing branded builds. All trademarks remain property of their respective owners.

## Usage

Import `ALL_BANK_LOGOS`, a regional list, or `BANK_LOGOS_BY_ID` from `./index.ts`. Each entry contains a stable ID, display name, region, official catalog color and its bundled asset URL.
