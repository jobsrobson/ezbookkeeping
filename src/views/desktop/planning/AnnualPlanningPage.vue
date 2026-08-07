<template>
    <main class="annual-planning-page">
        <header class="planning-header">
            <div class="planning-header__top">
                <div class="planning-header__copy">
                    <h1>{{ tt('Annual Planning') }}</h1>

                    <p>
                        {{ tt('Actual and projected values') }}
                        · {{ year }}
                    </p>
                </div>

                <div class="planning-header__controls">
                    <v-btn
                        class="planning-year-button"
                        :icon="mdiChevronLeft"
                        variant="text"
                        :disabled="loading"
                        :aria-label="tt('Previous Year')"
                        @click="changeYear(-1)"
                    />

                    <v-select
                        v-model="year"
                        class="planning-year-select"
                        :items="years"
                        :disabled="loading"
                        variant="outlined"
                        hide-details
                    />

                    <v-btn
                        class="planning-year-button"
                        :icon="mdiChevronRight"
                        variant="text"
                        :disabled="loading"
                        :aria-label="tt('Next Year')"
                        @click="changeYear(1)"
                    />

                    <v-tooltip :text="tt('Refresh')">
                        <template #activator="{ props }">
                            <v-btn
                                v-bind="props"
                                class="planning-refresh-button"
                                :icon="mdiRefresh"
                                variant="text"
                                :loading="loading"
                                :disabled="loading"
                                :aria-label="tt('Refresh')"
                                @click="load"
                            />
                        </template>
                    </v-tooltip>
                </div>
            </div>

            <nav
                class="planning-tabs"
                :aria-label="tt('Annual Planning')"
            >
                <button
                    type="button"
                    class="planning-tab planning-tab--active"
                >
                    {{ tt('Annual Overview') }}
                </button>

                <router-link
                    class="planning-tab"
                    to="/transaction/list"
                >
                    {{ tt('Transactions') }}
                </router-link>

                <router-link
                    class="planning-tab"
                    to="/statistics/transaction"
                >
                    {{ tt('Reports') }}
                </router-link>
            </nav>
        </header>

        <v-progress-linear
            v-if="loading"
            class="planning-loading"
            indeterminate
            height="2"
        />

        <section class="planning-workspace">
            <section class="planning-summary">
                <article class="summary-card summary-card--income">
                    <div class="summary-card__icon">
                        <v-icon :icon="mdiArrowDownLeft" size="19" />
                    </div>

                    <span class="summary-card__label">
                        {{ tt('Renda Total') }}
                    </span>

                    <strong class="summary-card__value">
                        {{ formatValue(annualIncome) }}
                    </strong>

                    <small>
                        {{ tt('Renda total do ano selecionado') }}
                    </small>
                </article>

                <article class="summary-card summary-card--expense">
                    <div class="summary-card__icon">
                        <v-icon :icon="mdiArrowUpRight" size="19" />
                    </div>

                    <span class="summary-card__label">
                        {{ tt('Despesa Total') }}
                    </span>

                    <strong class="summary-card__value">
                        {{ formatValue(annualExpenses) }}
                    </strong>

                    <small>
                        {{ tt('Despesa total do ano selecionado') }}
                    </small>
                </article>

                <article
                    class="summary-card summary-card--balance"
                    :class="{
                        'summary-card--negative': annualDifference < 0
                    }"
                >
                    <div class="summary-card__icon">
                        <v-icon
                            :icon="
                                annualDifference < 0
                                    ? mdiTrendingDown
                                    : mdiTrendingUp
                            "
                            size="19"
                        />
                    </div>

                    <span class="summary-card__label">
                        {{ tt('Balanço Anual') }}
                    </span>

                    <strong class="summary-card__value">
                        {{ formatValue(annualDifference) }}
                    </strong>

                    <small>
                        {{
                            annualDifference < 0
                                ? tt('Despesas ultrapassam Receita')
                                : tt('Receitas ultrapassam Despesas')
                        }}
                    </small>
                </article>
            </section>

            <section class="monthly-planning">
                <header class="monthly-planning__header">
                    <div>

                        <h2>{{ tt('Visão Mensal') }}</h2>

                        <p>
                            {{
                                tt(
                                    'Clique em um valor para ver as transações incluídas nele'
                                )
                            }}
                        </p>
                    </div>

                    <div class="monthly-planning__legend">
                        <span class="projection-dot" />
                        <span>{{ tt('Valor Projetado') }}</span>
                    </div>
                </header>

                <div class="planning-table-shell">
                    <div
                        ref="planningTableScroll"
                        class="planning-table-scroll"
                    >
                        <table class="planning-table">
                            <thead>
                                <tr>
                                    <th class="planning-row-name planning-column-heading">
                                        {{ tt('Category') }}
                                    </th>

                                    <th
                                        v-for="(month, monthIndex) in months"
                                        :key="month"
                                        class="planning-month-heading"
                                        :class="{
                                            'planning-month-heading--current':
                                                isCurrentMonth(monthIndex)
                                        }"
                                    >
                                        <span>{{ month }}</span>

                                        <small
                                            v-if="isCurrentMonth(monthIndex)"
                                        >
                                            {{ tt('Current') }}
                                        </small>
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                <template
                                    v-for="section in sections"
                                    :key="section.title"
                                >
                                    <tr class="planning-section-row">
                                        <td class="planning-section-name">
                                            <div class="planning-section-title">
                                                <span
                                                    class="planning-section-icon"
                                                    :class="`planning-section-icon--${section.kind}`"
                                                >
                                                    <v-icon
                                                        :icon="sectionIcon(section.kind)"
                                                        size="16"
                                                    />
                                                </span>

                                                <span>
                                                    {{ tt(section.title) }}
                                                </span>
                                            </div>
                                        </td>

                                        <td colspan="12">
                                            <span class="planning-section-count">
                                                {{
                                                    section.rows.length === 1
                                                        ? tt('1 item')
                                                        : `${section.rows.length} ${tt('items')}`
                                                }}
                                            </span>
                                        </td>
                                    </tr>

                                    <tr
                                        v-for="row in section.rows"
                                        :key="row.id"
                                        class="planning-data-row"
                                    >
                                        <th class="planning-row-name">
                                            <div class="planning-row-copy">
                                                <strong>{{ row.name }}</strong>

                                                <small>
                                                    {{
                                                        row.kind === 'income'
                                                            ? tt('Income')
                                                            : tt('Expense')
                                                    }}
                                                </small>
                                            </div>
                                        </th>

                                        <td
                                            v-for="monthIndex in 12"
                                            :key="monthIndex"
                                            :class="cellClass(row, monthIndex - 1)"
                                            @click="openDetails(row, monthIndex - 1)"
                                        >
                                            <div class="planning-cell-content">
                                                <span
                                                    v-if="row.values[monthIndex - 1]"
                                                    class="planning-cell-value"
                                                >
                                                    {{
                                                        formatValue(
                                                            row.values[monthIndex - 1]!
                                                        )
                                                    }}
                                                </span>

                                                <span
                                                    v-else
                                                    class="planning-cell-empty"
                                                >
                                                    –
                                                </span>

                                                <span
                                                    v-if="row.projected[monthIndex - 1]"
                                                    class="projection-dot"
                                                    :title="tt('Valor Projetado')"
                                                />
                                            </div>

                                            <v-tooltip
                                                v-if="row.values[monthIndex - 1]"
                                                activator="parent"
                                                location="top"
                                            >
                                                <div class="planning-cell-tooltip">
                                                    <strong>{{ row.name }}</strong>
                                                    <span>
                                                        {{ months[monthIndex - 1] }}
                                                        · {{ year }}
                                                    </span>
                                                    <b>
                                                        {{
                                                            formatValue(
                                                                row.values[monthIndex - 1]!
                                                            )
                                                        }}
                                                    </b>
                                                    <small
                                                        v-if="row.projected[monthIndex - 1]"
                                                    >
                                                        {{
                                                            tt(
                                                                'Inclui valores projetados'
                                                            )
                                                        }}
                                                    </small>
                                                </div>
                                            </v-tooltip>
                                        </td>
                                    </tr>
                                </template>

                                <tr class="planning-summary-divider">
                                    <td colspan="13" />
                                </tr>

                                <tr class="planning-total-row planning-total-row--income">
                                    <th class="planning-row-name">
                                        <span class="planning-total-label">
                                            <v-icon
                                                :icon="mdiArrowDownLeft"
                                                size="16"
                                            />
                                            {{ tt('Monthly Income') }}
                                        </span>
                                    </th>

                                    <td
                                        v-for="(value, index) in monthlyIncome"
                                        :key="index"
                                    >
                                        {{ formatValue(value) }}
                                    </td>
                                </tr>

                                <tr class="planning-total-row planning-total-row--expense">
                                    <th class="planning-row-name">
                                        <span class="planning-total-label">
                                            <v-icon
                                                :icon="mdiArrowUpRight"
                                                size="16"
                                            />
                                            {{ tt('Monthly Expenses') }}
                                        </span>
                                    </th>

                                    <td
                                        v-for="(value, index) in monthlyExpenses"
                                        :key="index"
                                    >
                                        {{ formatValue(value) }}
                                    </td>
                                </tr>

                                <tr class="planning-total-row planning-total-row--difference">
                                    <th class="planning-row-name">
                                        <span class="planning-total-label">
                                            <v-icon
                                                :icon="mdiSwapVertical"
                                                size="16"
                                            />
                                            {{ tt('Monthly Difference') }}
                                        </span>
                                    </th>

                                    <td
                                        v-for="(value, index) in monthlyDifference"
                                        :key="index"
                                    >
                                        {{ formatValue(value) }}
                                    </td>
                                </tr>

                                <tr class="planning-total-row planning-total-row--balance">
                                    <th class="planning-row-name">
                                        <span class="planning-total-label">
                                            <v-icon
                                                :icon="mdiWalletOutline"
                                                size="16"
                                            />
                                            {{ tt('Cumulative Balance') }}
                                        </span>
                                    </th>

                                    <td
                                        v-for="(value, index) in cumulativeBalance"
                                        :key="index"
                                        :class="
                                            value < 0
                                                ? 'planning-total-negative'
                                                : 'planning-total-positive'
                                        "
                                    >
                                        {{ formatValue(value) }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="planning-scroll-hint">
                    <v-icon
                        :icon="mdiGestureSwipeHorizontal"
                        size="16"
                    />
                    <span>
                        {{
                            tt(
                                'Scroll horizontally to view all months'
                            )
                        }}
                    </span>
                </div>
            </section>
        </section>

        <v-dialog
            v-model="detailsVisible"
            max-width="680"
            scrollable
        >
            <v-card class="planning-details-dialog">
                <header class="planning-details-header">
                    <div>
                        <span>{{ tt('Cell Details') }}</span>
                        <h2>{{ detailTitle }}</h2>
                    </div>

                    <v-btn
                        :icon="mdiClose"
                        variant="text"
                        size="small"
                        @click="detailsVisible = false"
                    />
                </header>

                <div
                    v-if="detailItems.length"
                    class="planning-details-summary"
                >
                    <span>
                        {{
                            detailItems.length === 1
                                ? tt('1 transação')
                                : `${detailItems.length} ${tt('transações')}`
                        }}
                    </span>

                    <strong>{{ formatValue(detailTotal) }}</strong>
                </div>

                <v-card-text class="planning-details-content">
                    <div
                        v-if="detailItems.length"
                        class="planning-transaction-list"
                    >
                        <article
                            v-for="item in sortedDetailItems"
                            :key="item.id"
                            class="planning-transaction-item"
                        >
                            <span
                                class="planning-transaction-icon"
                                :class="{
                                    'planning-transaction-icon--projected':
                                        item.projected
                                }"
                            >
                                <v-icon
                                    :icon="
                                        item.projected
                                            ? mdiCalendarClockOutline
                                            : mdiCheckCircleOutline
                                    "
                                    size="18"
                                />
                            </span>

                            <div class="planning-transaction-copy">
                                <strong>{{ item.description }}</strong>

                                <span>
                                    {{ formatDate(item.time) }}
                                    ·
                                    {{
                                        item.projected
                                            ? tt('Projetado')
                                            : tt('Atual')
                                    }}
                                </span>
                            </div>

                            <strong class="planning-transaction-amount">
                                {{ formatValue(item.amount) }}
                            </strong>
                        </article>
                    </div>

                    <div
                        v-else
                        class="planning-empty-details"
                    >
                        <v-icon :icon="mdiInboxOutline" size="30" />

                        <strong>{{ tt('No transactions') }}</strong>

                        <span>
                            {{
                                tt(
                                    'Não há valores reais ou projetados para este período'
                                )
                            }}
                        </span>
                    </div>
                </v-card-text>

                <v-card-actions class="planning-details-actions">
                    <v-spacer />

                    <v-btn
                        variant="text"
                        @click="detailsVisible = false"
                    >
                        {{ tt('Close') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </main>
</template>

<script setup lang="ts">
import {
    computed,
    nextTick,
    onMounted,
    ref,
    useTemplateRef,
    watch
} from 'vue';

import {
    mdiArrowDownLeft,
    mdiArrowUpRight,
    mdiCalendarClockOutline,
    mdiCheckCircleOutline,
    mdiChevronLeft,
    mdiChevronRight,
    mdiClose,
    mdiCreditCardOutline,
    mdiGestureSwipeHorizontal,
    mdiInboxOutline,
    mdiRefresh,
    mdiSwapVertical,
    mdiTrendingDown,
    mdiTrendingUp,
    mdiWalletOutline
} from '@mdi/js';

import { AccountCategory } from '@/core/account.ts';
import {
    ScheduledTemplateFrequencyType,
    TemplateType
} from '@/core/template.ts';
import { TransactionType } from '@/core/transaction.ts';

import { Transaction } from '@/models/transaction.ts';
import { TransactionTemplate } from '@/models/transaction_template.ts';

import { useAccountsStore } from '@/stores/account.ts';
import { useUserStore } from '@/stores/user.ts';

import { useI18n } from '@/locales/helpers.ts';
import { parseBigDecimal } from '@/lib/numeral.ts';
import services from '@/lib/services.ts';

interface PlanItem {
    id: string;
    time: number;
    amount: number;
    description: string;
    projected: boolean;
}

interface PlanRow {
    id: string;
    name: string;
    kind: 'income' | 'expense';
    values: number[];
    projected: boolean[];
    items: PlanItem[][];
}

type PlanSectionKind =
    | 'recurring-income'
    | 'recurring-expense'
    | 'credit-card'
    | 'other-income'
    | 'other-expense';

interface PlanSection {
    title: string;
    kind: PlanSectionKind;
    rows: PlanRow[];
}

const {
    tt,
    formatAmountToLocalizedNumeralsWithCurrency
} = useI18n();

const accountsStore = useAccountsStore();
const userStore = useUserStore();

const currentDate = new Date();
const currentYear = currentDate.getFullYear();

const year = ref(currentYear);
const loading = ref(false);
const rows = ref<PlanRow[]>([]);

const detailsVisible = ref(false);
const detailItems = ref<PlanItem[]>([]);
const detailTitle = ref('');

const years = computed<number[]>(() =>
    Array.from(
        { length: 11 },
        (_, index) => currentYear - 5 + index
    )
);

const months = computed<string[]>(() =>
    Array.from({ length: 12 }, (_, index) =>
        new Date(2020, index, 1)
            .toLocaleDateString(undefined, {
                month: 'short'
            })
            .replace('.', '')
            .toUpperCase()
    )
);

const sections = computed<PlanSection[]>(() => {
    const allSections: PlanSection[] = [
        {
            title: 'Recurring Income',
            kind: 'recurring-income',
            rows: rows.value.filter(
                row =>
                    row.id.startsWith('template-') &&
                    row.kind === 'income'
            )
        },
        {
            title: 'Recurring Expenses',
            kind: 'recurring-expense',
            rows: rows.value.filter(
                row =>
                    row.id.startsWith('template-') &&
                    row.kind === 'expense'
            )
        },
        {
            title: 'Credit Card Invoices',
            kind: 'credit-card',
            rows: rows.value.filter(
                row => row.id.startsWith('card-')
            )
        },
        {
            title: 'Other Income',
            kind: 'other-income',
            rows: rows.value.filter(
                row => row.id === 'other-income'
            )
        },
        {
            title: 'Other Expenses',
            kind: 'other-expense',
            rows: rows.value.filter(
                row => row.id === 'other-expense'
            )
        }
    ];

    return allSections.filter(
        section => section.rows.length > 0
    );
});

const incomeRows = computed<PlanRow[]>(() =>
    rows.value.filter(row => row.kind === 'income')
);

const expenseRows = computed<PlanRow[]>(() =>
    rows.value.filter(row => row.kind === 'expense')
);

const monthlyIncome = computed<number[]>(() =>
    totals(incomeRows.value)
);

const monthlyExpenses = computed<number[]>(() =>
    totals(expenseRows.value)
);

const monthlyDifference = computed<number[]>(() =>
    monthlyIncome.value.map(
        (value, index) => value - monthlyExpenses.value[index]!
    )
);

const cumulativeBalance = computed<number[]>(() => {
    let balance = 0;

    return monthlyDifference.value.map(value => {
        balance += value;
        return balance;
    });
});

const annualIncome = computed<number>(() =>
    monthlyIncome.value.reduce(
        (sum, value) => sum + value,
        0
    )
);

const annualExpenses = computed<number>(() =>
    monthlyExpenses.value.reduce(
        (sum, value) => sum + value,
        0
    )
);

const annualDifference = computed<number>(
    () => annualIncome.value - annualExpenses.value
);

const sortedDetailItems = computed<PlanItem[]>(() =>
    [...detailItems.value].sort(
        (first, second) => first.time - second.time
    )
);

const detailTotal = computed<number>(() =>
    detailItems.value.reduce(
        (sum, item) => sum + item.amount,
        0
    )
);

const planningTableScroll =
    useTemplateRef<HTMLElement>('planningTableScroll');

function createRow(
    id: string,
    name: string,
    kind: 'income' | 'expense'
): PlanRow {
    return {
        id,
        name,
        kind,
        values: Array(12).fill(0),
        projected: Array(12).fill(false),
        items: Array.from({ length: 12 }, () => [])
    };
}

function add(
    row: PlanRow,
    month: number,
    item: PlanItem
): void {
    if (month < 0 || month > 11) {
        return;
    }

    row.values[month] =
        row.values[month]! + item.amount;

    row.projected[month] =
        row.projected[month]! || item.projected;

    row.items[month]!.push(item);
}

function totals(source: PlanRow[]): number[] {
    return Array.from(
        { length: 12 },
        (_, month) =>
            source.reduce(
                (sum, row) =>
                    sum + row.values[month]!,
                0
            )
    );
}

function formatValue(value: number): string {
    return formatAmountToLocalizedNumeralsWithCurrency(
        parseBigDecimal(String(value)),
        userStore.currentUserDefaultCurrency
    );
}



function formatDate(time: number): string {
    return new Date(time * 1000).toLocaleDateString(
        undefined,
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }
    );
}

function changeYear(delta: number): void {
    year.value += delta;
}

function isCurrentMonth(monthIndex: number): boolean {
    return (
        year.value === currentYear &&
        monthIndex === currentDate.getMonth()
    );
}

async function centerCurrentMonth(): Promise<void> {
    /*
     * Só existe mês atual quando o ano exibido
     * é o ano corrente.
     */
    if (year.value !== currentYear) {
        return;
    }

    await nextTick();

    const scrollContainer =
        planningTableScroll.value;

    if (!scrollContainer) {
        return;
    }

    const currentMonthHeader =
        scrollContainer.querySelector<HTMLElement>(
            '.planning-month-heading--current'
        );

    const stickyColumn =
        scrollContainer.querySelector<HTMLElement>(
            '.planning-column-heading'
        );

    if (!currentMonthHeader) {
        return;
    }

    const stickyColumnWidth =
        stickyColumn?.offsetWidth ?? 0;

    const availableWidth = Math.max(
        0,
        scrollContainer.clientWidth -
            stickyColumnWidth
    );

    const targetScrollLeft =
        currentMonthHeader.offsetLeft -
        stickyColumnWidth -
        (
            availableWidth -
            currentMonthHeader.offsetWidth
        ) / 2;

    scrollContainer.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: 'smooth'
    });
}

