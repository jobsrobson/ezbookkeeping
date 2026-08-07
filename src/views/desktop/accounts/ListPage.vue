<template>
    <v-row class="accounts-page match-height">
        <v-col class="accounts-page__column" cols="12">
            <v-card class="accounts-shell" variant="flat">
                <v-layout class="accounts-layout">
                    <v-navigation-drawer class="accounts-sidebar" :permanent="alwaysShowNav" v-model="showNav">
                        <div class="accounts-sidebar__summary">
                            <div class="accounts-sidebar__net-worth">
                                <span class="accounts-sidebar__metric-label">{{ tt('Net assets') }}</span>
                                <strong class="accounts-sidebar__net-worth-value text-income text-truncate">
                                    <span v-if="!loading || allAccountCount > 0">{{ netAssets }}</span>
                                    <v-skeleton-loader class="skeleton-no-margin" width="120" type="text" :loading="true"
                                                       v-else-if="loading && allAccountCount <= 0" />
                                </strong>
                            </div>

                            <div class="accounts-sidebar__breakdown">
                                <div class="accounts-sidebar__metric">
                                    <span class="accounts-sidebar__metric-label">{{ tt('Total assets') }}</span>
                                    <strong class="accounts-sidebar__metric-value text-truncate">
                                        <span v-if="!loading || allAccountCount > 0">{{ totalAssets }}</span>
                                        <v-skeleton-loader class="skeleton-no-margin" width="100" type="text" :loading="true"
                                                           v-else-if="loading && allAccountCount <= 0" />
                                    </strong>
                                </div>

                                <div class="accounts-sidebar__metric">
                                    <span class="accounts-sidebar__metric-label">{{ tt('Total liabilities') }}</span>
                                    <strong class="accounts-sidebar__metric-value text-expense text-truncate">
                                        <span v-if="!loading || allAccountCount > 0">{{ totalLiabilities }}</span>
                                        <v-skeleton-loader class="skeleton-no-margin" width="100" type="text" :loading="true"
                                                           v-else-if="loading && allAccountCount <= 0" />
                                    </strong>
                                </div>
                            </div>
                        </div>
                        <v-divider class="accounts-sidebar__divider" />
                        <v-tabs show-arrows class="account-category-tabs accounts-sidebar__tabs" direction="vertical"
                                :disabled="loading" v-model="activeAccountCategoryType">
                            <v-tab class="tab-text-truncate" :key="accountCategory.type" :value="accountCategory.type"
                                   v-for="accountCategory in AccountCategory.values(customAccountCategoryOrder)"
                                   v-show="!hideAccountCategoriesWithoutAccounts || (allCategorizedAccountsMap[accountCategory.type] && allCategorizedAccountsMap[accountCategory.type]!.accounts.length > 0)">
                                <ItemIcon icon-type="account" :icon-id="accountCategory.defaultAccountIconId" />
                                <div class="d-flex flex-column text-truncate ms-2">
                                    <small class="text-truncate text-start smaller" v-if="!loading || allAccountCount > 0">{{ accountCategoryTotalBalance(accountCategory) }}</small>
                                    <small class="text-truncate text-start smaller my-1" v-else-if="loading && allAccountCount <= 0">
                                        <v-skeleton-loader class="skeleton-no-margin"
                                                           width="100px" height="16" type="text" :loading="true"></v-skeleton-loader>
                                    </small>
                                    <span class="text-truncate text-start">{{ tt(accountCategory.name) }}</span>
                                </div>
                            </v-tab>
                        </v-tabs>
                    </v-navigation-drawer>
                    <v-main class="accounts-main">
                        <v-window class="d-flex flex-grow-1 disable-tab-transition w-100-window-container" v-model="activeTab">
                            <v-window-item value="accountPage">
                                <v-card class="accounts-content-card" variant="flat" min-height="780">
                                    <template #title>
                                        <div class="accounts-page-header">
                                            <div class="accounts-page-header__top">
                                                <div class="accounts-page-header__identity">
                                                    <v-btn class="d-md-none accounts-sidebar-trigger" density="compact" color="default" variant="plain"
                                                           :ripple="false" :icon="true" @click="showNav = !showNav">
                                                        <v-icon :icon="mdiMenu" size="22" />
                                                    </v-btn>
                                                    <div class="accounts-page-header__titles">
                                                        <h1>{{ tt('Account List') }}</h1>
                                                        <span>{{ filteredAccountCount }} {{ tt('Accounts') }}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="accounts-page-toolbar">
                                                <div class="accounts-search accounts-search--desktop">
                                                    <v-text-field density="compact" variant="outlined" hide-details clearable
                                                                  :disabled="loading" :prepend-inner-icon="mdiMagnify"
                                                                  :placeholder="tt('Search accounts')" v-model="searchKeyword" />
                                                </div>

                                                <div class="accounts-page-header__actions">
                                                    <v-menu v-model="showCompactSearch" location="bottom start"
                                                            :close-on-content-click="false" width="320"
                                                            max-width="calc(100vw - 24px)">
                                                        <template #activator="{ props }">
                                                            <v-btn class="accounts-search-trigger" density="comfortable" color="default"
                                                                   variant="text" :icon="true" v-bind="props">
                                                                <v-icon :icon="mdiMagnify" size="21" />
                                                                <v-tooltip activator="parent">{{ tt('Search') }}</v-tooltip>
                                                            </v-btn>
                                                        </template>
                                                        <v-card class="accounts-search-popover" elevation="0">
                                                            <v-card-text>
                                                                <v-text-field autofocus density="comfortable" variant="outlined"
                                                                              hide-details clearable :disabled="loading"
                                                                              :prepend-inner-icon="mdiMagnify"
                                                                              :placeholder="tt('Search accounts')"
                                                                              v-model="searchKeyword" />
                                                            </v-card-text>
                                                        </v-card>
                                                    </v-menu>
                                                    <v-btn class="accounts-add-button" color="primary" variant="flat"
                                                           :disabled="loading" @click="add">{{ tt('Add') }}</v-btn>
                                                    <v-btn class="accounts-save-order-button" color="default" variant="outlined"
                                                           :disabled="loading" @click="saveSortResult"
                                                           v-if="displayOrderModified">{{ tt('Save Display Order') }}</v-btn>
                                                    <v-btn density="comfortable" color="default" variant="text"
                                                           :icon="true" :loading="loading" :disabled="loading" @click="reload(true)">
                                                        <template #loader>
                                                            <v-progress-circular indeterminate size="19"/>
                                                        </template>
                                                        <v-icon :icon="mdiRefresh" size="21" />
                                                        <v-tooltip activator="parent">{{ tt('Refresh') }}</v-tooltip>
                                                    </v-btn>
                                                    <v-btn density="comfortable" color="default" variant="text"
                                                       :disabled="loading" :icon="true">
                                                        <v-icon :icon="mdiDotsVertical" />
                                                        <v-menu activator="parent">
                                                            <v-list>
                                                                <v-list-item :prepend-icon="mdiEyeOutline" :title="tt('Show Hidden Accounts')"
                                                                             v-if="!showHidden" @click="showHidden = true" />
                                                                <v-list-item :prepend-icon="mdiEyeOffOutline" :title="tt('Hide Hidden Accounts')"
                                                                             v-if="showHidden" @click="showHidden = false" />
                                                                <v-divider class="my-2" v-if="hasAnyVisibleAccount"/>
                                                                <v-list-item :prepend-icon="mdiCalculatorVariantOutline"
                                                                             :title="tt('Set Accounts Included in Total')"
                                                                             v-if="hasAnyVisibleAccount" @click="showAccountsIncludedInTotalDialog = true" />
                                                            </v-list>
                                                        </v-menu>
                                                    </v-btn>
                                                </div>
                                            </div>
                                        </div>
                                    </template>

                                    <v-card-text class="accounts-balance-panel">
                                        <div class="accounts-balance-box">
                                            <div class="accounts-balance-box__copy">
                                                <span class="accounts-balance-box__eyebrow">{{ activeAccountCategory ? tt(activeAccountCategory.name) : tt('Accounts') }}</span>
                                                <span class="accounts-overview-subtitle">{{ activeAccountCategory?.isLiability ? tt('Outstanding Balance') : tt('Balance') }}</span>
                                            </div>

                                            <div class="accounts-balance-box__value">
                                                <v-skeleton-loader class="skeleton-no-margin" width="140px" type="text" :loading="true"
                                                                   v-if="loading && activeAccountCategory && !hasAccount(activeAccountCategory)" />
                                                <span class="accounts-overview-amount"
                                                      v-else-if="!loading || !activeAccountCategory || hasAccount(activeAccountCategory)">
                                                    {{ activeAccountCategoryTotalBalance }}
                                                </span>
                                                <v-btn class="accounts-balance-box__visibility" density="compact" color="default" variant="text"
                                                       :icon="true" :disabled="loading"
                                                       @click="showAccountBalance = !showAccountBalance">
                                                    <v-icon :icon="showAccountBalance ? mdiEyeOffOutline : mdiEyeOutline" size="19" />
                                                    <v-tooltip activator="parent">{{ showAccountBalance ? tt('Hide Account Balance') : tt('Show Account Balance') }}</v-tooltip>
                                                </v-btn>
                                            </div>
                                        </div>
                                    </v-card-text>

                                    <v-row class="ps-6 pe-6 pe-md-8" v-if="loading && activeAccountCategory && !hasAccount(activeAccountCategory)">
                                        <v-col cols="12">
                                            <v-card border rounded="lg" class="account-card mb-8 h-auto">
                                                <template #title>
                                                    <div class="account-title d-flex align-center">
                                                        <v-icon class="disabled me-0" size="28px" :icon="mdiSquareRounded" />
                                                        <span class="account-name text-truncate ms-2">
                                                            <v-skeleton-loader class="skeleton-no-margin my-1"
                                                                               width="120px" type="text" :loading="true"></v-skeleton-loader>
                                                        </span>
                                                        <v-spacer/>
                                                        <span class="align-self-center">
                                                            <v-icon class="disabled" :icon="mdiDrag"/>
                                                        </span>
                                                    </div>
                                                </template>
                                                <v-divider/>
                                                <v-card-text>
                                                    <div class="d-flex account-toolbar align-center">
                                                        <v-btn class="px-2" density="comfortable" color="default" variant="text"
                                                               :disabled="true" :prepend-icon="mdiListBoxOutline">
                                                            {{ tt('Transaction List') }}
                                                        </v-btn>
                                                        <v-spacer/>
                                                        <span class="account-balance ms-2">
                                                            <v-skeleton-loader class="skeleton-no-margin"
                                                                               width="100px" type="text" :loading="true"></v-skeleton-loader>
                                                        </span>
                                                    </div>
                                                </v-card-text>
                                            </v-card>
                                        </v-col>
                                    </v-row>

                                    <v-row class="accounts-empty-panel" v-if="!loading && activeAccountCategory && !hasAccount(activeAccountCategory)">
                                        <v-col class="accounts-empty-panel__column" cols="12">
                                            {{ tt('No available account') }}
                                        </v-col>
                                    </v-row>

                                    <v-row class="accounts-list-panel">
                                        <v-col class="accounts-list-panel__column" cols="12">
                                            <draggable-list
                                                class="list-group accounts-list"
                                                item-key="id"
                                                handle=".drag-handle"
                                                ghost-class="dragging-item"
                                                :disabled="activeAccountCategoryVisibleAccountCount <= 1"
                                                :list="allCategorizedAccountsMap[activeAccountCategory.type]!.accounts"
                                                v-if="activeAccountCategory && allCategorizedAccountsMap[activeAccountCategory.type] && allCategorizedAccountsMap[activeAccountCategory.type]!.accounts && allCategorizedAccountsMap[activeAccountCategory.type]!.accounts.length"
                                                @change="onMove"
                                            >
                                                <template #item="{ element }">
                                                    <div class="list-group-item" v-show="accountMatchesSearch(element)">
                                                        <v-card border rounded="lg" class="account-card h-auto" v-if="showHidden || !element.hidden">
                                                            <template #title>
                                                                <div class="account-card__header">
                                                                    <div class="account-card__identity">
                                                                        <span class="account-card__icon">
                                                                            <ItemIcon size="1.5rem" icon-type="account" :icon-id="element.icon"
                                                                                      :color="element.color" :hidden-status="element.hidden" />
                                                                        </span>
                                                                        <div class="account-card__name-group">
                                                                            <span class="account-name text-truncate">{{ element.name }}</span>
                                                                            <small class="account-currency text-truncate">{{ accountCurrency(element) }}</small>
                                                                        </div>
                                                                    </div>
                                                                    <div class="account-card__balance">
                                                                        <small>{{ activeAccountCategory?.isLiability ? tt('Outstanding Balance') : tt('Balance') }}</small>
                                                                        <strong>{{ accountBalance(element, activeSubAccount[element.id]) }}</strong>
                                                                    </div>
                                                                    <span class="account-card__drag">
                                                                        <v-icon :class="!loading && activeAccountCategoryVisibleAccountCount > 1 ? 'drag-handle' : 'disabled'"
                                                                                :icon="mdiDrag" size="20"/>
                                                                        <v-tooltip activator="parent" v-if="!loading && activeAccountCategoryVisibleAccountCount > 1">{{ tt('Drag to Reorder') }}</v-tooltip>
                                                                    </span>
                                                                </div>

                                                                <div class="account-card__subaccounts" v-if="element.type === AccountType.MultiSubAccounts.type">
                                                                    <v-btn-toggle
                                                                        class="account-subaccounts"
                                                                        variant="outlined"
                                                                        color="primary"
                                                                        density="compact"
                                                                        mandatory="force"
                                                                        divided rounded="xl"
                                                                        :disabled="loading"
                                                                        v-model="activeSubAccount[element.id]"
                                                                    >
                                                                        <v-btn :value="''">
                                                                            <span>{{ tt('All') }}</span>
                                                                        </v-btn>
                                                                        <v-btn :key="subAccount.id" :value="subAccount.id"
                                                                               v-for="subAccount in element.subAccounts"
                                                                               v-show="showHidden || !subAccount.hidden">
                                                                            <ItemIcon size="1.5rem" icon-type="account" :icon-id="subAccount.icon"
                                                                                      :color="subAccount.color" :hidden-status="subAccount.hidden" />
                                                                            <span class="ms-2">{{ subAccount.name }}</span>
                                                                        </v-btn>
                                                                    </v-btn-toggle>
                                                                </div>
                                                            </template>

                                                            <v-card-text class="account-card__comment" v-if="element.getAccountOrSubAccountComment(activeSubAccount[element.id])">
                                                                <span>{{ element.getAccountOrSubAccountComment(activeSubAccount[element.id]) }}</span>
                                                            </v-card-text>

                                                            <v-card-actions class="account-card__actions">
                                                                <div class="account-card__primary-actions">
                                                                    <v-btn density="comfortable" color="default" variant="outlined"
                                                                           :disabled="loading" :prepend-icon="mdiListBoxOutline"
                                                                           :to="`/transaction/list?accountIds=${element.getAccountOrSubAccountId(activeSubAccount[element.id])}`">
                                                                        {{ tt('Transaction List') }}
                                                                    </v-btn>
                                                                    <v-btn density="comfortable" color="default" variant="outlined"
                                                                           :disabled="loading" :prepend-icon="mdiCreditCardClockOutline"
                                                                           :to="`/account/invoices?accountId=${element.getAccountOrSubAccountId(activeSubAccount[element.id])}`"
                                                                           v-if="element.category === AccountCategory.CreditCard.type && element.creditCardStatementDate">
                                                                        {{ tt('Invoices') }}
                                                                    </v-btn>
                                                                </div>

                                                                <v-menu location="bottom end">
                                                                    <template #activator="{ props }">
                                                                        <v-btn class="account-card__menu-button" density="comfortable" color="default"
                                                                               variant="text" :icon="mdiDotsVertical" :disabled="loading" v-bind="props" />
                                                                    </template>
                                                                    <v-list class="account-card__menu" density="compact">
                                                                        <v-menu location="start" :open-on-hover="true"
                                                                                v-if="element.type === AccountType.SingleAccount.type || element.getSubAccount(activeSubAccount[element.id])">
                                                                            <template #activator="{ props }">
                                                                                <v-list-item :prepend-icon="mdiInvoiceListOutline" :title="tt('Reconciliation Statement')" v-bind="props" />
                                                                            </template>
                                                                            <v-list density="compact">
                                                                                <v-list-item :key="dateRange.type" :title="dateRange.displayName"
                                                                                             v-for="dateRange in accountReconciliationStatementDateRanges(element.getAccountOrSubAccount(activeSubAccount[element.id]))"
                                                                                             @click="showReconciliationStatementDialog(element.getAccountOrSubAccount(activeSubAccount[element.id]), dateRange.type)" />
                                                                            </v-list>
                                                                        </v-menu>
                                                                        <v-list-item :prepend-icon="element.isAccountOrSubAccountHidden(activeSubAccount[element.id]) ? mdiEyeOutline : mdiEyeOffOutline"
                                                                                     :title="element.isAccountOrSubAccountHidden(activeSubAccount[element.id]) ? tt('Show') : tt('Hide')"
                                                                                     v-if="!activeSubAccount[element.id] || element.getSubAccount(activeSubAccount[element.id])"
                                                                                     @click="hide(element, element.getAccountOrSubAccount(activeSubAccount[element.id]), !element.isAccountOrSubAccountHidden(activeSubAccount[element.id]))" />
                                                                        <v-list-item :prepend-icon="mdiPencilOutline" :title="tt('Edit')"
                                                                                     v-if="!activeSubAccount[element.id] || element.getSubAccount(activeSubAccount[element.id])"
                                                                                     @click="edit(element)" />
                                                                        <v-divider class="my-2" />
                                                                        <v-list-item :prepend-icon="mdiReceiptTextCheckOutline" :title="tt('Mark as Reconciled')"
                                                                                     v-if="useLastReconciledTime && (element.type === AccountType.SingleAccount.type || element.getSubAccount(activeSubAccount[element.id]))"
                                                                                     @click="updateLastReconciledTime(element.getAccountOrSubAccount(activeSubAccount[element.id]))" />
                                                                        <v-list-item :prepend-icon="mdiSwapHorizontal" :title="tt('Move All Transactions')"
                                                                                     v-if="element.type === AccountType.SingleAccount.type || element.getSubAccount(activeSubAccount[element.id])"
                                                                                     @click="moveAllTransactions(element.getAccountOrSubAccount(activeSubAccount[element.id]))" />
                                                                        <v-list-item :prepend-icon="mdiEraser" :title="tt('Clear All Transactions')"
                                                                                     v-if="element.type === AccountType.SingleAccount.type || element.getSubAccount(activeSubAccount[element.id])"
                                                                                     @click="clearAllTransactions(element.getAccountOrSubAccount(activeSubAccount[element.id]))" />
                                                                        <v-divider class="my-2" />
                                                                        <v-list-item class="account-card__delete-action" :prepend-icon="mdiDeleteOutline" :title="tt('Delete')"
                                                                                     v-if="!activeSubAccount[element.id] || element.getSubAccount(activeSubAccount[element.id])"
                                                                                     @click="remove(element)" />
                                                                    </v-list>
                                                                </v-menu>
                                                            </v-card-actions>
                                                        </v-card>
                                                    </div>
                                                </template>
                                            </draggable-list>
                                            <div class="accounts-search-empty" v-if="searchKeyword && filteredAccountCount < 1">
                                                <v-icon :icon="mdiMagnify" size="24" />
                                                <span>{{ tt('No available account') }}</span>
                                            </div>
                                        </v-col>
                                    </v-row>
                                </v-card>
                            </v-window-item>
                        </v-window>
                    </v-main>
                </v-layout>
            </v-card>
        </v-col>
    </v-row>

    <v-dialog width="800" v-model="showAccountsIncludedInTotalDialog">
        <account-filter-settings-card type="accountListTotalAmount" :dialog-mode="true"
                                      @settings:change="showAccountsIncludedInTotalDialog = false" />
    </v-dialog>

    <edit-dialog ref="editDialog" />
    <reconciliation-statement-dialog ref="reconciliationStatementDialog"
                                     @error="onShowDateRangeError" />
    <move-all-transactions-dialog ref="moveAllTransactionsDialog" />
    <clear-all-transactions-dialog ref="clearAllTransactionsDialog" />

    <date-range-selection-dialog :title="tt('Custom Date Range')"
                                 v-model:show="showCustomDateRangeDialog"
                                 @dateRange:change="onCustomDateRangeChanged"
                                 @error="onShowDateRangeError" />

    <confirm-dialog ref="confirmDialog"/>
    <snack-bar ref="snackbar" />
