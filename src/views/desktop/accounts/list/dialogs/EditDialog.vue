<template>
    <v-dialog class="account-edit-dialog" :width="account.type === AccountType.MultiSubAccounts.type ? 1000 : 800"
              max-width="calc(100vw - 24px)" :persistent="isAccountModified" v-model="showState">
        <v-card class="account-edit-dialog__card">
            <template #title>
                <div class="account-edit-dialog__header">
                    <div class="account-edit-dialog__heading">
                        <h4>{{ tt(title) }}</h4>
                        <v-progress-circular indeterminate size="22" class="ms-2" v-if="loading"></v-progress-circular>
                    </div>
                    <v-spacer/>
                    <v-menu location="bottom end" v-if="account.type === AccountType.MultiSubAccounts.type">
                        <template #activator="{ props }">
                            <v-btn density="comfortable" color="default" variant="text" :icon="true"
                                   :disabled="loading || submitting" v-bind="props">
                                <v-icon :icon="mdiDotsVertical" />
                                <v-tooltip activator="parent">{{ tt('More') }}</v-tooltip>
                            </v-btn>
                        </template>
                        <v-list density="compact">
                            <v-list-item :prepend-icon="mdiCreditCardPlusOutline"
                                         :title="tt('Add Sub-account')"
                                         @click="addSubAccount" />
                        </v-list>
                    </v-menu>
                </div>
            </template>
            <v-card-text class="account-edit-dialog__body">
                <aside class="account-edit-dialog__sidebar" v-if="account.type === AccountType.MultiSubAccounts.type">
                    <v-tabs class="account-edit-dialog__tabs" direction="vertical" :disabled="loading || submitting" v-model="currentAccountIndex">
                        <v-tab :value="-1">
                            <span>{{ tt('Main Account') }}</span>
                        </v-tab>
                        <template v-if="account.type === AccountType.MultiSubAccounts.type">
                            <v-tab :key="idx" :value="idx" v-for="(subAccount, idx) in subAccounts">
                                <span>{{ tt('Sub Account') + ' #' + (idx + 1) }}</span>
                                <v-btn class="ms-2" color="error" size="24" variant="text"
                                       :icon="mdiDeleteOutline"
                                       @click="removeSubAccount(subAccount)"></v-btn>
                            </v-tab>
                        </template>
                    </v-tabs>
                </aside>

                <v-window class="account-edit-dialog__content disable-tab-transition w-100-window-container"
                          v-model="activeTab">
                    <v-window-item value="account">
                        <v-form class="account-edit-dialog__form">
                            <v-row>
                                <v-col class="account-field" :data-field-label="tt('Account Category')" cols="12" md="12" v-if="account.type === AccountType.SingleAccount.type || currentAccountIndex < 0">
                                    <v-select
                                        item-title="displayName"
                                        item-value="type"
                                        persistent-placeholder
                                        :disabled="loading || submitting"
                                        :label="tt('Account Category')"
                                        :placeholder="tt('Account Category')"
                                        :items="allAccountCategories"
                                        :no-data-text="tt('No results')"
                                        v-model="selectedAccount.category"
                                    >
                                        <template #item="{ props, item }">
                                            <v-list-item :value="item.value" v-bind="props">
                                                <template #title>
                                                    <v-list-item-title>
                                                        <div class="d-flex align-center">
                                                            <ItemIcon icon-type="account"
                                                                      :icon-id="item.raw.defaultAccountIconId"
                                                                      v-if="item.raw" />
                                                            <span class="ms-2">{{ item.title }}</span>
                                                        </div>
                                                    </v-list-item-title>
                                                </template>
                                            </v-list-item>
                                        </template>
                                    </v-select>
                                </v-col>
                                <v-col class="account-field" :data-field-label="tt('Account Type')" cols="12" md="12" v-if="account.type === AccountType.SingleAccount.type || currentAccountIndex < 0">
                                    <v-select
                                        item-title="displayName"
                                        item-value="type"
                                        persistent-placeholder
                                        :disabled="loading || submitting || !!editAccountId"
                                        :label="tt('Account Type')"
                                        :placeholder="tt('Account Type')"
                                        :items="allAccountTypes"
                                        :no-data-text="tt('No results')"
                                        v-model="selectedAccount.type"
                                    />
                                </v-col>
                                <v-col class="account-field" :data-field-label="currentAccountIndex < 0 ? tt('Account Name') : tt('Sub-account Name')" cols="12" md="12">
                                    <v-text-field
                                        type="text"
                                        persistent-placeholder
                                        :disabled="loading || submitting"
                                        :label="currentAccountIndex < 0 ? tt('Account Name') : tt('Sub-account Name')"
                                        :placeholder="currentAccountIndex < 0 ? tt('Your account name') : tt('Your sub-account name')"
                                        v-model="selectedAccount.name"
                                    />
                                </v-col>
                                <v-col class="account-field" :data-field-label="currentAccountIndex < 0 ? tt('Account Icon') : tt('Sub-account Icon')" cols="12" md="6">
                                    <icon-select icon-type="account"
                                                 :all-icon-infos="ALL_ACCOUNT_ICONS"
                                                 :label="currentAccountIndex < 0 ? tt('Account Icon') : tt('Sub-account Icon')"
                                                 :color="selectedAccount.color"
                                                 :disabled="loading || submitting"
                                                 v-model="selectedAccount.icon" />
                                </v-col>
                                <v-col class="account-field" :data-field-label="currentAccountIndex < 0 ? tt('Account Color') : tt('Sub-account Color')" cols="12" md="6">
                                    <color-select :all-color-infos="ALL_ACCOUNT_COLORS"
                                                  :label="currentAccountIndex < 0 ? tt('Account Color') : tt('Sub-account Color')"
                                                  :disabled="loading || submitting"
                                                  v-model="selectedAccount.color" />
                                </v-col>
                                <v-col class="account-field" :data-field-label="tt('Currency')" cols="12" :md="currentAccountIndex < 0 && isAccountSupportCreditCardStatementDate ? 6 : 12" v-if="account.type === AccountType.SingleAccount.type || currentAccountIndex >= 0">
                                    <currency-select :disabled="loading || submitting || (!!editAccountId && !isNewAccount(selectedAccount))"
                                                     :label="tt('Currency')"
                                                     :placeholder="tt('Currency')"
                                                     v-model="selectedAccount.currency" />
                                </v-col>
                                <v-col class="account-field" :data-field-label="tt('Closing Date')" cols="12" :md="account.type === AccountType.SingleAccount.type || currentAccountIndex >= 0 ? 6 : 12" v-if="currentAccountIndex < 0 && isAccountSupportCreditCardStatementDate">
                                    <v-autocomplete
                                        item-title="displayName"
                                        item-value="type"
                                        auto-select-first
                                        persistent-placeholder
                                        :disabled="loading || submitting"
                                        :label="tt('Closing Date')"
                                        :placeholder="tt('Closing Date')"
                                        :items="allAvailableMonthDays"
                                        :no-data-text="tt('No results')"
                                        v-model="account.creditCardStatementDate"
                                    ></v-autocomplete>
                                </v-col>
                                <template v-if="currentAccountIndex < 0 && isAccountSupportCreditCardStatementDate">
                                    <v-col class="account-field" :data-field-label="tt('Due Date')" cols="12" md="6">
                                        <v-autocomplete
                                            item-title="displayName"
                                            item-value="type"
                                            auto-select-first
                                            persistent-placeholder
                                            :disabled="loading || submitting"
                                            :label="tt('Due Date')"
                                            :placeholder="tt('Due Date')"
                                            :items="allAvailableMonthDays"
                                            :no-data-text="tt('No results')"
                                            v-model="account.creditCardDueDate"
                                        />
                                    </v-col>
                                    <v-col class="account-field" :data-field-label="tt('Total Credit Limit')" cols="12" md="6">
                                        <amount-input :disabled="loading || submitting"
                                                      :persistent-placeholder="true"
                                                      :currency="account.currency"
                                                      :show-currency="true"
                                                      :label="tt('Total Credit Limit')"
                                                      :placeholder="tt('Total Credit Limit')"
                                                      v-model="account.creditCardLimit"/>
                                    </v-col>
                                </template>
                                <v-col class="account-field" :data-field-label="accountAmountTitle" cols="12" :md="((canShowBalanceTime && selectedAccount.numericBalance) || canShowLastReconciledTime) ? 6 : 12"
                                       v-if="account.type === AccountType.SingleAccount.type || currentAccountIndex >= 0">
                                    <amount-input :disabled="loading || submitting || (!!editAccountId && !isNewAccount(selectedAccount))"
                                                  :persistent-placeholder="true"
                                                  :currency="selectedAccount.currency"
                                                  :show-currency="true"
                                                  :flip-negative="account.isLiability"
                                                  :label="accountAmountTitle"
                                                  :placeholder="accountAmountTitle"
                                                  v-model="selectedAccount.numericBalance"/>
                                </v-col>
                                <v-col class="account-field" :data-field-label="tt('Balance Time')" cols="12" md="6" v-show="selectedAccount.numericBalance" v-if="canShowBalanceTime">
                                    <date-time-select
                                        :disabled="loading || submitting"
                                        :label="tt('Balance Time')"
                                        :timezone-utc-offset="getDefaultTimezoneOffsetMinutes(selectedAccount.balanceTime)"
                                        :model-value="selectedAccount.balanceTime"
                                        @update:model-value="updateAccountBalanceTime(selectedAccount, $event)"
                                        @error="onShowDateTimeError" />
                                </v-col>
                                <v-col class="account-field" :data-field-label="tt('Last Reconciled Time')" cols="12" md="6" v-if="canShowLastReconciledTime">
                                    <date-time-select
                                        :disabled="loading || submitting"
                                        :clearable="true"
                                        :label="tt('Last Reconciled Time')"
                                        :timezone-utc-offset="getDefaultTimezoneOffsetMinutes(selectedAccount.lastReconciledTime)"
                                        :model-value="selectedAccount.lastReconciledTime ?? getCurrentUnixTime()"
                                        :empty-value="!selectedAccount.lastReconciledTime"
                                        @update:model-value="updateAccountLastReconciledTime(selectedAccount, $event)"
                                        @clear:model-value="selectedAccount.lastReconciledTime = undefined"
                                        @error="onShowDateTimeError" />
                                </v-col>
                                <v-col class="account-field" :data-field-label="tt('Description')" cols="12" md="12">
                                    <v-textarea
                                        type="text"
                                        persistent-placeholder
                                        rows="3"
                                        :disabled="loading || submitting"
                                        :label="tt('Description')"
                                        :placeholder="currentAccountIndex < 0 ? tt('Your account description (optional)') : tt('Your sub-account description (optional)')"
                                        v-model="selectedAccount.comment"
                                    />
                                </v-col>
                                <v-col class="account-field account-toggle-field" :data-field-label="tt('Visible')" cols="12" md="12" v-if="editAccountId && !isNewAccount(selectedAccount)">
                                    <v-switch :disabled="loading || submitting"
                                              :label="tt('Visible')" v-model="selectedAccount.visible"/>
                                </v-col>
                            </v-row>
                        </v-form>
                    </v-window-item>
                </v-window>
            </v-card-text>
            <v-card-text class="account-edit-dialog__footer">
                <div class="account-edit-dialog__footer-actions">
                    <v-tooltip :disabled="!inputIsEmpty" :text="inputEmptyProblemMessage ? tt(inputEmptyProblemMessage) : ''">
                        <template v-slot:activator="{ props }">
                            <div v-bind="props" class="d-inline-block">
                                <v-btn color="primary" variant="flat" :disabled="inputIsEmpty || loading || submitting" @click="save">
                                    {{ tt(saveButtonTitle) }}
                                    <v-progress-circular indeterminate size="22" class="ms-2" v-if="submitting"></v-progress-circular>
                                </v-btn>
                            </div>
                        </template>
                    </v-tooltip>
                    <v-btn color="default" variant="outlined"
                           :disabled="loading || submitting" @click="cancel">{{ tt('Cancel') }}</v-btn>
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>

    <confirm-dialog ref="confirmDialog"/>
    <snack-bar ref="snackbar" />