function cellClass(
    row: PlanRow,
    month: number
): unknown[] {
    return [
        'value-cell',
        `value-cell--${row.kind}`,
        {
            'value-cell--clickable':
                row.items[month]!.length > 0,
            'value-cell--projected':
                row.projected[month],
            'value-cell--current-month':
                isCurrentMonth(month)
        }
    ];
}

function sectionIcon(
    kind: PlanSectionKind
): string {
    switch (kind) {
        case 'credit-card':
            return mdiCreditCardOutline;

        case 'recurring-expense':
        case 'other-expense':
            return mdiArrowUpRight;

        default:
            return mdiArrowDownLeft;
    }
}

function openDetails(
    row: PlanRow,
    month: number
): void {
    if (!row.items[month]!.length) {
        return;
    }

    detailItems.value = row.items[month]!;
    detailTitle.value =
        `${row.name} · ${months.value[month]} ${year.value}`;

    detailsVisible.value = true;
}

async function load(): Promise<void> {
    loading.value = true;

    try {
        await accountsStore.loadAllAccounts({
            force: false
        });

        const start = new Date(
            year.value - 1,
            11,
            1
        );

        const end = new Date(
            year.value,
            11,
            31,
            23,
            59,
            59
        );

        const [
            transactionResponse,
            templateResponse
        ] = await Promise.all([
            services.getAllTransactions({
                startTime: Math.floor(
                    start.getTime() / 1000
                ),
                endTime: Math.floor(
                    end.getTime() / 1000
                )
            }),

            services.getAllTransactionTemplates({
                templateType:
                    TemplateType.Schedule.type
            })
        ]);

        buildRows(
            Transaction.ofMulti(
                transactionResponse.data.result || []
            ),
            TransactionTemplate.ofMultiTemplates(
                templateResponse.data.result || []
            )
        );
    } finally {
        loading.value = false;
    }
}