</template>

<script setup lang="ts">
import ConfirmDialog from '@/components/desktop/ConfirmDialog.vue';
import SnackBar from '@/components/desktop/SnackBar.vue';
import EditDialog from './list/dialogs/EditDialog.vue';
import ReconciliationStatementDialog from './list/dialogs/ReconciliationStatementDialog.vue';
import MoveAllTransactionsDialog from '@/views/desktop/accounts/list/dialogs/MoveAllTransactionsDialog.vue';
import ClearAllTransactionsDialog from '@/views/desktop/accounts/list/dialogs/ClearAllTransactionsDialog.vue';
import AccountFilterSettingsCard from '@/views/desktop/common/cards/AccountFilterSettingsCard.vue';

import { ref, computed, useTemplateRef, watch } from 'vue';
import { useDisplay } from 'vuetify';

import { useI18n } from '@/locales/helpers.ts';
import { useAccountListPageBase } from '@/views/base/accounts/AccountListPageBase.ts';

import { useSettingsStore } from '@/stores/setting.ts';
import { useUserStore } from '@/stores/user.ts';
import { useAccountsStore } from '@/stores/account.ts';

import { DateRange, DateRangeScene, type LocalizedDateRange, type TimeRangeAndDateType } from '@/core/datetime.ts';
import { AccountType, AccountCategory } from '@/core/account.ts';
import { DEFAULT_RECONCILIATION_STATEMENT_DATE_RANGE_IN_DESKTOP } from '@/core/statistics.ts';
import type { Account } from '@/models/account.ts';

