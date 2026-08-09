<template>
    <v-dialog v-model="show" max-width="680" persistent>
        <v-card class="pay-invoice-dialog" :loading="loading" rounded="lg">
            <v-card-title class="pay-invoice-dialog__header">
                <span class="pay-invoice-dialog__header-icon">
                    <v-icon :icon="mdiCreditCardCheckOutline" size="24" />
                </span>
                <span>
                    <span class="pay-invoice-dialog__title">{{ tt('Pay Invoice') }}</span>
                    <span class="pay-invoice-dialog__subtitle">{{ tt('Pay invoice using a transfer') }}</span>
                </span>
            </v-card-title>

            <v-card-text class="pay-invoice-dialog__content">
                <div class="pay-invoice-section-label">{{ tt('Payment accounts') }}</div>
                <v-row class="pay-invoice-account-fields">
                    <v-col cols="12" md="6">
                        <v-autocomplete v-model="sourceAccountId" :items="sourceAccounts" item-title="name" item-value="id"
                                        :label="tt('Pay With')" :disabled="loading || submitting" :prepend-inner-icon="mdiBankOutline"
                                        :no-data-text="tt('No eligible source accounts')" hide-details />
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-select v-model="creditCardAccountId" :items="creditCards" item-title="name" item-value="id"
                                  :label="tt('Credit Card')" :disabled="loading || submitting" :prepend-inner-icon="mdiCreditCardOutline" hide-details />
                    </v-col>
                </v-row>

                <div class="pay-invoice-summary" :class="{ 'pay-invoice-summary--loading': loading }">
                    <div class="pay-invoice-summary__heading">
                        <span>{{ tt('Invoice') }}</span>
                        <strong>{{ invoiceLabel }}</strong>
                    </div>
                    <div class="pay-invoice-summary__amount">
                        <span>{{ tt('Invoice Total') }}</span>
                        <strong>{{ formatAmount(invoiceTotal) }}</strong>
                    </div>
                    <div class="pay-invoice-summary__amount">
                        <span>{{ tt('Already Paid') }}</span>
                        <strong>{{ formatAmount(paidAmount) }}</strong>
                    </div>
                    <div class="pay-invoice-summary__amount pay-invoice-summary__remaining">
                        <span>{{ tt('Remaining') }}</span>
                        <strong>{{ formatAmount(remainingAmount) }}</strong>
                    </div>
                </div>

                <v-alert v-if="!loading && !sourceAccounts.length" class="mb-5" type="warning" variant="tonal" density="compact">
                    {{ tt('Create an eligible account in the same currency to pay this invoice') }}
                </v-alert>
                <v-alert v-else-if="!loading && invoiceTotal <= 0" class="mb-5" type="info" variant="tonal" density="compact">
                    {{ tt('This invoice has no amount to pay') }}
                </v-alert>
                <v-alert v-else-if="!loading && remainingAmount <= 0" class="mb-5" type="success" variant="tonal" density="compact">
                    {{ tt('This invoice is already paid') }}
                </v-alert>

                <div class="pay-invoice-section-label">{{ tt('Payment details') }}</div>
                <v-row class="pay-invoice-payment-fields">
                    <v-col cols="12" md="6">
                        <amount-input v-model="amountToPay" :currency="selectedCreditCard?.currency || userStore.currentUserDefaultCurrency"
                                      :label="tt('Amount to Pay')" :disabled="loading || submitting || remainingAmount <= 0" />
                        <div v-if="amountToPay > remainingAmount && remainingAmount > 0" class="pay-invoice-field-error">
                            {{ tt('Amount cannot exceed the remaining invoice balance') }}
                        </div>
                    </v-col>
                    <v-col cols="12" md="6">
                        <date-time-select :model-value="paymentTime" :timezone-utc-offset="paymentUtcOffset"
                                          :label="tt('Payment Date')" :disabled="loading || submitting"
                                          @update:model-value="paymentTime = $event" @error="showDateError" />
                    </v-col>
                </v-row>
            </v-card-text>
            <v-card-actions class="pay-invoice-dialog__actions">
                <v-spacer />
                <v-btn variant="text" :disabled="submitting" @click="close">{{ tt('Cancel') }}</v-btn>
                <v-btn color="primary" variant="flat" size="large" :prepend-icon="mdiCheck" :loading="submitting" :disabled="!canSubmit" @click="submit">
                    {{ tt('Pay Invoice') }}
                </v-btn>
            </v-card-actions>
        </v-card>
        <snack-bar ref="snackbar" />
    </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue';