function buildRows(
    transactions: Transaction[],
    templates: TransactionTemplate[]
): void {
    const cards =
        accountsStore.allPlainAccounts.filter(
            account =>
                account.category ===
                    AccountCategory.CreditCard.type &&
                !!account.creditCardStatementDate
        );

    const cardMap = new Map(
        cards.map(account => [
            account.id,
            account
        ])
    );

    const templateRows =
        new Map<string, PlanRow>();

    for (
        const template of templates.filter(
            item =>
                !item.hidden &&
                (
                    item.type ===
                        TransactionType.Income ||
                    item.type ===
                        TransactionType.Expense
                )
        )
    ) {
        if (
            template.type ===
                TransactionType.Expense &&
            cardMap.has(template.sourceAccountId)
        ) {
            continue;
        }

        templateRows.set(
            template.id,
            createRow(
                `template-${template.id}`,
                template.name,
                template.type ===
                    TransactionType.Income
                    ? 'income'
                    : 'expense'
            )
        );
    }

    const cardRows = new Map(
        cards.map(card => [
            card.id,
            createRow(
                `card-${card.id}`,
                card.name,
                'expense'
            )
        ])
    );

    const otherIncome = createRow(
        'other-income',
        tt('Other Income'),
        'income'
    );

    const otherExpense = createRow(
        'other-expense',
        tt('Other Expenses'),
        'expense'
    );

    for (const transaction of transactions) {
        if (
            transaction.type ===
            TransactionType.Transfer
        ) {
            continue;
        }

        const card = cardMap.get(
            transaction.sourceAccountId
        );

        let month = new Date(
            transaction.time * 1000
        ).getMonth();

        if (
            card &&
            transaction.type ===
                TransactionType.Expense
        ) {
            const date = new Date(
                transaction.time * 1000
            );

            if (
                date.getDate() >
                card.creditCardStatementDate!
            ) {
                month++;
            }

            const invoiceYear =
                date.getFullYear() +
                Math.floor(month / 12);

            month = (month + 12) % 12;

            if (invoiceYear !== year.value) {
                continue;
            }

            add(
                cardRows.get(card.id)!,
                month,
                actualItem(transaction)
            );

            continue;
        }

        const date = new Date(
            transaction.time * 1000
        );

        if (
            date.getFullYear() !== year.value
        ) {
            continue;
        }

        const matchingTemplate =
            findMatchingTemplate(
                transaction,
                templates
            );

        const row = matchingTemplate
            ? templateRows.get(
                  matchingTemplate.id
              )
            : undefined;

        add(
            row ||
                (
                    transaction.type ===
                    TransactionType.Income
                        ? otherIncome
                        : otherExpense
                ),
            date.getMonth(),
            actualItem(transaction)
        );
    }

    const today = new Date();

    for (const template of templates) {
        const card = cardMap.get(
            template.sourceAccountId
        );

        if (
            card &&
            template.type ===
                TransactionType.Expense
        ) {
            const occurrences = [
                ...projectedOccurrences(
                    template,
                    year.value - 1
                ),
                ...projectedOccurrences(
                    template,
                    year.value
                )
            ];

            for (const occurrence of occurrences) {
                if (
                    occurrence <= today ||
                    hasMatchingTransaction(
                        transactions,
                        template,
                        occurrence
                    )
                ) {
                    continue;
                }

                let invoiceMonth =
                    occurrence.getMonth() +
                    (
                        occurrence.getDate() >
                        card.creditCardStatementDate!
                            ? 1
                            : 0
                    );

                const invoiceYear =
                    occurrence.getFullYear() +
                    Math.floor(invoiceMonth / 12);

                if (invoiceYear !== year.value) {
                    continue;
                }

                invoiceMonth =
                    (invoiceMonth + 12) % 12;

                add(
                    cardRows.get(card.id)!,
                    invoiceMonth,
                    {
                        id:
                            `projected-${template.id}-` +
                            occurrence.getTime(),

                        time: Math.floor(
                            occurrence.getTime() /
                                1000
                        ),

                        amount:
                            template.sourceAmount,

                        description:
                            template.comment ||
                            template.name,

                        projected: true
                    }
                );
            }

            continue;
        }

        const row = templateRows.get(
            template.id
        );

        if (!row) {
            continue;
        }

        for (
            const occurrence of projectedOccurrences(
                template,
                year.value
            )
        ) {
            if (
                occurrence <= today ||
                hasMatchingTransaction(
                    transactions,
                    template,
                    occurrence
                )
            ) {
                continue;
            }

            add(
                row,
                occurrence.getMonth(),
                {
                    id:
                        `projected-${template.id}-` +
                        occurrence.getTime(),

                    time: Math.floor(
                        occurrence.getTime() / 1000
                    ),

                    amount:
                        template.sourceAmount,

                    description:
                        template.comment ||
                        template.name,

                    projected: true
                }
            );
        }
    }

    rows.value = [
        ...templateRows.values(),
        ...cardRows.values(),
        otherIncome,
        otherExpense
    ];
}

