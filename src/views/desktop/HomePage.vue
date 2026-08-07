<template>
    <main class="home">
        <header class="page-header">
            <div class="page-header__top">
                <div class="page-header__copy">
                    <h1>{{ tt('Overview') }}</h1>
                </div>

                <div class="page-header__actions">
                    <v-btn
                        class="refresh-button"
                        variant="text"
                        color="tertiary"
                        :icon="mdiRefresh"
                        :loading="loadingOverview"
                        :disabled="loadingOverview"
                        :aria-label="tt('Refresh')"
                        @click="reload(true)"
                    />

                    <v-btn
                        class="primary-button"
                        color="primary"
                        variant="flat"
                        :prepend-icon="mdiPlus"
                        :aria-label="tt('Nova transação')"
                        @click="openNewTransaction"
                    >
                        {{ tt('Nova transação') }}
                    </v-btn>
                </div>
            </div>

        </header>

        <nav class="page-tabs" :aria-label="tt('Overview sections')">
            <button
                type="button"
                class="page-tab"
                :class="{ 'page-tab--active': activeTab === 'overview' }"
                @click="activeTab = 'overview'"
            >
                {{ tt('Resumo') }}
            </button>

            <button
                type="button"
                class="page-tab"
                :class="{ 'page-tab--active': activeTab === 'cashflow' }"
                @click="activeTab = 'cashflow'"
            >
                {{ tt('Fluxo financeiro') }}
            </button>

            <button
                type="button"
                class="page-tab"
                :class="{ 'page-tab--active': activeTab === 'cards' }"
                @click="activeTab = 'cards'"
            >
                {{ tt('Cartões') }}
            </button>

            <button
                type="button"
                class="page-tab"
                :class="{ 'page-tab--active': activeTab === 'analytics' }"
                @click="activeTab = 'analytics'"
            >
                {{ tt('Análises') }}
            </button>
        </nav>

        <div class="page-toolbar">
            <div class="period-chip">
                <v-icon :icon="mdiCalendarMonthOutline" size="16" />
                <span>{{ displayDateRange?.thisMonth?.displayTime || tt('This Month') }}</span>
            </div>

            <div class="toolbar-links">
                <router-link to="/transaction/list">{{ tt('Transações') }}</router-link>
                <router-link to="/account/invoices">{{ tt('Faturas') }}</router-link>
                <router-link to="/statistics/transaction">{{ tt('Relatórios') }}</router-link>
            </div>
        </div>

        <section v-show="activeTab === 'overview'" class="tab-content">
            <div class="summary-grid">
                <article class="card card--net-worth">
                    <div class="card-heading">
                        <div>
                            <span class="card-label">{{ tt('Patrimônio líquido') }}</span>
                            <h2>{{ netAssets }}</h2>
                        </div>

                        <v-btn
                            class="visibility-button"
                            variant="text"
                            density="compact"
                            color="grey-900"
                            :icon="true"
                            @click="showAmountInHomePage = !showAmountInHomePage"
                        >
                            <v-icon
                                :icon="showAmountInHomePage ? mdiEyeOffOutline : mdiEyeOutline"
                                size="18"
                            />
                        </v-btn>
                    </div>

                    <div class="net-worth-breakdown">
                        <div>
                            <span>{{ tt('Total assets') }}</span>
                            <strong>{{ totalAssets }}</strong>
                        </div>
                        <div>
                            <span>{{ tt('Total liabilities') }}</span>
                            <strong>{{ totalLiabilities }}</strong>
                        </div>
                    </div>
                </article>

                <article class="card metric-card">
                    <div class="metric-card__icon metric-card__icon--income">
                        <v-icon :icon="mdiTrendingUp" size="19" />
                    </div>
                    <span>{{ tt('Monthly income') }}</span>
                    <strong class="income-text">
                        {{
                            transactionOverview && transactionOverview.thisMonth
                                ? getDisplayIncomeAmount(transactionOverview.thisMonth)
                                : '-'
                        }}
                    </strong>
                    <small>{{ displayDateRange?.thisMonth?.displayTime || '' }}</small>
                </article>

                <article class="card metric-card">
                    <div class="metric-card__icon metric-card__icon--expense">
                        <v-icon :icon="mdiTrendingDown" size="19" />
                    </div>
                    <span>{{ tt('Despesa mensal') }}</span>
                    <strong class="expense-text">
                        {{
                            transactionOverview && transactionOverview.thisMonth
                                ? getDisplayExpenseAmount(transactionOverview.thisMonth)
                                : '-'
                        }}
                    </strong>
                    <small>{{ displayDateRange?.thisMonth?.displayTime || '' }}</small>
                </article>

                <article class="card metric-card">
                    <div class="metric-card__icon">
                        <v-icon :icon="mdiWalletOutline" size="19" />
                    </div>
                    <span>{{ tt('Accounts') }}</span>
                    <strong>{{ displayAccountCount }}</strong>
                    <small>{{ tt('Visible accounts') }}</small>
                </article>
            </div>

            <div class="overview-grid">
                <article class="card section-card">
                    <div class="section-heading">
                        <div>
                            <h2>{{ tt('Receitas e despesas') }}</h2>
                        </div>
                        <button class="inline-link" type="button" @click="activeTab = 'cashflow'">
                            {{ tt('View Details') }}
                            <v-icon :icon="mdiArrowRight" size="15" />
                        </button>
                    </div>

                    <div class="period-table">
                        <router-link
                            v-for="period in [
                                { key: 'today', label: tt('Today'), icon: mdiCalendarTodayOutline, dateType: DateRange.Today.type, date: displayDateRange?.today?.displayTime || '' },
                                { key: 'thisWeek', label: tt('This Week'), icon: mdiCalendarWeekOutline, dateType: DateRange.ThisWeek.type, date: displayDateRange?.thisWeek ? `${displayDateRange.thisWeek.startTime}-${displayDateRange.thisWeek.endTime}` : '' },
                                { key: 'thisMonth', label: tt('This Month'), icon: mdiCalendarMonthOutline, dateType: DateRange.ThisMonth.type, date: displayDateRange?.thisMonth?.displayTime || '' },
                                { key: 'thisYear', label: tt('This Year'), icon: mdiLayersTripleOutline, dateType: DateRange.ThisYear.type, date: displayDateRange?.thisYear?.displayTime || '' }
                            ]"
                            :key="period.key"
                            class="period-row"
                            :to="`/transaction/list?${overviewStore.getTransactionListPageParams({ dateType: period.dateType })}`"
                        >
                            <span class="period-row__icon"><v-icon :icon="period.icon" size="18" /></span>
                            <span class="period-row__name">
                                <strong>{{ period.label }}</strong>
                                <small>{{ period.date }}</small>
                            </span>
                            <span class="period-row__amount period-row__amount--income">
                                <small>{{ tt('Income') }}</small>
                                <strong class="income-text">
                                    {{ getPeriodIncome(period.key) }}
                                </strong>
                            </span>
                            <span class="period-row__amount">
                                <small>{{ tt('Expense') }}</small>
                                <strong class="expense-text">
                                    {{ getPeriodExpense(period.key) }}
                                </strong>
                            </span>
                            <v-icon class="period-row__arrow" :icon="mdiChevronRight" size="17" />
                        </router-link>
                    </div>
                </article>

                <aside class="overview-side">
                    <article class="card section-card">
                        <div class="section-heading">
                            <div>
                                <h2>{{ tt('Situação financeira') }}</h2>
                            </div>
                        </div>

                        <div class="position-list">
                            <div class="position-row">
                                <span class="position-icon"><v-icon :icon="mdiBankOutline" size="18" /></span>
                                <span>{{ tt('Total assets') }}</span>
                                <strong>{{ totalAssets }}</strong>
                            </div>
                            <div class="position-row">
                                <span class="position-icon position-icon--expense"><v-icon :icon="mdiCreditCardOutline" size="18" /></span>
                                <span>{{ tt('Total liabilities') }}</span>
                                <strong>{{ totalLiabilities }}</strong>
                            </div>
                            <div class="position-row position-row--highlight">
                                <span class="position-icon"><v-icon :icon="mdiPiggyBankOutline" size="18" /></span>
                                <span>{{ tt('Net assets') }}</span>
                                <strong>{{ netAssets }}</strong>
                            </div>
                        </div>
                    </article>

                    <article class="card section-card">
                        <div class="section-heading">
                            <div>
                                <h2>{{ tt('Ferramentas') }}</h2>
                            </div>
                        </div>

                        <div class="tool-list">
                            <router-link to="/statistics/transaction"><v-icon :icon="mdiChartBoxOutline" size="18" /><span>{{ tt('Estatísticas') }}</span><v-icon :icon="mdiChevronRight" size="16" /></router-link>
                            <router-link to="/schedule/list"><v-icon :icon="mdiCalendarClockOutline" size="18" /><span>{{ tt('Agendamentos') }}</span><v-icon :icon="mdiChevronRight" size="16" /></router-link>
                            <router-link to="/account/list"><v-icon :icon="mdiWalletOutline" size="18" /><span>{{ tt('Gerenciar contas') }}</span><v-icon :icon="mdiChevronRight" size="16" /></router-link>
                        </div>
                    </article>
                </aside>
            </div>
        </section>

        <section v-show="activeTab === 'cashflow'" class="tab-content">
            <article class="card section-card section-card--wide">
                <div class="section-heading">
                    <div>
                        <h2>{{ tt('Receitas e despesas por período') }}</h2>
                    </div>
                    <router-link class="inline-link" to="/transaction/list">
                        {{ tt('Todas as transações') }}
                        <v-icon :icon="mdiArrowRight" size="15" />
                    </router-link>
                </div>

                <div class="period-table period-table--expanded">
                    <router-link
                        v-for="period in [
                            { key: 'today', label: tt('Today'), icon: mdiCalendarTodayOutline, dateType: DateRange.Today.type, date: displayDateRange?.today?.displayTime || '' },
                            { key: 'thisWeek', label: tt('This Week'), icon: mdiCalendarWeekOutline, dateType: DateRange.ThisWeek.type, date: displayDateRange?.thisWeek ? `${displayDateRange.thisWeek.startTime}-${displayDateRange.thisWeek.endTime}` : '' },
                            { key: 'thisMonth', label: tt('This Month'), icon: mdiCalendarMonthOutline, dateType: DateRange.ThisMonth.type, date: displayDateRange?.thisMonth?.displayTime || '' },
                            { key: 'thisYear', label: tt('This Year'), icon: mdiLayersTripleOutline, dateType: DateRange.ThisYear.type, date: displayDateRange?.thisYear?.displayTime || '' }
                        ]"
                        :key="period.key"
                        class="period-row"
                        :to="`/transaction/list?${overviewStore.getTransactionListPageParams({ dateType: period.dateType })}`"
                    >
                        <span class="period-row__icon"><v-icon :icon="period.icon" size="18" /></span>
                        <span class="period-row__name"><strong>{{ period.label }}</strong><small>{{ period.date }}</small></span>
                        <span class="period-row__amount period-row__amount--income"><small>{{ tt('Income') }}</small><strong class="income-text">{{ getPeriodIncome(period.key) }}</strong></span>
                        <span class="period-row__amount"><small>{{ tt('Expense') }}</small><strong class="expense-text">{{ getPeriodExpense(period.key) }}</strong></span>
                        <v-icon class="period-row__arrow" :icon="mdiChevronRight" size="17" />
                    </router-link>
                </div>
            </article>
        </section>

        <section v-show="activeTab === 'cards'" class="tab-content">
            <article class="card credit-card-panel">
                <header class="credit-card-panel__header">
                    <div class="credit-card-panel__title">
                        
                        <h2>{{ selectedCreditCard?.name || tt('Cartões') }}</h2>
                        <p>
                            {{ tt('Acompanhe o limite utilizado e o saldo disponível deste cartão.') }}
                        </p>
                    </div>

                    <v-select
                        v-if="creditCards.length"
                        v-model="selectedCreditCardId"
                        class="credit-select"
                        :items="creditCards"
                        item-title="name"
                        item-value="id"
                        density="compact"
                        variant="solo"
                        flat
                        hide-details
                        :disabled="loadingCreditLimit"
                        :menu-props="{
                            contentClass: 'credit-select-menu',
                            offset: 6,
                            closeOnContentClick: true
                        }"
                    />
                </header>

                <template v-if="selectedCreditCard">
                    <div class="credit-overview">
                        <section class="credit-limit">
                            <span class="credit-limit__label">
                                {{ tt('Available limit') }}
                            </span>

                            <strong class="credit-limit__value">
                                {{ formattedAvailableCreditLimit }}
                            </strong>

                            <div class="credit-limit__progress">
                                <div class="credit-limit__progress-header">
                                    <span>
                                        {{ Math.round(creditLimitUsagePercentage) }}%
                                        {{ tt('utilizado') }}
                                    </span>

                                    <span>
                                        {{ formattedUsedCreditLimit }}
                                        {{ tt('de') }}
                                        {{ formattedTotalCreditLimit }}
                                    </span>
                                </div>

                                <v-progress-linear
                                    :model-value="creditLimitUsagePercentage"
                                    color="primary"
                                    bg-color="surface-variant"
                                    height="8"
                                    rounded
                                />
                            </div>

                            <router-link
                                class="credit-details-link"
                                :to="`/account/invoices?accountId=${selectedCreditCard.id}`"
                            >
                                <span>{{ tt('View Details') }}</span>
                                <v-icon :icon="mdiArrowRight" size="16" />
                            </router-link>
                        </section>

                        <aside class="credit-summary">
                            <div class="credit-summary__item">
                                <div class="credit-summary__icon credit-summary__icon--used">
                                    <v-icon :icon="mdiCreditCardOutline" size="18" />
                                </div>

                                <div class="credit-summary__content">
                                    <span>{{ tt('Used limit') }}</span>
                                    <strong>{{ formattedUsedCreditLimit }}</strong>
                                </div>
                            </div>

                            <div class="credit-summary__item">
                                <div class="credit-summary__icon">
                                    <v-icon :icon="mdiWalletOutline" size="18" />
                                </div>

                                <div class="credit-summary__content">
                                    <span>{{ tt('Limite total') }}</span>
                                    <strong>{{ formattedTotalCreditLimit }}</strong>
                                </div>
                            </div>

                            <div class="credit-summary__item">
                                <div class="credit-summary__icon credit-summary__icon--available">
                                    <v-icon :icon="mdiTrendingUp" size="18" />
                                </div>

                                <div class="credit-summary__content">
                                    <span>{{ tt('Available limit') }}</span>
                                    <strong>{{ formattedAvailableCreditLimit }}</strong>
                                </div>
                            </div>
                        </aside>
                    </div>
                </template>

                <div v-else class="credit-empty-state">
                    <div class="credit-empty-state__icon">
                        <v-icon :icon="mdiCreditCardOutline" size="24" />
                    </div>

                    <strong>{{ tt('No credit cards available') }}</strong>

                    <span>
                        {{ tt('Adicione um cartão de crédito para acompanhar o limite disponível.') }}
                    </span>
                </div>
            </article>
        </section>

        <section v-show="activeTab === 'analytics'" class="tab-content">
            <article class="card chart-card">
                <div class="section-heading">
                    <div>
                        <h2>{{ tt('Evolução dos últimos 12 meses') }}</h2>
                    </div>
                    <router-link class="inline-link" to="/statistics/transaction">
                        {{ tt('Relatórios') }}
                        <v-icon :icon="mdiArrowRight" size="15" />
                    </router-link>
                </div>

                <monthly-income-and-expense-card
                    :data="monthlyIncomeAndExpenseData"
                    :is-dark-mode="isDarkMode"
                    :loading="loadingOverview"
                    :disabled="loadingOverview"
                    :enable-click-item="true"
                    @click="clickMonthlyIncomeOrExpense"
                />
            </article>
        </section>

        <snack-bar ref="snackbar" />
    </main>
