<template>
    <main class="invoice-page">
        <header class="invoice-header">
            <div class="invoice-header__top">
                <div class="invoice-header__copy">

                    <h1>{{ tt('Faturas') }}</h1>

                    <p>
                        {{ selectedAccount?.name || tt('Account') }}
                        <template v-if="selectedMonthLabel">
                            · {{ selectedMonthLabel }}
                        </template>
                    </p>
                </div>

                <div class="invoice-header__controls">
                    <v-select
                        v-model="accountId"
                        class="invoice-account-select"
                        :items="creditCards"
                        item-title="name"
                        item-value="id"
                        :label="tt('Account')"
                        variant="outlined"
                        :disabled="loading"
                        hide-details
                    />

                    <v-menu
                        v-model="monthMenuVisible"
                        :close-on-content-click="false"
                    >
                        <template #activator="{ props: menuProps }">
                            <v-text-field
                                v-bind="menuProps"
                                class="invoice-month-select"
                                :model-value="selectedMonthLabel"
                                :label="tt('Invoice Month')"
                                variant="outlined"
                                readonly
                                hide-details
                                :disabled="loading || !accountId"
                            />
                        </template>

                        <v-card class="month-calendar" elevation="0">
                            <MonthPicker
                                v-model="selectedYearMonth"
                                :is-dark-mode="isDarkMode"
                                @update:model-value="monthMenuVisible = false"
                            />
                        </v-card>
                    </v-menu>

                    <v-btn
                        class="invoice-toolbar-icon-button"
                        density="comfortable"
                        color="default"
                        variant="text"
                        :icon="true"
                        :disabled="!accountId"
                        :aria-label="tt('More options')"
                    >
                        <v-icon :icon="mdiDotsVertical" />
                        <v-menu activator="parent" location="bottom end">
                            <v-list>
                                <v-list-item :prepend-icon="mdiCalendarSync" :title="tt('Automatic Debit')" @click="openAutoPaymentDialog" />
                            </v-list>
                        </v-menu>
                    </v-btn>
                </div>
            </div>

            <div class="invoice-header__tabs">
                <button
                    type="button"
                    class="invoice-header__tab"
                    :class="{ 'invoice-header__tab--active': activeTab === 'invoice' }"
                    @click="activeTab = 'invoice'"
                >
                    {{ tt('Visão Geral da Fatura') }}
                </button>

                <button
                    type="button"
                    class="invoice-header__tab"
                    :class="{ 'invoice-header__tab--active': activeTab === 'limit' }"
                    @click="activeTab = 'limit'"
                >
                    {{ tt('Visão Geral do Limite') }}
                </button>

                <router-link
                    class="invoice-header__link"
                    to="/transaction/list"
                >
                    {{ tt('Transactions') }}
                </router-link>

                <router-link
                    class="invoice-header__link"
                    to="/account/list"
                >
                    {{ tt('Accounts') }}
                </router-link>
            </div>
        </header>

        <v-progress-linear
            v-if="loading"
            class="invoice-loading"
            indeterminate
            height="2"
        />

        <section class="invoice-workspace">
            <section
                v-show="activeTab === 'invoice'"
                v-if="selectedAccount"
                class="invoice-overview-card"
            >
                <div class="invoice-overview-card__main">
                    <div class="invoice-overview-card__header">
                        <div class="invoice-overview-card__eyebrow">
                            <span>{{ tt('Invoice Total') }}</span>
                            <v-chip v-if="invoicePaid" color="success" size="small" variant="tonal">{{ tt('Paid') }}</v-chip>
                            <v-chip v-else-if="invoicePartiallyPaid" color="warning" size="small" variant="tonal">{{ tt('Partially Paid') }}</v-chip>
                        </div>
                        <div class="invoice-overview-card__icon">
                            <v-icon :icon="mdiCreditCardClockOutline" size="20" />
                        </div>
                    </div>

                    <strong class="invoice-overview-card__total">{{ formattedTotal }}</strong>

                    <div v-if="invoicePartiallyPaid" class="invoice-overview-card__payment-summary">
                        <div>
                            <span>{{ tt('Already Paid') }}</span>
                            <strong>{{ formatTransactionAmount(paidAmount) }}</strong>
                        </div>
                        <div>
                            <span>{{ tt('Remaining') }}</span>
                            <strong>{{ formatTransactionAmount(remainingAmount) }}</strong>
                        </div>
                    </div>

                    <div class="invoice-overview-card__footer">
                        <div class="invoice-overview-card__account">
                            <strong>{{ selectedAccount.name }}</strong>
                            <span>{{ selectedMonthLabel }}</span>
                        </div>
                        <v-btn v-if="!invoicePaid" size="small" color="primary" variant="flat" :disabled="loading || invoiceTotal <= 0" @click="openPayInvoiceDialog">
                            {{ tt('Pay Invoice') }}
                        </v-btn>
                    </div>
                </div>

                <div class="invoice-overview-card__details">
                    <div class="invoice-overview-detail">
                        <div class="invoice-overview-detail__icon">
                            <v-icon :icon="mdiCalendarRange" size="19" />
                        </div>
                        <div class="invoice-overview-detail__copy">
                            <span>{{ tt('Statement Period') }}</span>
                            <strong>{{ formatDate(period.start) }}</strong>
                            <small>{{ tt('Until') }} {{ formatDate(period.end) }}</small>
                        </div>
                    </div>

                    <div class="invoice-overview-detail invoice-overview-detail--due">
                        <div class="invoice-overview-detail__icon">
                            <v-icon :icon="mdiCalendarCheckOutline" size="19" />
                        </div>
                        <div class="invoice-overview-detail__copy">
                            <span>{{ tt('Due Date') }}</span>
                            <strong>{{ formatDate(period.due) }}</strong>
                            <small>{{ selectedAccount.name }}</small>
                        </div>
                    </div>
                </div>
            </section>

            <section
                v-show="activeTab === 'invoice'"
                class="invoice-list-section"
            >
                <div class="invoice-list-section__header">
                    <div>
                        <h2>{{ tt('Despesas') }}</h2>
                        <span class="invoice-entry-count">
                            {{ displayedTransactions.length }}
                            / {{ transactions.length }}
                            {{ tt('Transactions') }}
                        </span>
                    </div>

                    <v-text-field
                        v-model="searchKeyword"
                        class="invoice-search"
                        density="compact"
                        variant="outlined"
                        hide-details
                        clearable
                        :disabled="loading"
                        :prepend-inner-icon="mdiMagnify"
                        :placeholder="tt('Search invoice purchases')"
                    />
                </div>

                <div
                    v-if="displayedTransactions.length"
                    class="invoice-table-wrapper"
                >
                    <v-table class="invoice-table">
                        <thead>
                            <tr>
                                <th>
                                    <invoice-column-menu
                                        :label="tt('Date')"
                                        column="date"
                                        v-model:sort-by="sortBy"
                                        v-model:sort-direction="sortDirection"
                                    />
                                </th>
                                <th>
                                    <invoice-column-menu
                                        :label="tt('Description')"
                                        column="description"
                                        v-model:sort-by="sortBy"
                                        v-model:sort-direction="sortDirection"
                                    />
                                </th>
                                <th>
                                    <invoice-column-menu
                                        :label="selectedCategory || tt('Category')"
                                        column="category"
                                        :categories="availableCategories"
                                        v-model:category="selectedCategory"
                                        v-model:sort-by="sortBy"
                                        v-model:sort-direction="sortDirection"
                                    />
                                </th>
                                <th>
                                    <invoice-column-menu
                                        :label="selectedTypeLabel"
                                        column="type"
                                        v-model:type-filter="selectedType"
                                        v-model:sort-by="sortBy"
                                        v-model:sort-direction="sortDirection"
                                    />
                                </th>
                                <th class="text-end">
                                    <invoice-column-menu
                                        class="invoice-column-menu--amount"
                                        :label="tt('Amount')"
                                        column="amount"
                                        v-model:min-amount="minimumAmount"
                                        v-model:max-amount="maximumAmount"
                                        v-model:sort-by="sortBy"
                                        v-model:sort-direction="sortDirection"
                                    />
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr
                                v-for="transaction in displayedTransactions"
                                :key="transaction.id"
                                class="invoice-transaction-row"
                                tabindex="0"
                                @click="editTransaction(transaction)"
                                @keydown.enter="editTransaction(transaction)"
                            >
                                <td>
                                    {{
                                        formatTransactionDate(
                                            transaction.time,
                                            transaction.utcOffset
                                        )
                                    }}
                                </td>

                                <td class="invoice-description-cell">
                                    {{ transaction.comment || '-' }}
                                </td>

                                <td>
                                    {{ transaction.categoryName || '-' }}
                                </td>

                                <td>
                                    <v-chip
                                        v-if="transaction.installmentCount > 1"
                                        size="small"
                                        variant="tonal"
                                    >
                                        {{ tt('Installment') }}
                                        {{ transaction.installmentNumber }}/{{ transaction.installmentCount }}
                                    </v-chip>

                                    <v-chip
                                        v-else-if="transaction.subscription"
                                        size="small"
                                        variant="tonal"
                                    >
                                        {{ tt('Subscription') }}
                                        <span v-if="transaction.projected">
                                            &nbsp;· {{ tt('Agendado') }}
                                        </span>
                                    </v-chip>

                                    <span v-else>
                                        {{ tt('Expense') }}
                                    </span>
                                </td>

                                <td class="text-end invoice-amount-cell">
                                    {{
                                        formatTransactionAmount(
                                            transaction.sourceAmount
                                        )
                                    }}
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </div>

                <v-empty-state
                    v-else-if="loaded && !loading"
                    class="invoice-empty"
                    :title="hasActiveListFilters ? tt('No purchases match the filters') : tt('No expenses in this invoice')"
                />
            </section>

            <section
                v-show="activeTab === 'limit'"
                class="credit-limit-overview"
            >
                <article class="credit-limit-card">
                    <header class="credit-limit-card__header">
                        <div>

                            <h2>{{ selectedAccount?.name || tt('Account') }}</h2>

                            <p>
                                {{ tt('Acompanhe o limite utilizado e o saldo disponível deste cartão.') }}
                            </p>
                        </div>
                    </header>

                    <div class="credit-limit-card__body">
                        <div class="credit-limit-card__main">
                            <span class="invoice-label">
                                {{ tt('Limite disponível') }}
                            </span>

                            <strong class="credit-limit-card__available">
                                {{ formattedAvailableCreditLimit }}
                            </strong>

                            <div class="credit-limit-card__usage-copy">
                                <span>{{ Math.round(creditLimitUsagePercentage) }}% {{ tt('utilizado') }}</span>
                                <span>
                                    {{ formattedUsedCreditLimit }} {{ tt('de') }} {{ formattedTotalCreditLimit }}
                                </span>
                            </div>

                            <v-progress-linear
                                class="credit-limit-card__progress"
                                :model-value="creditLimitUsagePercentage"
                                color="primary"
                                bg-color="secondary"
                                height="8"
                                rounded
                            />
                        </div>

                        <aside class="credit-limit-card__stats">
                            <div class="credit-limit-stat">
                                <span class="credit-limit-stat__icon">
                                    <v-icon :icon="mdiCreditCardOutline" size="18" />
                                </span>

                                <span class="credit-limit-stat__copy">
                                    <small>{{ tt('Utilizado') }}</small>
                                    <strong>{{ formattedUsedCreditLimit }}</strong>
                                </span>
                            </div>

                            <div class="credit-limit-stat">
                                <span class="credit-limit-stat__icon">
                                    <v-icon :icon="mdiWalletOutline" size="18" />
                                </span>

                                <span class="credit-limit-stat__copy">
                                    <small>{{ tt('Limite total') }}</small>
                                    <strong>{{ formattedTotalCreditLimit }}</strong>
                                </span>
                            </div>

                            <div class="credit-limit-stat">
                                <span class="credit-limit-stat__icon credit-limit-stat__icon--positive">
                                    <v-icon :icon="mdiTrendingUp" size="18" />
                                </span>

                                <span class="credit-limit-stat__copy">
                                    <small>{{ tt('Limite disponível') }}</small>
                                    <strong>{{ formattedAvailableCreditLimit }}</strong>
                                </span>
                            </div>
                        </aside>
                    </div>
                </article>
            </section>

            <nav
    v-if="activeTab === 'invoice'"
    v-show="activeTab === 'invoice'"
    class="invoice-navigation"
    :aria-label="tt('Invoices')"