function actualItem(
    transaction: Transaction
): PlanItem {
    return {
        id: transaction.id,
        time: transaction.time,
        amount: transaction.sourceAmount,
        description:
            transaction.comment ||
            transaction.category?.name ||
            tt('Transaction'),
        projected: false
    };
}

function findMatchingTemplate(
    transaction: Transaction,
    templates: TransactionTemplate[]
): TransactionTemplate | undefined {
    if (transaction.subscriptionTemplateId) {
        return templates.find(
            template =>
                template.id ===
                transaction.subscriptionTemplateId
        );
    }

    return templates.find(
        template =>
            template.type === transaction.type &&
            template.sourceAccountId ===
                transaction.sourceAccountId &&
            template.categoryId ===
                transaction.categoryId &&
            template.sourceAmount ===
                transaction.sourceAmount &&
            template.comment ===
                transaction.comment
    );
}

function hasMatchingTransaction(
    transactions: Transaction[],
    template: TransactionTemplate,
    occurrence: Date
): boolean {
    return transactions.some(transaction => {
        const date = new Date(
            transaction.time * 1000
        );

        return (
            !!findMatchingTemplate(
                transaction,
                [template]
            ) &&
            date.getFullYear() ===
                occurrence.getFullYear() &&
            date.getMonth() ===
                occurrence.getMonth() &&
            date.getDate() ===
                occurrence.getDate()
        );
    });
}

