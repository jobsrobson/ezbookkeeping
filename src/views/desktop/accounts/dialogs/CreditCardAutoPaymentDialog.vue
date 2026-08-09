<template>
    <v-dialog
        v-model="show"
        max-width="600"
        persistent
    >
        <v-card
            class="auto-payment-dialog"
            rounded="lg"
            :loading="loading"
        >
            <!-- Header -->
            <v-card-title class="auto-payment-dialog__header">
                <span class="auto-payment-dialog__header-icon">
                    <v-icon
                        :icon="mdiCalendarSync"
                        size="22"
                    />
                </span>

                <div class="auto-payment-dialog__header-content">
                    <strong class="auto-payment-dialog__title">
                        {{ tt('Automatic Debit') }}
                    </strong>

                    <span class="auto-payment-dialog__subtitle">
                        {{ tt('Pay every invoice automatically at maturity') }}
                    </span>
                </div>
            </v-card-title>

            <v-card-text class="auto-payment-dialog__content">
                <!-- Ativar / desativar -->
                <section class="auto-payment-toggle">
                    <div class="auto-payment-toggle__content">
                        <strong class="auto-payment-toggle__title">
                            {{ tt('Automatic Debit') }}
                        </strong>

                        <span class="auto-payment-toggle__description">
                            {{ tt('Automatically pay the full remaining invoice balance on the due date') }}
                        </span>
                    </div>

                    <v-switch
                        v-model="enabled"
                        class="auto-payment-toggle__switch"
                        color="primary"
                        density="compact"
                        hide-details
                        :disabled="loading || saving"
                    />
                </section>

                <!--
                    As configurações abaixo só são exibidas
                    quando o débito automático estiver ativado.
                -->
                <template v-if="enabled">
                    <!-- Agendamento -->
                    <section class="auto-payment-schedule">
                        <div class="auto-payment-schedule__icon">
                            <v-icon
                                :icon="mdiClockOutline"
                                size="20"
                            />
                        </div>

                        <div class="auto-payment-schedule__content">
                            <span class="auto-payment-schedule__label">
                                {{ tt('Payment schedule') }}
                            </span>

                            <strong class="auto-payment-schedule__value">
                                {{
                                    tt('Automatic payment schedule', {
                                        day: selectedCard?.creditCardDueDate || ''
                                    })
                                }}
                            </strong>
                        </div>
                    </section>

                    <!-- Configuração -->
                    <div class="auto-payment-fields">
                        <!-- Conta de origem -->
                        <section class="auto-payment-field">
                            <div class="auto-payment-field__header">
                                <strong class="auto-payment-field__title">
                                    {{ tt('Payment account') }}
                                </strong>

                                <span class="auto-payment-field__description">
                                    {{ tt('Choose the account that will be debited when the invoice is paid') }}
                                </span>
                            </div>

                            <v-autocomplete
                                v-model="sourceAccountId"
                                :items="sourceAccounts"
                                item-title="name"
                                item-value="id"
                                :label="tt('Pay With')"
                                :prepend-inner-icon="mdiBankOutline"
                                :disabled="loading || saving"
                                :no-data-text="tt('No eligible source accounts')"
                                hide-details
                            />
                        </section>

                        <!-- Cartão -->
                        <section class="auto-payment-field">
                            <div class="auto-payment-field__header">
                                <strong class="auto-payment-field__title">
                                    {{ tt('Credit Card') }}
                                </strong>

                                <span class="auto-payment-field__description">
                                    {{ tt('Select the credit card whose invoice will be paid automatically') }}
                                </span>
                            </div>

                            <v-select
                                v-model="cardAccountId"
                                :items="creditCards"
                                item-title="name"
                                item-value="id"
                                :label="tt('Credit Card')"
                                :prepend-inner-icon="mdiCreditCardOutline"
                                :disabled="loading || saving"
                                hide-details
                            />
                        </section>
                    </div>

                    <!-- Explicação -->
                    <section class="auto-payment-info">
                        <v-icon
                            class="auto-payment-info__icon"
                            :icon="mdiInformationOutline"
                            size="18"
                        />

                        <div class="auto-payment-info__content">
                            <strong>
                                {{ tt('How automatic payment works') }}
                            </strong>

                            <span>
                                {{
                                    tt(
                                        'On each due date, Bookkeeping will automatically create a transfer from the selected payment account to the credit card for the remaining invoice balance.'
                                    )
                                }}
                            </span>
                        </div>
                    </section>
                </template>
            </v-card-text>

            <v-card-actions class="auto-payment-dialog__actions">
                <v-spacer />

                <v-btn
                    class="auto-payment-cancel-btn"
                    variant="text"
                    :disabled="saving"
                    @click="close"
                >
                    {{ tt('Cancel') }}
                </v-btn>

                <v-btn
                    color="primary"
                    variant="flat"
                    :loading="saving"
                    :disabled="!canSave"
                    @click="save"
                >
                    {{ tt('Save') }}
                </v-btn>
            </v-card-actions>
        </v-card>

        <snack-bar ref="snackbar" />
    </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue';