</template>
<script setup lang="ts">
import SnackBar from '@/components/desktop/SnackBar.vue';
import MonthlyIncomeAndExpenseCard, {
    type MonthlyIncomeAndExpenseCardClickEvent
} from './overview/cards/MonthlyIncomeAndExpenseCard.vue';

import { ref, computed, useTemplateRef, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useTheme } from 'vuetify';

import { useI18n } from '@/locales/helpers.ts';
import { useHomePageBase } from '@/views/base/HomePageBase.ts';

import { useAccountsStore } from '@/stores/account.ts';
import { useTransactionCategoriesStore } from '@/stores/transactionCategory.ts';
import { useOverviewStore } from '@/stores/overview.ts';
import { useDesktopPageStore } from '@/stores/desktopPage.ts';

import { DateRange } from '@/core/datetime.ts';
import { AccountCategory } from '@/core/account.ts';
import { TransactionType } from '@/core/transaction.ts';
import { ThemeType } from '@/core/theme.ts';
import type { Account } from '@/models/account.ts';
import {
    Transaction,
    type TransactionMonthlyIncomeAndExpenseData,
    LATEST_12MONTHS_TRANSACTION_AMOUNTS_REQUEST_TYPES
} from '@/models/transaction.ts';

import { BIG_DECIMAL_ZERO, parseBigDecimal } from '@/lib/numeral.ts';
import services from '@/lib/services.ts';
import { loadCreditCardInvoiceItems } from '@/lib/credit_card_invoice.ts';
import {
    getUnixTimeBeforeUnixTime,
    getUnixTimeAfterUnixTime,
    getBillingCycleFirstUnixTimeBySpecifiedUnixTime,
    getBillingCycleLastUnixTimeBySpecifiedUnixTime
} from '@/lib/datetime.ts';
import { isUserLogined, isUserUnlocked } from '@/lib/userstate.ts';