function projectedOccurrences(
    template: TransactionTemplate,
    targetYear: number
): Date[] {
    const result: Date[] = [];

    const frequencies = (
        template.scheduledFrequency || ''
    )
        .split(',')
        .map(Number)
        .filter(Number.isFinite);

    if (
        template.scheduledFrequencyType ===
        ScheduledTemplateFrequencyType
            .Monthly.type
    ) {
        for (let month = 0; month < 12; month++) {
            for (
                const configuredDay of frequencies
            ) {
                const lastDay = new Date(
                    targetYear,
                    month + 1,
                    0
                ).getDate();

                const day =
                    configuredDay === -1
                        ? lastDay
                        : Math.min(
                              Math.max(
                                  configuredDay,
                                  1
                              ),
                              lastDay
                          );

                const date = new Date(
                    targetYear,
                    month,
                    day
                );

                if (
                    withinSchedule(
                        date,
                        template
                    )
                ) {
                    result.push(date);
                }
            }
        }
    } else if (
        template.scheduledFrequencyType ===
        ScheduledTemplateFrequencyType
            .Yearly.type
    ) {
        for (const value of frequencies) {
            const month =
                Math.floor(value / 100) - 1;

            const day = value % 100;

            const date = new Date(
                targetYear,
                month,
                day
            );

            if (
                withinSchedule(
                    date,
                    template
                )
            ) {
                result.push(date);
            }
        }
    }

    return result;
}

function withinSchedule(
    date: Date,
    template: TransactionTemplate
): boolean {
    const text =
        `${date.getFullYear()}-` +
        `${String(
            date.getMonth() + 1
        ).padStart(2, '0')}-` +
        `${String(
            date.getDate()
        ).padStart(2, '0')}`;

    return (
        (
            !template.scheduledStartDate ||
            text >=
                template.scheduledStartDate
        ) &&
        (
            !template.scheduledEndDate ||
            text <=
                template.scheduledEndDate
        )
    );
}

watch(year, async () => {
    await load();

    if (year.value === currentYear) {
        await centerCurrentMonth();
    }
});

onMounted(async () => {
    await load();
    await centerCurrentMonth();
});
</script>