import { isNumber } from '@/lib/common.ts';
import {
    getCurrentUnixTime,
    getDateRangeByDateType,
    getDateRangeByBillingCycleDateType,
    getDateRangeByLastReconciledTimeRangeDateType
} from '@/lib/datetime.ts';

import {
    mdiEyeOutline,
    mdiEyeOffOutline,
    mdiCalculatorVariantOutline,
    mdiRefresh,
    mdiSquareRounded,
    mdiMenu,
    mdiMagnify,
    mdiPencilOutline,
    mdiReceiptTextCheckOutline,
    mdiSwapHorizontal,
    mdiEraser,
    mdiDeleteOutline,
    mdiListBoxOutline,
    mdiInvoiceListOutline,
    mdiCreditCardClockOutline,
    mdiDrag,
    mdiDotsVertical
} from '@mdi/js';

type ConfirmDialogType = InstanceType<typeof ConfirmDialog>;
type SnackBarType = InstanceType<typeof SnackBar>;
type EditDialogType = InstanceType<typeof EditDialog>;
type ReconciliationStatementDialogType = InstanceType<typeof ReconciliationStatementDialog>;
type MoveAllTransactionsDialogType = InstanceType<typeof MoveAllTransactionsDialog>;
type ClearAllTransactionsDialogType = InstanceType<typeof ClearAllTransactionsDialog>;