import {
    mdiRefresh,
    mdiArrowRight,
    mdiEyeOutline,
    mdiEyeOffOutline,
    mdiBankOutline,
    mdiCreditCardOutline,
    mdiPiggyBankOutline,
    mdiCalendarTodayOutline,
    mdiCalendarWeekOutline,
    mdiCalendarMonthOutline,
    mdiLayersTripleOutline,
    mdiPlus,
    mdiCalendarClockOutline,
    mdiTrendingUp,
    mdiTrendingDown,
    mdiWalletOutline,
    mdiChartBoxOutline,
    mdiChevronRight
} from '@mdi/js';

type SnackBarType = InstanceType<typeof SnackBar>;

const router = useRouter();
const theme = useTheme();

const totalCreditLimit = computed<number>(() =>
    Number(selectedCreditCard.value?.creditCardLimit ?? 0)
);

const formattedTotalCreditLimit = computed<string>(() =>
    formatCreditCardAmount(totalCreditLimit.value)
);


const {
    tt,
    formatNumberToLocalizedNumerals,
    formatAmountToLocalizedNumeralsWithCurrency
} = useI18n();

const {
    showAmountInHomePage,
    allAccounts,
    netAssets,
    totalAssets,
    totalLiabilities,
    displayDateRange,
    transactionOverview,
    getDisplayIncomeAmount,
    getDisplayExpenseAmount
} = useHomePageBase();

const accountsStore = useAccountsStore();
const transactionCategoriesStore = useTransactionCategoriesStore();
const overviewStore = useOverviewStore();
const desktopPageStore = useDesktopPageStore();

const snackbar = useTemplateRef<SnackBarType>('snackbar');

type HomeTab = 'overview' | 'cashflow' | 'cards' | 'analytics';

const activeTab = ref<HomeTab>('overview');
const loadingOverview = ref<boolean>(true);
const loadingCreditLimit = ref<boolean>(false);
const selectedCreditCardId = ref<string>('');
const currentInvoiceAmount = ref<number>(0);
const futureInstallmentAmount = ref<number>(0);
let creditLimitLoadSequence = 0;