<style scoped>
.annual-planning-page {
    --planning-gutter: 48px;

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

.annual-planning-page,
.annual-planning-page *,
.annual-planning-page *::before,
.annual-planning-page *::after {
    box-sizing: border-box;
}

/* Header */

.planning-header {
    width: 100%;

    border-bottom: 1px solid rgb(var(--v-theme-muted-border));

    background: rgb(var(--v-theme-surface));
}

.planning-header__top {
    display: flex;
    width: 100%;
    min-width: 0;
    align-items: flex-start;
    justify-content: space-between;
    gap: 32px;

    padding:
        40px
        var(--planning-gutter)
        0;
}

.planning-header__copy {
    min-width: 0;
}

.planning-header h1 {
    margin: 0;

    color: rgb(var(--v-theme-on-surface));

    font-size: clamp(2rem, 3.6vw, 3.15rem);
    font-weight: 500;
    letter-spacing: -0.055em;
    line-height: 1;
}

.planning-header p {
    margin: 12px 0 0;

    color: rgb(var(--v-theme-tertiary));

    font-size: 0.88rem;
    line-height: 1.45;
}

.planning-header__controls {
    display: grid;
    grid-template-columns: 44px auto 44px 44px;
    align-items: stretch;
    justify-content: end;
    gap: 8px;

    width: auto;
    max-width: 100%;
    flex: 0 0 auto;

    margin-left: auto;
}

.planning-year-button,
.planning-refresh-button {
    width: 44px !important;
    min-width: 44px !important;
    height: 44px !important;

    border: 1px solid rgb(var(--v-theme-muted-border)) !important;
    border-radius: 6px !important;

    color: rgb(var(--v-theme-on-surface)) !important;
    background: rgb(var(--v-theme-surface)) !important;

    box-shadow: none !important;
}

.planning-year-button:hover,
.planning-refresh-button:hover {
    border-color: rgb(var(--v-theme-on-hover-border)) !important;
    background: rgb(var(--v-theme-on-hover-background)) !important;
}

/* Tabs */

.planning-tabs {
    display: flex;
    align-items: stretch;
    gap: 28px;

    margin-top: 34px;
    padding-inline: var(--planning-gutter);

    overflow-x: auto;

    scrollbar-width: none;
}

.planning-tabs::-webkit-scrollbar {
    display: none;
}

.planning-tab {
    position: relative;

    display: inline-flex;
    min-height: 48px;
    align-items: center;

    padding: 0 1px;
    border: 0;

    color: rgb(var(--v-theme-tertiary));
    background: transparent;

    cursor: pointer;

    text-decoration: none;

    font: inherit;
    font-size: 0.78rem;
    font-weight: 500;
    white-space: nowrap;
}

.planning-tab::after {
    position: absolute;
    right: 0;
    bottom: -1px;
    left: 0;

    height: 2px;

    background: transparent;

    content: "";
}

.planning-tab:hover,
.planning-tab--active {
    color: rgb(var(--v-theme-on-surface));
}

.planning-tab--active {
    font-weight: 600;
}

.planning-tab--active::after {
    background: rgb(var(--v-theme-on-surface));
}

.planning-loading {
    position: absolute;
    z-index: 10;
    top: 0;
    right: 0;
    left: 0;
}

/* Workspace */

.planning-workspace {
    padding:
        24px
        var(--planning-gutter)
        52px;
}

/* Summary */

.planning-summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;

    margin-bottom: 14px;
}

.summary-card {
    display: flex;
    min-width: 0;
    min-height: 176px;
    flex-direction: column;

    padding: 22px;

    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 10px;

    background: rgb(var(--v-theme-surface));
}

.summary-card__icon {
    display: grid;
    width: 36px;
    min-width: 36px;
    height: 36px;
    place-items: center;

    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 50%;

    color: rgb(var(--v-theme-on-surface));
    background: rgb(var(--v-theme-secondary));
}

.summary-card--income .summary-card__icon,
.summary-card--income .summary-card__value {
    color: rgb(var(--v-theme-income));
}

.summary-card--expense .summary-card__icon,
.summary-card--expense .summary-card__value,
.summary-card--negative .summary-card__icon,
.summary-card--negative .summary-card__value {
    color: rgb(var(--v-theme-expense));
}

.summary-card__label {
    margin-top: auto;

    color: rgb(var(--v-theme-tertiary));

    font-size: 0.7rem;
    font-weight: 500;
}

.summary-card__value {
    overflow: hidden;

    margin-top: 8px;

    color: rgb(var(--v-theme-on-surface));

    font-size: clamp(1.45rem, 2.7vw, 2.15rem);
    font-weight: 550;
    letter-spacing: -0.045em;
    line-height: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.summary-card small {
    margin-top: 7px;

    color: rgb(var(--v-theme-tertiary));

    font-size: 0.64rem;
}

/* Monthly panel */

.monthly-planning {
    overflow: hidden;

    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 10px;

    background: rgb(var(--v-theme-surface));
}

.monthly-planning__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;

    padding: 22px 24px;

    border-bottom: 1px solid rgb(var(--v-theme-muted-border));
}

.monthly-planning__eyebrow {
    display: block;

    margin-bottom: 6px;

    color: rgb(var(--v-theme-tertiary));

    font-size: 0.62rem;
    font-weight: 600;
    letter-spacing: 0.065em;
    text-transform: uppercase;
}

.monthly-planning__header h2 {
    margin: 0;

    color: rgb(var(--v-theme-on-surface));

    font-size: 1.08rem;
    font-weight: 550;
    letter-spacing: -0.025em;
}

.monthly-planning__header p {
    margin: 7px 0 0;

    color: rgb(var(--v-theme-tertiary));

    font-size: 0.7rem;
    line-height: 1.4;
}

.monthly-planning__legend {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 7px;

    min-height: 30px;
    padding: 0 10px;

    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 5px;

    color: rgb(var(--v-theme-tertiary));
    background: rgb(var(--v-theme-secondary));

    font-size: 0.64rem;
}

.projection-dot {
    display: inline-block;
    width: 6px;
    min-width: 6px;
    height: 6px;

    border-radius: 50%;

    background: rgb(var(--v-theme-primarymuted));
}

.planning-table-shell {
    width: 100%;
    min-width: 0;
}