</template>

<script setup lang="ts">
import ConfirmDialog from '@/components/desktop/ConfirmDialog.vue';
import SnackBar from '@/components/desktop/SnackBar.vue';

import { ref, computed, useTemplateRef, watch } from 'vue';

import { useI18n } from '@/locales/helpers.ts';
import { useAccountEditPageBase } from '@/views/base/accounts/AccountEditPageBase.ts';

import { useUserStore } from '@/stores/user.ts';
import { useAccountsStore } from '@/stores/account.ts';

import { itemAndIndex } from '@/core/base.ts';
import { AccountType } from '@/core/account.ts';
import { ALL_ACCOUNT_ICONS } from '@/consts/icon.ts';
import { ALL_ACCOUNT_COLORS } from '@/consts/color.ts';
import { Account } from '@/models/account.ts';

import { isNumber } from '@/lib/common.ts';
import { getCurrentUnixTime } from '@/lib/datetime.ts';
import { generateRandomUUID } from '@/lib/misc.ts';

import {
    mdiDotsVertical,
    mdiCreditCardPlusOutline,
    mdiDeleteOutline
} from '@mdi/js';

interface AccountEditResponse {
    message: string;
}

type ConfirmDialogType = InstanceType<typeof ConfirmDialog>;
type SnackBarType = InstanceType<typeof SnackBar>;