const display = useDisplay();

const { tt, getAllDateRanges, getCurrencyName, joinMultiText } = useI18n();

const {
    loading,
    showHidden,
    displayOrderModified,
    showAccountBalance,
    customAccountCategoryOrder,
    defaultAccountCategory,
    firstDayOfWeek,
    fiscalYearStart,
    useLastReconciledTime,
    allAccounts,
    allCategorizedAccountsMap,
    allAccountCount,
    netAssets,
    totalAssets,
    totalLiabilities,
    accountCategoryTotalBalance,
    accountBalance
} = useAccountListPageBase();

const settingsStore = useSettingsStore();
const userStore = useUserStore();
const accountsStore = useAccountsStore();

const confirmDialog = useTemplateRef<ConfirmDialogType>('confirmDialog');
const snackbar = useTemplateRef<SnackBarType>('snackbar');
const editDialog = useTemplateRef<EditDialogType>('editDialog');
const reconciliationStatementDialog = useTemplateRef<ReconciliationStatementDialogType>('reconciliationStatementDialog');
const moveAllTransactionsDialog = useTemplateRef<MoveAllTransactionsDialogType>('moveAllTransactionsDialog');
const clearAllTransactionsDialog = useTemplateRef<ClearAllTransactionsDialogType>('clearAllTransactionsDialog');

const activeAccountCategoryType = ref<number>(defaultAccountCategory.value.type);
const activeTab = ref<string>('accountPage');
const activeSubAccount = ref<Record<string, string>>({});
const searchKeyword = ref<string | null>('');
const showCompactSearch = ref<boolean>(false);
const accountToShowReconciliationStatement = ref<Account | null>(null);
const alwaysShowNav = ref<boolean>(display.mdAndUp.value);
const showNav = ref<boolean>(display.mdAndUp.value);
const showAccountsIncludedInTotalDialog = ref<boolean>(false);
const showCustomDateRangeDialog = ref<boolean>(false);