import {
    mdiBankOutline,
    mdiCalendarSync,
    mdiClockOutline,
    mdiCreditCardOutline,
    mdiInformationOutline
} from '@mdi/js';

import { AccountCategory } from '@/core/account.ts';
import { CategoryType } from '@/core/category.ts';

import { useAccountsStore } from '@/stores/account.ts';
import { useTransactionCategoriesStore } from '@/stores/transactionCategory.ts';

import { useI18n } from '@/locales/helpers.ts';
import { getFirstVisibleCategoryId } from '@/lib/category.ts';

import services from '@/lib/services.ts';
import logger from '@/lib/logger.ts';

import SnackBar from '@/components/desktop/SnackBar.vue';

type SnackBarType = InstanceType<typeof SnackBar>;

const { tt } = useI18n();

const accountsStore = useAccountsStore();
const categoriesStore = useTransactionCategoriesStore();

const snackbar = useTemplateRef<SnackBarType>('snackbar');

const emit = defineEmits<{
    updated: [];
}>();

const show = ref(false);
const loading = ref(false);
const saving = ref(false);
const enabled = ref(false);

const sourceAccountId = ref('');
const cardAccountId = ref('');

const creditCards = computed(() =>
    accountsStore.allVisiblePlainAccounts.filter(
        account =>
            account.category === AccountCategory.CreditCard.type &&
            !!account.creditCardDueDate &&
            !!account.creditCardStatementDate
    )
);

const selectedCard = computed(() =>
    creditCards.value.find(
        account => account.id === cardAccountId.value
    )
);

const sourceAccounts = computed(() =>
    accountsStore.allVisiblePlainAccounts.filter(
        account =>
            account.category !== AccountCategory.CreditCard.type &&
            (
                !selectedCard.value ||
                account.currency === selectedCard.value.currency
            )
    )
);

const transferCategoryId = computed(() =>
    getFirstVisibleCategoryId(
        categoriesStore.allTransactionCategories[
            CategoryType.Transfer
        ] || []
    )
);

const canSave = computed(() =>
    !loading.value &&
    !saving.value &&
    !!cardAccountId.value &&
    (
        !enabled.value ||
        (
            !!sourceAccountId.value &&
            !!transferCategoryId.value
        )
    )
);

async function load(): Promise<void> {
    if (!cardAccountId.value) {
        return;
    }

    loading.value = true;

    try {
        const response =
            await services.getCreditCardAutoPayment(
                cardAccountId.value
            );

        enabled.value =
            !!response.data.result?.enabled;

        sourceAccountId.value =
            response.data.result?.sourceAccountId ||
            sourceAccounts.value[0]?.id ||
            '';
    } catch (error) {
        logger.error(
            'failed to load automatic invoice payment',
            error
        );

        enabled.value = false;

        sourceAccountId.value =
            sourceAccounts.value[0]?.id ||
            '';
    } finally {
        loading.value = false;
    }
}

async function open(accountId: string): Promise<void> {
    show.value = true;
    loading.value = true;
    cardAccountId.value = accountId;

    try {
        await Promise.all([
            accountsStore.loadAllAccounts({
                force: false
            }),

            categoriesStore.loadAllCategories({
                force: false
            })
        ]);

        await load();
    } catch (error) {
        logger.error(
            'failed to initialize automatic debit',
            error
        );

        enabled.value = false;

        sourceAccountId.value =
            sourceAccounts.value[0]?.id ||
            '';

        loading.value = false;
    }
}

function close(): void {
    if (!saving.value) {
        show.value = false;
    }
}

async function save(): Promise<void> {
    if (!canSave.value) {
        return;
    }

    saving.value = true;

    try {
        await services.updateCreditCardAutoPayment({
            enabled: enabled.value,

            creditCardAccountId:
                cardAccountId.value,

            sourceAccountId:
                sourceAccountId.value ||
                sourceAccounts.value[0]?.id ||
                '0',

            transferCategoryId:
                transferCategoryId.value ||
                '0'
        });

        show.value = false;

        emit('updated');
    } catch (error) {
        logger.error(
            'failed to save automatic debit',
            error
        );

        snackbar.value?.showError(
            'Unable to save automatic debit'
        );
    } finally {
        saving.value = false;
    }
}

watch(
    cardAccountId,
    (value, oldValue) => {
        if (
            show.value &&
            oldValue &&
            value !== oldValue
        ) {
            void load();
        }
    }
);

defineExpose({
    open
});
</script>

<style scoped>
.auto-payment-dialog {
    overflow: hidden;
}

/* ---------------------------------------------------------
 * Header
 * --------------------------------------------------------- */

.auto-payment-dialog__header {
    display: none;
    align-items: center;
    gap: 14px;

    padding: 24px 24px 18px;

    white-space: normal;
}

.auto-payment-dialog__header-icon {
    display: none;
}