const isDarkMode = computed<boolean>(
    () => theme.global.name.value === ThemeType.Dark
);

const displayAccountCount = computed<string>(() =>
    formatNumberToLocalizedNumerals(allAccounts.value?.length ?? 0)
);

const creditCards = computed<Account[]>(() =>
    accountsStore.allPlainAccounts.filter(account =>
        account.category === AccountCategory.CreditCard.type && account.visible
    )
);

const selectedCreditCard = computed<Account | undefined>(() =>
    creditCards.value.find(account => account.id === selectedCreditCardId.value)
);

const usedCreditLimit = computed<number>(() =>
    Math.max(
        0,
        currentInvoiceAmount.value +
            futureInstallmentAmount.value
    )
);

const availableCreditLimit = computed<number>(() => {
    const limit = Number(
        selectedCreditCard.value?.creditCardLimit ?? 0
    );

    return Math.max(
        0,
        limit - usedCreditLimit.value
    );
});

const creditLimitUsagePercentage = computed<number>(() => {
    const limit = Number(
        selectedCreditCard.value?.creditCardLimit ?? 0
    );

    return limit > 0
        ? Math.min(
            100,
            (usedCreditLimit.value / limit) * 100
        )
        : 0;
});

const formattedAvailableCreditLimit = computed<string>(() =>
    formatCreditCardAmount(availableCreditLimit.value)
);

const formattedUsedCreditLimit = computed<string>(() =>
    formatCreditCardAmount(usedCreditLimit.value)
);

function formatCreditCardAmount(amount: number): string {
    return formatAmountToLocalizedNumeralsWithCurrency(
        parseBigDecimal(String(amount)),
        selectedCreditCard.value?.currency
    );
}



async function loadCreditLimitUsage(): Promise<void> {
    const account = selectedCreditCard.value;
    const sequence = ++creditLimitLoadSequence;

    currentInvoiceAmount.value = 0;
    futureInstallmentAmount.value = 0;

    if (!account?.creditCardStatementDate) {
        loadingCreditLimit.value = false;
        return;
    }

    loadingCreditLimit.value = true;

    const nowUnixTime = Math.floor(Date.now() / 1000);
    const statementDate = account.creditCardStatementDate;

    /*
     * Usa as funções nativas do Bookkeeping para determinar o ciclo,
     * evitando erros no último dia da fatura e diferenças de fuso.
     */
    const invoiceStartDateTime =
        getBillingCycleFirstUnixTimeBySpecifiedUnixTime(
            nowUnixTime,
            statementDate
        );

    const invoiceEndDateTime =
        getBillingCycleLastUnixTimeBySpecifiedUnixTime(
            nowUnixTime,
            statementDate
        );

    const invoiceStartTime = invoiceStartDateTime.getUnixTime();
    const invoiceEndTime = invoiceEndDateTime.getUnixTime();

    const invoiceStart = new Date(invoiceStartTime * 1000);
    const invoiceEnd = new Date(invoiceEndTime * 1000);

    const futureEndTime = getUnixTimeAfterUnixTime(
        invoiceEndTime,
        121,
        'months'
    );

    try {
        const [
            invoiceItems,
            futureTransactionsResponse
        ] = await Promise.all([
            loadCreditCardInvoiceItems(
                account,
                invoiceStart,
                invoiceEnd
            ),

            services.getAllTransactions({
                startTime: invoiceEndTime + 1,
                endTime: futureEndTime,
                accountIds: account.id
            })
        ]);

        if (sequence !== creditLimitLoadSequence) {
            return;
        }

        currentInvoiceAmount.value = invoiceItems
            .filter(item => !item.projected)
            .reduce(
                (total, item) =>
                    total + item.sourceAmount,
                0
            );

        futureInstallmentAmount.value =
            Transaction.ofMulti(
                futureTransactionsResponse.data.result || []
            )
                .filter(transaction =>
                    transaction.type === TransactionType.Expense &&
                    transaction.sourceAccountId === account.id &&
                    transaction.installmentCount > 1
                )
                .reduce(
                    (total, transaction) =>
                        total + transaction.sourceAmount,
                    0
                );
    } catch (error: any) {
        if (
            sequence === creditLimitLoadSequence &&
            !error.processed
        ) {
            snackbar.value?.showError(error);
        }
    } finally {
        if (sequence === creditLimitLoadSequence) {
            loadingCreditLimit.value = false;
        }
    }
}

watch(creditCards, cards => {
    if (!cards.some(account => account.id === selectedCreditCardId.value)) {
        selectedCreditCardId.value = cards[0]?.id ?? '';
    }
}, { immediate: true });

watch(selectedCreditCardId, () => {
    void loadCreditLimitUsage();
});

function getPeriodIncome(key: string): string {
    const item = (transactionOverview.value as any)?.[key];

    return item?.valid
        ? getDisplayIncomeAmount(item)
        : '-';
}

function getPeriodExpense(key: string): string {
    const item = (transactionOverview.value as any)?.[key];

    return item?.valid
        ? getDisplayExpenseAmount(item)
        : '-';
}

function openNewTransaction(): void {
    desktopPageStore.setShowAddTransactionDialogInTransactionList();

    void router.push('/transaction/list');
}

function clickMonthlyIncomeOrExpense(
    e: MonthlyIncomeAndExpenseCardClickEvent
): void {
    const minTime = e.monthStartTime;
    const maxTime = getUnixTimeBeforeUnixTime(
        getUnixTimeAfterUnixTime(minTime, 1, 'months'),
        1,
        'seconds'
    );

    router.push(
        `/transaction/list?${overviewStore.getTransactionListPageParams({
            type: e.transactionType,
            dateType: DateRange.Custom.type,
            minTime,
            maxTime
        })}`
    );
}

const monthlyIncomeAndExpenseData = computed<
    TransactionMonthlyIncomeAndExpenseData[]
>(() => {
    const data: TransactionMonthlyIncomeAndExpenseData[] = [];

    if (
        !transactionOverview.value ||
        !transactionOverview.value.thisMonth ||
        !transactionOverview.value.thisMonth.valid
    ) {
        return data;
    }

    for (const amountRequestType of LATEST_12MONTHS_TRANSACTION_AMOUNTS_REQUEST_TYPES) {
        const dateRange =
            overviewStore.transactionDataRange[amountRequestType];

        if (!dateRange) {
            continue;
        }

        const item = transactionOverview.value[amountRequestType];

        data.push({
            monthStartTime: dateRange.startTime,
            incomeAmount: item?.incomeAmount || BIG_DECIMAL_ZERO,
            expenseAmount: item?.expenseAmount || BIG_DECIMAL_ZERO,
            incompleteIncomeAmount: item
                ? item.incompleteIncomeAmount
                : true,
            incompleteExpenseAmount: item
                ? item.incompleteExpenseAmount
                : true
        });
    }

    return data;
});