.planning-table-scroll {
    width: 100%;

    overflow-x: auto;

    scrollbar-width: thin;
    scrollbar-color:
        rgb(var(--v-theme-perfect-scrollbar-thumb))
        transparent;
}

.planning-table-scroll::-webkit-scrollbar {
    height: 7px;
}

.planning-table-scroll::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: rgb(var(--v-theme-perfect-scrollbar-thumb));
}

.planning-table {
    width: max-content;
    min-width: 100%;

    border-spacing: 0;
    border-collapse: separate;

    table-layout: fixed;
}

.planning-table th,
.planning-table td {
    min-width: 126px;
    height: 54px;

    padding: 8px 12px;

    border-right: 1px solid rgb(var(--v-theme-muted-border));
    border-bottom: 1px solid rgb(var(--v-theme-muted-border));

    color: rgb(var(--v-theme-on-surface));

    font-size: 0.69rem;
    text-align: right;
    vertical-align: middle;
}

.planning-table tr > *:last-child {
    border-right: 0;
}

.planning-table thead th {
    position: sticky;
    z-index: 4;
    top: 0;

    height: 46px;

    color: rgb(var(--v-theme-tertiary));
    background: rgb(var(--v-theme-table-header-color));

    font-size: 0.63rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

.planning-row-name,
.planning-section-name {
    position: sticky;
    z-index: 8;
    left: 0;

    width: 230px;
    min-width: 230px !important;
    max-width: 230px;

    text-align: left !important;

    background: rgb(var(--v-theme-surface));

    /* impede que as células apareçam por baixo */
    background-clip: padding-box;
}

.planning-column-heading {
    z-index: 10 !important;

    background: rgb(var(--v-theme-table-header-color)) !important;
}

.planning-table thead .planning-column-heading {
    z-index: 20 !important;
    background: rgb(var(--v-theme-surface)) !important;
}

.planning-month-heading {
    text-align: center !important;
}

.planning-month-heading span,
.planning-month-heading small {
    display: block;
}

.planning-month-heading small {
    margin-top: 3px;

    color: rgb(var(--v-theme-primarymuted));

    font-size: 0.52rem;
    letter-spacing: 0;
    text-transform: none;
}

.planning-month-heading--current {
    color: rgb(var(--v-theme-on-surface)) !important;
    background: rgba(var(--v-theme-primary), 0.055) !important;
}

.planning-section-row td {
    height: 44px;

    background: rgb(var(--v-theme-secondary));
}

.planning-section-name {
    background: rgb(var(--v-theme-secondary)) !important;
}

.planning-section-title {
    display: flex;
    align-items: center;
    gap: 10px;

    font-size: 0.7rem;
    font-weight: 600;
}

.planning-section-icon {
    display: grid;
    width: 28px;
    min-width: 28px;
    height: 28px;
    place-items: center;

    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 50%;

    color: rgb(var(--v-theme-on-surface));
    background: rgb(var(--v-theme-surface));
}

.planning-section-icon--recurring-income,
.planning-section-icon--other-income {
    color: rgb(var(--v-theme-income));
}

.planning-section-icon--recurring-expense,
.planning-section-icon--other-expense,
.planning-section-icon--credit-card {
    color: rgb(var(--v-theme-expense));
}

.planning-section-count {
    color: rgb(var(--v-theme-tertiary));

    font-size: 0.61rem;
}

.planning-data-row td {
    cursor: pointer;

    transition: background-color 120ms ease;
}

.planning-data-row td:hover {
    background: rgb(var(--v-theme-on-hover-background));
}

.planning-row-copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 5px;
}

