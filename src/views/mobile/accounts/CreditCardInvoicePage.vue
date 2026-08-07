<template>
    <f7-page @page:afterin="initialize">
        <f7-navbar :title="tt('Credit Card Invoices')" :back-link="tt('Back')" />
        <f7-list strong inset class="invoice-filters">
            <f7-list-input type="select" :label="tt('Account')" v-model:value="accountId">
                <option v-for="account in creditCards" :key="account.id" :value="account.id">{{ account.name }}</option>
            </f7-list-input>
            <f7-list-input type="month" :label="tt('Invoice Month')" v-model:value="selectedMonth" />
        </f7-list>

        <f7-block strong inset class="invoice-summary" v-if="selectedAccount">
            <div class="invoice-month"><small>{{ tt('Invoice Month') }}</small><strong>{{ selectedMonthLabel }}</strong><span>{{ selectedAccount.name }}</span></div>
            <div class="invoice-dates"><div><small>{{ tt('Statement Period') }}</small><b>{{ formatDate(period.start) }} – {{ formatDate(period.end) }}</b></div><div><small>{{ tt('Due Date') }}</small><b>{{ formatDate(period.due) }}</b></div></div>
            <div class="invoice-value"><small>{{ tt('Invoice Total') }}</small><b class="invoice-total">{{ formattedTotal }}</b><f7-preloader size="18" v-if="loading" /></div>
        </f7-block>

        <f7-list strong inset dividers v-if="transactions.length">
            <f7-list-item v-for="transaction in transactions" :key="transaction.id"
                          :title="transaction.comment || transaction.categoryName || tt('Expense')"
                          :subtitle="transactionLabel(transaction)"
                          :after="formatAmount(transaction.sourceAmount)" />
        </f7-list>
        <f7-block strong inset class="text-align-center" v-else-if="loaded && !loading">{{ tt('No expenses in this invoice') }}</f7-block>
        <div class="invoice-navigation">
            <f7-button class="current" outline :disabled="loading || isCurrentMonth" @click="goToCurrentMonth"><f7-icon f7="calendar" /><span><small>{{ tt('Current Invoice') }}</small><b>{{ currentMonthLabel }}</b></span></f7-button>
            <div class="adjacent-navigation">
                <f7-button outline :disabled="loading" @click="changeMonth(-1)"><f7-icon f7="chevron_left" /><span><small>{{ tt('Previous Invoice') }}</small><b>{{ adjacentMonthLabel(-1) }}</b></span></f7-button>
                <f7-button outline :disabled="loading" @click="changeMonth(1)"><span><small>{{ tt('Next Invoice') }}</small><b>{{ adjacentMonthLabel(1) }}</b></span><f7-icon f7="chevron_right" /></f7-button>
            </div>
        </div>
    </f7-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Router } from 'framework7/types';
import { AccountCategory } from '@/core/account.ts';
import type { Account } from '@/models/account.ts';
import { useAccountsStore } from '@/stores/account.ts';
import { useI18n } from '@/locales/helpers.ts';
import { parseBigDecimal } from '@/lib/numeral.ts';
import { loadCreditCardInvoiceItems, type CreditCardInvoiceItem } from '@/lib/credit_card_invoice.ts';
import { getYearMonthDayDateTime, parseDateTimeFromUnixTime, parseDateTimeFromUnixTimeWithTimezoneOffset } from '@/lib/datetime.ts';