function reload(force: boolean): void {
    loadingOverview.value = true;

    const promises = [
        accountsStore.loadAllAccounts({ force: false }),
        transactionCategoriesStore.loadAllCategories({ force: false }),
        overviewStore.loadTransactionOverview({
            force,
            loadLast11Months: true
        })
    ];

    Promise.all(promises)
        .then(() => {
            loadingOverview.value = false;
            void loadCreditLimitUsage();

            if (force) {
                snackbar.value?.showMessage('Data has been updated');
            }
        })
        .catch(error => {
            loadingOverview.value = false;

            if (!error.processed) {
                snackbar.value?.showError(error);
            }
        });
}

if (isUserLogined() && isUserUnlocked()) {
    reload(false);
}
</script>
<style>
.layout-navbar {
    background: rgb(var(--v-theme-surface)) !important;
    color: rgb(var(--v-theme-on-surface)) !important;
    box-shadow: none !important;
}

.home {
    --ramp-bg: rgb(var(--v-theme-background));
    --ramp-surface: rgb(var(--v-theme-surface));
    --ramp-app-chrome: rgb(var(--v-theme-background));

    --ramp-surface-soft: rgb(var(--v-theme-secondary));
    --ramp-surface-hover: rgb(var(--v-theme-on-hover-background));

    --ramp-text: rgb(var(--v-theme-on-background));
    --ramp-muted: rgb(var(--v-theme-tertiary));
    --ramp-soft: rgb(var(--v-theme-grey-500));

    --ramp-border: rgb(var(--v-theme-muted-border));
    --ramp-border-strong: rgb(var(--v-theme-border));

    --ramp-accent: rgb(var(--v-theme-primary));
    --ramp-positive: rgb(var(--v-theme-income));
    --ramp-negative: rgb(var(--v-theme-expense));

    --ramp-radius: 10px;

    width: calc(100% + 48px);
    min-width: 0;
    min-height: 100vh;
    margin: -24px;

    color: var(--ramp-text);
    background: var(--ramp-bg);


    font-family:
        "Lausanne",
        "Helvetica Neue",
        Arial,
        sans-serif;
}

.home *,
.home *::before,
.home *::after {
    box-sizing: border-box;
}

/*
 * HEADER
 *
 * O fundo do header ocupa toda a largura disponível e permanece
 * encostado na sidebar. Somente seu conteúdo recebe padding interno.
 */
.page-header {
    width: 100%;
    min-width: 0;
    margin: 0;
    padding: 42px 48px 058px;

    background: rgb(var(--v-theme-surface));
}

/*
 * Não usar max-width nem margin-inline: auto aqui.
 * Isso evita que o conteúdo do header "descole" da sidebar
 * em áreas maiores que 1260px.
 */
.page-header__top {
    display: flex;
    width: 100%;
    min-width: 0;
    align-items: flex-start;
    justify-content: space-between;
    gap: 32px;
}