>
    <button
        type="button"
        class="invoice-navigation__button invoice-navigation__button--previous"
        :disabled="loading"
        @click="changeMonth(-1)"
    >
        <v-icon
            class="invoice-navigation__icon"
            :icon="mdiChevronLeft"
            size="20"
        />

        <span class="invoice-navigation__content">
            <small>{{ tt('Previous Invoice') }}</small>
            <strong>{{ adjacentMonthLabel(-1) }}</strong>
        </span>

        <span class="invoice-navigation__amount">
            {{ formattedPreviousInvoiceTotal }}
        </span>
    </button>

    <button
        type="button"
        class="invoice-navigation__button invoice-navigation__button--current"
        :class="{
            'invoice-navigation__button--selected': isCurrentMonth
        }"
        :disabled="loading"
        @click="goToCurrentMonth"
    >
        <span class="invoice-navigation__content">
            <small>
                {{
                    isCurrentMonth
                        ? tt('CurrentInvoice')
                        : tt('Selected Invoice')
                }}
            </small>

            <strong>{{ selectedMonthLabel }}</strong>
        </span>

        <span class="invoice-navigation__amount invoice-navigation__amount--current">
            {{ formattedTotal }}
        </span>
    </button>

    <button
        type="button"
        class="invoice-navigation__button invoice-navigation__button--next"
        :disabled="loading"
        @click="changeMonth(1)"
    >
        <span class="invoice-navigation__content">
            <small>{{ tt('Next Invoice') }}</small>
            <strong>{{ adjacentMonthLabel(1) }}</strong>
        </span>

        <span class="invoice-navigation__amount">
            {{ formattedNextInvoiceTotal }}
        </span>

        <v-icon
            class="invoice-navigation__icon"
            :icon="mdiChevronRight"
            size="20"
        />
    </button>
</nav>
        </section>

        <transaction-edit-dialog
            ref="transactionEditDialog"
            :type="TransactionEditPageType.Transaction"
        />

        <transaction-edit-dialog
            ref="subscriptionEditDialog"
            :type="TransactionEditPageType.Template"
        />

        <pay-credit-card-invoice-dialog ref="payInvoiceDialog" @paid="loadInvoice" />
        <credit-card-auto-payment-dialog ref="autoPaymentDialog" @updated="loadInvoice" />
    </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useTheme } from 'vuetify';