.planning-row-copy strong {
    overflow: hidden;

    font-size: 0.7rem;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.planning-row-copy small {
    color: rgb(var(--v-theme-tertiary));

    font-size: 0.58rem;
    font-weight: 500;
}

.planning-cell-content {
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: flex-end;
    gap: 7px;
}

.planning-cell-value {
    overflow: hidden;

    color: rgb(var(--v-theme-on-surface));

    font-weight: 550;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.planning-cell-empty {
    color: rgb(var(--v-theme-tertiary));
}

.planning-cell-tooltip {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.planning-cell-tooltip span,
.planning-cell-tooltip small {
    opacity: 0.76;
}

.planning-summary-divider td {
    height: 12px;

    padding: 0;

    border-bottom: 1px solid rgb(var(--v-theme-muted-border));

    background: rgb(var(--v-theme-background));
}

.planning-total-row th,
.planning-total-row td {
    height: 50px;

    font-weight: 600;
}

.planning-total-row--income td {
    color: rgb(var(--v-theme-income));
}

.planning-total-row--expense td {
    color: rgb(var(--v-theme-expense));
}

.planning-total-row--difference td,
.planning-total-row--balance td {
    color: rgb(var(--v-theme-on-surface));
}

.planning-total-label {
    display: inline-flex;
    align-items: center;
    gap: 8px;

    font-size: 0.68rem;
    font-weight: 600;
}

.planning-total-positive {
    color: rgb(var(--v-theme-income)) !important;
}

.planning-total-negative {
    color: rgb(var(--v-theme-expense)) !important;
}

.planning-scroll-hint {
    display: flex;
    align-items: center;
    gap: 7px;

    padding: 10px 16px;

    border-top: 1px solid rgb(var(--v-theme-muted-border));

    color: rgb(var(--v-theme-tertiary));
    background: rgb(var(--v-theme-secondary));

    font-size: 0.62rem;
}

/* Details dialog */

.planning-details-dialog {
    overflow: hidden;

    border: 1px solid rgb(var(--v-theme-muted-border)) !important;
    border-radius: 10px !important;

    background: rgb(var(--v-theme-surface)) !important;
    box-shadow: none !important;
}

.planning-details-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;

    padding: 20px 22px;

    border-bottom: 1px solid rgb(var(--v-theme-muted-border));
}

.planning-details-header span {
    color: rgb(var(--v-theme-tertiary));

    font-size: 0.62rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.planning-details-header h2 {
    margin: 6px 0 0;

    color: rgb(var(--v-theme-on-surface));

    font-size: 1.1rem;
    font-weight: 550;
    letter-spacing: -0.025em;
}

.planning-details-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;

    padding: 12px 22px;

    border-bottom: 1px solid rgb(var(--v-theme-muted-border));

    color: rgb(var(--v-theme-tertiary));
    background: rgb(var(--v-theme-secondary));

    font-size: 0.80rem;
}

.planning-details-summary strong {
    color: rgb(var(--v-theme-on-surface));

    font-size: 1.2rem;
}

.planning-details-content {
    padding: 0 !important;
}

.planning-transaction-list {
    max-height: 430px;

    overflow-y: auto;
}

.planning-transaction-item {
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;

    min-height: 66px;
    padding: 10px 22px;

    border-bottom: 1px solid rgb(var(--v-theme-muted-border));
}

.planning-transaction-item:last-child {
    border-bottom: 0;
}

.planning-transaction-icon {
    display: grid;
    width: 34px;
    height: 34px;
    place-items: center;

    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 50%;

    color: rgb(var(--v-theme-income));
    background: rgb(var(--v-theme-secondary));
}

.planning-transaction-icon--projected {
    color: rgb(var(--v-theme-primarymuted));
}

.planning-transaction-copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 5px;
}

.planning-transaction-copy strong {
    overflow: hidden;

    font-size: 0.85rem;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.planning-transaction-copy span {
    color: rgb(var(--v-theme-tertiary));

    font-size: 0.75rem;
}

.planning-transaction-amount {
    font-size: 0.80rem;
    font-weight: 600;
    white-space: nowrap;
}

.planning-empty-details {
    display: flex;
    min-height: 250px;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 9px;

    color: rgb(var(--v-theme-tertiary));

    text-align: center;
}

.planning-empty-details strong {
    color: rgb(var(--v-theme-on-surface));

    font-size: 0.82rem;
}

.planning-empty-details span {
    max-width: 330px;

    font-size: 0.67rem;
    line-height: 1.45;
}

.planning-details-actions {
    padding: 10px 16px !important;
    border-top: 1px solid rgb(var(--v-theme-muted-border));
}
.planning-details-actions .v-btn {
    color: rgb(var(--v-theme-on-surface)) !important;
}


/* Responsive */

@media (max-width: 1260px) {
    .annual-planning-page {
        --planning-gutter: 32px;
    }

    .planning-header__top {
        flex-direction: column;
    }

    .planning-header__controls {
        width: 100%;
        max-width: 520px;
    }
}

@media (max-width: 900px) {
    .annual-planning-page {
        --planning-gutter: 22px;
    }

    .planning-header__top {
        padding-top: 28px;
    }

    .planning-summary {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .summary-card--balance {
        grid-column: 1 / -1;
    }

    .planning-row-name,
    .planning-section-name {
        width: 200px;
        min-width: 200px !important;
        max-width: 200px;
    }
}

@media (max-width: 700px) {
    .planning-header__controls {
        grid-template-columns: 42px minmax(0, 1fr) 42px 42px;
    }

    .planning-summary {
        grid-template-columns: 1fr;
    }

    .summary-card--balance {
        grid-column: auto;
    }

    .monthly-planning__header {
        align-items: flex-start;
        flex-direction: column;
    }
}

@media (max-width: 600px) {
    .annual-planning-page {
        --planning-gutter: 14px;

        width: calc(100% + 48px);
        margin: -24px;
    }

    .planning-header__top {
        padding-top: 22px;
    }

    .planning-header h1 {
        font-size: 1.75rem;
    }

    .planning-header p {
        display: none;
    }

    .planning-tabs {
        gap: 22px;
        margin-top: 24px;
    }

    .planning-header__controls {
        grid-template-columns: 40px minmax(0, 1fr) 40px 40px;
        gap: 6px;
    }

    .planning-year-button,
    .planning-refresh-button {
        width: 40px !important;
        min-width: 40px !important;
        height: 40px !important;
    }

    .planning-workspace {
        padding-top: 14px;
        padding-bottom: 28px;
    }

    .summary-card {
        min-height: 148px;
        padding: 18px;
    }

    .monthly-planning__header {
        padding: 18px;
    }

    .planning-row-name,
    .planning-section-name {
        width: 170px;
        min-width: 170px !important;
        max-width: 170px;
    }

    .planning-table th,
    .planning-table td {
        min-width: 112px;
        padding-inline: 9px;
    }

    .planning-transaction-item {
        grid-template-columns: 34px minmax(0, 1fr);
    }

    .planning-transaction-amount {
        grid-column: 2;
    }
}

/* Valores das células por tipo */

.value-cell--income .planning-cell-value {
    color: rgb(var(--v-theme-income));
}

.value-cell--expense .planning-cell-value {
    color: rgb(var(--v-theme-expense));
}

/* Seletor de ano — alinhado aos botões laterais */

.planning-year-select {
    min-width: 0; max-width: fit-content;
}

.planning-year-select :deep(.v-input__control) {
    height: 44px;
}

.planning-year-select :deep(.v-field) {
    height: 44px !important;
    min-height: 44px !important;

    border-radius: 6px !important;

    color: rgb(var(--v-theme-on-surface));
    background: rgb(var(--v-theme-surface));

    box-shadow: none !important;
}

.planning-year-select :deep(.v-field__outline) {
    --v-field-border-opacity: 1;

    color: rgb(var(--v-theme-muted-border));
}

.planning-year-select:hover :deep(.v-field__outline) {
    color: rgb(var(--v-theme-on-hover-border));
}

.planning-year-select
    :deep(.v-field--focused .v-field__outline) {
    color: rgb(var(--v-theme-primarymuted));
}

.planning-year-select :deep(.v-field__input) {
    min-height: 44px !important;
    padding:
        0
        14px !important;

    align-items: center;

    font-size: 0.88rem;
    font-weight: 500;
}

.planning-year-select :deep(.v-field__append-inner) {
    height: 44px;
    align-items: center;

    padding-top: 0;
}

.planning-year-select :deep(.v-select__selection) {
    margin: 0;
}

/* Remove os efeitos tonais internos apenas deste select */
.planning-year-select :deep(.v-field__overlay) {
    opacity: 0 !important;
}

@media (max-width: 600px) {
    .planning-year-select :deep(.v-input__control),
    .planning-year-select :deep(.v-field),
    .planning-year-select :deep(.v-field__input),
    .planning-year-select :deep(.v-field__append-inner) {
        height: 40px !important;
        min-height: 40px !important;
    }
}

</style>