.page-kicker {
    display: block;

    margin-bottom: 9px;

    color: var(--ramp-muted);

    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.page-header h1 {
    margin: 0;

    font-size: clamp(2rem, 3.5vw, 3.2rem);
    font-weight: 500;
    letter-spacing: -0.055em;
    line-height: 1;
}

.page-header p {
    max-width: 620px;
    margin: 13px 0 0;

    color: var(--ramp-muted);

    font-size: 0.92rem;
    line-height: 1.5;
}

.page-header__actions {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 10px;
}

.primary-button .v-icon,
.refresh-button .v-icon {
    width: 18px !important;
    height: 18px !important;
    font-size: 18px !important;
}

.primary-button,
.refresh-button {
    box-shadow: none !important;
    text-transform: none !important;
}

.primary-button {
    min-height: 42px !important;
    padding-inline: 18px !important;

    border-radius: 4px !important;

    font-size: 0.78rem !important;
    font-weight: 650 !important;
}

.refresh-button {
    width: 42px !important;
    min-width: 42px !important;
    height: 42px !important;

    border: 1px solid var(--ramp-border) !important;
    border-radius: 4px !important;

    color: var(--ramp-text) !important;
    background: var(--ramp-surface) !important;
}

.refresh-button:hover {
    background: var(--ramp-surface-soft) !important;
}

/*
 * ABAS
 *
 * Fazem parte visualmente do header e seguem o mesmo padding interno.
 * Também não devem receber max-width ou margin-inline: auto.
 */
.page-tabs {
    position: sticky;
    top: 0;
    z-index: 30;

    display: flex;
    width: 100%;
    min-width: 0;
    min-height: 49px;
    align-items: stretch;
    gap: 30px;

    margin: 0;
    padding-inline: 48px;

    border-bottom: 1px solid rgb(var(--v-theme-muted-border));
    background: rgb(var(--v-theme-surface));;

    overflow-x: auto;
    scrollbar-width: none;
}

.page-tabs::-webkit-scrollbar {
    display: none;
}

.page-tab {
    position: relative;

    min-height: 48px;
    padding: 0 1px;

    border: 0;

    color: var(--ramp-muted);
    background: transparent;

    cursor: pointer;

    font: inherit;
    font-size: 0.8rem;
    font-weight: 500;
    white-space: nowrap;
}

.page-tab::after {
    position: absolute;
    right: 0;
    bottom: -1px;
    left: 0;

    height: 2px;

    background: transparent;

    content: "";
}

.page-tab:hover {
    color: var(--ramp-text);
}

.page-tab--active {
    color: var(--ramp-text);

    font-weight: 600;
}

.page-tab--active::after {
    background: var(--ramp-text);
}

/*
 * ÁREA ABAIXO DO HEADER
 *
 * O espaçamento lateral começa somente aqui.
 * Em telas maiores que 1260px, toolbar e conteúdo recebem 48px.
 */
.page-toolbar {
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: space-between;
    gap: 20px;

    margin-inline: 48px;
    padding: 22px 0;
}

.period-chip {
    display: inline-flex;
    min-height: 36px;
    align-items: center;
    gap: 8px;

    padding: 0 12px;

    border-radius: 5px;

    color: var(--ramp-text);
    background: rgb(var(--v-theme-secondary));

    font-size: 0.75rem;
    font-weight: 550;
}

.toolbar-links {
    display: flex;
    align-items: center;
    gap: 22px;
}

.toolbar-links a {
    color: var(--ramp-muted);

    text-decoration: none;

    font-size: 0.76rem;
    font-weight: 500;
}

.toolbar-links a:hover {
    color: var(--ramp-text);
}

/*
 * CONTEÚDO DAS ABAS
 *
 * Sem max-width e sem centralização automática.
 * A página aproveita a largura disponível depois da sidebar.
 */
.tab-content {
    min-width: 0;
    margin-inline: 48px;
    padding-bottom: 56px;
}

.summary-grid {
    display: grid;
    grid-template-columns: 1.65fr repeat(3, minmax(0, 1fr));
    gap: 14px;

    margin-bottom: 14px;
}

.overview-grid {
    display: grid;
    grid-template-columns:
        minmax(0, 1.55fr)
        minmax(300px, 0.75fr);
    gap: 14px;
}

.overview-side {
    display: grid;
    min-width: 0;
    align-content: start;
    gap: 14px;
}

/*
 * CARDS
 */
.card {
    min-width: 0;

    border: 1px solid var(--ramp-border);
    border-radius: var(--ramp-radius);

    background: var(--ramp-surface);
    box-shadow: none;
}

.card--net-worth {
    min-height: 190px;
    padding: 24px;
}

.card-heading,
.section-heading {
    display: flex;
    min-width: 0;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
}

.card-label {
    display: block;
    margin-bottom: 9px;
    color: var(--ramp-muted);
    font-size: 0.72rem;
    font-weight: 500;
}

.card--net-worth h2 {
    margin: 0;
    font-size: clamp(1.8rem, 4vw, 2.65rem);
    font-weight: 600;
    letter-spacing: -0.065em;
    line-height: 1;
}

.visibility-button {
    width: 32px !important;
    min-width: 32px !important;
    height: 32px !important;
    color: rgb(var(--v-theme-income)) !important;
}

.net-worth-breakdown {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;

    margin-top: 32px;
    padding-top: 18px;

    border-top: 1px solid var(--ramp-border);
}

.net-worth-breakdown div {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 6px;
}

.net-worth-breakdown span {
    color: var(--ramp-muted);

    font-size: 0.7rem;
}

.net-worth-breakdown strong {
    overflow: hidden;

    font-size: 0.92rem;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.metric-card {
    display: flex;
    min-width: 0;
    min-height: 190px;
    flex-direction: column;

    padding: 22px;
}

.metric-card__icon,
.position-icon {
    display: grid;
    width: 36px;
    min-width: 36px;
    height: 36px;
    place-items: center;

    border: 1px solid var(--ramp-border);
    border-radius: 50%;

    color: var(--ramp-text);
    background: var(--ramp-surface-soft);
}

.metric-card__icon--income {
    color: var(--ramp-positive);
}

.metric-card__icon--expense,
.position-icon--expense {
    color: var(--ramp-negative);
}

.metric-card > span {
    margin-top: auto;

    color: var(--ramp-muted);

    font-size: 0.72rem;
}

.metric-card > strong {
    font-size: 1.15rem;
    font-weight: 600;
    letter-spacing: -0.025em;
}

.metric-card > small {
    margin-top: 5px;
    color: var(--ramp-soft);
    font-size: 0.67rem;
}

.income-text {
    color: var(--ramp-positive) !important;
}

.expense-text {
    color: var(--ramp-negative) !important;
}

/*
 * SEÇÕES
 */
.section-card {
    min-width: 0;
    padding: 24px;
}

.section-card--wide {
    min-height: 360px;
}

.section-heading {
    align-items: center;
    margin-bottom: 20px;
}

.section-heading h2 {
    margin: 0;
    font-size: 1.07rem;
    font-weight: 550;
    letter-spacing: -0.025em;
}

.inline-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;

    padding: 0;
    border: 0;

    color: var(--ramp-text);
    background: none;

    cursor: pointer;

    text-decoration: none;

    font: inherit;
    font-size: 0.72rem;
    font-weight: 550;
}

.inline-link:hover {
    opacity: 0.65;
}

/*
 * TABELA DE PERÍODOS
 */
.period-table {
    border-top: 1px solid var(--ramp-border);
}

.period-row {
    display: grid;
    grid-template-columns:
        40px
        minmax(120px, 1fr)
        minmax(110px, auto)
        minmax(110px, auto)
        20px;
    min-width: 0;
    min-height: 76px;
    align-items: center;
    gap: 14px;

    padding: 10px 4px;

    border-bottom: 1px solid var(--ramp-border);

    color: var(--ramp-text);

    text-decoration: none;
}

.period-row:hover {
    background: var(--ramp-surface-soft);
}

.period-row__icon {
    display: grid;
    width: 34px;
    height: 34px;
    place-items: center;

    border-radius: 50%;

    color: var(--ramp-muted);
    background: var(--ramp-surface-soft);
}

.period-row__name,
.period-row__amount {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 5px;
}

.period-row__name strong,
.period-row__amount strong {
    overflow: hidden;

    font-size: 0.78rem;
    font-weight: 550;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.period-row__name small,
.period-row__amount small {
    color: var(--ramp-soft);

    font-size: 0.65rem;
}

.period-row__amount {
    text-align: right;
}

.period-row__arrow {
    color: var(--ramp-soft);
}

/*
 * POSIÇÃO FINANCEIRA
 */
.position-list {
    border-top: 1px solid var(--ramp-border);
}

.position-row {
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr) auto;
    min-width: 0;
    min-height: 66px;
    align-items: center;
    gap: 12px;

    border-bottom: 1px solid var(--ramp-border);
}

.position-row > span:nth-child(2) {
    min-width: 0;
    color: var(--ramp-muted);
    font-size: 0.73rem;
}

.position-row strong {
    font-size: 0.78rem;
    font-weight: 600;
    white-space: nowrap;
}

.position-row--highlight {
    margin: 0px -10px -10px;
    padding: 0 10px;
    border-bottom: 0;
    border-radius: 6px;
}

/*
 * FERRAMENTAS
 */
.tool-list {
    border-top: 1px solid var(--ramp-border);
}

.tool-list a {
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr) 18px;
    min-width: 0;
    min-height: 50px;
    align-items: center;

    border-bottom: 1px solid var(--ramp-border);

    color: var(--ramp-text);

    text-decoration: none;

    font-size: 0.74rem;
}

.tool-list a:hover {
    color: rgb(var(--v-theme-primarymuted));
}

.tool-list a:last-child {
    border-bottom: 0;
}

.tool-list a .v-icon:last-child {
    color: var(--ramp-soft);
}

/*
 * CARTÃO DE CRÉDITO
 */
.credit-card-panel {
    min-width: 0;
    overflow: hidden;
    padding: 0;
}