const hideAccountCategoriesWithoutAccounts = computed<boolean>(() => settingsStore.appSettings.hideCategoriesWithoutAccounts);
const hasAnyVisibleAccount = computed<boolean>(() => accountsStore.allVisibleAccountsCount > 0);
const activeAccountCategory = computed<AccountCategory | undefined>(() => AccountCategory.valueOf(activeAccountCategoryType.value));
const activeAccountCategoryTotalBalance = computed<string>(() => accountCategoryTotalBalance(activeAccountCategory.value));
const filteredAccountCount = computed<number>(() => {
    if (!activeAccountCategory.value) {
        return 0;
    }

    const accounts = allCategorizedAccountsMap.value[activeAccountCategory.value.type]?.accounts || [];
    return accounts.filter(account => (showHidden.value || !account.hidden) && accountMatchesSearch(account)).length;
});

const activeAccountCategoryVisibleAccountCount = computed<number>(() => {
    if (!activeAccountCategory.value) {
        return 0;
    }

    const categorizedAccounts = allCategorizedAccountsMap.value[activeAccountCategory.value.type];

    if (!categorizedAccounts || !categorizedAccounts.accounts || !categorizedAccounts.accounts.length) {
        return 0;
    }

    if (showHidden.value) {
        return categorizedAccounts.accounts.length;
    }

    let visibleCount = 0;

    for (const account of categorizedAccounts.accounts) {
        if (!account.hidden) {
            visibleCount++;
        }
    }

    return visibleCount;
});

function reload(force: boolean): void {
    loading.value = true;

    accountsStore.loadAllAccounts({
        force: force
    }).then(() => {
        loading.value = false;
        displayOrderModified.value = false;

        if (allAccounts.value) {
            for (const account of allAccounts.value) {
                if (account.type === AccountType.MultiSubAccounts.type && !activeSubAccount.value[account.id]) {
                    activeSubAccount.value[account.id] = '';
                }
            }
        }

        if (force) {
            snackbar.value?.showMessage('Account list has been updated');
        }
    }).catch(error => {
        loading.value = false;

        if (error && error.isUpToDate) {
            displayOrderModified.value = false;
        }

        if (!error.processed) {
            snackbar.value?.showError(error);
        }
    });
}

function hasAccount(accountCategory: AccountCategory): boolean {
    return accountsStore.hasAccount(accountCategory, !showHidden.value);
}

function accountCurrency(account: Account): string | null {
    if (account.type === AccountType.SingleAccount.type) {
        return getCurrencyName(account.currency);
    } else if (account.type === AccountType.MultiSubAccounts.type) {
        const subAccountCurrencies = account.getSubAccountCurrencies(showHidden.value, activeSubAccount.value[account.id])
            .map(currencyCode => getCurrencyName(currencyCode));
        return joinMultiText(subAccountCurrencies);
    } else {
        return null;
    }
}

function accountMatchesSearch(account: Account): boolean {
    const keyword = (searchKeyword.value || '').trim().toLocaleLowerCase();

    if (!keyword) {
        return true;
    }

    const searchableValues = [account.name, account.currency, accountCurrency(account)];

    if (account.subAccounts) {
        for (const subAccount of account.subAccounts) {
            searchableValues.push(subAccount.name, subAccount.currency);
        }
    }

    return searchableValues.some(value => value?.toLocaleLowerCase().includes(keyword));
}

function accountReconciliationStatementDateRanges(account: Account): LocalizedDateRange[] {
    return getAllDateRanges(DateRangeScene.Normal, {
        includeCustom: true,
        includeBillingCycle: !!accountsStore.getAccountStatementDate(account.id),
        includeLastReconciledTimeRange: userStore.currentUserUseLastReconciledTime && !!account.lastReconciledTime
    });
}

function add(): void {
    editDialog.value?.open({
        category: activeAccountCategoryType.value
    }).then(result => {
        if (result && result.message) {
            snackbar.value?.showMessage(result.message);
        }
    }).catch(error => {
        if (error) {
            snackbar.value?.showError(error);
        }
    });
}

function edit(account: Account): void {
    editDialog.value?.open({
        id: account.id,
        currentAccount: account
    }).then(result => {
        if (result && result.message) {
            snackbar.value?.showMessage(result.message);
        }

        if (accountsStore.accountListStateInvalid && !loading.value) {
            reload(false);
        }
    }).catch(error => {
        if (error) {
            snackbar.value?.showError(error);
        }
    });
}

function showReconciliationStatementDialog(account: Account, dateRangeType?: number): void {
    if (!isNumber(dateRangeType)) {
        const defualtDateRange = DateRange.valueOf(settingsStore.appSettings.reconciliationStatementButtonDefaultDateRangeTypeInDesktop);

        if (!defualtDateRange) {
            dateRangeType = DEFAULT_RECONCILIATION_STATEMENT_DATE_RANGE_IN_DESKTOP.type;
        } else if (defualtDateRange.isBillingCycle && !accountsStore.getAccountStatementDate(account.id)) {
            dateRangeType = DEFAULT_RECONCILIATION_STATEMENT_DATE_RANGE_IN_DESKTOP.type;
        } else if (defualtDateRange.isLastReconciledTimeRange && (!userStore.currentUserUseLastReconciledTime || !account.lastReconciledTime)) {
            dateRangeType = DEFAULT_RECONCILIATION_STATEMENT_DATE_RANGE_IN_DESKTOP.type;
        } else {
            dateRangeType = defualtDateRange.type;
        }
    }

    if (!isNumber(dateRangeType) || dateRangeType === DateRange.Custom.type) {
        accountToShowReconciliationStatement.value = account;
        showCustomDateRangeDialog.value = true;
        return;
    }

    let dateRange: TimeRangeAndDateType | null = null;

    if (DateRange.isBillingCycle(dateRangeType)) {
        dateRange = getDateRangeByBillingCycleDateType(dateRangeType, firstDayOfWeek.value, fiscalYearStart.value, accountsStore.getAccountStatementDate(account.id));
    } else if (DateRange.isLastReconciledTimeRange(dateRangeType)) {
        dateRange = getDateRangeByLastReconciledTimeRangeDateType(dateRangeType, account.lastReconciledTime);
    } else {
        dateRange = getDateRangeByDateType(dateRangeType, firstDayOfWeek.value, fiscalYearStart.value);
    }

    if (!dateRange) {
        return;
    }

    reconciliationStatementDialog.value?.open({
        accountId: account.id,
        startTime: dateRange.minTime,
        endTime: dateRange.maxTime
    });
}