.auto-payment-dialog__header-content {
    display: flex;
    min-width: 0;
    flex-direction: column;
}

.auto-payment-dialog__title {
    color: rgb(var(--v-theme-on-surface));

    font-size: 1.4rem;
    font-weight: 600;
    line-height: 1.4;
}

.auto-payment-dialog__subtitle {
    display: none;
}

/* ---------------------------------------------------------
 * Content
 * --------------------------------------------------------- */

.auto-payment-dialog__content {
    display: flex;
    flex-direction: column;
    gap: 22px;

    margin-top: 20px;

    padding: 12px 24px 24px;
}

/* ---------------------------------------------------------
 * Enable / disable
 * --------------------------------------------------------- */

.auto-payment-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;

    padding: 16px;

    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 12px;
}

.auto-payment-toggle__content {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
}

.auto-payment-toggle__title {
    color: rgb(var(--v-theme-on-surface));

    font-size: 0.9rem;
    font-weight: 600;
    line-height: 1.4;
}

.auto-payment-toggle__description {
    margin-top: 3px;

    color: rgb(var(--v-theme-tertiary));

    font-size: 0.8rem;
    font-weight: 400;
    line-height: 1.45;
}

.auto-payment-toggle__switch {
    flex: 0 0 auto;
}

/* ---------------------------------------------------------
 * Schedule
 * --------------------------------------------------------- */

.auto-payment-schedule {
    display: flex;
    align-items: center;
    gap: 14px;

    padding: 14px 16px;

    background: rgba(var(--v-theme-primary), 0.15);

    border: 1px solid rgba(var(--v-theme-on-primary), 0.3);
    border-radius: 10px;
}

.auto-payment-schedule__icon {
    display: grid;
    flex: 0 0 34px;

    width: 34px;
    height: 34px;

    place-items: center;

    color: rgb(var(--v-theme-on-primary));

    background: rgb(var(--v-theme-primary));

    border-radius: 8px;
}

.auto-payment-schedule__content {
    display: flex;
    min-width: 0;
    flex-direction: column;
}

.auto-payment-schedule__label {
    color: rgb(var(--v-theme-tertiary));

    font-size: 0.72rem;
    font-weight: 500;
    line-height: 1.3;
}

.auto-payment-schedule__value {
    margin-top: 2px;

    color: rgb(var(--v-theme-on-surface));

    font-size: 0.85rem;
    font-weight: 600;
    line-height: 1.4;
}

/* ---------------------------------------------------------
 * Fields
 * --------------------------------------------------------- */

.auto-payment-fields {
    display: flex;
    flex-direction: column;
    gap: 22px;
}

.auto-payment-field {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.auto-payment-field__header {
    display: flex;
    flex-direction: column;

    padding: 0 2px;
}

.auto-payment-field__title {
    color: rgb(var(--v-theme-on-surface));

    font-size: 0.85rem;
    font-weight: 600;
    line-height: 1.4;
}

.auto-payment-field__description {
    margin-top: 2px;

    color: rgb(var(--v-theme-tertiary));

    font-size: 0.75rem;
    font-weight: 400;
    line-height: 1.45;
}

/* ---------------------------------------------------------
 * Information
 * --------------------------------------------------------- */

.auto-payment-info {
    display: flex;
    align-items: flex-start;
    gap: 11px;

    padding-top: 17px;

    border-top: 1px solid rgb(var(--v-theme-muted-border));
}

.auto-payment-info__icon {
    flex: 0 0 auto;

    margin-top: 1px;

    color: rgb(var(--v-theme-tertiary));
}

.auto-payment-info__content {
    display: flex;
    min-width: 0;
    flex-direction: column;
}

.auto-payment-info__content strong {
    color: rgb(var(--v-theme-on-surface));

    font-size: 0.78rem;
    font-weight: 600;
    line-height: 1.4;
}

.auto-payment-info__content span {
    margin-top: 3px;

    color: rgb(var(--v-theme-tertiary));

    font-size: 0.75rem;
    font-weight: 400;
    line-height: 1.5;
}

/* ---------------------------------------------------------
 * Actions
 * --------------------------------------------------------- */

.auto-payment-dialog__actions {
    padding: 16px 24px 22px;

    border-top: 1px solid rgb(var(--v-theme-muted-border));
}

.auto-payment-cancel-btn {
    color: rgb(var(--v-theme-tertiary)) !important;
}

/* ---------------------------------------------------------
 * Responsive
 * --------------------------------------------------------- */

@media (max-width: 600px) {
    .auto-payment-dialog__header {
        padding: 20px 20px 16px;
    }

    .auto-payment-dialog__content {
        gap: 20px;

        padding: 10px 20px 22px;
    }

    .auto-payment-toggle {
        gap: 16px;

        padding: 14px;
    }

    .auto-payment-schedule {
        padding: 13px 14px;
    }

    .auto-payment-fields {
        gap: 20px;
    }

    .auto-payment-dialog__actions {
        padding: 14px 20px 18px;
    }
}
</style>