const props = defineProps<{ f7route: Router.Route }>();
const { tt, formatAmountToLocalizedNumeralsWithCurrency, formatDateTimeToLongDate, formatDateTimeToGregorianLikeLongYearMonth } = useI18n();
const accountsStore = useAccountsStore();
const now = new Date();
const accountId = ref(String(props.f7route.query['accountId'] || ''));
const selectedMonth = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
const transactions = ref<CreditCardInvoiceItem[]>([]);
const loading = ref(false);
const loaded = ref(false);
const initialized = ref(false);
let loadSequence = 0;
const creditCards = computed(() => accountsStore.allPlainAccounts.filter(account => account.category === AccountCategory.CreditCard.type && !!account.creditCardStatementDate));
const selectedAccount = computed<Account | undefined>(() => creditCards.value.find(account => account.id === accountId.value));
const canLoad = computed(() => !!selectedAccount.value && /^\d{4}-\d{2}$/.test(selectedMonth.value));
const period = computed(() => invoicePeriod(selectedAccount.value));
const formattedTotal = computed(() => formatAmount(transactions.value.reduce((sum, item) => sum + item.sourceAmount, 0)));
const selectedMonthLabel = computed(() => {
    const [year, month] = selectedMonth.value.split('-').map(Number);
    if (!year || !month) return selectedMonth.value;
    return formatDateTimeToGregorianLikeLongYearMonth(getYearMonthDayDateTime(year, month, 1));
});
const currentMonthLabel = computed(() => formatMonthLabel(now.getFullYear(), now.getMonth() + 1));
const isCurrentMonth = computed(() => selectedMonth.value === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

function dateAt(year: number, month: number, day: number, end = false): Date {
    return new Date(year, month, Math.min(day, new Date(year, month + 1, 0).getDate()), end ? 23 : 0, end ? 59 : 0, end ? 59 : 0);
}
function invoicePeriod(account?: Account): { start: Date, end: Date, due: Date } {
    const [year, monthText] = selectedMonth.value.split('-').map(Number);
    const month = (monthText || 1) - 1, close = account?.creditCardStatementDate || 1, due = account?.creditCardDueDate || close;
    const previous = dateAt(year!, month - 1, close, true);
    return {
        start: new Date(previous.getFullYear(), previous.getMonth(), previous.getDate() + 1),
        end: dateAt(year!, month, close, true),
        due: dateAt(year!, due <= close ? month + 1 : month, due)
    };
}
function formatDate(date: Date): string { return formatDateTimeToLongDate(parseDateTimeFromUnixTime(Math.floor(date.getTime() / 1000))); }
function formatAmount(amount: number): string { return formatAmountToLocalizedNumeralsWithCurrency(parseBigDecimal(String(amount)), selectedAccount.value?.currency); }
function formatMonthLabel(year: number, month: number): string { return formatDateTimeToGregorianLikeLongYearMonth(getYearMonthDayDateTime(year, month, 1)); }
function adjacentMonthLabel(offset: number): string { const [year, month] = selectedMonth.value.split('-').map(Number); const target = new Date(year!, month! - 1 + offset, 1); return formatMonthLabel(target.getFullYear(), target.getMonth() + 1); }
function transactionLabel(item: CreditCardInvoiceItem): string {
    const date = formatDateTimeToLongDate(parseDateTimeFromUnixTimeWithTimezoneOffset(item.time, item.utcOffset));
    if (item.installmentCount > 1) return `${date} · ${tt('Installment')} ${item.installmentNumber}/${item.installmentCount}`;
    if (item.subscription) return `${date} · ${tt('Subscription')}${item.projected ? ` · ${tt('Scheduled')}` : ''}`;
    return date;
}
function changeMonth(offset: number): void {
    const [year, month] = selectedMonth.value.split('-').map(Number);
    const target = new Date(year!, month! - 1 + offset, 1);
    selectedMonth.value = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}`;
}
function goToCurrentMonth(): void { selectedMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; }
async function loadInvoice(): Promise<void> {
    if (!canLoad.value) return;
    const sequence = ++loadSequence;
    loading.value = true;
    try {
        const result = await loadCreditCardInvoiceItems(selectedAccount.value!, period.value.start, period.value.end);
        if (sequence !== loadSequence) return;
        transactions.value = result;
        loaded.value = true;
    } finally { if (sequence === loadSequence) loading.value = false; }
}
async function initialize(): Promise<void> {
    await accountsStore.loadAllAccounts({ force: false });
    if (!accountId.value && creditCards.value.length) accountId.value = creditCards.value[0]!.id;
    initialized.value = true;
    if (canLoad.value && !loaded.value) await loadInvoice();
}
watch([accountId, selectedMonth], () => {
    if (!initialized.value) return;
    loaded.value = false;
    transactions.value = [];
    void loadInvoice();
});
</script>

<style scoped>
.invoice-filters{margin-bottom:10px}.invoice-navigation{margin:18px 16px 24px;padding-top:16px;border-top:1px solid var(--f7-list-item-border-color)}.invoice-navigation .button{display:flex;height:52px;flex-direction:column;justify-content:center;border-radius:14px;font-size:10px;line-height:1.2}.invoice-navigation small{font-size:9px;opacity:.65}.invoice-navigation b{max-width:145px;overflow:hidden;margin-top:3px;text-overflow:ellipsis;white-space:nowrap}.adjacent-navigation{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.invoice-summary{overflow:hidden;padding:0!important}.invoice-month{padding:20px;background:linear-gradient(135deg,rgba(var(--f7-theme-color-rgb),.16),rgba(var(--f7-theme-color-rgb),.04))}.invoice-month small,.invoice-value small,.invoice-dates small{display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;opacity:.65}.invoice-month strong{display:block;margin-top:5px;font-size:24px;line-height:1.15;letter-spacing:-.04em}.invoice-month span{display:block;margin-top:7px;font-size:12px;opacity:.6}.invoice-dates{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:16px 20px;border-top:1px solid var(--f7-list-item-border-color)}.invoice-dates b{display:block;margin-top:4px;font-size:12px}.invoice-value{display:flex;align-items:center;justify-content:space-between;padding:17px 20px;border-top:1px solid var(--f7-list-item-border-color)}.invoice-total{font-size:1.5rem;letter-spacing:-.04em}
.invoice-navigation{overflow:hidden;padding-top:0;border:1px solid var(--f7-list-item-border-color);border-radius:16px}.invoice-navigation .button{display:grid;height:58px;grid-template-columns:22px minmax(0,1fr);align-items:center;gap:6px;border:0;border-radius:0}.invoice-navigation .button span{display:flex;min-width:0;flex-direction:column;align-items:flex-start}.invoice-navigation .current span{align-items:center}.invoice-navigation b{width:100%;max-width:none}.adjacent-navigation{gap:0;margin-top:0;border-top:1px solid var(--f7-list-item-border-color)}.adjacent-navigation .button:last-child{grid-template-columns:minmax(0,1fr) 22px;border-inline-start:1px solid var(--f7-list-item-border-color)}.adjacent-navigation .button:last-child span{align-items:flex-end}
</style>