function updateLastReconciledTime(account: Account): void {
    confirmDialog.value?.open('Are you sure you want to update the last reconciled time of this account to the current time?').then(() => {
        loading.value = true;

        accountsStore.updateAccountLastReconciledTime(account.id, getCurrentUnixTime()).then(() => {
            loading.value = false;
            snackbar.value?.showMessage('Last reconciled time have been updated');

            if (accountsStore.accountListStateInvalid && !loading.value) {
                reload(false);
            }

        }).catch(error => {
            loading.value = false;

            if (error) {
                snackbar.value?.showError(error);
            }
        });
    });
}

function moveAllTransactions(account: Account): void {
    moveAllTransactionsDialog.value?.open(account).then(() => {
        snackbar.value?.showMessage('All transactions in this account have been moved.');

        if (accountsStore.accountListStateInvalid && !loading.value) {
            reload(false);
        }
    });
}

function clearAllTransactions(account: Account): void {
    clearAllTransactionsDialog.value?.open(account).then(() => {
        snackbar.value?.showMessage('All transactions in this account have been cleared');

        if (accountsStore.accountListStateInvalid && !loading.value) {
            reload(false);
        }
    });
}

function hide(account: Account, targetAccount: Account, hidden: boolean): void {
    loading.value = true;

    accountsStore.hideAccount({
        account: targetAccount,
        hidden: hidden
    }).then(() => {
        if (hidden && !showHidden.value && activeSubAccount.value[account.id]) {
            activeSubAccount.value[account.id] = '';
        }

        loading.value = false;
    }).catch(error => {
        loading.value = false;

        if (!error.processed) {
            snackbar.value?.showError(error);
        }
    });
}

function remove(account: Account): void {
    if (activeSubAccount.value[account.id]) {
        const subAccount: Account | null = account.getSubAccount(activeSubAccount.value[account.id]);

        if (!subAccount) {
            snackbar.value?.showMessage('Unable to delete this sub-account');
            return;
        }

        confirmDialog.value?.open('Are you sure you want to delete this sub-account?').then(() => {
            loading.value = true;

            accountsStore.deleteSubAccount({
                subAccount: subAccount
            }).then(() => {
                activeSubAccount.value[account.id] = '';
                loading.value = false;
            }).catch(error => {
                loading.value = false;

                if (!error.processed) {
                    snackbar.value?.showError(error);
                }
            });
        });
    } else {
        confirmDialog.value?.open('Are you sure you want to delete this account?').then(() => {
            loading.value = true;

            accountsStore.deleteAccount({
                account: account
            }).then(() => {
                loading.value = false;
            }).catch(error => {
                loading.value = false;

                if (!error.processed) {
                    snackbar.value?.showError(error);
                }
            });
        });
    }
}

function saveSortResult(): void {
    if (!displayOrderModified.value) {
        return;
    }

    loading.value = true;

    accountsStore.updateAccountDisplayOrders().then(() => {
        loading.value = false;
        displayOrderModified.value = false;
    }).catch(error => {
        loading.value = false;

        if (!error.processed) {
            snackbar.value?.showError(error);
        }
    });
}

function onMove(event: { moved: { element: { id: string }, oldIndex: number, newIndex: number } }): void {
    if (!event || !event.moved) {
        return;
    }

    const moveEvent = event.moved;

    if (!moveEvent.element || !moveEvent.element.id) {
        snackbar.value?.showMessage('Unable to move account');
        return;
    }

    accountsStore.changeAccountDisplayOrder({
        accountId: moveEvent.element.id,
        from: moveEvent.oldIndex,
        to: moveEvent.newIndex,
        updateListOrder: false,
        updateGlobalListOrder: true
    }).then(() => {
        displayOrderModified.value = true;
    }).catch(error => {
        snackbar.value?.showError(error);
    });
}

function onCustomDateRangeChanged(minUnixTime: number, maxUnixTime: number): void {
    if (!accountToShowReconciliationStatement.value) {
        snackbar.value?.showMessage('An error occurred');
        return;
    }

    showCustomDateRangeDialog.value = false;

    reconciliationStatementDialog.value?.open({
        accountId: accountToShowReconciliationStatement.value.id,
        startTime: minUnixTime,
        endTime: maxUnixTime
    });

    accountToShowReconciliationStatement.value = null;
}

function onShowDateRangeError(message: string): void {
    snackbar.value?.showError(message);
}

watch(() => display.mdAndUp.value, (newValue) => {
    alwaysShowNav.value = newValue;

    if (!showNav.value) {
        showNav.value = newValue;
    }
});

reload(false);
</script>

<style scoped>
.accounts-page {
    width: calc(100% + 48px);
    min-width: 0;
    min-height: 100vh;
    margin: -24px;
    background: rgb(var(--v-theme-background));
    font-family: "Lausanne", "Helvetica Neue", Arial, sans-serif;
}

.accounts-page,
.accounts-page *,
.accounts-page *::before,
.accounts-page *::after {
    box-sizing: border-box;
}

.accounts-page__column {
    min-width: 0;
    padding: 0 !important;
}

.accounts-shell,
.accounts-layout,
.accounts-main,
.accounts-content-card {
    min-width: 0;
    min-height: 100vh;
    background: rgb(var(--v-theme-background)) !important;
}

.accounts-shell,
.accounts-content-card {
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
}

.accounts-sidebar {
    border-right: 1px solid rgb(var(--v-theme-muted-border)) !important;
    background: rgb(var(--v-theme-surface)) !important;
    box-shadow: none !important;
}

.accounts-sidebar__summary {
    padding: 20px 16px 18px;
}

.accounts-sidebar__net-worth {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 8px;
    padding: 15px 16px;
    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 8px;
    background: rgb(var(--v-theme-background));
}

.accounts-sidebar__metric-label {
    color: rgb(var(--v-theme-tertiary));
    font-size: 0.66rem;
    font-weight: 600;
    letter-spacing: 0.035em;
    line-height: 1.2;
    text-transform: uppercase;
}