import { mdiCreditCardClockOutline, mdiCalendarRange, mdiCalendarCheckOutline, mdiChevronLeft, mdiChevronRight, mdiCreditCardOutline, mdiWalletOutline, mdiTrendingUp, mdiMagnify, mdiDotsVertical, mdiCalendarSync } from '@mdi/js';
import { AccountCategory } from '@/core/account.ts';
import { TransactionType } from '@/core/transaction.ts';
import type { Account } from '@/models/account.ts';
import { Transaction } from '@/models/transaction.ts';
import { useAccountsStore } from '@/stores/account.ts';
import { useI18n } from '@/locales/helpers.ts';
import { parseBigDecimal } from '@/lib/numeral.ts';
import { getCreditCardInvoicePeriod, loadCreditCardInvoiceItems, type CreditCardInvoiceItem } from '@/lib/credit_card_invoice.ts';
import { getCreditCardInvoiceCycle } from '@/lib/credit_card_invoice_cycle.ts';
import { getYearMonthDayDateTime, parseDateTimeFromUnixTime, parseDateTimeFromUnixTimeWithTimezoneOffset, getBillingCycleFirstUnixTimeBySpecifiedUnixTime, getBillingCycleLastUnixTimeBySpecifiedUnixTime, getUnixTimeAfterUnixTime } from '@/lib/datetime.ts';
import MonthPicker from '@/components/common/MonthPicker.vue';
import InvoiceColumnMenu, { type InvoiceSortColumn, type InvoiceSortDirection, type InvoiceTypeFilter } from '@/views/desktop/accounts/InvoiceColumnMenu.vue';
import TransactionEditDialog from '@/views/desktop/transactions/list/dialogs/EditDialog.vue';
import PayCreditCardInvoiceDialog from '@/views/desktop/accounts/dialogs/PayCreditCardInvoiceDialog.vue';
import CreditCardAutoPaymentDialog from '@/views/desktop/accounts/dialogs/CreditCardAutoPaymentDialog.vue';
import { TransactionEditPageType } from '@/views/base/transactions/TransactionEditPageBase.ts';
import { TemplateType } from '@/core/template.ts';
import services from '@/lib/services.ts';

type TransactionEditDialogType = InstanceType<typeof TransactionEditDialog>;
type PayCreditCardInvoiceDialogType = InstanceType<typeof PayCreditCardInvoiceDialog>;
type CreditCardAutoPaymentDialogType = InstanceType<typeof CreditCardAutoPaymentDialog>;

const props = defineProps<{ initAccountId?: string }>();
const { tt, formatAmountToLocalizedNumeralsWithCurrency, formatDateTimeToLongDate, formatDateTimeToGregorianLikeLongYearMonth } = useI18n();
const theme = useTheme();
const accountsStore = useAccountsStore();
const now = new Date();
const accountId = ref(props.initAccountId || '');
const selectedMonth = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
type InvoiceTab = 'invoice' | 'limit';

const activeTab = ref<InvoiceTab>('invoice');
const transactions = ref<CreditCardInvoiceItem[]>([]);
const paidAmount = ref(0);
const searchKeyword = ref<string | null>('');
const sortBy = ref<InvoiceSortColumn>('date');
const sortDirection = ref<InvoiceSortDirection>('desc');
const selectedCategory = ref('');
const selectedType = ref<InvoiceTypeFilter>('all');
const minimumAmount = ref<number | null>(null);
const maximumAmount = ref<number | null>(null);
const previousInvoiceTotal = ref<number>(0);
const nextInvoiceTotal = ref<number>(0);
const loadingAdjacentInvoices = ref<boolean>(false);
const loadingCreditLimit = ref<boolean>(false);
const currentLimitInvoiceAmount = ref<number>(0);
const currentLimitPaidAmount = ref<number>(0);
const futureInstallmentAmount = ref<number>(0);
const loading = ref(false);
const loaded = ref(false);
const initialized = ref(false);
const monthMenuVisible = ref(false);
const transactionEditDialog = useTemplateRef<TransactionEditDialogType>('transactionEditDialog');
const subscriptionEditDialog = useTemplateRef<TransactionEditDialogType>('subscriptionEditDialog');
const payInvoiceDialog = useTemplateRef<PayCreditCardInvoiceDialogType>('payInvoiceDialog');
const autoPaymentDialog = useTemplateRef<CreditCardAutoPaymentDialogType>('autoPaymentDialog');
let loadSequence = 0;

const creditCards = computed(() => accountsStore.allPlainAccounts.filter(account => account.category === AccountCategory.CreditCard.type && !!account.creditCardStatementDate));
const selectedAccount = computed<Account | undefined>(() => creditCards.value.find(account => account.id === accountId.value));
const canLoad = computed(() => !!selectedAccount.value && /^\d{4}-\d{2}$/.test(selectedMonth.value));
const period = computed(() => getCreditCardInvoicePeriod(selectedAccount.value, selectedMonth.value));
const total = computed(() => transactions.value.reduce((sum, transaction) => sum + transaction.sourceAmount, 0));
const invoiceTotal = computed(() => total.value);
const remainingAmount = computed(() => Math.max(invoiceTotal.value - paidAmount.value, 0));
const invoicePaid = computed(() => invoiceTotal.value > 0 && remainingAmount.value <= 0);
const invoicePartiallyPaid = computed(() => paidAmount.value > 0 && remainingAmount.value > 0);
const availableCategories = computed(() => Array.from(new Set(
    transactions.value.map(transaction => transaction.categoryName).filter(Boolean)
)).sort((a, b) => a.localeCompare(b)));
const selectedTypeLabel = computed(() => {
    if (selectedType.value === 'installment') return tt('Installment');
    if (selectedType.value === 'subscription') return tt('Subscription');
    if (selectedType.value === 'expense') return tt('Expense');
    return tt('Type');
});
const hasActiveListFilters = computed(() =>
    !!searchKeyword.value?.trim() ||
    !!selectedCategory.value ||
    selectedType.value !== 'all' ||
    minimumAmount.value !== null ||
    maximumAmount.value !== null
);
const displayedTransactions = computed(() => {
    const keyword = normalizeSearchText(searchKeyword.value);
    const items = transactions.value.filter(transaction => {
        if (selectedCategory.value && transaction.categoryName !== selectedCategory.value) return false;
        if (selectedType.value !== 'all' && getInvoiceItemType(transaction) !== selectedType.value) return false;
        if (minimumAmount.value !== null && transaction.sourceAmount < minimumAmount.value) return false;
        if (maximumAmount.value !== null && transaction.sourceAmount > maximumAmount.value) return false;

        if (keyword) {
            const searchableText = [
                transaction.comment,
                transaction.categoryName,
                getInvoiceItemTypeLabel(transaction),
                formatTransactionDate(transaction.time, transaction.utcOffset),
                formatTransactionAmount(transaction.sourceAmount)
            ].join(' ');
            if (!normalizeSearchText(searchableText).includes(keyword)) return false;
        }

        return true;
    });

    return items.sort((first, second) => {
        let result: number;
        if (sortBy.value === 'date') result = first.time - second.time;
        else if (sortBy.value === 'amount') result = first.sourceAmount - second.sourceAmount;
        else if (sortBy.value === 'category') result = first.categoryName.localeCompare(second.categoryName);
        else if (sortBy.value === 'type') result = getInvoiceItemTypeLabel(first).localeCompare(getInvoiceItemTypeLabel(second));
        else result = first.comment.localeCompare(second.comment);
        return sortDirection.value === 'asc' ? result : -result;
    });
});
const formattedTotal = computed(() => formatTransactionAmount(total.value));
const formattedPreviousInvoiceTotal = computed<string>(() =>
    formatTransactionAmount(previousInvoiceTotal.value)
);