.credit-card-panel__header {
    display: flex;
    min-width: 0;
    align-items: flex-start;
    justify-content: space-between;
    gap: 32px;

    padding: 28px 28px 24px;

    border-bottom: 1px solid var(--ramp-border);
}

.credit-card-panel__title {
    min-width: 0;
}

.credit-card-panel__title h2 {
    margin: 0;

    color: var(--ramp-text);

    font-size: 1.3rem;
    font-weight: 600;
    letter-spacing: -0.035em;
    line-height: 1.2;
}

.credit-card-panel__title p {
    max-width: 520px;
    margin: 8px 0 0;

    color: var(--ramp-muted);

    font-size: 0.76rem;
    line-height: 1.5;
}

/*
 * SELECT
 */
.credit-select {
    width: 280px;
    max-width: 36%;
    min-width: 220px;
    flex: 0 0 auto;
}

.credit-select .v-field {
    min-height: 42px !important;

    border: 1px solid var(--ramp-border) !important;
    border-radius: 6px !important;

    background: var(--ramp-surface) !important;
    box-shadow: none !important;
}

.credit-select .v-field:hover {
    border-color: var(--ramp-border-strong) !important;
    background: var(--ramp-surface-soft) !important;
}

.credit-select .v-field--focused {
    border-color: var(--ramp-text) !important;
}

.credit-select .v-field__outline {
    display: none !important;
}

.credit-select .v-field__input {
    min-height: 40px !important;
    padding: 0 14px !important;

    color: var(--ramp-text) !important;

    font-size: 0.82rem !important;
    font-weight: 500 !important;
}

.credit-select .v-field__append-inner {
    align-items: center;
    padding-top: 0 !important;
    padding-right: 10px !important;

    color: var(--ramp-muted) !important;
}

.credit-select .v-field__append-inner .v-icon {
    width: 16px !important;
    height: 16px !important;

    color: var(--ramp-muted) !important;

    font-size: 16px !important;
}

/*
 * CONTEÚDO PRINCIPAL
 */
.credit-overview {
    display: grid;
    grid-template-columns:
        minmax(0, 1.35fr)
        minmax(280px, 0.65fr);
    min-width: 0;
}

.credit-limit {
    display: flex;
    min-width: 0;
    min-height: 300px;
    flex-direction: column;

    padding: 32px 28px 28px;

    border-right: 1px solid var(--ramp-border);
}

.credit-limit__label {
    color: var(--ramp-muted);

    font-size: 0.72rem;
    font-weight: 500;
}

.credit-limit__value {
    margin-top: 10px;

    color: var(--ramp-text);

    font-size: clamp(2.4rem, 5vw, 4.6rem);
    font-weight: 500;
    letter-spacing: -0.07em;
    line-height: 0.98;
}

.credit-limit__progress {
    margin-top: 36px;
}

.credit-limit__progress-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;

    margin-bottom: 10px;

    color: var(--ramp-muted);

    font-size: 0.68rem;
    font-weight: 500;
}

.credit-limit__progress-header span:last-child {
    overflow: hidden;

    text-align: right;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.credit-limit :deep(.v-progress-linear) {
    border-radius: 999px !important;
}

.credit-limit :deep(.v-progress-linear__background) {
    background: var(--ramp-surface-soft) !important;
    opacity: 1 !important;
}

.credit-details-link {
    display: inline-flex;
    width: fit-content;
    align-items: center;
    gap: 7px;

    margin-top: auto;
    padding-top: 28px;

    color: var(--ramp-text);

    text-decoration: none;

    font-size: 0.72rem;
    font-weight: 600;
}

.credit-details-link:hover {
    opacity: 0.65;
}

/*
 * RESUMO LATERAL
 */
.credit-summary {
    display: flex;
    min-width: 0;
    flex-direction: column;

    padding: 18px 28px;
}

.credit-summary__item {
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr);
    min-width: 0;
    align-items: center;
    gap: 14px;

    min-height: 82px;

    border-bottom: 1px solid var(--ramp-border);
}

.credit-summary__item:last-child {
    border-bottom: 0;
}

.credit-summary__icon {
    display: grid;
    width: 36px;
    height: 36px;
    place-items: center;

    border: 1px solid var(--ramp-border);
    border-radius: 50%;

    color: var(--ramp-text);
    background: var(--ramp-surface-soft);
}

.credit-summary__icon--used {
    color: var(--ramp-negative);
}

.credit-summary__icon--available {
    color: var(--ramp-positive);
}

.credit-summary__content {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 6px;
}

.credit-summary__content span {
    color: var(--ramp-muted);

    font-size: 0.68rem;
    font-weight: 500;
}