.accounts-sidebar__net-worth-value {
    min-width: 0;
    font-size: 1.15rem;
    font-weight: 500;
    letter-spacing: -0.025em;
    line-height: 1.2;
}

.accounts-sidebar__breakdown {
    margin-top: 12px;
    padding: 2px 4px 0;
}

.accounts-sidebar__metric {
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 4px;
}

.accounts-sidebar__metric + .accounts-sidebar__metric {
    border-top: 1px solid rgb(var(--v-theme-muted-border));
}

.accounts-sidebar__metric-value {
    min-width: 0;
    color: rgb(var(--v-theme-on-surface));
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    text-align: right;
}

.accounts-sidebar__divider {
    border-color: rgb(var(--v-theme-muted-border)) !important;
    opacity: 1 !important;
}

.accounts-sidebar__tabs {
    width: 100%;
    margin: 14px 0 0 !important;
    padding: 0 12px 18px;
}

.accounts-sidebar__tabs :deep(.v-tab) {
    width: 100%;
    justify-content: flex-start;
    padding-inline: 12px;
    border-radius: 6px !important;
    color: rgb(var(--v-theme-tertiary));
    font-weight: 500;
    letter-spacing: 0 !important;
    text-transform: none !important;
}

.accounts-sidebar__tabs :deep(.v-tab:hover) {
    color: rgb(var(--v-theme-on-surface));
    background: rgb(var(--v-theme-on-hover-background));
}

.accounts-sidebar__tabs :deep(.v-tab--selected) {
    color: rgb(var(--v-theme-on-surface)) !important;
    background: rgb(var(--v-theme-verticalbutton-selected)) !important;
    font-weight: 600;
}

.accounts-sidebar__tabs :deep(.v-tab__slider) {
    top: 8px !important;
    bottom: 8px !important;
    left: 8px !important;
    width: 2px !important;
    height: auto !important;
    background: rgb(var(--v-theme-highlight)) !important;
}

.accounts-content-card > :deep(.v-card-item) {
    padding: 0 !important;
    border-bottom: 1px solid rgb(var(--v-theme-muted-border));
    background: rgb(var(--v-theme-surface));
}

.accounts-content-card > :deep(.v-card-item .v-card-title) {
    width: 100%;
    overflow: visible;
    white-space: normal;
}

.accounts-page-header {
    width: 100%;
    padding: 36px 40px 0;
    background: rgb(var(--v-theme-surface));
}

.accounts-page-header__top {
    display: flex;
    width: 100%;
    min-width: 0;
    align-items: flex-start;
}

.accounts-page-header__identity,
.accounts-page-header__actions {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 12px;
}

.accounts-page-header__titles {
    min-width: 0;
}

.accounts-page-header__titles h1 {
    margin: 0;
    color: rgb(var(--v-theme-on-surface));
    font-size: clamp(1.8rem, 3vw, 2.65rem);
    font-weight: 500;
    letter-spacing: -0.05em;
    line-height: 1;
}

.accounts-page-header__titles > span {
    display: block;
    margin-top: 10px;
    overflow: hidden;
    color: rgb(var(--v-theme-tertiary));
    font-size: 0.76rem;
    font-weight: 500;
    line-height: 1.4;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.accounts-page-toolbar {
    display: flex;
    width: 100%;
    min-width: 0;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    margin-top: 30px;
    padding-bottom: 20px;
}

.accounts-search {
    width: min(100%, 360px);
}

.accounts-search :deep(.v-field) {
    min-height: 40px !important;
    border: 1px solid rgb(var(--v-theme-border)) !important;
    border-radius: 6px !important;
    background: rgb(var(--v-theme-background)) !important;
    box-shadow: none !important;
}

.accounts-search :deep(.v-field:hover) {
    border-color: rgb(var(--v-theme-on-hover-border)) !important;
    background: rgb(var(--v-theme-on-hover-background)) !important;
}

.accounts-search :deep(.v-field--focused) {
    border-color: rgb(var(--v-theme-on-background)) !important;
}

.accounts-search :deep(.v-field__outline),
.accounts-search :deep(.v-field__overlay) {
    display: none !important;
}

.accounts-search :deep(.v-field__input) {
    min-height: 38px !important;
    padding-block: 0 !important;
    font-size: 0.78rem !important;
}

.accounts-search-trigger {
    display: none !important;
}

.accounts-search-popover {
    width: 100%;
    border: 1px solid rgb(var(--v-theme-muted-border)) !important;
    border-radius: 8px !important;
    background: rgb(var(--v-theme-surface)) !important;
    box-shadow: none !important;
}

.accounts-search-popover :deep(.v-card-text) {
    padding: 12px !important;
}

.accounts-page-header__actions {
    flex: 0 0 auto;
    justify-content: flex-end;
    gap: 8px;
}

.accounts-add-button,
.accounts-save-order-button {
    min-width: 40px !important;
    height: 40px !important;
    border-radius: 6px !important;
    box-shadow: none !important;
    text-transform: none !important;
}

</style>

<style>

.account-statistic-item-value {
    font-size: 1rem;
}

.account-category-tabs .v-tab.v-tab.v-btn {
    height: calc(var(--v-tabs-height) * 1.5);
}

.accounts-balance-panel {
    margin: 24px 40px 0;
    padding: 0 !important;
}

.accounts-balance-box {
    display: flex;
    min-height: 76px;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding: 16px 18px;
    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 8px;
    background: rgb(var(--v-theme-surface));
}

.accounts-balance-box__copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 5px;
}

.accounts-balance-box__eyebrow {
    overflow: hidden;
    color: rgb(var(--v-theme-tertiary));
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.035em;
    line-height: 1.2;
    text-overflow: ellipsis;
    text-transform: uppercase;
    white-space: nowrap;
}

.accounts-balance-box__value {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 8px;
}