const formattedNextInvoiceTotal = computed<string>(() =>
    formatTransactionAmount(nextInvoiceTotal.value)
);

const totalCreditLimit = computed<number>(() =>
    Number(selectedAccount.value?.creditCardLimit ?? 0)
);

const usedCreditLimit = computed<number>(() =>
    Math.max(0, currentLimitInvoiceAmount.value - currentLimitPaidAmount.value) +
    Math.max(0, futureInstallmentAmount.value)
);

const availableCreditLimit = computed<number>(() =>
    Math.max(0, totalCreditLimit.value - usedCreditLimit.value)
);

const creditLimitUsagePercentage = computed<number>(() =>
    totalCreditLimit.value > 0
        ? Math.min(100, (usedCreditLimit.value / totalCreditLimit.value) * 100)
        : 0
);

const formattedTotalCreditLimit = computed<string>(() =>
    formatTransactionAmount(totalCreditLimit.value)
);

const formattedUsedCreditLimit = computed<string>(() =>
    formatTransactionAmount(usedCreditLimit.value)
);

const formattedAvailableCreditLimit = computed<string>(() =>
    formatTransactionAmount(availableCreditLimit.value)
);
const isDarkMode = computed(() => theme.global.current.value.dark);
const selectedYearMonth = computed({
    get: () => { const [year, month] = selectedMonth.value.split('-').map(Number); return { year: year!, month0base: month! - 1 }; },
    set: (value: { year: number, month0base: number }) => { selectedMonth.value = `${value.year}-${String(value.month0base + 1).padStart(2, '0')}`; }
});
const selectedMonthLabel = computed(() => {
    const [year, month] = selectedMonth.value.split('-').map(Number);
    if (!year || !month) return selectedMonth.value;
    return formatDateTimeToGregorianLikeLongYearMonth(getYearMonthDayDateTime(year, month, 1));
});
/* 
const currentMonthLabel = computed(() => formatMonthLabel(now.getFullYear(), now.getMonth() + 1));
*/
const isCurrentMonth = computed(() => selectedMonth.value === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

function formatDate(date: Date): string { return formatDateTimeToLongDate(parseDateTimeFromUnixTime(Math.floor(date.getTime() / 1000))); }
function formatTransactionDate(time: number, utcOffset: number): string { return formatDateTimeToLongDate(parseDateTimeFromUnixTimeWithTimezoneOffset(time, utcOffset)); }
function formatTransactionAmount(amount: number): string { return formatAmountToLocalizedNumeralsWithCurrency(parseBigDecimal(String(amount)), selectedAccount.value?.currency); }
function normalizeSearchText(value: string | null): string { return (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim(); }
function getInvoiceItemType(transaction: CreditCardInvoiceItem): Exclude<InvoiceTypeFilter, 'all'> {
    if (transaction.installmentCount > 1) return 'installment';
    if (transaction.subscription) return 'subscription';
    return 'expense';
}
function getInvoiceItemTypeLabel(transaction: CreditCardInvoiceItem): string {
    const type = getInvoiceItemType(transaction);
    if (type === 'installment') return tt('Installment');
    if (type === 'subscription') return tt('Subscription');
    return tt('Expense');
}
function formatMonthLabel(year: number, month: number): string { return formatDateTimeToGregorianLikeLongYearMonth(getYearMonthDayDateTime(year, month, 1)); }
function adjacentMonthLabel(offset: number): string { const [year, month] = selectedMonth.value.split('-').map(Number); const target = new Date(year!, month! - 1 + offset, 1); return formatMonthLabel(target.getFullYear(), target.getMonth() + 1); }
function changeMonth(offset: number): void {
    const [year, month] = selectedMonth.value.split('-').map(Number);
    const target = new Date(year!, month! - 1 + offset, 1);
    selectedMonth.value = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}`;
}
function goToCurrentMonth(): void { selectedMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; }
function openPayInvoiceDialog(): void {
    if (!selectedAccount.value || invoicePaid.value) return;
    payInvoiceDialog.value?.open({ accountId: selectedAccount.value.id, yearMonth: selectedMonth.value, invoiceLabel: selectedMonthLabel.value });
}
function openAutoPaymentDialog(): void { if (selectedAccount.value) void autoPaymentDialog.value?.open(selectedAccount.value.id); }

async function loadInvoicePayment(sequence: number, account: Account, invoiceCycle: string): Promise<void> {
    try {
        const response = await services.getCreditCardInvoicePayment(account.id, invoiceCycle);
        if (sequence === loadSequence) paidAmount.value = response.data.result?.paidAmount || 0;
    } catch {
        if (sequence === loadSequence) paidAmount.value = 0;
    }
}

function editTransaction(transaction: CreditCardInvoiceItem): void {
    if (transaction.projected && transaction.templateId) {
        subscriptionEditDialog.value?.open({
            id: transaction.templateId,
            templateType: TemplateType.Schedule.type
        }).then(result => {
            if (result?.message) void loadInvoice();
        }).catch(() => undefined);
        return;
    }

    if (transaction.projected) return;

    transactionEditDialog.value?.open({
        id: transaction.id,
        editImmediately: true
    }).then(() => {
        void loadInvoice();
    }).catch(() => undefined);
}

function getAdjacentYearMonth(offset: number): string {
    const [year, month] = selectedMonth.value
        .split('-')
        .map(Number);

    const target = new Date(
        year!,
        month! - 1 + offset,
        1
    );

    return `${target.getFullYear()}-${String(
        target.getMonth() + 1
    ).padStart(2, '0')}`;
}

async function loadInvoiceTotal(
    account: Account,
    yearMonth: string
): Promise<number> {
    const targetPeriod = getCreditCardInvoicePeriod(
        account,
        yearMonth
    );

    const items = await loadCreditCardInvoiceItems(
        account,
        targetPeriod.start,
        targetPeriod.end
    );

    return items.reduce(
        (sum, transaction) =>
            sum + transaction.sourceAmount,
        0
    );
}

async function loadAdjacentInvoiceTotals(
    sequence: number
): Promise<void> {
    const account = selectedAccount.value;

    if (!account) {
        previousInvoiceTotal.value = 0;
        nextInvoiceTotal.value = 0;
        return;
    }

    loadingAdjacentInvoices.value = true;

    try {
        const previousYearMonth =
            getAdjacentYearMonth(-1);

        const nextYearMonth =
            getAdjacentYearMonth(1);

        const [
            previousTotal,
            nextTotal
        ] = await Promise.all([
            loadInvoiceTotal(
                account,
                previousYearMonth
            ),
            loadInvoiceTotal(
                account,
                nextYearMonth
            )
        ]);

        if (sequence !== loadSequence) {
            return;
        }

        previousInvoiceTotal.value =
            previousTotal;

        nextInvoiceTotal.value =
            nextTotal;
    } finally {
        if (sequence === loadSequence) {
            loadingAdjacentInvoices.value = false;
        }
    }
}

async function loadCreditLimitUsage(sequence: number): Promise<void> {
    const account = selectedAccount.value;

    currentLimitInvoiceAmount.value = 0;
    currentLimitPaidAmount.value = 0;
    futureInstallmentAmount.value = 0;

    if (!account?.creditCardStatementDate) {
        return;
    }

    loadingCreditLimit.value = true;

    const nowUnixTime = Math.floor(Date.now() / 1000);
    const statementDate = account.creditCardStatementDate;
    const invoiceStartDateTime = getBillingCycleFirstUnixTimeBySpecifiedUnixTime(
        nowUnixTime,
        statementDate
    );
    const invoiceEndDateTime = getBillingCycleLastUnixTimeBySpecifiedUnixTime(
        nowUnixTime,
        statementDate
    );
    const invoiceStartTime = invoiceStartDateTime.getUnixTime();
    const invoiceEndTime = invoiceEndDateTime.getUnixTime();
    const futureEndTime = getUnixTimeAfterUnixTime(
        invoiceEndTime,
        121,
        'months'
    );

    try {
        const currentInvoiceCycle = getCreditCardInvoiceCycle({
            start: new Date(invoiceStartTime * 1000),
            end: new Date(invoiceEndTime * 1000)
        });
        const [invoiceItems, futureTransactionsResponse, invoicePaymentResponse] = await Promise.all([
            loadCreditCardInvoiceItems(
                account,
                new Date(invoiceStartTime * 1000),
                new Date(invoiceEndTime * 1000)
            ),
            services.getAllTransactions({
                startTime: invoiceEndTime + 1,
                endTime: futureEndTime,
                accountIds: account.id
            }),
            services.getCreditCardInvoicePayment(account.id, currentInvoiceCycle).catch(() => undefined)
        ]);

        if (sequence !== loadSequence) {
            return;
        }

        currentLimitInvoiceAmount.value = invoiceItems
            .filter(item => !item.projected)
            .reduce((sum, item) => sum + item.sourceAmount, 0);

        currentLimitPaidAmount.value = invoicePaymentResponse?.data.result?.paidAmount || 0;

        futureInstallmentAmount.value = Transaction.ofMulti(
            futureTransactionsResponse.data.result || []
        )
            .filter(transaction =>
                transaction.type === TransactionType.Expense &&
                transaction.sourceAccountId === account.id &&
                transaction.installmentCount > 1
            )
            .reduce((sum, transaction) => sum + transaction.sourceAmount, 0);
    } finally {
        if (sequence === loadSequence) {
            loadingCreditLimit.value = false;
        }
    }
}

async function loadInvoice(): Promise<void> {
    if (!canLoad.value) {
        return;
    }

    const account = selectedAccount.value;

    if (!account) {
        return;
    }

    const sequence = ++loadSequence;

    loading.value = true;
    previousInvoiceTotal.value = 0;
    nextInvoiceTotal.value = 0;

    try {
        const [
            currentItems
        ] = await Promise.all([
            loadCreditCardInvoiceItems(
                account,
                period.value.start,
                period.value.end
            ),

            loadAdjacentInvoiceTotals(sequence),
            loadCreditLimitUsage(sequence)
        ]);

        if (sequence !== loadSequence) {
            return;
        }

        transactions.value = currentItems;
        void loadInvoicePayment(sequence, account, getCreditCardInvoiceCycle(period.value));
        if (selectedCategory.value && !currentItems.some(item => item.categoryName === selectedCategory.value)) {
            selectedCategory.value = '';
        }
        loaded.value = true;
    } finally {
        if (sequence === loadSequence) {
            loading.value = false;
        }
    }
}

watch([accountId, selectedMonth], () => {
    if (!initialized.value) return;
    loaded.value = false;
    transactions.value = [];
    paidAmount.value = 0;
    void loadInvoice();
});
onMounted(async () => {
    await accountsStore.loadAllAccounts({ force: false });
    if (!accountId.value && creditCards.value.length) accountId.value = creditCards.value[0]!.id;
    initialized.value = true;
    if (canLoad.value) await loadInvoice();
});
</script>


<style scoped>
.invoice-page {
    --invoice-page-gutter: 48px;

    position: relative;

    width: calc(100% + 48px);
    min-width: 0;
    min-height: 100vh;
    margin: -24px;

    color: rgb(var(--v-theme-on-background));
    background: rgb(var(--v-theme-background));

    font-family:
        "Lausanne",
        "Helvetica Neue",
        Arial,
        sans-serif;
}

.invoice-page,
.invoice-page *,
.invoice-page *::before,
.invoice-page *::after {
    box-sizing: border-box;
}

/* Header */

.invoice-header {
    width: 100%;

    border-bottom: 1px solid rgb(var(--v-theme-muted-border));

    background: rgb(var(--v-theme-surface));
}

.invoice-header__top {
    display: flex;
    width: 100%;
    min-width: 0;
    align-items: flex-start;
    justify-content: space-between;
    gap: 32px;

    padding:
        40px
        var(--invoice-page-gutter)
        0;
}

.invoice-header__copy {
    min-width: 0;
}

.invoice-kicker {
    display: block;

    margin-bottom: 8px;

    color: rgb(var(--v-theme-tertiary));

    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.075em;
    text-transform: uppercase;
}

.invoice-header h1 {
    margin: 0;

    color: rgb(var(--v-theme-on-surface));

    font-size: clamp(2rem, 3.6vw, 3.15rem);
    font-weight: 500;
    letter-spacing: -0.055em;
    line-height: 1;
}

.invoice-header p {
    max-width: 640px;

    margin: 12px 0 0;

    color: rgb(var(--v-theme-tertiary));

    font-size: 0.88rem;
    line-height: 1.45;
}

.invoice-header__controls {
    display: grid;
    width: min(500px, 100%);
    flex: 0 0 auto;
    grid-template-columns:
        minmax(210px, 1fr)
        minmax(210px, 1fr)
        48px;
    gap: 10px;
}

.invoice-toolbar-icon-button {
    width: 40px !important;
    min-width: 40px !important;
    height: 40px !important;
    align-self: center;
    justify-self: end;
    border-radius: 6px !important;
    box-shadow: none !important;
}

.invoice-toolbar-icon-button:hover {
    background: rgb(var(--v-theme-on-hover-background)) !important;
}

.month-calendar {
    padding: 12px;

    border: 1px solid rgb(var(--v-theme-muted-border)) !important;
    border-radius: 8px !important;

    background: rgb(var(--v-theme-surface)) !important;
    box-shadow: none !important;
}

/* Header tabs */

.invoice-header__tabs {
    display: flex;
    align-items: stretch;
    gap: 28px;

    margin-top: 34px;
    padding-inline: var(--invoice-page-gutter);

    overflow-x: auto;

    scrollbar-width: none;
}

.invoice-header__tabs::-webkit-scrollbar {
    display: none;
}

.invoice-header__tab,
.invoice-header__link {
    position: relative;

    display: inline-flex;
    min-height: 48px;
    align-items: center;

    padding: 0 1px;

    border: 0;

    color: rgb(var(--v-theme-tertiary));
    background: transparent;

    text-decoration: none;

    cursor: pointer;

    font: inherit;
    font-size: 0.78rem;
    font-weight: 500;
    white-space: nowrap;
}

.invoice-header__tab::after,
.invoice-header__link::after {
    position: absolute;
    right: 0;
    bottom: -1px;
    left: 0;

    height: 2px;

    background: transparent;

    content: "";
}

.invoice-header__tab:hover,
.invoice-header__link:hover {
    color: rgb(var(--v-theme-on-surface));
}

.invoice-header__tab--active {
    color: rgb(var(--v-theme-on-surface));

    font-weight: 600;
}

.invoice-header__tab--active::after {
    background: rgb(var(--v-theme-on-surface));
}

.invoice-loading {
    position: absolute;
    z-index: 5;
    top: 0;
    right: 0;
    left: 0;
}

/* Workspace */

.invoice-workspace {
    padding:
        24px
        var(--invoice-page-gutter)
        48px;
}

/* Summary */

.invoice-overview-card {
    display: grid;
    grid-template-columns: minmax(0, 1.45fr) minmax(360px, 1fr);
    margin-bottom: 14px;
    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 12px;
    background: rgb(var(--v-theme-surface));
    overflow: hidden;
}

.invoice-overview-card__main {
    min-width: 0;
    padding: 22px 24px 20px;
}

.invoice-overview-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.invoice-overview-card__eyebrow {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    color: rgb(var(--v-theme-tertiary));
    font-size: 0.8rem;
    font-weight: 500;
}

.invoice-overview-card__icon,
.invoice-overview-detail__icon {
    display: grid;
    width: 36px;
    min-width: 36px;
    height: 36px;
    place-items: center;

    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 50%;

    color: rgb(var(--v-theme-income));
    background: rgb(var(--v-theme-secondary));
}

.invoice-label {
    display: block;

    color: rgb(var(--v-theme-tertiary));

    font-size: 0.80rem;
    font-weight: 500;
}

.invoice-overview-card__total {
    display: block;
    margin-top: 10px;
    color: rgb(var(--v-theme-on-surface));
    font-size: clamp(2.25rem, 3.4vw, 3rem);
    font-weight: 500;
    letter-spacing: -0.02em;
    line-height: 1;
}

.invoice-overview-card__payment-summary {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 28px;
    max-width: 440px;
    margin-top: 20px;
}

.invoice-overview-card__payment-summary > div {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.invoice-overview-card__payment-summary span {
    color: rgb(var(--v-theme-tertiary));
    font-size: 0.72rem;
}

.invoice-overview-card__payment-summary strong {
    color: rgb(var(--v-theme-on-surface));
    font-size: 0.95rem;
    font-weight: 600;
}

.invoice-overview-card__payment-summary > div:last-child strong {
    color: rgb(var(--v-theme-primary));
}

.invoice-overview-card__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 20px;
    padding-top: 14px;
    border-top: 1px solid rgb(var(--v-theme-muted-border));
}

.invoice-overview-card__account {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 2px;
    color: rgb(var(--v-theme-tertiary));
    font-size: 0.80rem;
}

.invoice-overview-card__account strong {
    overflow: hidden;
    color: rgb(var(--v-theme-on-surface));
    font-weight: 550;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.invoice-overview-card__details {
    display: grid;
    grid-template-rows: repeat(2, minmax(0, 1fr));
    border-left: 1px solid rgb(var(--v-theme-muted-border));
}

.invoice-overview-detail {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 16px;
    padding: 22px 24px;
}

.invoice-overview-detail + .invoice-overview-detail {
    border-top: 1px solid rgb(var(--v-theme-muted-border));
}

.invoice-overview-detail--due .invoice-overview-detail__icon {
    color: rgb(var(--v-theme-expense));
}

.invoice-overview-detail__copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
}

.invoice-overview-detail__copy span,
.invoice-overview-detail__copy small {
    color: rgb(var(--v-theme-tertiary));
    font-size: 0.80rem;
}

.invoice-overview-detail__copy strong {
    margin-top: 4px;
    color: rgb(var(--v-theme-on-surface));
    font-size: 1rem;
    font-weight: 600;
}

.invoice-overview-detail__copy small {
    margin-top: 3px;
}

/* List */

.invoice-list-section {
    overflow: hidden;
    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 10px;
    background: rgb(var(--v-theme-surface));
}

.invoice-list-section__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;

    padding: 20px 22px;

    border-bottom: 1px solid rgb(var(--v-theme-muted-border));
}

.invoice-list-section__header h2 {
    margin: 0 0 4px;

    color: rgb(var(--v-theme-on-surface));

    font-size: 1rem;
    font-weight: 550;
    letter-spacing: -0.025em;
}

.invoice-entry-count {
    display: block;
    flex: 0 0 auto;

    color: rgb(var(--v-theme-tertiary));

    font-size: 0.68rem;
    font-weight: 500;
}

.invoice-search {
    width: min(360px, 45%);
    flex: 0 1 360px;
}

.invoice-table-wrapper {
    width: 100%;

    overflow-x: auto;
}

.invoice-table {
    min-width: 760px;

    background: transparent !important;
}

.invoice-table :deep(table) {
    width: 100%;
}

.invoice-table :deep(th) {
    height: 42px !important;

    color: rgb(var(--v-theme-tertiary)) !important;
    background: rgb(var(--v-theme-table-header-color)) !important;

    font-size: 0.66rem !important;
    font-weight: 600 !important;
    letter-spacing: 0.035em;
    text-transform: uppercase;
}

.invoice-table :deep(th:last-child .invoice-column-menu) {
    margin-left: auto;
}

.invoice-table :deep(td) {
    height: 54px !important;

    border-color: rgb(var(--v-theme-muted-border)) !important;

    color: rgb(var(--v-theme-on-surface));

    font-size: 0.74rem;
}

.invoice-transaction-row {
    cursor: pointer;

    transition: background-color 130ms ease;
}

.invoice-transaction-row:hover,
.invoice-transaction-row:focus-visible {
    outline: none;

    background: rgb(var(--v-theme-on-hover-background));
}

.invoice-description-cell {
    max-width: 320px;

    overflow: hidden;

    text-overflow: ellipsis;
    white-space: nowrap;
}

.invoice-amount-cell {
    color: rgb(var(--v-theme-expense));

    font-weight: 600;
    white-space: nowrap;
}

.invoice-empty {
    min-height: 260px;
}

/* Navigation */

/* =========================================================
 * BARRA FIXA DE NAVEGAÇÃO DAS FATURAS
 * ======================================================= */

.invoice-workspace {
    display: flex;
    min-height: calc(100vh - 160px);
    flex-direction: column;

    padding:
        24px
        var(--invoice-page-gutter)
        0;
}

.invoice-list-section {
    flex: 1 1 auto;
}

/* Barra restrita à largura da invoice-workspace */
.invoice-navigation {
    position: sticky;
    z-index: 20;
    right: auto;
    bottom: 0;
    left: auto;

    display: grid;
    width: 100%;
    height: 62px;
    grid-template-columns: repeat(3, minmax(0, 1fr));

    margin-top: 14px;
    overflow: hidden;

    border: 1px solid rgb(var(--v-theme-muted-border));
    border-bottom: 0;
    border-radius: 10px 10px 0 0;

    background: rgb(var(--v-theme-surface));

    box-shadow: none;
}

.invoice-navigation__button {
    display: grid;
    width: 100%;
    min-width: 0;
    height: 62px;
    grid-template-columns:
        24px minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;

    padding: 7px 18px;

    border: 0;
    border-radius: 0;

    color: rgb(var(--v-theme-on-surface));
    background: transparent;

    cursor: pointer;

    font: inherit;
    text-align: left;

    transition:
        color 130ms ease,
        background-color 130ms ease;
}

.invoice-navigation__button + .invoice-navigation__button {
    border-left: 1px solid
        rgb(var(--v-theme-muted-border));
}

.invoice-navigation__button:hover {
    background:
        rgb(var(--v-theme-on-hover-background));
}

.invoice-navigation__button:disabled {
    cursor: default;
    opacity: var(--v-disabled-opacity);
}

.invoice-navigation__button:focus-visible {
    z-index: 2;

    outline: 2px solid
        rgba(var(--v-theme-primary), 0.55);
    outline-offset: -3px;
}

.invoice-navigation__content {
    display: flex;
    min-width: 0;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
}

.invoice-navigation__content small {
    overflow: hidden;

    color: rgb(var(--v-theme-tertiary));

    font-size: 0.59rem;
    font-weight: 500;
    line-height: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.invoice-navigation__content strong {
    overflow: hidden;

    color: rgb(var(--v-theme-on-surface));

    font-size: 0.73rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1.15;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.invoice-navigation__amount {
    flex: 0 0 auto;

    color: rgb(var(--v-theme-on-surface));

    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: -0.015em;
    white-space: nowrap;
}

.invoice-navigation__icon {
    color: rgb(var(--v-theme-tertiary));
}

.invoice-navigation__button--current {
    grid-template-columns:
        minmax(0, 1fr) auto;

    text-align: center;
}

.invoice-navigation__button--current
    .invoice-navigation__content {
    align-items: center;
}

.invoice-navigation__button--current
    .invoice-navigation__amount {
    color: rgb(var(--v-theme-expense));
}

.invoice-navigation__button--selected {
    background:
        rgba(var(--v-theme-primary), 0.055);
}

.invoice-navigation__button--selected::before {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;

    height: 2px;

    background: rgb(var(--v-theme-primary));

    content: "";
}

.invoice-navigation__button--selected {
    position: relative;
}

.invoice-navigation__button--next {
    grid-template-columns:
        minmax(0, 1fr) auto 24px;

    text-align: right;
}

.invoice-navigation__button--next
    .invoice-navigation__content {
    align-items: flex-end;
}

/* =========================================================
 * TABLET
 * ======================================================= */

@media (max-width: 900px) {
    .invoice-navigation__button {
        gap: 7px;
        padding-inline: 12px;
    }

    .invoice-navigation__amount {
        font-size: 0.72rem;
    }

    .invoice-navigation__content strong {
        font-size: 0.68rem;
    }
}

/* =========================================================
 * MOBILE
 * ======================================================= */

@media (max-width: 600px) {
    .invoice-list-section__header {
        flex-wrap: wrap;
        gap: 14px;
    }

    .invoice-search {
        width: 100%;
        flex-basis: 100%;
    }

    .invoice-workspace {
        padding-bottom: 0;
    }

    .invoice-navigation {
        height: calc(62px + env(safe-area-inset-bottom));

        padding-bottom: env(safe-area-inset-bottom);

        border-radius: 8px 8px 0 0;
    }

    .invoice-navigation__button {
        height: 62px;
        grid-template-columns:
            minmax(0, 1fr);

        justify-items: center;
        gap: 2px;

        padding: 6px 5px;

        text-align: center;
    }

    .invoice-navigation__button--next,
    .invoice-navigation__button--current {
        grid-template-columns:
            minmax(0, 1fr);
    }

    .invoice-navigation__icon {
        display: none;
    }

    .invoice-navigation__content,
    .invoice-navigation__button--next
        .invoice-navigation__content {
        align-items: center;
    }

    .invoice-navigation__content small {
        font-size: 0.53rem;
    }

    .invoice-navigation__content strong {
        max-width: 100%;

        font-size: 0.62rem;
    }

    .invoice-navigation__amount {
        max-width: 100%;

        overflow: hidden;

        font-size: 0.67rem;
        text-overflow: ellipsis;
    }
}

/* Credit limit overview */

.credit-limit-overview {
    min-width: 0;
}

.credit-limit-card {
    overflow: hidden;

    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 10px;

    background: rgb(var(--v-theme-surface));
}

.credit-limit-card__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 28px;

    padding: 28px;

    border-bottom: 1px solid rgb(var(--v-theme-muted-border));
}

.credit-limit-card__header h2 {
    margin: 8px 0 0;

    color: rgb(var(--v-theme-on-surface));

    font-size: 1.2rem;
    font-weight: 550;
    letter-spacing: -0.025em;
}

.credit-limit-card__header p {
    margin: 8px 0 0;

    color: rgb(var(--v-theme-tertiary));

    font-size: 0.78rem;
    line-height: 1.45;
}

.credit-limit-account-select {
    width: 280px;
    max-width: 36%;
    flex: 0 0 auto;
}

.credit-limit-card__body {
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(300px, 0.85fr);
}

.credit-limit-card__main {
    display: flex;
    min-width: 0;
    min-height: 300px;
    flex-direction: column;

    padding: 34px 28px;
}

.credit-limit-card__available {
    margin-top: 14px;

    color: rgb(var(--v-theme-on-surface));

    font-size: clamp(2.7rem, 6vw, 4.5rem);
    font-weight: 500;
    letter-spacing: -0.06em;
    line-height: 1;
}

.credit-limit-card__usage-copy {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;

    margin-top: 36px;

    color: rgb(var(--v-theme-tertiary));

    font-size: 0.68rem;
}

.credit-limit-card__progress {
    margin-top: 10px;
}

.credit-limit-card__details-link {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    gap: 7px;

    margin-top: auto;

    color: rgb(var(--v-theme-on-surface));

    text-decoration: none;

    font-size: 0.72rem;
    font-weight: 550;
}

.credit-limit-card__details-link:hover {
    opacity: 0.65;
}

.credit-limit-card__stats {
    display: flex;
    min-width: 0;
    flex-direction: column;
    justify-content: center;

    padding: 18px 28px;

    border-left: 1px solid rgb(var(--v-theme-muted-border));
}

.credit-limit-stat {
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr);
    align-items: center;
    gap: 14px;

    min-height: 82px;

    border-bottom: 1px solid rgb(var(--v-theme-muted-border));
}

.credit-limit-stat:last-child {
    border-bottom: 0;
}

.credit-limit-stat__icon {
    display: grid;
    width: 36px;
    height: 36px;
    place-items: center;

    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 50%;

    color: rgb(var(--v-theme-on-surface));
    background: rgb(var(--v-theme-secondary));
}

.credit-limit-stat__icon--positive {
    color: rgb(var(--v-theme-income));
}

.credit-limit-stat__copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 6px;
}

.credit-limit-stat__copy small {
    color: rgb(var(--v-theme-tertiary));

    font-size: 0.64rem;
}

.credit-limit-stat__copy strong {
    overflow: hidden;

    color: rgb(var(--v-theme-on-surface));

    font-size: 0.85rem;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
}

@media (max-width: 900px) {
    .credit-limit-card__body {
        grid-template-columns: 1fr;
    }

    .credit-limit-card__stats {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));

        border-top: 1px solid rgb(var(--v-theme-muted-border));
        border-left: 0;
    }

    .credit-limit-stat {
        border-right: 1px solid rgb(var(--v-theme-muted-border));
        border-bottom: 0;
    }

    .credit-limit-stat:last-child {
        border-right: 0;
    }
}

@media (max-width: 700px) {
    .credit-limit-card__header {
        flex-direction: column;
        padding: 22px;
    }

    .credit-limit-account-select {
        width: 100%;
        max-width: none;
    }

    .credit-limit-card__main {
        min-height: 270px;
        padding: 26px 22px;
    }

    .credit-limit-card__stats {
        grid-template-columns: 1fr;
        padding: 8px 22px;
    }

    .credit-limit-stat {
        border-right: 0;
        border-bottom: 1px solid rgb(var(--v-theme-muted-border));
    }

    .credit-limit-stat:last-child {
        border-bottom: 0;
    }
}

@media (max-width: 600px) {
    .credit-limit-card__available {
        font-size: clamp(2.2rem, 12vw, 3.2rem);
    }

    .credit-limit-card__usage-copy {
        align-items: flex-start;
        flex-direction: column;
        gap: 5px;

        margin-top: 28px;
    }
}

/* Responsive */

@media (max-width: 1260px) {
    .invoice-page {
        --invoice-page-gutter: 32px;
    }

    .invoice-header__top {
        flex-direction: column;
    }

    .invoice-header__controls {
        width: 100%;
    }
}

@media (max-width: 900px) {
    .invoice-page {
        --invoice-page-gutter: 22px;
    }

    .invoice-header__top {
        padding-top: 28px;
    }

    .invoice-overview-card {
        grid-template-columns: minmax(0, 1.25fr) minmax(300px, 1fr);
    }
}

@media (max-width: 700px) {
    .invoice-header__controls {
        grid-template-columns: 1fr;
    }

    .invoice-overview-card {
        grid-template-columns: 1fr;
    }

    .invoice-overview-card__details {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-template-rows: none;
        border-top: 1px solid rgb(var(--v-theme-muted-border));
        border-left: 0;
    }

    .invoice-overview-detail + .invoice-overview-detail {
        border-top: 0;
        border-left: 1px solid rgb(var(--v-theme-muted-border));
    }
}

@media (max-width: 600px) {
    .invoice-page {
        --invoice-page-gutter: 14px;

        width: calc(100% + 48px);
        margin: -24px;
    }

    .invoice-header__top {
        padding-top: 22px;
    }

    .invoice-header h1 {
        font-size: 1.75rem;
    }

    .invoice-header p {
        display: none;
    }

    .invoice-header__tabs {
        gap: 22px;
        margin-top: 24px;
    }

    .invoice-workspace {
        padding-top: 14px;
        padding-bottom: 28px;
    }

    .invoice-overview-card__main {
        padding: 20px 18px 18px;
    }

    .invoice-overview-card__details {
        grid-template-columns: 1fr;
    }

    .invoice-overview-detail {
        padding: 18px;
    }

    .invoice-overview-detail + .invoice-overview-detail {
        border-top: 1px solid rgb(var(--v-theme-muted-border));
        border-left: 0;
    }

    .invoice-overview-card__footer {
        align-items: stretch;
        flex-direction: column;
    }

    .invoice-overview-card__footer .v-btn {
        width: 100%;
    }

    .invoice-list-section__header {
        align-items: flex-start;
        padding: 16px 18px;
    }

    .invoice-entry-count {
        margin-top: 2px;
    }

}

/*
 * Mantém os três botões em qualquer largura.
 */
.invoice-navigation {
    display: grid !important;
    grid-template-columns:
        minmax(0, 1fr)
        minmax(0, 1fr)
        minmax(0, 1fr) !important;

    width: 100% !important;
    min-width: 0 !important;
}

/*
 * Impede regras antigas de esconderem os botões laterais.
 */
.invoice-navigation__button,
.invoice-navigation__button--previous,
.invoice-navigation__button--current,
.invoice-navigation__button--next {
    display: grid !important;
    visibility: visible !important;

    min-width: 0 !important;
    height: 62px !important;

    opacity: 1;
}

.invoice-navigation__button:disabled {
    opacity: var(--v-disabled-opacity);
}

/* =========================================================
 * TABLET — abaixo de 700px
 * ======================================================= */

@media (max-width: 700px) {
    .invoice-navigation {
        grid-template-columns:
            minmax(72px, 0.8fr)
            minmax(0, 1.4fr)
            minmax(72px, 0.8fr) !important;

        height: 62px !important;
    }

    .invoice-navigation__button {
        height: 62px !important;
    }

    /*
     * Os três botões continuam visíveis.
     * Apenas reduzimos os espaçamentos.
     */
    .invoice-navigation__button--previous {
        grid-template-columns:
            20px minmax(0, 1fr) !important;

        padding: 6px 10px !important;
    }

    .invoice-navigation__button--current {
        grid-template-columns:
            minmax(0, 1fr) !important;

        padding: 6px 10px !important;
    }

    .invoice-navigation__button--next {
        grid-template-columns:
            minmax(0, 1fr) 20px !important;

        padding: 6px 10px !important;
    }

    /*
     * O valor das faturas laterais é ocultado no tablet
     * para evitar esmagamento, mas mês e navegação continuam.
     */
    .invoice-navigation__button--previous
        .invoice-navigation__amount,
    .invoice-navigation__button--next
        .invoice-navigation__amount {
        display: none !important;
    }

    .invoice-navigation__content strong {
        font-size: 0.65rem;
    }

    .invoice-navigation__content small {
        font-size: 0.53rem;
    }

    .invoice-navigation__icon {
        display: inline-flex !important;
    }
}

/* =========================================================
 * MOBILE — abaixo de 600px
 * ======================================================= */

@media (max-width: 600px) {
    .invoice-navigation {
        grid-template-columns:
            56px
            minmax(0, 1fr)
            56px !important;

        height:
            calc(62px + env(safe-area-inset-bottom)) !important;

        padding-bottom:
            env(safe-area-inset-bottom);
    }

    /*
     * Anterior e próximo viram botões somente com ícones.
     */
    .invoice-navigation__button--previous,
    .invoice-navigation__button--next {
        display: flex !important;
        width: 56px !important;
        min-width: 56px !important;
        height: 62px !important;
        align-items: center !important;
        justify-content: center !important;

        padding: 0 !important;
    }

    .invoice-navigation__button--previous
        .invoice-navigation__content,
    .invoice-navigation__button--previous
        .invoice-navigation__amount,
    .invoice-navigation__button--next
        .invoice-navigation__content,
    .invoice-navigation__button--next
        .invoice-navigation__amount {
        display: none !important;
    }

    .invoice-navigation__button--previous
        .invoice-navigation__icon,
    .invoice-navigation__button--next
        .invoice-navigation__icon {
        display: inline-flex !important;

        margin: 0 !important;

        color: rgb(var(--v-theme-on-surface));

        font-size: 22px !important;
    }

    /*
     * O botão central continua exibindo mês e valor.
     */
    .invoice-navigation__button--current {
        display: flex !important;
        min-width: 0 !important;
        height: 62px !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 4px !important;

        padding: 5px 8px !important;

        text-align: center !important;
    }

    .invoice-navigation__button--current
        .invoice-navigation__content {
        align-items: center !important;
        gap: 3px;
    }

    .invoice-navigation__button--current
        .invoice-navigation__content small {
        display: block !important;

        font-size: 0.52rem;
    }

    .invoice-navigation__button--current
        .invoice-navigation__content strong {
        display: block !important;

        max-width: 100%;

        font-size: 0.67rem;
    }

    .invoice-navigation__button--current
        .invoice-navigation__amount {
        display: block !important;

        max-width: 100%;

        overflow: hidden;

        color: rgb(var(--v-theme-expense));

        font-size: 0.72rem;
        font-weight: 600;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}

@media (min-width: 901px) {
    .invoice-navigation {
        width: calc(100% + 24px) !important;
        margin-right: -16px !important;
        margin-left: -16px !important;
    }
}

</style>