import { mdiBankOutline, mdiCheck, mdiCreditCardCheckOutline, mdiCreditCardOutline } from '@mdi/js';
import type { Account } from '@/models/account.ts';
import { Transaction } from '@/models/transaction.ts';
import { AccountCategory } from '@/core/account.ts';
import { CategoryType } from '@/core/category.ts';
import { TransactionType } from '@/core/transaction.ts';
import { useAccountsStore } from '@/stores/account.ts';
import { useSettingsStore } from '@/stores/setting.ts';
import { useTransactionCategoriesStore } from '@/stores/transactionCategory.ts';
import { useTransactionsStore } from '@/stores/transaction.ts';
import { useUserStore } from '@/stores/user.ts';
import { useI18n } from '@/locales/helpers.ts';
import { BIG_DECIMAL_ZERO, parseBigDecimal } from '@/lib/numeral.ts';
import { getCurrentUnixTime, getTimezoneOffsetMinutes } from '@/lib/datetime.ts';
import { getFirstVisibleCategoryId } from '@/lib/category.ts';
import { generateRandomUUID } from '@/lib/misc.ts';
import services from '@/lib/services.ts';
import logger from '@/lib/logger.ts';
import { getCreditCardInvoicePeriod, loadCreditCardInvoiceItems } from '@/lib/credit_card_invoice.ts';
import { getCreditCardInvoiceCycle } from '@/lib/credit_card_invoice_cycle.ts';
import AmountInput from '@/components/desktop/AmountInput.vue';
import DateTimeSelect from '@/components/desktop/DateTimeSelect.vue';
import SnackBar from '@/components/desktop/SnackBar.vue';

interface PayInvoiceOptions {
    readonly accountId: string;
    readonly yearMonth: string;
    readonly invoiceLabel: string;
}

type SnackBarType = InstanceType<typeof SnackBar>;
const emit = defineEmits<{ paid: [] }>();
const { tt, formatAmountToLocalizedNumeralsWithCurrency } = useI18n();
const accountsStore = useAccountsStore();
const settingsStore = useSettingsStore();
const categoriesStore = useTransactionCategoriesStore();
const transactionsStore = useTransactionsStore();
const userStore = useUserStore();
const snackbar = useTemplateRef<SnackBarType>('snackbar');
const show = ref(false);
const loading = ref(false);
const submitting = ref(false);
const sourceAccountId = ref('');
const creditCardAccountId = ref('');
const yearMonth = ref('');
const invoiceLabel = ref('');
const invoiceTotal = ref(0);
const paidAmount = ref(0);
const amountToPay = ref(0);
const paymentTime = ref(getCurrentUnixTime());
let loadSequence = 0;

const creditCards = computed(() => accountsStore.allVisiblePlainAccounts.filter(account => account.category === AccountCategory.CreditCard.type && !!account.creditCardStatementDate));
const selectedCreditCard = computed<Account | undefined>(() => creditCards.value.find(account => account.id === creditCardAccountId.value));
const sourceAccounts = computed(() => accountsStore.allVisiblePlainAccounts.filter(account => account.category !== AccountCategory.CreditCard.type && account.id !== creditCardAccountId.value && (!selectedCreditCard.value || account.currency === selectedCreditCard.value.currency)));
const remainingAmount = computed(() => Math.max(parseBigDecimal(invoiceTotal.value).subtract(parseBigDecimal(paidAmount.value)).toSafeIntegerNumber(), 0));
const paymentUtcOffset = computed(() => getTimezoneOffsetMinutes(paymentTime.value, settingsStore.appSettings.timeZone));
const transferCategoryId = computed(() => getFirstVisibleCategoryId(categoriesStore.allTransactionCategories[CategoryType.Transfer] || []));
const canSubmit = computed(() => !loading.value && !submitting.value && !!sourceAccountId.value && !!selectedCreditCard.value && !!transferCategoryId.value && amountToPay.value > 0 && amountToPay.value <= remainingAmount.value);