const { tt } = useI18n();
const {
    defaultAccountCategory,
    editAccountId,
    clientSessionId,
    loading,
    submitting,
    account,
    subAccounts,
    useLastReconciledTime,
    title,
    saveButtonTitle,
    inputEmptyProblemMessage,
    inputIsEmpty,
    allAccountCategories,
    allAccountTypes,
    allAvailableMonthDays,
    isAccountSupportCreditCardStatementDate,
    getCurrentUnixTimeForNewAccount,
    getDefaultTimezoneOffsetMinutes,
    updateAccountBalanceTime,
    updateAccountLastReconciledTime,
    isNewAccount,
    addSubAccount,
    setAccount
} = useAccountEditPageBase();

const userStore = useUserStore();
const accountsStore = useAccountsStore();

const confirmDialog = useTemplateRef<ConfirmDialogType>('confirmDialog');
const snackbar = useTemplateRef<SnackBarType>('snackbar');

const showState = ref<boolean>(false);
const activeTab = ref<string>('account');
const currentAccountIndex = ref<number>(-1);

const canShowBalanceTime = computed<boolean>(() => (!editAccountId.value || isNewAccount(selectedAccount.value)) && (account.value.type === AccountType.SingleAccount.type || currentAccountIndex.value >= 0));
const canShowLastReconciledTime = computed<boolean>(() => useLastReconciledTime.value && !!editAccountId.value && !isNewAccount(selectedAccount.value) && (account.value.type === AccountType.SingleAccount.type || currentAccountIndex.value >= 0));