.credit-summary__content strong {
    overflow: hidden;

    color: var(--ramp-text);

    font-size: 0.88rem;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/*
 * ESTADO VAZIO
 */
.credit-empty-state {
    display: flex;
    min-height: 300px;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 10px;

    padding: 36px;

    color: var(--ramp-muted);

    text-align: center;
}

.credit-empty-state__icon {
    display: grid;
    width: 48px;
    height: 48px;
    place-items: center;

    margin-bottom: 6px;

    border: 1px solid var(--ramp-border);
    border-radius: 50%;

    color: var(--ramp-text);
    background: var(--ramp-surface-soft);
}

.credit-empty-state strong {
    color: var(--ramp-text);

    font-size: 0.9rem;
    font-weight: 600;
}

.credit-empty-state span {
    max-width: 360px;

    font-size: 0.74rem;
    line-height: 1.5;
}

/*
 * MENU DO SELECT
 */
.credit-select-menu {
    overflow: hidden;

    border: 1px solid var(--ramp-border) !important;
    border-radius: 7px !important;

    background: var(--ramp-surface) !important;
    box-shadow:
        0 14px 32px rgb(32 32 29 / 10%),
        0 3px 10px rgb(32 32 29 / 6%) !important;
}

.credit-select-menu .v-list {
    padding: 6px !important;

    background: var(--ramp-surface) !important;
}

.credit-select-menu .v-list-item {
    min-height: 40px !important;
    padding-inline: 11px !important;

    border-radius: 4px !important;

    color: var(--ramp-text) !important;

    font-size: 0.8rem !important;
    font-weight: 500 !important;

    transition:
        color 0.15s ease,
        background-color 0.15s ease;
}

.credit-select-menu .v-list-item:hover {
    background: var(--ramp-surface-soft) !important;
}

.credit-select-menu .v-list-item--active {
    color: var(--ramp-text) !important;
    background: var(--ramp-surface-hover) !important;
}

.credit-select-menu .v-list-item__overlay {
    background: transparent !important;
    opacity: 0 !important;
}

.credit-select-menu .v-list-item--active .v-list-item-title {
    font-weight: 600 !important;
}

.credit-select-menu .v-ripple__container {
    display: none !important;
}

/*
 * GRÁFICOS
 */
.chart-card {
    min-width: 0;
    overflow: hidden;

    padding: 24px;
}

.chart-card > .section-heading {
    margin-bottom: 12px;
}

.chart-card :deep(.v-card) {
    border: 0 !important;

    background: transparent !important;
    box-shadow: none !important;
}

/*
 * TEMA ESCURO
 */
.v-theme--dark .home {
    --ramp-bg: #151513;
    --ramp-surface: #1d1d1a;
    --ramp-surface-soft: #252521;
    --ramp-surface-hover: #2b2b27;
    --ramp-text: #f4f3ee;
    --ramp-muted: #aaa89f;
    --ramp-soft: #7f7d75;
    --ramp-border: #34342f;
    --ramp-border-strong: #46463f;
}

/*
 * TABLET E DESKTOP MENOR
 */
@media (max-width: 1260px) {
    /*
     * O layout externo ainda possui 24px de padding.
     * Portanto, a página deve continuar sangrando 24px
     * para encostar nas duas laterais.
     */
    .home {
        width: calc(100% + 48px);
        margin: -24px;
    }

    /*
     * Reduzimos apenas o espaçamento interno do conteúdo.
     */
    .page-header {
        padding-inline: 28px;
    }

    .page-tabs {
        padding-inline: 28px;
    }

    .page-toolbar,
    .tab-content {
        margin-inline: 28px;
    }

    .summary-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .card--net-worth {
        grid-column: 1 / -1;
    }
}

/*
 * TABLET
 */
@media (max-width: 900px) {

    .page-header {
        padding: 26px 18px 0;
    }

    .page-header__top {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
    }

    .page-header__copy {
        min-width: 0;
        flex: 1 1 auto;
    }

    .page-header h1 {
        overflow: hidden;
        font-size: 1.85rem;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .page-header__actions {
        width: auto;
        flex: 0 0 auto;
        justify-content: flex-end;
        gap: 8px;
    }

    .primary-button .v-btn__prepend {
        margin: 0 !important;
    }

    .primary-button .v-icon,
    .refresh-button .v-icon {
        width: 18px !important;
        height: 18px !important;
        font-size: 18px !important;
    }

    .overview-grid,
    .credit-layout {
        grid-template-columns: 1fr;
    }

    .summary-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .toolbar-links {
        display: none;
    }

    .period-row {
        grid-template-columns:
            38px
            minmax(0, 1fr)
            minmax(100px, auto)
            18px;
    }

    .period-row__amount--income {
        display: none;
    }

    .credit-card-panel__header {
        gap: 20px;
    }

    .credit-select {
        width: 240px;
        max-width: 44%;
    }

    .credit-overview {
        grid-template-columns: 1fr;
    }

    .credit-limit {
        min-height: 280px;
        border-right: 0;
        border-bottom: 1px solid var(--ramp-border);
    }

    .credit-summary {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        padding: 0;
    }

    .credit-summary__item {
        display: flex;
        min-height: 110px;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        gap: 10px;

        padding: 18px;

        border-right: 1px solid var(--ramp-border);
        border-bottom: 0;
    }

    .credit-summary__item:last-child {
        border-right: 0;
    }
}

/*
 * MOBILE
 */
@media (max-width: 600px) {
    .home {
        width: calc(100% + 48px);
        margin: -24px;
    }

    .page-tabs {
        gap: 22px;
        margin-top: 0px !important;
        padding-inline: 18px;
    }

    .page-header {
        padding: 26px 18px 28px;
        
    }

    .page-header__top {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        
    }

    .page-header__copy {
        min-width: 0;
        flex: 1 1 auto;
    }

    .page-header h1 {
        overflow: hidden;
        font-size: 1.85rem;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .page-header p {
        display: none;
    }

    .page-header__actions {
        width: auto;
        flex: 0 0 auto;
        justify-content: flex-end;
        gap: 8px;
    }

    .refresh-button,
    .primary-button {
        width: 36px !important;
        min-width: 36px !important;
        height: 36px !important;
        min-height: 36px !important;
        padding: 0 !important;
        border-radius: 4px !important;
    }

    .primary-button .v-btn__content {
        font-size: 0 !important;
        gap: 0 !important;
    }

    .primary-button .v-btn__prepend {
        margin: 0 !important;
    }

    .primary-button .v-icon,
    .refresh-button .v-icon {
        width: 18px !important;
        height: 18px !important;
        font-size: 18px !important;
    }

    .page-tabs {
        gap: 22px;
        margin-top: 24px;
    }

    .page-toolbar,
    .tab-content {
        margin-inline: 14px;
    }

    .page-toolbar {
        padding-block: 14px;
    }

    .summary-grid {
        grid-template-columns: 1fr;
    }

    .card--net-worth {
        grid-column: auto;
    }

    .metric-card {
        min-height: 150px;
    }

    .section-card,
    .chart-card,
    .card--net-worth {
        padding: 18px;
    }

    .period-row {
        grid-template-columns:
            36px
            minmax(0, 1fr)
            minmax(94px, auto);
        gap: 9px;
    }

    .period-row__arrow {
        display: none;
    }

    .period-row__amount small {
        display: none;
    }

    .section-heading {
        align-items: flex-start;
    }

    .section-heading--credit {
        flex-direction: column;
    }

    .credit-select {
        width: 100%;
    }

    .credit-stats {
        grid-template-columns: 1fr;
    }

    .credit-stats div {
        min-height: 66px;
    }

    .credit-card-panel__header {
        flex-direction: column;
        gap: 18px;

        padding: 22px 18px 18px;
    }

    .credit-select {
        width: 100%;
        max-width: 100%;
        min-width: 0;
    }

    .credit-limit {
        min-height: 260px;
        padding: 26px 18px 22px;
    }

    .credit-limit__value {
        font-size: clamp(2.25rem, 12vw, 3.4rem);
    }

    .credit-limit__progress-header {
        align-items: flex-start;
        flex-direction: column;
        gap: 5px;
    }

    .credit-limit__progress-header span:last-child {
        text-align: left;
    }

    .credit-summary {
        grid-template-columns: 1fr;
    }

    .credit-summary__item {
        min-height: 72px;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;

        padding: 14px 18px;

        border-right: 0;
        border-bottom: 1px solid var(--ramp-border);
    }

    .credit-summary__item:last-child {
        border-bottom: 0;
    }

    .credit-details-link {
        padding-top: 24px;
    }
}
</style>