function formatAmount(amount: number): string {
    return formatAmountToLocalizedNumeralsWithCurrency(parseBigDecimal(amount), selectedCreditCard.value?.currency);
}

function open(options: PayInvoiceOptions): void {
    yearMonth.value = options.yearMonth;
    invoiceLabel.value = options.invoiceLabel;
    creditCardAccountId.value = options.accountId;
    paymentTime.value = getCurrentUnixTime();
    sourceAccountId.value = '';
    show.value = true;
    loading.value = true;
    Promise.all([accountsStore.loadAllAccounts({ force: false }), categoriesStore.loadAllCategories({ force: false })])
        .then(() => loadSelectedInvoice())
        .catch((error: unknown) => {
            logger.error('failed to initialize invoice payment dialog', error);
            snackbar.value?.showError('Unable to load invoice payment data');
            loading.value = false;
        });
}

function close(): void { if (!submitting.value) show.value = false; }

async function loadSelectedInvoice(): Promise<void> {
    const account = selectedCreditCard.value;
    const sequence = ++loadSequence;
    invoiceTotal.value = 0;
    paidAmount.value = 0;
    amountToPay.value = 0;
    if (!account) return;
    loading.value = true;
    const period = getCreditCardInvoicePeriod(account, yearMonth.value);

    try {
        const items = await loadCreditCardInvoiceItems(account, period.start, period.end);
        if (sequence !== loadSequence) return;
        invoiceTotal.value = items.reduce((sum, item) => sum.add(parseBigDecimal(item.sourceAmount)), BIG_DECIMAL_ZERO).toSafeIntegerNumber();
    } catch (error: unknown) {
        logger.error('failed to load credit card invoice items', error);
        snackbar.value?.showError('Unable to load invoice payment data');
        if (sequence === loadSequence) loading.value = false;
        return;
    }

    try {
        const response = await services.getCreditCardInvoicePayment(account.id, getCreditCardInvoiceCycle(period));
        if (sequence === loadSequence) paidAmount.value = response.data.result?.paidAmount || 0;
    } catch (error: unknown) {
        logger.error('failed to load credit card invoice payments', error);
        if (sequence === loadSequence) paidAmount.value = 0;
    } finally {
        if (sequence === loadSequence) {
            amountToPay.value = remainingAmount.value;
            if (!sourceAccounts.value.some(source => source.id === sourceAccountId.value)) sourceAccountId.value = sourceAccounts.value[0]?.id || '';
            loading.value = false;
        }
    }
}

async function submit(): Promise<void> {
    if (!canSubmit.value || submitting.value || !selectedCreditCard.value) return;
    const card = selectedCreditCard.value;
    submitting.value = true;
    try {
        const transaction = Transaction.createNewTransaction(TransactionType.Transfer, paymentTime.value, settingsStore.appSettings.timeZone, paymentUtcOffset.value);
        transaction.sourceAccountId = sourceAccountId.value;
        transaction.destinationAccountId = card.id;
        transaction.sourceAmount = amountToPay.value;
        transaction.destinationAmount = amountToPay.value;
        transaction.transferCategoryId = transferCategoryId.value;
        transaction.creditCardInvoiceCycle = getCreditCardInvoiceCycle(getCreditCardInvoicePeriod(card, yearMonth.value));
        transaction.comment = tt('Invoice payment description', { invoice: invoiceLabel.value, card: card.name });
        await transactionsStore.saveTransaction({ transaction, defaultCurrency: userStore.currentUserDefaultCurrency, isEdit: false, clientSessionId: generateRandomUUID() });
        show.value = false;
        snackbar.value?.showMessage('Invoice payment recorded');
        emit('paid');
    } catch (error: unknown) {
        logger.error('failed to pay credit card invoice', error);
        snackbar.value?.showError('Unable to pay invoice');
    } finally {
        submitting.value = false;
    }
}