const selectedAccount = computed<Account>(() => {
    if (currentAccountIndex.value < 0) {
        return account.value;
    }

    return subAccounts.value[currentAccountIndex.value] as Account;
});

const accountAmountTitle = computed<string>(() => {
    if (currentAccountIndex.value < 0) {
        return account.value.isLiability ? tt('Account Outstanding Balance') : tt('Account Balance');
    } else {
        return account.value.isLiability ? tt('Sub-account Outstanding Balance') : tt('Sub-account Balance');
    }
});

const isAccountModified = computed<boolean>(() => {
    if (!editAccountId.value) {
        return !account.value.equals(Account.createNewAccount(defaultAccountCategory, userStore.currentUserDefaultCurrency, account.value.balanceTime ?? getCurrentUnixTimeForNewAccount()));
    } else {
        return true;
    }
});

let resolveFunc: ((value: AccountEditResponse) => void) | null = null;
let rejectFunc: ((reason?: unknown) => void) | null = null;

function open(options?: { id?: string, currentAccount?: Account, category?: number }): Promise<AccountEditResponse> {
    showState.value = true;
    loading.value = true;
    submitting.value = false;

    const newAccount = Account.createNewAccount(defaultAccountCategory, userStore.currentUserDefaultCurrency, getCurrentUnixTimeForNewAccount());
    account.value.fillFrom(newAccount);
    subAccounts.value = [];
    currentAccountIndex.value = -1;
    clientSessionId.value = generateRandomUUID();

    if (options && options.id) {
        if (options.currentAccount) {
            setAccount(options.currentAccount);
        }

        editAccountId.value = options.id;
        accountsStore.getAccount({
            accountId: editAccountId.value
        }).then(response => {
            setAccount(response);
            loading.value = false;
        }).catch(error => {
            loading.value = false;
            showState.value = false;

            if (!error.processed) {
                if (rejectFunc) {
                    rejectFunc(error);
                }
            }
        });
    } else {
        if (options && isNumber(options.category)) {
            account.value.category = options.category;
            account.value.setSuitableIcon(1, options.category);
        }

        editAccountId.value = null;
        loading.value = false;
    }

    return new Promise<AccountEditResponse>((resolve, reject) => {
        resolveFunc = resolve;
        rejectFunc = reject;
    });
}