.accounts-overview-amount {
    overflow: hidden;
    color: rgb(var(--v-theme-on-surface));
    font-size: 1.55rem;
    font-weight: 500;
    letter-spacing: -0.035em;
    line-height: 1.1;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.accounts-overview-subtitle {
    color: rgb(var(--v-theme-on-surface));
    font-size: 0.82rem;
    font-weight: 500;
    line-height: 1.35;
}

.accounts-balance-box__visibility {
    flex: 0 0 auto;
    border-radius: 6px !important;
}

.accounts-list-panel {
    margin: 16px 40px 40px !important;
}

.accounts-empty-panel {
    margin: 16px 40px 40px !important;
}

.accounts-empty-panel__column {
    padding: 0 !important;
    color: rgb(var(--v-theme-tertiary));
    font-size: 0.82rem;
}

.accounts-list-panel__column {
    min-width: 0;
    padding: 0 !important;
}

.accounts-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.accounts-list .list-group-item {
    min-width: 0;
}

.account-card {
    overflow: hidden;
    border: 1px solid rgb(var(--v-theme-muted-border)) !important;
    border-radius: 8px !important;
    background: rgb(var(--v-theme-surface)) !important;
    background-clip: padding-box !important;
    box-shadow: none !important;
    transition: border-color 160ms ease, box-shadow 160ms ease;
}

.account-card::before,
.account-card::after {
    border-radius: inherit !important;
}

.account-card:hover {
    border-color: rgb(var(--v-theme-border)) !important;
    box-shadow: 0 8px 24px rgba(var(--v-theme-on-background), 0.05) !important;
}

.account-card > .v-card-item {
    padding: 18px 20px !important;
    background: rgb(var(--v-theme-surface)) !important;
}

.account-card__header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto 24px;
    align-items: center;
    gap: 20px;
}

.account-card__identity {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 12px;
}

.account-card__icon {
    display: grid;
    width: 40px;
    height: 40px;
    flex: 0 0 auto;
    place-items: center;
    border-radius: 7px;
    background: rgb(var(--v-theme-background));
}

.account-card__name-group {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 3px;
}

.account-card .account-name {
    color: rgb(var(--v-theme-on-surface));
    font-size: 0.92rem;
    font-weight: 600;
    line-height: 1.25;
}

.account-card .account-currency {
    color: rgb(var(--v-theme-tertiary));
    font-size: 0.72rem;
    font-weight: 500;
}

.account-card__balance {
    display: flex;
    min-width: 130px;
    flex-direction: column;
    align-items: flex-end;
    gap: 3px;
}

.account-card__balance small {
    color: rgb(var(--v-theme-tertiary));
    font-size: 0.68rem;
    font-weight: 500;
}

.account-card__balance strong {
    color: rgb(var(--v-theme-on-surface));
    font-size: 1.1rem;
    font-weight: 500;
    letter-spacing: -0.02em;
}

.account-card__drag {
    display: grid;
    place-items: center;
    color: rgb(var(--v-theme-tertiary));
}

.account-card__subaccounts {
    margin-top: 16px;
}

.account-card .account-subaccounts {
    overflow-x: auto;
    white-space: nowrap;
}

.account-card .account-subaccounts.v-btn-toggle {
    height: auto !important;
    padding: 0;
    border: none;
}

.account-card .account-subaccounts.v-btn-toggle > .v-btn {
    border-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

.account-card .account-subaccounts.v-btn-toggle > .v-btn:not(:first-child) {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-left: none;
}

.account-card .account-subaccounts.v-btn-toggle > .v-btn:not(:last-child) {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
}

.account-card .account-subaccounts.v-btn-toggle > .v-btn {
    border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.account-card .account-subaccounts.v-btn-toggle button.v-btn {
    width: auto !important;
}

.account-card__comment {
    padding: 14px 20px 4px !important;
    color: rgb(var(--v-theme-tertiary));
    font-size: 0.78rem;
    line-height: 1.5;
}

.account-card__actions {
    display: flex;
    min-height: 64px;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 16px 12px 20px !important;
    border-top: 1px solid rgb(var(--v-theme-muted-border));
    background: rgb(var(--v-theme-background));
}

.account-card__primary-actions {
    display: flex;
    min-width: 0;
    flex-wrap: wrap;
    gap: 8px;
}

.account-card__primary-actions .v-btn {
    min-height: 36px;
    border-color: rgb(var(--v-theme-border)) !important;
    border-radius: 6px !important;
    background: rgb(var(--v-theme-surface)) !important;
    font-size: 0.74rem;
    font-weight: 500;
    letter-spacing: 0;
    text-transform: none;
}

.account-card__menu-button {
    flex: 0 0 auto;
    border-radius: 6px !important;
}

.account-card__delete-action {
    color: rgb(var(--v-theme-error));
}

.accounts-search-empty {
    display: flex;
    min-height: 180px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: rgb(var(--v-theme-tertiary));
    font-size: 0.8rem;
}

</style>

<style scoped>

@media (max-width: 960px) {
    .accounts-page-header {
        padding: 24px 20px 0;
    }

    .accounts-balance-panel {
        margin-inline: 22px;
    }

    .accounts-list-panel {
        margin-inline: 22px !important;
    }

    .accounts-empty-panel {
        margin-inline: 22px !important;
    }

    .accounts-page-header__titles h1 {
        font-size: 1.55rem;
    }

    .accounts-page-toolbar {
        margin-top: 22px;
    }

    .accounts-search {
        flex: 1 1 auto;
    }
}

@media (max-width: 700px) {
    .accounts-page-header {
        padding: 20px 14px 0;
    }

    .accounts-page-header__identity {
        gap: 8px;
    }

    .accounts-page-header__titles h1 {
        font-size: 1.35rem;
    }

    .accounts-page-header__titles > span {
        display: none;
    }

    .accounts-page-header__actions {
        width: auto;
        justify-content: flex-end;
    }

    .accounts-page-toolbar {
        justify-content: flex-end;
        gap: 0;
        margin-top: 18px;
    }

    .accounts-search--desktop {
        display: none;
    }

    .accounts-search-trigger {
        display: inline-grid !important;
        width: 40px !important;
        min-width: 40px !important;
        height: 40px !important;
        border-radius: 6px !important;
    }

    .accounts-balance-panel {
        margin: 16px 14px 0;
    }

    .accounts-list-panel {
        margin: 14px 14px 28px !important;
    }

    .accounts-empty-panel {
        margin: 14px 14px 28px !important;
    }

    .accounts-balance-box {
        min-height: 70px;
        gap: 12px;
        padding: 14px;
    }

    .accounts-overview-amount {
        font-size: 1.25rem;
    }
}

@media (max-width: 600px) {
    .account-card__header {
        grid-template-columns: minmax(0, 1fr) 20px;
        gap: 12px;
    }

    .account-card__balance {
        grid-column: 1 / -1;
        grid-row: 2;
        align-items: flex-start;
        padding-left: 52px;
    }

    .account-card__drag {
        grid-column: 2;
        grid-row: 1;
    }
}
</style>