function showDateError(error: string): void { snackbar.value?.showError(error); }
watch(creditCardAccountId, (value, oldValue) => { if (show.value && value && value !== oldValue) void loadSelectedInvoice(); }, { flush: 'sync' });
defineExpose({ open });
</script>

<style scoped>
.pay-invoice-dialog { overflow: hidden; }
.pay-invoice-dialog__header { display: flex; align-items: center; gap: 14px; padding: 24px 24px 18px; white-space: normal; }
.pay-invoice-dialog__header-icon { display: grid; place-items: center; width: 44px; height: 44px; flex: 0 0 44px; border-radius: 12px; color: rgb(var(--v-theme-primary)); background: rgba(var(--v-theme-primary), 0.1); }
.pay-invoice-dialog__title, .pay-invoice-dialog__subtitle { display: block; }
.pay-invoice-dialog__title { font-size: 1.25rem; font-weight: 650; line-height: 1.4; }
.pay-invoice-dialog__subtitle { margin-top: 2px; color: rgb(var(--v-theme-tertiary)); font-size: 0.875rem; font-weight: 400; line-height: 1.35; }
.pay-invoice-dialog__content { padding: 6px 24px 8px !important; }
.pay-invoice-section-label { margin: 8px 0 4px; color: rgb(var(--v-theme-tertiary)); font-size: 0.75rem; font-weight: 650; letter-spacing: 0.06em; text-transform: uppercase; }
.pay-invoice-account-fields, .pay-invoice-payment-fields { margin-top: 0; }
.pay-invoice-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin: 18px 0 22px; overflow: hidden; border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); border-radius: 12px; background: rgba(var(--v-theme-on-surface), 0.025); }
.pay-invoice-summary__heading { display: flex; align-items: center; justify-content: space-between; grid-column: 1 / -1; padding: 12px 16px; border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.pay-invoice-summary__heading span, .pay-invoice-summary__amount span { color: rgb(var(--v-theme-tertiary)); font-size: 0.8125rem; }
.pay-invoice-summary__heading strong { font-size: 0.9375rem; }
.pay-invoice-summary__amount { display: flex; flex-direction: column; gap: 5px; padding: 14px 16px; }
.pay-invoice-summary__amount + .pay-invoice-summary__amount { border-left: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.pay-invoice-summary__amount strong { font-size: 1rem; white-space: nowrap; }
.pay-invoice-summary__remaining { background: rgba(var(--v-theme-primary), 0.07); }
.pay-invoice-summary__remaining strong { color: rgb(var(--v-theme-on-primary)); font-size: 1.125rem; }
.pay-invoice-summary--loading { opacity: 0.55; }
.pay-invoice-field-error { margin: -14px 0 8px 16px; color: rgb(var(--v-theme-error)); font-size: 0.75rem; }
.pay-invoice-dialog__actions { padding: 16px 24px 22px; gap: 8px; }
@media (max-width: 600px) {
    .pay-invoice-dialog__header { padding: 20px 18px 14px; }
    .pay-invoice-dialog__content { padding-inline: 18px !important; }
    .pay-invoice-summary { grid-template-columns: 1fr; }
    .pay-invoice-summary__amount { flex-direction: row; align-items: center; justify-content: space-between; }
    .pay-invoice-summary__amount + .pay-invoice-summary__amount { border-left: 0; border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
    .pay-invoice-dialog__actions { padding: 12px 18px 18px; }
}
</style>