function save(): void {
    const problemMessage = inputEmptyProblemMessage.value;

    if (problemMessage) {
        snackbar.value?.showMessage(problemMessage);
        return;
    }

    submitting.value = true;

    accountsStore.saveAccount({
        account: account.value,
        subAccounts: subAccounts.value,
        isEdit: !!editAccountId.value,
        clientSessionId: clientSessionId.value
    }).then(() => {
        submitting.value = false;

        let message = 'You have saved this account';

        if (!editAccountId.value) {
            message = 'You have added a new account';
        }

        resolveFunc?.({ message });
        showState.value = false;
    }).catch(error => {
        submitting.value = false;

        if (!error.processed) {
            snackbar.value?.showError(error);
        }
    });
}

function removeSubAccount(currentSubAccount: Account): void {
    confirmDialog.value?.open('Are you sure you want to remove this sub-account?').then(() => {
        for (const [subAccount, index] of itemAndIndex(subAccounts.value)) {
            if (subAccount === currentSubAccount) {
                subAccounts.value.splice(index, 1);

                if (currentAccountIndex.value >= subAccounts.value.length) {
                    currentAccountIndex.value = subAccounts.value.length - 1;
                }
            }
        }
    });
}

function cancel(): void {
    rejectFunc?.();
    showState.value = false;
}

function onShowDateTimeError(error: string): void {
    snackbar.value?.showError(error);
}

watch(() => account.value.type, () => {
    if (subAccounts.value.length < 1) {
        addSubAccount();
    }
});

defineExpose({
    open
});
</script>

<style>
.account-edit-dialog .v-overlay__content {
    max-height: calc(100vh - 20px) !important;
}

.account-edit-dialog__card {
    display: flex;
    max-height: calc(100vh - 20px);
    flex-direction: column;
    overflow: hidden;
    border: 1px solid rgb(var(--v-theme-muted-border)) !important;
    border-radius: 10px !important;
    background: rgb(var(--v-theme-surface)) !important;
    box-shadow: none !important;
    font-family: "Lausanne", "Helvetica Neue", Arial, sans-serif;
}

.account-edit-dialog__card > .v-card-item {
    min-height: auto;
    padding: 0 !important;
}

.account-edit-dialog__card > .v-card-item .v-card-title {
    width: 100%;
    white-space: normal;
}

.account-edit-dialog__header {
    display: flex;
    width: 100%;
    min-width: 0;
    align-items: center;
    gap: 8px;
    padding: 16px 18px;
    border-bottom: 1px solid rgb(var(--v-theme-muted-border));
}

.account-edit-dialog__heading {
    display: flex;
    min-width: 0;
    align-items: center;
}

.account-edit-dialog__heading h4 {
    margin: 0;
    color: rgb(var(--v-theme-on-surface));
    font-size: clamp(1.25rem, 2vw, 1.65rem);
    font-weight: 500;
    letter-spacing: -0.04em;
    line-height: 1.05;
}

.account-edit-dialog__header > .v-btn {
    width: 34px !important;
    min-width: 34px !important;
    height: 34px !important;
    border-radius: 5px !important;
}

.account-edit-dialog__body {
    display: grid !important;
    grid-template-columns: 170px minmax(0, 1fr);
    min-height: 0;
    flex: 1 1 auto;
    padding: 0 !important;
    overflow: hidden !important;
    background: rgb(var(--v-theme-background));
}

.account-edit-dialog__body:not(:has(.account-edit-dialog__sidebar)) {
    grid-template-columns: minmax(0, 1fr);
}

.account-edit-dialog__sidebar {
    min-width: 0;
    padding: 12px 10px;
    overflow-y: auto;
    border-right: 1px solid rgb(var(--v-theme-muted-border));
    background: rgb(var(--v-theme-surface));
}

.account-edit-dialog__tabs .v-tab {
    width: 100%;
    min-height: 36px !important;
    justify-content: flex-start;
    padding-inline: 12px !important;
    border-radius: 5px !important;
    color: rgb(var(--v-theme-tertiary));
    font-size: 0.72rem;
    letter-spacing: 0;
    text-transform: none;
}

.account-edit-dialog__tabs .v-tab--selected {
    color: rgb(var(--v-theme-on-surface)) !important;
    background: rgb(var(--v-theme-verticalbutton-selected)) !important;
    font-weight: 600;
}

.account-edit-dialog__content {
    display: flex !important;
    min-width: 0;
    min-height: 0;
    overflow-y: auto;
}

.account-edit-dialog__form {
    width: 100%;
    padding: 16px 18px 20px;
}

.account-edit-dialog__form > .v-row {
    margin: -6px !important;
}

.account-edit-dialog__form > .v-row > .v-col {
    padding: 6px !important;
}

.account-field {
    position: relative;
    padding-top: 25px !important;
}

.account-field::before {
    position: absolute;
    top: 7px;
    right: 6px;
    left: 12px;
    overflow: hidden;
    color: rgb(var(--v-theme-tertiary));
    content: attr(data-field-label);
    font-size: 0.64rem;
    font-weight: 600;
    line-height: 1.1;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.account-field .v-field-label,
.account-field .v-label.v-field-label {
    display: none !important;
}

.account-field .v-field__outline__notch,
.account-field .v-field__outline__notch::before,
.account-field .v-field__outline__notch::after {
    border: 0 !important;
}

.account-edit-dialog__form .v-field {
    min-height: 42px !important;
    border: 1px solid rgb(var(--v-theme-border)) !important;
    border-radius: 6px !important;
    background: rgb(var(--v-theme-surface)) !important;
    box-shadow: none !important;
}

.account-edit-dialog__form .v-field:hover {
    border-color: rgb(var(--v-theme-on-hover-border)) !important;
}

.account-edit-dialog__form .v-field--focused {
    border-color: rgb(var(--v-theme-on-surface)) !important;
    box-shadow: 0 0 0 1px rgb(var(--v-theme-on-surface)) !important;
}

.account-edit-dialog__form .v-field__outline,
.account-edit-dialog__form .v-field__overlay {
    display: none !important;
}

.account-edit-dialog__form .v-field__input {
    min-height: 40px !important;
    padding-block: 0 !important;
    font-size: 0.78rem !important;
}

.account-edit-dialog__form .v-textarea .v-field,
.account-edit-dialog__form .v-textarea .v-field__input {
    min-height: 82px !important;
}

.account-edit-dialog__form .v-textarea .v-field__field {
    align-self: stretch;
}

.account-edit-dialog__form .v-textarea .v-field__input {
    padding-top: 11px !important;
    padding-bottom: 11px !important;
    line-height: 1.4 !important;
}

.account-toggle-field .v-switch {
    min-height: 42px;
    padding: 3px 10px;
    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 6px;
    background: rgb(var(--v-theme-surface));
}

.account-edit-dialog__footer {
    flex: 0 0 auto;
    padding: 16px 16px !important;
    border-top: 1px solid rgb(var(--v-theme-muted-border));
    background: rgb(var(--v-theme-surface));
}

.account-edit-dialog__footer-actions {
    display: flex;
    padding-top: 16px !important;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 8px;
}

.account-edit-dialog__footer .v-btn {
    min-height: 38px;
    border-radius: 6px !important;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0;
    text-transform: none;
}

@media (max-width: 900px) {
    .account-edit-dialog__card {
        max-height: calc(100vh - 12px);
        border-radius: 8px !important;
    }

    .account-edit-dialog__body {
        display: flex !important;
        flex-direction: column;
    }

    .account-edit-dialog__sidebar {
        flex: 0 0 auto;
        padding: 8px 10px;
        overflow-x: auto;
        overflow-y: hidden;
        border-right: 0;
        border-bottom: 1px solid rgb(var(--v-theme-muted-border));
    }

    .account-edit-dialog__tabs .v-slide-group__content {
        flex-direction: row !important;
    }

    .account-edit-dialog__tabs .v-tab {
        width: auto;
        min-width: max-content;
    }
}

@media (max-width: 600px) {
    .account-edit-dialog .v-overlay__content {
        width: calc(100vw - 8px) !important;
        max-width: calc(100vw - 8px) !important;
        max-height: calc(100vh - 8px) !important;
        margin: 4px !important;
    }

    .account-edit-dialog__card {
        max-height: calc(100vh - 8px);
        border-radius: 6px !important;
    }

    .account-edit-dialog__header {
        padding: 13px 14px;
    }

    .account-edit-dialog__form {
        padding: 12px 10px 16px;
    }

    .account-edit-dialog__footer {
        padding: 10px 12px !important;
    }

    .account-edit-dialog__footer-actions .v-btn,
    .account-edit-dialog__footer-actions > div {
        flex: 1 1 auto;
    }
}
</style>
