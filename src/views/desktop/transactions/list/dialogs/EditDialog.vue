<template>
    <v-dialog class="transaction-edit-dialog" width="920" max-width="calc(100vw - 24px)" :persistent="isTransactionModified || recognizing" v-model="showState">
        <v-card class="transaction-edit-dialog__card">
            <template #title>
                <div class="transaction-edit-dialog__header">
                    <div class="transaction-edit-dialog__heading">
                        <h4>{{ tt(title) }}</h4>
                        <v-progress-circular indeterminate size="22" class="ms-2" v-if="loading"></v-progress-circular>
                    </div>
                    <v-spacer/>
                    <small class="transaction-edit-dialog__ai-note text-truncate" v-if="recognizing">{{ tt('AI can make mistakes. Check important info.') }}</small>
                    <v-btn density="comfortable" color="default" variant="text" class="ms-2" :icon="true"
                           :disabled="loading || submitting || recognizing"
                           v-if="mode !== TransactionEditPageMode.View && type === TransactionEditPageType.Transaction && activeTab === 'basicInfo' && isTransactionFromAITextRecognitionEnabled()"
                           @click="recognizeFromClipboard">
                        <v-icon :icon="mdiMagicStaff" size="22" v-if="!recognizing"/>
                        <v-tooltip activator="parent">{{ tt('AI Clipboard Text Recognition') }}</v-tooltip>
                        <v-progress-circular indeterminate size="22" v-if="recognizing"></v-progress-circular>
                    </v-btn>
                    <v-btn density="comfortable" color="default" variant="text" class="ms-2" :icon="true"
                           :disabled="loading || submitting || recognizing" v-if="mode !== TransactionEditPageMode.View && (activeTab === 'basicInfo' || (activeTab === 'map' && isSupportGetGeoLocationByClick()))">
                        <v-icon :icon="mdiDotsVertical" />
                        <v-menu activator="parent">
                            <v-list v-if="activeTab === 'basicInfo'">
                                <v-list-item :prepend-icon="mdiSwapHorizontal"
                                             :title="tt('Swap Account')"
                                             v-if="transaction.type === TransactionType.Transfer"
                                             @click="swapTransactionData(true, false)"></v-list-item>
                                <v-list-item :prepend-icon="mdiSwapHorizontal"
                                             :title="tt('Swap Amount')"
                                             v-if="transaction.type === TransactionType.Transfer"
                                             @click="swapTransactionData(false, true)"></v-list-item>
                                <v-list-item :prepend-icon="mdiSwapHorizontal"
                                             :title="tt('Swap Account and Amount')"
                                             v-if="transaction.type === TransactionType.Transfer"
                                             @click="swapTransactionData(true, true)"></v-list-item>
                                <v-divider v-if="transaction.type === TransactionType.Transfer" />
                                <v-list-item :prepend-icon="mdiEyeOutline"
                                             :title="tt('Show Amount')"
                                             v-if="transaction.hideAmount" @click="transaction.hideAmount = false"></v-list-item>
                                <v-list-item :prepend-icon="mdiEyeOffOutline"
                                             :title="tt('Hide Amount')"
                                             v-if="!transaction.hideAmount" @click="transaction.hideAmount = true"></v-list-item>
                            </v-list>
                            <v-list v-if="activeTab === 'map'">
                                <v-list-item key="setGeoLocationByClickMap" value="setGeoLocationByClickMap"
                                             :prepend-icon="mdiMapMarkerOutline"
                                             :disabled="!transaction.geoLocation" v-if="isSupportGetGeoLocationByClick()">
                                    <v-list-item-title class="cursor-pointer" @click="setGeoLocationByClickMap = !setGeoLocationByClickMap; geoMenuState = false">
                                        <div class="d-flex align-center">
                                            <span>{{ tt('Click on Map to Set Geographic Location') }}</span>
                                            <v-spacer/>
                                            <v-icon :icon="mdiCheck" v-if="setGeoLocationByClickMap" />
                                        </div>
                                    </v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </v-menu>
                    </v-btn>
                </div>
            </template>
            <v-card-text class="transaction-edit-dialog__body">
                <aside class="transaction-edit-dialog__sidebar">
                    <v-tabs class="transaction-edit-dialog__type-tabs" direction="vertical" :class="{ 'readonly': type === TransactionEditPageType.Transaction && mode !== TransactionEditPageMode.Add && mode !== TransactionEditPageMode.Edit }"
                            :disabled="loading || submitting || recognizing" v-model="transaction.type">
                        <v-tab :value="TransactionType.Expense" :disabled="type === TransactionEditPageType.Transaction && mode !== TransactionEditPageMode.Add && mode !== TransactionEditPageMode.Edit && transaction.type !== TransactionType.Expense" v-if="transaction.type !== TransactionType.ModifyBalance">
                            <span>{{ tt('Expense') }}</span>
                        </v-tab>
                        <v-tab :value="TransactionType.Income" :disabled="type === TransactionEditPageType.Transaction && mode !== TransactionEditPageMode.Add && mode !== TransactionEditPageMode.Edit && transaction.type !== TransactionType.Income" v-if="transaction.type !== TransactionType.ModifyBalance">
                            <span>{{ tt('Income') }}</span>
                        </v-tab>
                        <v-tab :value="TransactionType.Transfer" :disabled="type === TransactionEditPageType.Transaction && mode !== TransactionEditPageMode.Add && mode !== TransactionEditPageMode.Edit && transaction.type !== TransactionType.Transfer" v-if="transaction.type !== TransactionType.ModifyBalance">
                            <span>{{ tt('Transfer') }}</span>
                        </v-tab>
                        <v-tab :value="TransactionType.ModifyBalance" v-if="type === TransactionEditPageType.Transaction && transaction.type === TransactionType.ModifyBalance">
                            <span>{{ tt('Modify Balance') }}</span>
                        </v-tab>
                    </v-tabs>
                    <v-divider class="transaction-edit-dialog__sidebar-divider"/>
                    <v-tabs class="transaction-edit-dialog__section-tabs" direction="vertical" :disabled="loading || submitting || recognizing" v-model="activeTab">
                        <v-tab value="basicInfo">
                            <span>{{ tt('Basic Information') }}</span>
                        </v-tab>
                        <v-tab value="map" :disabled="!transaction.geoLocation" v-if="type === TransactionEditPageType.Transaction && !!getMapProvider()">
                            <span>{{ tt('Location on Map') }}</span>
                        </v-tab>
                        <v-tab value="pictures" :disabled="mode !== TransactionEditPageMode.Add && mode !== TransactionEditPageMode.Edit && (!transaction.pictures || !transaction.pictures.length)" v-if="type === TransactionEditPageType.Transaction && isTransactionPicturesEnabled()">
                            <span>{{ tt('Pictures') }}</span>
                        </v-tab>
                    </v-tabs>
                </aside>

                <v-window class="transaction-edit-dialog__content disable-tab-transition w-100-window-container"
                          v-model="activeTab">
                    <v-window-item class="transaction-edit-dialog__panel" value="basicInfo">
                        <v-form class="transaction-edit-dialog__form">
                            <v-row>
                                <v-col class="transaction-field" cols="12" :data-field-label="tt('Template Name')" v-if="type === TransactionEditPageType.Template && transaction instanceof TransactionTemplate">
                                    <v-text-field
                                        type="text"
                                        persistent-placeholder
                                        :disabled="loading || submitting || recognizing"
                                        :label="tt('Template Name')"
                                        :placeholder="tt('Template Name')"
                                        v-model="transaction.name"
                                    />
                                </v-col>
                                <v-col class="transaction-field" cols="12" :md="transaction.type === TransactionType.Transfer ? 6 : 12" :data-field-label="sourceAmountTitle">
                                    <amount-input class="transaction-edit-amount font-weight-bold"
                                                  :color="sourceAmountColor"
                                                  :currency="sourceAccountCurrency"
                                                  :show-currency="true"
                                                  :readonly="mode === TransactionEditPageMode.View"
                                                  :disabled="loading || submitting || recognizing"
                                                  :persistent-placeholder="true"
                                                  :hide="transaction.hideAmount"
                                                  :label="sourceAmountTitle"
                                                  :placeholder="tt(sourceAmountName)"
                                                  :enable-formula="mode !== TransactionEditPageMode.View"
                                                  v-model="transaction.sourceAmount"/>
                                </v-col>
<v-col
    cols="12"
    v-if="mode === TransactionEditPageMode.View && transaction.subscription"
>
    <div class="transaction-subscription-info">
        <div class="transaction-subscription-info__icon">
            <v-icon
                :icon="mdiCalendarSyncOutline"
                size="18"
            />
        </div>

        <div class="transaction-subscription-info__content">
            <div class="transaction-subscription-info__title">
                {{ tt('Subscription') }}
            </div>

            <div class="transaction-subscription-info__description">
                {{ tt('This expense repeats monthly with the same amount and billing day.') }}
            </div>
        </div>
    </div>
</v-col>

                                <!-- Installment summary section -->
                                <v-col
                                    class="transaction-installments-column"
                                    cols="12"
                                    v-if="
                                        mode === TransactionEditPageMode.View &&
                                        transaction.installmentSummary
                                    "
                                >
                                    <section class="transaction-installments">
                                        <header class="transaction-installments__header">
                                            <div>
                                                <span class="transaction-installments__eyebrow">
                                                    {{ tt('Installment Purchase') }}
                                                </span>

                                                <h3>
                                                    {{ tt('Installment Details') }}
                                                </h3>
                                            </div>

                                            <span class="transaction-installments__counter">
                                                {{ transaction.installmentSummary.items.length }}
                                                {{ tt('Installments') }}
                                            </span>
                                        </header>

                                        <div class="transaction-installments__summary">
                                            <div class="transaction-installments__metric">
                                                <span>{{ tt('Total Purchase') }}</span>

                                                <strong>
                                                    {{
                                                        displayInstallmentAmount(
                                                            transaction.installmentSummary.totalAmount
                                                        )
                                                    }}
                                                </strong>
                                            </div>

                                            <div class="transaction-installments__metric">
                                                <span>{{ tt('Total Paid') }}</span>

                                                <strong class="transaction-installments__paid">
                                                    {{
                                                        displayInstallmentAmount(
                                                            transaction.installmentSummary.paidAmount
                                                        )
                                                    }}
                                                </strong>
                                            </div>

                                            <div class="transaction-installments__metric">
                                                <span>{{ tt('Remaining Amount') }}</span>

                                                <strong class="transaction-installments__pending">
                                                    {{
                                                        displayInstallmentAmount(
                                                            transaction.installmentSummary.remainingAmount
                                                        )
                                                    }}
                                                </strong>
                                            </div>
                                        </div>

                                        <div class="transaction-installments__list">
                                            <article
                                                v-for="item in transaction.installmentSummary.items"
                                                :key="item.transactionId"
                                                class="transaction-installments__item"
                                                :class="{
                                                    'transaction-installments__item--pending': !item.paid
                                                }"
                                            >
                                                <div class="transaction-installments__number">
                                                    {{ item.number }}
                                                </div>

                                                <div class="transaction-installments__content">
                                                    <div class="transaction-installments__item-heading">
                                                        <strong>
                                                            {{ tt('Installment') }}
                                                            {{ item.number }}/{{ transaction.installmentCount }}
                                                        </strong>

                                                        <span
                                                            class="transaction-installments__status"
                                                            :class="{
                                                                'transaction-installments__status--paid':
                                                                    item.paid,
                                                                'transaction-installments__status--pending':
                                                                    !item.paid
                                                            }"
                                                        >
                                                            {{ item.paid ? tt('Paid') : tt('To Pay') }}
                                                        </span>
                                                    </div>

                                                    <div class="transaction-installments__dates">
                                                        <span>
                                                            {{ tt('Invoice') }}:
                                                            {{ displayInstallmentDate(item.time) }}
                                                        </span>

                                                        <span v-if="item.dueTime">
                                                            {{ tt('Due Date') }}:
                                                            {{ displayInstallmentDate(item.dueTime) }}
                                                        </span>
                                                    </div>
                                                </div>

                                                <strong class="transaction-installments__amount">
                                                    {{ displayInstallmentAmount(item.amount) }}
                                                </strong>
                                            </article>
                                        </div>
                                    </section>
                                </v-col>
                                <v-col class="transaction-field" cols="12" :md="6" :data-field-label="transferInAmountTitle" v-if="transaction.type === TransactionType.Transfer">
                                    <amount-input class="transaction-edit-amount font-weight-bold" color="primary"
                                                  :currency="destinationAccountCurrency"
                                                  :show-currency="true"
                                                  :readonly="mode === TransactionEditPageMode.View"
                                                  :disabled="loading || submitting || recognizing"
                                                  :persistent-placeholder="true"
                                                  :hide="transaction.hideAmount"
                                                  :label="transferInAmountTitle"
                                                  :placeholder="tt('Transfer In Amount')"
                                                  :enable-formula="mode !== TransactionEditPageMode.View"
                                                  v-model="transaction.destinationAmount"/>
                                </v-col>
                                <v-col class="transaction-field" cols="12" md="12" :data-field-label="transactionDescriptionTitle">
                                    <v-text-field
                                        type="text"
                                        persistent-placeholder
                                        :readonly="mode === TransactionEditPageMode.View"
                                        :disabled="loading || submitting || recognizing"
                                        :label="transactionDescriptionTitle"
                                        :placeholder="tt('Your transaction description')"
                                        v-model="transaction.comment"
                                    />
                                </v-col>
                                <v-col class="transaction-field" cols="12" md="12" :data-field-label="tt('Category')" v-if="transaction.type === TransactionType.Expense">
                                    <v-tooltip :disabled="hasVisibleExpenseCategories" :text="hasVisibleExpenseCategories ? '' : tt('No secondary expense categories are available')">
                                        <template v-slot:activator="{ props }">
                                            <div v-bind="props" class="d-block">
                                                <two-column-select primary-key-field="id" primary-value-field="id" primary-title-field="name"
                                                                   primary-icon-field="icon" primary-icon-type="category" primary-color-field="color"
                                                                   primary-hidden-field="hidden" primary-sub-items-field="subCategories"
                                                                   secondary-key-field="id" secondary-value-field="id" secondary-title-field="name"
                                                                   secondary-icon-field="icon" secondary-icon-type="category" secondary-color-field="color"
                                                                   secondary-hidden-field="hidden"
                                                                   :readonly="mode === TransactionEditPageMode.View"
                                                                   :disabled="loading || submitting || recognizing || !hasVisibleExpenseCategories"
                                                                   :enable-filter="true" :filter-placeholder="tt('Find category')" :filter-no-items-text="tt('No available category')"
                                                                   :show-selection-primary-text="true"
                                                                   :custom-selection-primary-text="getTransactionPrimaryCategoryName(transaction.expenseCategoryId, allCategories[CategoryType.Expense])"
                                                                   :custom-selection-secondary-text="getTransactionSecondaryCategoryName(transaction.expenseCategoryId, allCategories[CategoryType.Expense])"
                                                                   :label="tt('Category')" :placeholder="tt('Category')"
                                                                   :items="allCategories[CategoryType.Expense] || []"
                                                                   v-model="transaction.expenseCategoryId">
                                                </two-column-select>
                                            </div>
                                        </template>
                                    </v-tooltip>
                                </v-col>
                                <v-col class="transaction-field" cols="12" md="12" :data-field-label="tt('Category')" v-if="transaction.type === TransactionType.Income">
                                    <v-tooltip :disabled="hasVisibleIncomeCategories" :text="hasVisibleIncomeCategories ? '' : tt('No secondary income categories are available')">
                                        <template v-slot:activator="{ props }">
                                            <div v-bind="props" class="d-block">
                                                <two-column-select primary-key-field="id" primary-value-field="id" primary-title-field="name"
                                                                   primary-icon-field="icon" primary-icon-type="category" primary-color-field="color"
                                                                   primary-hidden-field="hidden" primary-sub-items-field="subCategories"
                                                                   secondary-key-field="id" secondary-value-field="id" secondary-title-field="name"
                                                                   secondary-icon-field="icon" secondary-icon-type="category" secondary-color-field="color"
                                                                   secondary-hidden-field="hidden"
                                                                   :readonly="mode === TransactionEditPageMode.View"
                                                                   :disabled="loading || submitting || recognizing || !hasVisibleIncomeCategories"
                                                                   :enable-filter="true" :filter-placeholder="tt('Find category')" :filter-no-items-text="tt('No available category')"
                                                                   :show-selection-primary-text="true"
                                                                   :custom-selection-primary-text="getTransactionPrimaryCategoryName(transaction.incomeCategoryId, allCategories[CategoryType.Income])"
                                                                   :custom-selection-secondary-text="getTransactionSecondaryCategoryName(transaction.incomeCategoryId, allCategories[CategoryType.Income])"
                                                                   :label="tt('Category')" :placeholder="tt('Category')"
                                                                   :items="allCategories[CategoryType.Income] || []"
                                                                   v-model="transaction.incomeCategoryId">
                                                </two-column-select>
                                            </div>
                                        </template>
                                    </v-tooltip>
                                </v-col>
                                <v-col class="transaction-field" cols="12" md="12" :data-field-label="tt('Category')" v-if="transaction.type === TransactionType.Transfer">
                                    <v-tooltip :disabled="hasVisibleTransferCategories" :text="hasVisibleTransferCategories ? '' : tt('No secondary transfer categories are available')">
                                        <template v-slot:activator="{ props }">
                                            <div v-bind="props" class="d-block">
                                                <two-column-select primary-key-field="id" primary-value-field="id" primary-title-field="name"
                                                                   primary-icon-field="icon" primary-icon-type="category" primary-color-field="color"
                                                                   primary-hidden-field="hidden" primary-sub-items-field="subCategories"
                                                                   secondary-key-field="id" secondary-value-field="id" secondary-title-field="name"
                                                                   secondary-icon-field="icon" secondary-icon-type="category" secondary-color-field="color"
                                                                   secondary-hidden-field="hidden"
                                                                   :readonly="mode === TransactionEditPageMode.View"
                                                                   :disabled="loading || submitting || recognizing || !hasVisibleTransferCategories"
                                                                   :enable-filter="true" :filter-placeholder="tt('Find category')" :filter-no-items-text="tt('No available category')"
                                                                   :show-selection-primary-text="true"
                                                                   :custom-selection-primary-text="getTransactionPrimaryCategoryName(transaction.transferCategoryId, allCategories[CategoryType.Transfer])"
                                                                   :custom-selection-secondary-text="getTransactionSecondaryCategoryName(transaction.transferCategoryId, allCategories[CategoryType.Transfer])"
                                                                   :label="tt('Category')" :placeholder="tt('Category')"
                                                                   :items="allCategories[CategoryType.Transfer] || []"
                                                                   v-model="transaction.transferCategoryId">
                                                </two-column-select>
                                            </div>
                                        </template>
                                    </v-tooltip>
                                </v-col>
                                <v-col class="transaction-field" cols="12" :md="transaction.type === TransactionType.Transfer ? 6 : 12" :data-field-label="tt(sourceAccountTitle)">
                                    <v-tooltip :disabled="!!allVisibleAccounts.length" :text="allVisibleAccounts.length ? '' : tt('No available account')">
                                        <template v-slot:activator="{ props }">
                                            <div v-bind="props" class="d-block">
                                                <two-column-select primary-key-field="id" primary-value-field="category"
                                                                   primary-title-field="name" primary-footer-field="displayBalance"
                                                                   primary-icon-field="icon" primary-icon-type="account"
                                                                   primary-sub-items-field="accounts"
                                                                   :primary-title-i18n="true"
                                                                   secondary-key-field="id" secondary-value-field="id"
                                                                   secondary-title-field="name" secondary-footer-field="displayBalance"
                                                                   secondary-icon-field="icon" secondary-icon-type="account" secondary-color-field="color"
                                                                   :readonly="mode === TransactionEditPageMode.View"
                                                                   :disabled="loading || submitting || recognizing || !allVisibleAccounts.length || (mode === TransactionEditPageMode.Edit && transaction.type === TransactionType.ModifyBalance)"
                                                                   :enable-filter="true" :filter-placeholder="tt('Find account')" :filter-no-items-text="tt('No available account')"
                                                                   :custom-selection-primary-text="sourceAccountName"
                                                                   :label="tt(sourceAccountTitle)"
                                                                   :placeholder="tt(sourceAccountTitle)"
                                                                   :items="allVisibleCategorizedAccounts"
                                                                   v-model="transaction.sourceAccountId">
                                                </two-column-select>
                                            </div>
                                        </template>
                                    </v-tooltip>
                                </v-col>

                                <!-- Credit card purchase options -->
                                <v-col
                                    class="transaction-credit-card-options-column"
                                    cols="12"
                                    v-if="mode === TransactionEditPageMode.Add && isCreditCardExpense"
                                >
                                    <section class="transaction-credit-card-options">
                                        <div class="transaction-credit-card-options__header">
                                            <div>
                                                <span class="transaction-credit-card-options__eyebrow">
                                                    {{ tt('Credit Card') }}
                                                </span>
                                                <h3>{{ tt('Purchase Options') }}</h3>
                                            </div>

                                            <span class="transaction-credit-card-options__hint">
                                                {{ tt('Choose how this purchase should be handled') }}
                                            </span>
                                        </div>

                                        <div class="transaction-credit-card-options__grid">
                                            <div
                                                class="transaction-credit-card-option"
                                                :class="{ 'transaction-credit-card-option--active': transaction.installmentCount !== 0 }"
                                            >
                                                <div class="transaction-credit-card-option__content">
                                                    <strong>{{ tt('Installment Purchase') }}</strong>
                                                    <span>
                                                        {{ tt('Split this purchase into monthly installments') }}
                                                    </span>
                                                </div>

                                                <v-switch
                                                    class="transaction-credit-card-option__switch"
                                                    color="primary"
                                                    density="compact"
                                                    hide-details
                                                    :disabled="loading || submitting || recognizing"
                                                    :model-value="transaction.installmentCount !== 0"
                                                    @update:model-value="transaction.installmentCount = $event ? 2 : 0; transaction.subscription = false"
                                                />
                                            </div>

                                            <div
                                                class="transaction-credit-card-option"
                                                :class="{ 'transaction-credit-card-option--active': transaction.subscription }"
                                            >
                                                <div class="transaction-credit-card-option__content">
                                                    <strong>{{ tt('Subscription') }}</strong>
                                                    <span>
                                                        {{ tt('Repeat this expense monthly with the same amount and billing day') }}
                                                    </span>
                                                </div>

                                                <v-switch
                                                    v-model="transaction.subscription"
                                                    class="transaction-credit-card-option__switch"
                                                    color="primary"
                                                    density="compact"
                                                    hide-details
                                                    :disabled="loading || submitting || recognizing"
                                                    @update:model-value="transaction.installmentCount = 0"
                                                />
                                            </div>
                                        </div>

                                        <div
                                            class="transaction-credit-card-installments"
                                            v-if="transaction.installmentCount !== 0"
                                        >
                                            <div class="transaction-credit-card-installments__text">
                                                <strong>{{ tt('Number of Installments') }}</strong>
                                                <span>
                                                    {{ tt('Define how many monthly payments will be created') }}
                                                </span>
                                            </div>

                                            <v-text-field
                                                class="transaction-credit-card-installments__input"
                                                type="number"
                                                persistent-placeholder
                                                hide-details
                                                :min="2"
                                                :max="120"
                                                :disabled="loading || submitting || recognizing"
                                                @blur="normalizeInstallmentCount"
                                                v-model.number="transaction.installmentCount"
                                            />
                                        </div>
                                    </section>
                                </v-col>
                                <v-col class="transaction-field" cols="12" md="6" :data-field-label="tt('Destination Account')" v-if="transaction.type === TransactionType.Transfer">
                                    <v-tooltip :disabled="!!allVisibleAccounts.length" :text="allVisibleAccounts.length ? '' : tt('No available account')">
                                        <template v-slot:activator="{ props }">
                                            <div v-bind="props" class="d-block">
                                                <two-column-select primary-key-field="id" primary-value-field="category"
                                                                   primary-title-field="name" primary-footer-field="displayBalance"
                                                                   primary-icon-field="icon" primary-icon-type="account"
                                                                   primary-sub-items-field="accounts"
                                                                   :primary-title-i18n="true"
                                                                   secondary-key-field="id" secondary-value-field="id"
                                                                   secondary-title-field="name" secondary-footer-field="displayBalance"
                                                                   secondary-icon-field="icon" secondary-icon-type="account" secondary-color-field="color"
                                                                   :readonly="mode === TransactionEditPageMode.View"
                                                                   :disabled="loading || submitting || recognizing || !allVisibleAccounts.length"
                                                                   :enable-filter="true" :filter-placeholder="tt('Find account')" :filter-no-items-text="tt('No available account')"
                                                                   :custom-selection-primary-text="destinationAccountName"
                                                                   :label="tt('Destination Account')"
                                                                   :placeholder="tt('Destination Account')"
                                                                   :items="allVisibleCategorizedAccounts"
                                                                   v-model="transaction.destinationAccountId">
                                                </two-column-select>
                                            </div>
                                        </template>
                                    </v-tooltip>
                                </v-col>
                                <v-col class="transaction-field" cols="12" md="6" :data-field-label="tt('Transaction Time')" v-if="type === TransactionEditPageType.Transaction">
                                    <date-time-select
                                        class="transaction-time-picker"
                                        menu-content-class="transaction-time-picker-menu"
                                        :readonly="mode === TransactionEditPageMode.View"
                                        :disabled="loading || submitting || recognizing || (mode === TransactionEditPageMode.Edit && transaction.type === TransactionType.ModifyBalance)"
                                        :label="tt('Transaction Time')"
                                        :timezone-utc-offset="transaction.utcOffset"
                                        :model-value="transaction.time"
                                        @update:model-value="updateTransactionTime"
                                        @error="onShowDateTimeError" />
                                </v-col>
                                <v-col class="transaction-field" cols="12" md="6" :data-field-label="tt('Scheduled Transaction Frequency')" v-if="type === TransactionEditPageType.Template && transaction instanceof TransactionTemplate && transaction.templateType === TemplateType.Schedule.type">
                                    <schedule-frequency-select
                                        :readonly="mode === TransactionEditPageMode.View"
                                        :disabled="loading || submitting || recognizing"
                                        :label="tt('Scheduled Transaction Frequency')"
                                        v-model:type="transaction.scheduledFrequencyType"
                                        v-model="transaction.scheduledFrequency" />
                                </v-col>
                                <v-col class="transaction-field" cols="12" md="6" :data-field-label="tt('Transaction Timezone')" v-if="type === TransactionEditPageType.Transaction || (type === TransactionEditPageType.Template && transaction instanceof TransactionTemplate && transaction.templateType === TemplateType.Schedule.type)">
                                    <v-autocomplete
                                        class="transaction-edit-timezone"
                                        item-title="displayNameWithUtcOffset"
                                        item-value="name"
                                        auto-select-first
                                        persistent-placeholder
                                        :readonly="mode === TransactionEditPageMode.View"
                                        :disabled="loading || submitting || recognizing || (mode === TransactionEditPageMode.Edit && transaction.type === TransactionType.ModifyBalance)"
                                        :label="tt('Transaction Timezone')"
                                        :placeholder="!transaction.timeZone && transaction.timeZone !== '' ? `(${transactionDisplayTimezone}) ${transactionTimezoneTimeDifference}` : tt('Timezone')"
                                        :items="allTimezones"
                                        :no-data-text="tt('No results')"
                                        :model-value="transaction.timeZone"
                                        @update:model-value="updateTransactionTimezone"
                                    >
                                        <template #selection="{ item }">
                                            <span class="text-truncate" v-if="transaction.timeZone || transaction.timeZone === ''">
                                                {{ item.title }}
                                            </span>
                                        </template>
                                    </v-autocomplete>
                                </v-col>
                                <v-col class="transaction-field" cols="12" md="6" :data-field-label="tt('Start Date')" v-if="type === TransactionEditPageType.Template && transaction instanceof TransactionTemplate && transaction.templateType === TemplateType.Schedule.type">
                                    <date-select
                                        :readonly="mode === TransactionEditPageMode.View"
                                        :disabled="loading || submitting || recognizing"
                                        :clearable="true"
                                        :label="tt('Start Date')"
                                        :no-data-text="tt('No limit')"
                                        v-model="transaction.scheduledStartDate" />
                                </v-col>
                                <v-col class="transaction-field" cols="12" md="6" :data-field-label="tt('End Date')" v-if="type === TransactionEditPageType.Template && transaction instanceof TransactionTemplate && transaction.templateType === TemplateType.Schedule.type">
                                    <date-select
                                        :readonly="mode === TransactionEditPageMode.View"
                                        :disabled="loading || submitting || recognizing"
                                        :clearable="true"
                                        :label="tt('End Date')"
                                        :no-data-text="tt('No limit')"
                                        v-model="transaction.scheduledEndDate" />
                                </v-col>
                                <v-col class="transaction-field" cols="12" md="12" :data-field-label="tt('Geographic Location')" v-if="type === TransactionEditPageType.Transaction">
                                    <v-select
                                        persistent-placeholder
                                        :readonly="mode === TransactionEditPageMode.View"
                                        :disabled="loading || submitting || recognizing"
                                        :label="tt('Geographic Location')"
                                        v-model="transaction"
                                        v-model:menu="geoMenuState"
                                    >
                                        <template #selection>
                                            <span class="cursor-pointer" v-if="transaction.geoLocation">{{ `(${formatCoordinate(transaction.geoLocation, coordinateDisplayType)})` }}</span>
                                            <span class="cursor-pointer" v-else-if="!transaction.geoLocation">{{ geoLocationStatusInfo }}</span>
                                        </template>

                                        <template #no-data>
                                            <v-list class="py-0">
                                                <v-list-item v-if="mode !== TransactionEditPageMode.View" @click="updateGeoLocation(true)">{{ tt('Update Geographic Location') }}</v-list-item>
                                                <v-list-item v-if="mode !== TransactionEditPageMode.View" @click="clearGeoLocation">{{ tt('Clear Geographic Location') }}</v-list-item>
                                            </v-list>
                                        </template>
                                    </v-select>
                                </v-col>
                                <v-col class="transaction-field" cols="12" md="12" :data-field-label="tt('Tags')">
                                    <transaction-tag-auto-complete
                                        :readonly="mode === TransactionEditPageMode.View"
                                        :disabled="loading || submitting || recognizing"
                                        :show-label="true"
                                        :allow-add-new-tag="true"
                                        v-model="transaction.tagIds"
                                        @tag:saving="onSavingTag"
                                    />
                                </v-col>

                            </v-row>
                        </v-form>
                    </v-window-item>
                    <v-window-item class="transaction-edit-dialog__panel" value="map">
                        <v-row>
                            <v-col cols="12" md="12">
                                <map-view ref="map" map-class="transaction-edit-map-view"
                                          :enable-zoom-control="true" :geo-location="transaction.geoLocation"
                                          @click="updateSpecifiedGeoLocation">
                                    <template #error-title="{ mapSupported, mapDependencyLoaded }">
                                        <span class="text-subtitle-1" v-if="!mapSupported"><b>{{ tt('Unsupported Map Provider') }}</b></span>
                                        <span class="text-subtitle-1" v-else-if="!mapDependencyLoaded"><b>{{ tt('Cannot Initialize Map') }}</b></span>
                                    </template>
                                    <template #error-content>
                                        <p class="text-body-1">
                                            {{ tt('Please refresh the page and try again. If the error persists, ensure that the server\'s map settings are correctly configured.') }}
                                        </p>
                                    </template>
                                </map-view>
                            </v-col>
                        </v-row>
                    </v-window-item>
                    <v-window-item class="transaction-edit-dialog__panel" value="pictures">
                        <v-row class="transaction-pictures align-content-start" :class="{ 'readonly': submitting || uploadingPicture || removingPictureId }">
                            <v-col :key="picIdx" cols="6" md="3" v-for="(pictureInfo, picIdx) in transaction.pictures">
                                <v-avatar rounded="lg" variant="tonal" size="160"
                                          class="cursor-pointer transaction-picture"
                                          color="rgba(0,0,0,0)" @click="viewOrRemovePicture(pictureInfo)">
                                    <v-img :src="getTransactionPictureUrl(pictureInfo)">
                                        <template #placeholder>
                                            <div class="d-flex align-center justify-center fill-height bg-light-primary">
                                                <v-progress-circular color="grey-500" indeterminate size="48"></v-progress-circular>
                                            </div>
                                        </template>
                                        <template #error>
                                            <div class="d-flex align-center justify-center fill-height bg-light-primary">
                                                <span class="text-body-1">{{ tt('Failed to load image, please check whether the config "domain" and "root_url" are set correctly.') }}</span>
                                            </div>
                                        </template>
                                    </v-img>
                                    <div class="picture-control-icon" :class="{ 'show-control-icon': pictureInfo.pictureId === removingPictureId }">
                                        <v-icon size="64" :icon="mdiTrashCanOutline" v-if="(mode === TransactionEditPageMode.Add || mode === TransactionEditPageMode.Edit) && pictureInfo.pictureId !== removingPictureId"/>
                                        <v-progress-circular color="grey-500" indeterminate size="48" v-if="(mode === TransactionEditPageMode.Add || mode === TransactionEditPageMode.Edit) && pictureInfo.pictureId === removingPictureId"></v-progress-circular>
                                        <v-icon size="64" :icon="mdiFullscreen" v-if="mode !== TransactionEditPageMode.Add && mode !== TransactionEditPageMode.Edit"/>
                                    </div>
                                </v-avatar>
                            </v-col>
                            <v-col cols="6" md="3" v-if="canAddTransactionPicture">
                                <v-avatar rounded="lg" variant="tonal" size="160"
                                          class="transaction-picture transaction-picture-add"
                                          :class="{ 'enabled': !submitting, 'cursor-pointer': !submitting }"
                                          color="rgba(0,0,0,0)" @click="showOpenPictureDialog">
                                    <v-tooltip activator="parent" v-if="!submitting">{{ tt('Add Picture') }}</v-tooltip>
                                    <v-icon class="transaction-picture-add-icon" size="56" :icon="mdiImagePlusOutline" v-if="!uploadingPicture"/>
                                    <v-progress-circular color="grey-500" indeterminate size="48" v-if="uploadingPicture"></v-progress-circular>
                                </v-avatar>
                            </v-col>
                        </v-row>
                    </v-window-item>
                </v-window>
            </v-card-text>
            <v-card-text class="transaction-edit-dialog__footer">
                <div class="transaction-edit-dialog__footer-actions">
                    <v-tooltip :disabled="!inputIsEmpty" :text="inputEmptyProblemMessage ? tt(inputEmptyProblemMessage) : ''">
                        <template v-slot:activator="{ props }">
                            <div v-bind="props" class="d-inline-block">
                                <v-btn-group density="comfortable" v-if="mode === TransactionEditPageMode.Add || mode === TransactionEditPageMode.Edit">
                                    <v-btn color="primary" :disabled="inputIsEmpty || loading || submitting || recognizing" @click="save(AfterSaveAction.GoBack)">
                                        {{ tt(saveButtonTitle) }}
                                        <v-progress-circular indeterminate size="22" class="ms-2" v-if="submitting"></v-progress-circular>
                                    </v-btn>
                                    <v-btn color="primary" density="compact"
                                           :disabled="inputIsEmpty || loading || submitting || recognizing" :icon="true"
                                           v-if="type === TransactionEditPageType.Transaction && mode === TransactionEditPageMode.Add">
                                        <v-icon :icon="mdiMenuDown" size="24" />
                                        <v-menu activator="parent">
                                            <v-list>
                                                <v-list-item :title="tt(TransactionQuickAddButtonActionType.SaveAndAddNewTransaction.name)"
                                                             @click="save(AfterSaveAction.StayWithNewTransaction)"></v-list-item>
                                                <v-list-item :title="tt(TransactionQuickAddButtonActionType.SaveAndKeepCurrentData.name)"
                                                             @click="save(AfterSaveAction.StayWithCurrentTransaction)"></v-list-item>
                                            </v-list>
                                        </v-menu>
                                    </v-btn>
                                </v-btn-group>
                            </div>
                        </template>
                    </v-tooltip>
                    <div
                        class="duplicate-split-button"
                        v-if="mode === TransactionEditPageMode.View && transaction.type !== TransactionType.ModifyBalance"
                    >
                        <v-btn
                            class="duplicate-split-button__main"
                            variant="flat"
                            :disabled="loading || submitting || recognizing"
                            @click="duplicate(false, false)"
                        >
                            {{ tt('Duplicate') }}
                        </v-btn>

                        <v-btn
                            class="duplicate-split-button__menu"
                            variant="flat"
                            :disabled="loading || submitting || recognizing"
                            :icon="true"
                            :aria-label="tt('More options')"
                        >
                            <v-icon :icon="mdiMenuDown" size="18" />

                            <v-menu activator="parent" location="top end">
                                <v-list>
                                    <v-list-item
                                        :title="tt('Duplicate (With Time)')"
                                        @click="duplicate(true, false)"
                                    />
                                    <v-list-item
                                        :title="tt('Duplicate (With Geographic Location)')"
                                        v-if="transaction.geoLocation"
                                        @click="duplicate(false, true)"
                                    />
                                    <v-list-item
                                        :title="tt('Duplicate (With Time and Geographic Location)')"
                                        v-if="transaction.geoLocation"
                                        @click="duplicate(true, true)"
                                    />
                                </v-list>
                            </v-menu>
                        </v-btn>
                    </div>
                    <v-btn color="warning" variant="tonal" :disabled="loading || submitting || recognizing"
                           v-if="mode === TransactionEditPageMode.View && (originalTransactionEditable || transaction.installmentCount > 1)"
                           @click="edit">{{ tt('Edit') }}</v-btn>
                    <v-btn color="error" variant="tonal" :disabled="loading || submitting || recognizing"
                           v-if="props.type === TransactionEditPageType.Transaction &&
                               ((mode === TransactionEditPageMode.View && originalTransactionEditable) ||
                               ((mode === TransactionEditPageMode.View || mode === TransactionEditPageMode.Edit) &&
                               transaction.type === TransactionType.Expense))"
                           @click="remove">
                        {{ tt('Delete') }}
                        <v-progress-circular indeterminate size="22" class="ms-2" v-if="submitting"></v-progress-circular>
                    </v-btn>
                    <v-btn color="secondary" variant="tonal" :disabled="loading || submitting || recognizing"
                           @click="cancel">{{ tt(cancelButtonTitle) }}</v-btn>
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>

    <v-dialog class="transaction-paste-dialog" width="600" max-width="calc(100vw - 32px)" v-model="showPasteTextDialog">
        <v-card class="transaction-paste-dialog__card">
            <template #title>
                <h4 class="text-h4 text-wrap">{{ tt('AI Clipboard Text Recognition') }}</h4>
            </template>
            <v-card-text class="w-100 d-flex justify-center">
                <v-textarea
                    type="text"
                    persistent-placeholder
                    rows="8"
                    :disabled="recognizing"
                    :placeholder="tt('Click here to paste a transaction description')"
                    v-model="pastedText"
                />
            </v-card-text>
            <v-card-text>
                <div class="w-100 d-flex justify-center flex-wrap mt-sm-1 mt-md-2 gap-4">
                    <v-btn color="primary" :disabled="!pastedText || !pastedText.trim() || recognizing" @click="showPasteTextDialog = false; recognizeText(pastedText);">
                        {{ tt('Recognize') }}
                    </v-btn>
                    <v-btn color="secondary" variant="tonal" :disabled="recognizing" @click="showPasteTextDialog = false; pastedText = '';">{{ tt('Cancel') }}</v-btn>
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>

    <confirm-dialog ref="confirmDialog"/>
    <snack-bar ref="snackbar" />
    <input ref="pictureInput" type="file" style="display: none" :accept="SUPPORTED_IMAGE_EXTENSIONS" @change="onUploadPicture($event)" />
</template>

<script setup lang="ts">
import MapView from '@/components/common/MapView.vue';
import ConfirmDialog from '@/components/desktop/ConfirmDialog.vue';
import SnackBar from '@/components/desktop/SnackBar.vue';

import { ref, computed, useTemplateRef, watch, nextTick } from 'vue';

import { useI18n } from '@/locales/helpers.ts';
import {
    TransactionEditPageMode,
    TransactionEditPageType,
    GeoLocationStatus,
    AfterSaveAction,
    useTransactionEditPageBase
} from '@/views/base/transactions/TransactionEditPageBase.ts';

import { useSettingsStore } from '@/stores/setting.ts';
import { useUserStore } from '@/stores/user.ts';
import { useAccountsStore } from '@/stores/account.ts';
import { useTransactionCategoriesStore } from '@/stores/transactionCategory.ts';
import { useTransactionTagsStore } from '@/stores/transactionTag.ts';
import { useTransactionsStore } from '@/stores/transaction.ts';
import { useTransactionTemplatesStore } from '@/stores/transactionTemplate.ts';

import type { Coordinate } from '@/core/coordinate.ts';
import { CategoryType } from '@/core/category.ts';
import { TransactionType, TransactionEditScopeType, TransactionQuickAddButtonActionType } from '@/core/transaction.ts';
import { AccountCategory } from '@/core/account.ts';
import { TemplateType, ScheduledTemplateFrequencyType } from '@/core/template.ts';
import { KnownFileType } from '@/core/file.ts';

import { KnownErrorCode } from '@/consts/api.ts';
import { SUPPORTED_IMAGE_EXTENSIONS } from '@/consts/file.ts';

import { TransactionTemplate } from '@/models/transaction_template.ts';
import type { TransactionPictureInfoBasicResponse } from '@/models/transaction_picture_info.ts';
import { Transaction } from '@/models/transaction.ts';

import { isDefined } from '@/lib/common.ts';
import { parseBigDecimal } from '@/lib/numeral.ts';
import {
    getTimezoneOffsetMinutes,
    getCurrentUnixTime
} from '@/lib/datetime.ts';
import { formatCoordinate } from '@/lib/coordinate.ts';
import { generateRandomUUID } from '@/lib/misc.ts';
import {
    getTransactionPrimaryCategoryName,
    getTransactionSecondaryCategoryName
} from '@/lib/category.ts';
import { type SetTransactionOptions } from '@/lib/transaction.ts';
import {
    isTransactionFromAITextRecognitionEnabled,
    isTransactionPicturesEnabled,
    getMapProvider
} from '@/lib/server_settings.ts';
import {
    isSupportGetGeoLocationByClick
} from '@/lib/map/index.ts';
import { compressJpgImageByQuality } from '@/lib/ui/common.ts';
import logger from '@/lib/logger.ts';

import {
    mdiMagicStaff,
    mdiDotsVertical,
    mdiEyeOffOutline,
    mdiEyeOutline,
    mdiSwapHorizontal,
    mdiMapMarkerOutline,
    mdiCheck,
    mdiMenuDown,
    mdiImagePlusOutline,
    mdiTrashCanOutline,
    mdiCalendarSyncOutline,
    mdiFullscreen
} from '@mdi/js';

export interface TransactionEditOptions extends SetTransactionOptions {
    id?: string;
    templateType?: number;
    template?: TransactionTemplate;
    currentTransaction?: Transaction;
    currentTemplate?: TransactionTemplate;
    autoUploadPicture?: File;
    autoRecognizeClipboardText?: string;
    noTransactionDraft?: boolean;
    editImmediately?: boolean;
}

interface TransactionEditResponse {
    message: string;
}

type MapViewType = InstanceType<typeof MapView>;
type ConfirmDialogType = InstanceType<typeof ConfirmDialog>;
type SnackBarType = InstanceType<typeof SnackBar>;

const props = defineProps<{
    type: TransactionEditPageType;
    persistent?: boolean;
    show?: boolean;
}>();

const { tt } = useI18n();

const {
    mode,
    isSupportGeoLocation,
    editId,
    addByTemplateId,
    duplicateFromId,
    clientSessionId,
    loading,
    recognizing,
    submitting,
    submitted,
    uploadingPicture,
    geoLocationStatus,
    setGeoLocationByClickMap,
    transaction,
    defaultCurrency,
    coordinateDisplayType,
    imageUploadQualityType,
    allTimezones,
    allVisibleAccounts,
    allVisibleCategorizedAccounts,
    allCategories,
    firstVisibleAccountId,
    hasVisibleExpenseCategories,
    hasVisibleIncomeCategories,
    hasVisibleTransferCategories,
    canAddTransactionPicture,
    title,
    saveButtonTitle,
    cancelButtonTitle,
    sourceAmountName,
    sourceAmountTitle,
    sourceAccountTitle,
    transferInAmountTitle,
    sourceAccountName,
    destinationAccountName,
    sourceAccountCurrency,
    destinationAccountCurrency,
    transactionDisplayTimezone,
    transactionTimezoneTimeDifference,
    geoLocationStatusInfo,
    transactionDescriptionTitle,
    inputEmptyProblemMessage,
    inputIsEmpty,
    createNewTransactionModel,
    setTransactionModel,
    updateTransactionModelFromRecognizedResponse,
    updateTransactionModelByAfterSaveAction,
    updateTransactionTime,
    updateTransactionTimezone,
    swapTransactionData,
    getDisplayAmount,
    getTransactionPictureUrl
} = useTransactionEditPageBase(props.type);

const settingsStore = useSettingsStore();
const userStore = useUserStore();
const accountsStore = useAccountsStore();
const transactionCategoriesStore = useTransactionCategoriesStore();
const transactionTagsStore = useTransactionTagsStore();
const transactionsStore = useTransactionsStore();
const transactionTemplatesStore = useTransactionTemplatesStore();

const map = useTemplateRef<MapViewType>('map');
const confirmDialog = useTemplateRef<ConfirmDialogType>('confirmDialog');
const snackbar = useTemplateRef<SnackBarType>('snackbar');
const pictureInput = useTemplateRef<HTMLInputElement>('pictureInput');

const showState = ref<boolean>(false);
const showPasteTextDialog = ref<boolean>(false);
const activeTab = ref<string>('basicInfo');
const originalTransactionEditable = ref<boolean>(false);
const noTransactionDraft = ref<boolean>(false);
const geoMenuState = ref<boolean>(false);
const removingPictureId = ref<string>('');
const pastedText = ref<string>('');

const initOptions = ref<TransactionEditOptions | undefined>(undefined);

let resolveFunc: ((response?: TransactionEditResponse) => void) | null = null;
let rejectFunc: ((reason?: unknown) => void) | null = null;

const sourceAmountColor = computed<string | undefined>(() => {
    if (transaction.value.type === TransactionType.Expense) {
        return 'expense';
    } else if (transaction.value.type === TransactionType.Income) {
        return 'income';
    } else if (transaction.value.type === TransactionType.Transfer) {
        return 'primary';
    }

    return undefined;
});

const isCreditCardExpense = computed<boolean>(() => {
    const account = accountsStore.allAccountsMap[transaction.value.sourceAccountId];
    return transaction.value.type === TransactionType.Expense && account?.category === AccountCategory.CreditCard.type;
});

watch(isCreditCardExpense, (isCreditCard) => {
    if (!isCreditCard && mode.value === TransactionEditPageMode.Add) {
        transaction.value.installmentCount = 0;
        transaction.value.subscription = false;
    }
});

function displayInstallmentAmount(amount: number): string {
    return getDisplayAmount(parseBigDecimal(amount.toString(10)), false, sourceAccountCurrency.value);
}

function displayInstallmentDate(unixTime: number): string {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date(unixTime * 1000));
}

function normalizeInstallmentCount(): void {
    const installmentCount = Number(transaction.value.installmentCount);

    if (!Number.isFinite(installmentCount) || installmentCount < 2) {
        transaction.value.installmentCount = 2;
        return;
    }

    transaction.value.installmentCount = Math.min(Math.trunc(installmentCount), 120);
}

const isTransactionModified = computed<boolean>(() => {
    if (mode.value === TransactionEditPageMode.Add) {
        return transactionsStore.isTransactionDraftModified(transaction.value, initOptions.value?.amount, initOptions.value?.categoryId, initOptions.value?.accountId, initOptions.value?.tagIds, firstVisibleAccountId.value);
    } else if (mode.value === TransactionEditPageMode.Edit) {
        return true;
    } else {
        return false;
    }
});

function open(options: TransactionEditOptions): Promise<TransactionEditResponse | undefined> {
    addByTemplateId.value = null;
    duplicateFromId.value = null;
    showState.value = true;
    activeTab.value = 'basicInfo';
    loading.value = true;
    submitting.value = false;
    submitted.value = false;
    geoLocationStatus.value = null;
    setGeoLocationByClickMap.value = false;
    originalTransactionEditable.value = false;
    noTransactionDraft.value = options.noTransactionDraft || false;

    initOptions.value = options;

    const newTransaction = createNewTransactionModel(options.type);
    setTransactionModel(newTransaction, options, true);

    const promises: Promise<unknown>[] = [
        accountsStore.loadAllAccounts({ force: false }),
        transactionCategoriesStore.loadAllCategories({ force: false }),
        transactionTagsStore.loadAllTags({ force: false })
    ];

    if (props.type === TransactionEditPageType.Transaction) {
        if (options && options.id) {
            if (options.currentTransaction) {
                setTransactionModel(options.currentTransaction, options, true);
            }

            mode.value = TransactionEditPageMode.View;
            editId.value = options.id;

            promises.push(transactionsStore.getTransaction({ transactionId: editId.value }));
        } else {
            mode.value = TransactionEditPageMode.Add;
            editId.value = null;

            if (options.template) {
                setTransactionModel(options.template, options, false);
                addByTemplateId.value = options.template.id;
            } else if (!options.noTransactionDraft && (settingsStore.appSettings.autoSaveTransactionDraft === 'enabled' || settingsStore.appSettings.autoSaveTransactionDraft === 'confirmation') && transactionsStore.transactionDraft) {
                setTransactionModel(Transaction.ofDraft(transactionsStore.transactionDraft), options, false);
            }

            if (settingsStore.appSettings.autoGetCurrentGeoLocation
                && !geoLocationStatus.value && !transaction.value.geoLocation) {
                updateGeoLocation(false);
            }
        }
    } else if (props.type === TransactionEditPageType.Template) {
        const template = TransactionTemplate.createNewTransactionTemplate(transaction.value);
        template.name = '';

        if (options && options.templateType) {
            template.templateType = options.templateType;
        }

        if (template.templateType === TemplateType.Schedule.type) {
            template.scheduledFrequencyType = ScheduledTemplateFrequencyType.Disabled.type;
            template.scheduledFrequency = '';
        }

        transaction.value = template;

        if (options && options.id) {
            if (options.currentTemplate) {
                setTransactionModel(options.currentTemplate, options, false);
                (transaction.value as TransactionTemplate).fillFrom(options.currentTemplate);
            }

            mode.value = TransactionEditPageMode.Edit;
            editId.value = options.id;
            transaction.value.id = options.id;

            promises.push(transactionTemplatesStore.getTemplate({ templateId: editId.value }));
        } else {
            mode.value = TransactionEditPageMode.Add;
            editId.value = null;
            transaction.value.id = '';
        }
    }

    if (options.type &&
        options.type >= TransactionType.Income &&
        options.type <= TransactionType.Transfer) {
        transaction.value.type = options.type;
    }

    if (mode.value === TransactionEditPageMode.Add) {
        clientSessionId.value = generateRandomUUID();
    }

    Promise.all(promises).then(function (responses) {
        if (editId.value && !responses[3]) {
            if (rejectFunc) {
                if (props.type === TransactionEditPageType.Transaction) {
                    rejectFunc('Unable to retrieve transaction');
                } else if (props.type === TransactionEditPageType.Template) {
                    rejectFunc('Unable to retrieve template');
                }
            }

            return;
        }

        if (props.type === TransactionEditPageType.Transaction && options && options.id && responses[3] && responses[3] instanceof Transaction) {
            const transaction: Transaction = responses[3];
            setTransactionModel(transaction, options, true);
            originalTransactionEditable.value = transaction.editable;

            if (options.editImmediately && (transaction.editable || transaction.installmentCount > 1)) {
                mode.value = TransactionEditPageMode.Edit;
            }
        } else if (props.type === TransactionEditPageType.Template && options && options.id && responses[3] && responses[3] instanceof TransactionTemplate) {
            const template: TransactionTemplate = responses[3];
            setTransactionModel(template, options, false);

            if (!(transaction.value instanceof TransactionTemplate)) {
                transaction.value = TransactionTemplate.createNewTransactionTemplate(transaction.value);
            }

            (transaction.value as TransactionTemplate).fillFrom(template);
        } else {
            setTransactionModel(null, options, true);
        }

        if (options.autoUploadPicture) {
            uploadPicture(options.autoUploadPicture);
        }

        loading.value = false;

        if (isDefined(options.autoRecognizeClipboardText)) {
            pastedText.value = options.autoRecognizeClipboardText;

            if (pastedText.value && !settingsStore.appSettings.alwaysRequireConfirmationOfClipboardContentBeforeSubmission) {
                recognizeText(pastedText.value);
            } else {
                showPasteTextDialog.value = true;
            }
        }
    }).catch(error => {
        logger.error('failed to load essential data for editing transaction', error);

        loading.value = false;
        showState.value = false;

        if (!error.processed) {
            if (rejectFunc) {
                rejectFunc(error);
            }
        }
    });

    return new Promise((resolve, reject) => {
        resolveFunc = resolve;
        rejectFunc = reject;
    });
}

function save(afterAction: AfterSaveAction): void {
    const problemMessage = inputEmptyProblemMessage.value;

    if (problemMessage) {
        snackbar.value?.showMessage(problemMessage);
        return;
    }

    if (props.type === TransactionEditPageType.Transaction && (mode.value === TransactionEditPageMode.Add || mode.value === TransactionEditPageMode.Edit)) {
        const doSubmit = function () {
            submitting.value = true;

            transactionsStore.saveTransaction({
                transaction: transaction.value as Transaction,
                defaultCurrency: defaultCurrency.value,
                isEdit: mode.value === TransactionEditPageMode.Edit,
                clientSessionId: clientSessionId.value
            }).then(() => {
                submitting.value = false;
                submitted.value = true;

                if (mode.value === TransactionEditPageMode.Add && !noTransactionDraft.value && !addByTemplateId.value && !duplicateFromId.value) {
                    transactionsStore.clearTransactionDraft();
                }

                if (mode.value === TransactionEditPageMode.Add && (afterAction === AfterSaveAction.StayWithNewTransaction || afterAction === AfterSaveAction.StayWithCurrentTransaction)) {
                    snackbar.value?.showMessage('You have added a new transaction');
                    updateTransactionModelByAfterSaveAction(afterAction, initOptions.value);
                    clientSessionId.value = generateRandomUUID();
                } else {
                    if (resolveFunc) {
                        if (mode.value === TransactionEditPageMode.Add) {
                            resolveFunc({
                                message: 'You have added a new transaction'
                            });
                        } else if (mode.value === TransactionEditPageMode.Edit) {
                            resolveFunc({
                                message: 'You have saved this transaction'
                            });
                        }
                    }

                    showState.value = false;
                }
            }).catch(error => {
                submitting.value = false;

                if (error.error && (error.error.errorCode === KnownErrorCode.TransactionCannotCreateInThisTime || error.error.errorCode === KnownErrorCode.TransactionCannotModifyInThisTime)) {
                    confirmDialog.value?.open('You have set this time range to prevent editing transactions. Would you like to change the editable transaction range to All?').then(() => {
                        submitting.value = true;

                        userStore.updateUserTransactionEditScope({
                            transactionEditScope: TransactionEditScopeType.All.type
                        }).then(() => {
                            submitting.value = false;

                            snackbar.value?.showMessage('Your editable transaction range has been set to All');
                        }).catch(error => {
                            submitting.value = false;

                            if (!error.processed) {
                                snackbar.value?.showError(error);
                            }
                        });
                    });
                } else if (!error.processed) {
                    snackbar.value?.showError(error);
                }
            });
        };

        if (transaction.value.sourceAmount === 0) {
            confirmDialog.value?.open('Are you sure you want to save this transaction with a zero amount?').then(() => {
                doSubmit();
            });
        } else {
            doSubmit();
        }
    } else if (props.type === TransactionEditPageType.Template && (mode.value === TransactionEditPageMode.Add || mode.value === TransactionEditPageMode.Edit)) {
        submitting.value = true;

        transactionTemplatesStore.saveTemplateContent({
            template: transaction.value as TransactionTemplate,
            isEdit: mode.value === TransactionEditPageMode.Edit,
            clientSessionId: clientSessionId.value
        }).then(() => {
            submitting.value = false;

            if (resolveFunc) {
                if (mode.value === TransactionEditPageMode.Add) {
                    resolveFunc({
                        message: 'You have added a new template'
                    });
                } else if (mode.value === TransactionEditPageMode.Edit) {
                    resolveFunc({
                        message: 'You have saved this template'
                    });
                }
            }

            showState.value = false;
        }).catch(error => {
            submitting.value = false;

            if (!error.processed) {
                snackbar.value?.showError(error);
            }
        });
    }
}

function recognizeText(text: string): void {
    if (recognizing.value || loading.value || submitting.value) {
        return;
    }

    if (!text || !text.trim()) {
        return;
    }

    recognizing.value = true;

    transactionsStore.recognizeTransactionText({ text }).then(response => {
        updateTransactionModelFromRecognizedResponse(response);
        recognizing.value = false;
    }).catch(error => {
        recognizing.value = false;

        if (!error.processed) {
            snackbar.value?.showError(error);
        }
    });
}

function recognizeFromClipboard(): void {
    if (recognizing.value || loading.value || submitting.value) {
        return;
    }

    pastedText.value = '';

    navigator.clipboard.readText().then(text => {
        pastedText.value = text && text.trim() ? text.trim() : '';

        if (pastedText.value && !settingsStore.appSettings.alwaysRequireConfirmationOfClipboardContentBeforeSubmission) {
            recognizeText(pastedText.value);
        } else {
            showPasteTextDialog.value = true;
        }
    }).catch(error => {
        logger.error('failed to read clipboard', error);
        showPasteTextDialog.value = true;
    });
}

function duplicate(withTime?: boolean, withGeoLocation?: boolean): void {
    if (props.type !== TransactionEditPageType.Transaction || mode.value !== TransactionEditPageMode.View) {
        return;
    }

    editId.value = null;
    duplicateFromId.value = transaction.value.id;
    clientSessionId.value = generateRandomUUID();
    submitted.value = false;
    activeTab.value = 'basicInfo';
    transaction.value.id = '';

    if (!withTime) {
        transaction.value.time = getCurrentUnixTime();
        transaction.value.timeZone = settingsStore.appSettings.timeZone;
        transaction.value.utcOffset = getTimezoneOffsetMinutes(transaction.value.time, transaction.value.timeZone);
    }

    if (!withGeoLocation) {
        transaction.value.removeGeoLocation();
    }

    transaction.value.clearPictures();
    mode.value = TransactionEditPageMode.Add;
}

function edit(): void {
    if (props.type !== TransactionEditPageType.Transaction || mode.value !== TransactionEditPageMode.View) {
        return;
    }

    mode.value = TransactionEditPageMode.Edit;
}

function remove(): void {
    if (props.type !== TransactionEditPageType.Transaction ||
        (mode.value !== TransactionEditPageMode.View && mode.value !== TransactionEditPageMode.Edit)) {
        return;
    }

    const confirmationMessage = transaction.value.installmentGroupId
        ? 'Deleting this installment will also delete all past and future installments. Are you sure?'
        : 'Are you sure you want to delete this transaction?';

    confirmDialog.value?.open(confirmationMessage).then(() => {
        submitting.value = true;

        transactionsStore.deleteTransaction({
            transaction: transaction.value as Transaction,
            defaultCurrency: defaultCurrency.value
        }).then(() => {
            if (resolveFunc) {
                resolveFunc();
            }

            submitting.value = false;
            showState.value = false;
        }).catch(error => {
            submitting.value = false;

            if (!error.processed) {
                snackbar.value?.showError(error);
            }
        });
    });
}

function cancel(): void {
    const doClose = function () {
        if (props.type === TransactionEditPageType.Transaction && mode.value === TransactionEditPageMode.Add && submitted.value && resolveFunc) {
            resolveFunc({
                message: 'You have added a new transaction'
            });
        } else if (rejectFunc) {
            rejectFunc();
        }

        showState.value = false;
    };

    if (props.type !== TransactionEditPageType.Transaction || mode.value !== TransactionEditPageMode.Add || noTransactionDraft.value || addByTemplateId.value || duplicateFromId.value) {
        doClose();
        return;
    }

    if (settingsStore.appSettings.autoSaveTransactionDraft === 'confirmation') {
        if (transactionsStore.isTransactionDraftModified(transaction.value, initOptions.value?.amount, initOptions.value?.categoryId, initOptions.value?.accountId, initOptions.value?.tagIds, firstVisibleAccountId.value)) {
            confirmDialog.value?.open('Do you want to save this transaction draft?').then(() => {
                transactionsStore.saveTransactionDraft(transaction.value, initOptions.value?.amount, initOptions.value?.categoryId, initOptions.value?.accountId, initOptions.value?.tagIds, firstVisibleAccountId.value);
                doClose();
            }).catch(() => {
                transactionsStore.clearTransactionDraft();
                doClose();
            });
        } else {
            transactionsStore.clearTransactionDraft();
            doClose();
        }
    } else if (settingsStore.appSettings.autoSaveTransactionDraft === 'enabled') {
        transactionsStore.saveTransactionDraft(transaction.value, initOptions.value?.amount, initOptions.value?.categoryId, initOptions.value?.accountId, initOptions.value?.tagIds, firstVisibleAccountId.value);
        doClose();
    } else {
        doClose();
    }
}

function updateGeoLocation(forceUpdate: boolean): void {
    geoMenuState.value = false;

    if (!isSupportGeoLocation) {
        logger.warn('this browser does not support geo location');

        if (forceUpdate) {
            snackbar.value?.showMessage('Unable to retrieve current position');
        }
        return;
    }

    navigator.geolocation.getCurrentPosition(function (position) {
        if (!position || !position.coords) {
            logger.error('current position is null');
            geoLocationStatus.value = GeoLocationStatus.Error;

            if (forceUpdate) {
                snackbar.value?.showMessage('Unable to retrieve current position');
            }

            return;
        }

        geoLocationStatus.value = GeoLocationStatus.Success;

        transaction.value.setLatitudeAndLongitude(position.coords.latitude, position.coords.longitude);
    }, function (err) {
        logger.error('cannot retrieve current position', err);
        geoLocationStatus.value = GeoLocationStatus.Error;

        if (forceUpdate) {
            snackbar.value?.showMessage('Unable to retrieve current position');
        }
    });

    geoLocationStatus.value = GeoLocationStatus.Getting;
}

function updateSpecifiedGeoLocation(coordinate: Coordinate): void {
    if (isSupportGetGeoLocationByClick() && setGeoLocationByClickMap.value) {
        transaction.value.setLatitudeAndLongitude(coordinate.latitude, coordinate.longitude);
        map.value?.setMarkerPosition(transaction.value.geoLocation);
    }
}

function clearGeoLocation(): void {
    geoMenuState.value = false;
    geoLocationStatus.value = null;
    transaction.value.removeGeoLocation();
}

function showOpenPictureDialog(): void {
    if (!canAddTransactionPicture.value || submitting.value) {
        return;
    }

    pictureInput.value?.click();
}

function uploadPicture(file: File): void {
    if (!file) {
        return;
    }

    uploadingPicture.value = true;
    submitting.value = true;

    compressJpgImageByQuality(file, imageUploadQualityType.value).then(blob => {
        return transactionsStore.uploadTransactionPicture({
            pictureFile: KnownFileType.JPG.createFileFromBlob(blob, "image")
        });
    }).then(response => {
        transaction.value.addPicture(response);
        uploadingPicture.value = false;
        submitting.value = false;
    }).catch(error => {
        uploadingPicture.value = false;
        submitting.value = false;

        if (!error.processed) {
            snackbar.value?.showError(error);
        }
    });
}

function viewOrRemovePicture(pictureInfo: TransactionPictureInfoBasicResponse): void {
    if (mode.value !== TransactionEditPageMode.Add && mode.value !== TransactionEditPageMode.Edit) {
        window.open(getTransactionPictureUrl(pictureInfo), '_blank');
        return;
    }

    confirmDialog.value?.open('Are you sure you want to remove this transaction picture?').then(() => {
        removingPictureId.value = pictureInfo.pictureId;
        submitting.value = true;

        transactionsStore.removeUnusedTransactionPicture({ pictureInfo }).then(response => {
            if (response) {
                transaction.value.removePicture(pictureInfo);
            }

            removingPictureId.value = '';
            submitting.value = false;
        }).catch(error => {
            if (error.error && error.error.errorCode === KnownErrorCode.TransactionPictureNotFound) {
                transaction.value.removePicture(pictureInfo);
            } else if (!error.processed) {
                snackbar.value?.showError(error);
            }

            removingPictureId.value = '';
            submitting.value = false;
        });
    });
}

function onSavingTag(state: boolean): void {
    submitting.value = state;
}

function onUploadPicture(event: Event): void {
    if (!event || !event.target) {
        return;
    }

    const el = event.target as HTMLInputElement;

    if (!el.files || !el.files.length || !el.files[0]) {
        return;
    }

    const pictureFile = el.files[0] as File;

    el.value = '';
    uploadPicture(pictureFile);
}

function onShowDateTimeError(error: string): void {
    snackbar.value?.showError(error);
}

watch(activeTab, (newValue) => {
    if (newValue === 'map') {
        nextTick(() => {
            map.value?.initMapView();
        });
    }
});

defineExpose({
    open
});
</script>

<style>
/* =========================================================
 * TRANSACTION EDIT DIALOG — RAMP COMPACT
 * ======================================================= */

.transaction-edit-dialog .v-overlay__content {
    max-height: calc(100vh - 20px) !important;
}

.transaction-edit-dialog__card {
    display: flex;
    max-height: calc(100vh - 20px);
    flex-direction: column;
    overflow: hidden;

    border: 1px solid rgb(var(--v-theme-muted-border)) !important;
    border-radius: 10px !important;

    color: rgb(var(--v-theme-on-surface));
    background: rgb(var(--v-theme-surface)) !important;

    box-shadow: none !important;

    font-family:
        "Lausanne",
        "Helvetica Neue",
        Arial,
        sans-serif;
}

/* Header */

.transaction-edit-dialog__card > .v-card-item {
    min-height: auto;
    padding: 0 !important;
}

.transaction-edit-dialog__card > .v-card-item .v-card-title {
    width: 100%;
    white-space: normal;
}

.transaction-edit-dialog__header {
    display: flex;
    width: 100%;
    min-width: 0;
    align-items: center;
    gap: 6px;

    padding: 15px 18px;

    border-bottom: 1px solid rgb(var(--v-theme-muted-border));

    background: rgb(var(--v-theme-surface));
}

.transaction-edit-dialog__heading {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 8px;
}

.transaction-edit-dialog__heading h4 {
    margin: 0;

    color: rgb(var(--v-theme-on-surface));

    font-size: clamp(1.25rem, 2vw, 1.65rem);
    font-weight: 500;
    letter-spacing: -0.04em;
    line-height: 1.05;
}

.transaction-edit-dialog__ai-note {
    max-width: 240px;
    margin-left: auto !important;

    color: rgb(var(--v-theme-tertiary));

    font-size: 0.65rem;
    font-weight: 500;
}

.transaction-edit-dialog__header > .v-btn {
    width: 34px !important;
    min-width: 34px !important;
    height: 34px !important;

    margin-left: 0 !important;

    border-radius: 5px !important;

    color: rgb(var(--v-theme-on-surface)) !important;
    background: transparent !important;

    box-shadow: none !important;
}

.transaction-edit-dialog__header > .v-btn:hover {
    background: rgb(var(--v-theme-on-hover-background)) !important;
}

/* Main body */

.transaction-edit-dialog__body {
    display: grid !important;
    grid-template-columns: 170px minmax(0, 1fr);
    flex: 1 1 auto;

    min-height: 0;
    padding: 0 !important;

    overflow: hidden !important;

    background: rgb(var(--v-theme-background));
}

/* Sidebar */

.transaction-edit-dialog__sidebar {
    min-width: 0;
    padding: 12px 10px;

    overflow-y: auto;

    border-right: 1px solid rgb(var(--v-theme-muted-border)) !important;

    background: rgb(var(--v-theme-surface));
}

.transaction-edit-dialog__sidebar::before,
.transaction-edit-dialog__sidebar::after {
    display: none !important;
    content: none !important;
}

.transaction-edit-dialog__sidebar-divider {
    margin: 9px 5px !important;
    border-color: rgb(var(--v-theme-muted-border)) !important;
    opacity: 0 !important;
}

.transaction-edit-dialog__type-tabs {
    width: 100%;
    padding: 4px;

    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 7px;

    background: rgb(var(--v-theme-verticalbutton));
}

.transaction-edit-dialog__type-tabs .v-slide-group__content,
.transaction-edit-dialog__section-tabs .v-slide-group__content {
    gap: 2px;
}

.transaction-edit-dialog__type-tabs .v-tab,
.transaction-edit-dialog__section-tabs .v-tab {
    justify-content: flex-start !important;

    width: 100%;
    min-width: 0 !important;
    min-height: 34px !important;

    padding: 0 10px 0 13px !important;

    border: 0 !important;
    border-radius: 5px !important;

    color: rgb(var(--v-theme-tertiary)) !important;
    background: transparent !important;

    box-shadow: none !important;
    text-transform: none !important;

    font-size: 0.72rem !important;
    font-weight: 500 !important;
    letter-spacing: -0.005em;
}

.transaction-edit-dialog__type-tabs .v-tab:hover,
.transaction-edit-dialog__section-tabs .v-tab:hover {
    color: rgb(var(--v-theme-on-verticalbutton-background)) !important;
    background: rgb(var(--v-theme-verticalbutton-hover)) !important;
}

.transaction-edit-dialog__type-tabs .v-tab.v-tab--selected,
.transaction-edit-dialog__section-tabs .v-tab.v-tab--selected {
    color: rgb(var(--v-theme-on-verticalbutton-background)) !important;
    background: rgb(var(--v-theme-verticalbutton-selected)) !important;

    font-weight: 600 !important;
}

.transaction-edit-dialog__type-tabs .v-tab__slider {
    display: none !important;
}

.transaction-edit-dialog__section-tabs .v-tab {
    position: relative;
}

.transaction-edit-dialog__section-tabs .v-tab__slider {
    position: absolute !important;
    top: 8px !important;
    bottom: 8px !important;
    left: 3px !important;

    width: 2px !important;
    height: auto !important;

    border-radius: 999px;

    background: rgb(var(--v-theme-highlight)) !important;
}

/* Mantém a caixa do seletor de tipo */
.transaction-edit-dialog__type-tabs {
    border: 1px solid rgb(var(--v-theme-muted-border));
}

/* Remove somente a linha espúria das tabs inferiores */
.transaction-edit-dialog__section-tabs,
.transaction-edit-dialog__section-tabs .v-slide-group,
.transaction-edit-dialog__section-tabs .v-slide-group__container,
.transaction-edit-dialog__section-tabs .v-slide-group__content {
    border-right: 0 !important;
    box-shadow: none !important;
}

/* Content */

.transaction-edit-dialog__content {
    display: flex !important;
    min-width: 0;
    min-height: 0;
    flex: 1 1 auto;

    margin: 0 !important;

    overflow-y: auto;

    background: rgb(var(--v-theme-background));
}

.transaction-edit-dialog__panel {
    width: 100%;
    min-width: 0;
}

.transaction-edit-dialog__form {
    width: 100%;
    padding: 16px 18px 18px;
}

.transaction-edit-dialog__form > .v-row {
    margin: -6px !important;
}

.transaction-edit-dialog__form > .v-row > .v-col {
    padding: 6px !important;
}

/* External labels */

.transaction-field {
    position: relative;
    padding-top: 24px !important;
}

.transaction-field::before {
    position: absolute;
    top: 6px;
    right: 6px;
    left: 13px;

    overflow: hidden;

    color: rgb(var(--v-theme-tertiary));

    content: attr(data-field-label);

    font-size: 0.64rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    line-height: 1.1;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.transaction-field .v-field-label,
.transaction-field .v-label.v-field-label {
    display: none !important;
}

.transaction-field .v-field__outline__notch {
    border: 0 !important;
}

.transaction-field .v-field__outline__notch::before,
.transaction-field .v-field__outline__notch::after {
    border: 0 !important;
}

/* Fields 

.transaction-edit-dialog__form .v-field {
    min-height: 38px !important;

    border: 1px solid rgb(var(--v-theme-border)) !important;
    border-radius: 6px !important;

    color: rgb(var(--v-theme-on-surface)) !important;
    background: rgb(var(--v-theme-surface)) !important;

    box-shadow: none !important;
}

.transaction-edit-dialog__form .v-field:hover {
    border-color: rgb(var(--v-theme-on-hover-border)) !important;
    background: rgb(var(--v-theme-on-hover-background)) !important;
}

.transaction-edit-dialog__form .v-field--focused {
    border-color: rgb(var(--v-theme-on-surface)) !important;
    box-shadow: 0 0 0 1px rgb(var(--v-theme-on-surface)) !important;
}

.transaction-edit-dialog__form .v-field__outline,
.transaction-edit-dialog__form .v-field__overlay {
    display: none !important;
}

.transaction-edit-dialog__form .v-field__input {
    min-height: 36px !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;

    font-size: 0.76rem !important;
}

.transaction-edit-dialog__form .v-field__prepend-inner,
.transaction-edit-dialog__form .v-field__append-inner {
    padding-top: 0 !important;
    align-items: center !important;
} 

*/

/* Amount */

.transaction-edit-dialog .v-icon__svg {
    width: 100%;
    height: 100%;
}

.transaction-edit-dialog .transaction-edit-amount .v-field {
    min-height: 48px !important;
}

.transaction-edit-dialog .transaction-edit-amount .v-field__input {
    min-height: 48px !important;
    padding-block: 0 !important;
}

.transaction-edit-dialog .transaction-edit-amount .v-field__prepend-inner,
.transaction-edit-dialog .transaction-edit-amount .v-field__append-inner,
.transaction-edit-dialog .transaction-edit-amount .v-field__field,
.transaction-edit-dialog .transaction-edit-amount .v-field__input,
.transaction-edit-dialog .transaction-edit-amount .v-field__input input,
.transaction-edit-dialog .transaction-edit-amount input {
    font-size: 1.85rem !important;
    font-weight: 500 !important;
    line-height: 1 !important;
    letter-spacing: -0.045em !important;
}

/* Textarea */

.transaction-edit-dialog__form .v-textarea .v-field {
    min-height: 78px !important;
}

.transaction-edit-dialog__form .v-textarea .v-field__input {
    min-height: 74px !important;
    padding-top: 9px !important;
    padding-bottom: 9px !important;

    line-height: 1.35;
}

/* Credit card purchase options */

.transaction-credit-card-options-column {
    padding-top: 2px;
}

.transaction-credit-card-options {
    display: flex;
    flex-direction: column;
    gap: 14px;

    width: 100%;
    padding: 16px;

    background: rgb(var(--v-theme-surface));
    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 10px;
}

.transaction-credit-card-options__header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
}

.transaction-credit-card-options__header > div {
    min-width: 0;
}

.transaction-credit-card-options__eyebrow {
    display: block;
    margin-bottom: 2px;

    color: rgb(var(--v-theme-tertiary));

    font-size: 0.68rem;
    font-weight: 500;
    line-height: 1.35;
}

.transaction-credit-card-options__header h3 {
    margin: 0;

    color: rgb(var(--v-theme-on-surface));

    font-size: 0.88rem;
    font-weight: 600;
    line-height: 1.4;
}

.transaction-credit-card-options__hint {
    max-width: 280px;

    color: rgb(var(--v-theme-tertiary));

    font-size: 0.72rem;
    font-weight: 400;
    line-height: 1.4;
    text-align: right;
}

.transaction-credit-card-options__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}

.transaction-credit-card-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;

    min-width: 0;
    min-height: 72px;
    padding: 12px 14px;

    background: rgb(var(--v-theme-background));
    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 8px;

    transition:
        background-color 0.15s ease,
        border-color 0.15s ease;
}

.transaction-credit-card-option--active {
    background: rgba(var(--v-theme-primary), 0.06);
    border-color: rgba(var(--v-theme-primary), 0.35);
}

.transaction-credit-card-option__content {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
}

.transaction-credit-card-option__content strong {
    color: rgb(var(--v-theme-on-surface));

    font-size: 0.78rem;
    font-weight: 600;
    line-height: 1.4;
}

.transaction-credit-card-option__content span {
    margin-top: 3px;

    color: rgb(var(--v-theme-tertiary));

    font-size: 0.7rem;
    font-weight: 400;
    line-height: 1.4;
}

.transaction-credit-card-option__switch {
    flex: 0 0 auto;
}

.transaction-credit-card-installments {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;

    padding-top: 14px;

    border-top: 1px solid rgb(var(--v-theme-muted-border));
}

.transaction-credit-card-installments__text {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
}

.transaction-credit-card-installments__text strong {
    color: rgb(var(--v-theme-on-surface));

    font-size: 0.76rem;
    font-weight: 600;
    line-height: 1.4;
}

.transaction-credit-card-installments__text span {
    margin-top: 2px;

    color: rgb(var(--v-theme-tertiary));

    font-size: 0.7rem;
    line-height: 1.4;
}

.transaction-credit-card-installments__input {
    flex: 0 0 120px;
    width: 120px;
}

@media (max-width: 700px) {
    .transaction-credit-card-options__header {
        align-items: flex-start;
        flex-direction: column;
        gap: 4px;
    }

    .transaction-credit-card-options__hint {
        max-width: none;
        text-align: left;
    }

    .transaction-credit-card-options__grid {
        grid-template-columns: 1fr;
    }

    .transaction-credit-card-installments {
        align-items: stretch;
        flex-direction: column;
        gap: 10px;
    }

    .transaction-credit-card-installments__input {
        flex: 1 1 auto;
        width: 100%;
    }
}

/* Alerts / cards */



/* Map / pictures */

.transaction-edit-dialog__panel > .v-row,
.transaction-pictures {
    margin: 0 !important;
    padding: 16px 18px;
}

.transaction-edit-map-view {
    height: 320px;

    overflow: hidden;

    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 8px;
}

.transaction-picture,
.transaction-picture-add {
    overflow: hidden;
    border-radius: 7px !important;
    box-shadow: none !important;
}

.transaction-picture .picture-control-icon {
    display: none;
    position: absolute;
    width: 100% !important;
    height: 100% !important;
    background-color: rgba(0, 0, 0, 0.4);
}

.transaction-picture .picture-control-icon > i.v-icon {
    color: rgba(255, 255, 255, 0.8);
    background-color: transparent;
}

.transaction-picture:hover .picture-control-icon,
.transaction-picture .picture-control-icon.show-control-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.transaction-picture-add {
    border: 1px dashed rgb(var(--v-theme-grey-500));
}

.transaction-picture-add .transaction-picture-add-icon {
    color: rgb(var(--v-theme-grey-500));
}

.transaction-picture-add.enabled:hover {
    border-color: rgb(var(--v-theme-grey-700));
}

/* Footer */

.transaction-edit-dialog__footer {
    flex: 0 0 auto;
    padding: 16px 16px !important;
    border-top: 1px solid rgb(var(--v-theme-muted-border));
    background: rgb(var(--v-theme-surface));
}

.transaction-edit-dialog__footer-actions {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 16px !important;
}

.transaction-edit-dialog__footer .v-btn {
    font-size: 0.82rem !important;
    font-weight: 600 !important;
    letter-spacing: 0 !important;
}


.transaction-edit-dialog__footer .v-btn-group .v-btn:last-child {
    border-left: 1px solid rgba(var(--v-theme-on-background), 0.16) !important;
}

.transaction-edit-dialog__footer .v-btn-group .v-icon__svg {
    fill: rgb(var(--v-theme-on-primary)) !important;
}

.transaction-edit-dialog__footer .v-btn.text-secondary,
.transaction-edit-dialog__footer .v-btn.bg-secondary {
    border-color: rgb(var(--v-theme-border)) !important;
    color: rgb(var(--v-theme-on-surface)) !important;
    background: rgb(var(--v-theme-surface)) !important;
}

.transaction-edit-dialog__footer .v-btn.text-secondary:hover,
.transaction-edit-dialog__footer .v-btn.bg-secondary:hover {
    border-color: rgb(var(--v-theme-on-hover-border)) !important;
    background: rgb(var(--v-theme-on-hover-background)) !important;
}

.transaction-edit-dialog__footer .v-btn.text-warning {
    border-color: rgba(var(--v-theme-warning), 0.3) !important;
    color: rgb(var(--v-theme-warning)) !important;
    background: rgba(var(--v-theme-warning), 0.08) !important;
}

.transaction-edit-dialog__footer .v-btn.text-error {
    border-color: rgba(var(--v-theme-error), 0.3) !important;
    color: rgb(var(--v-theme-error)) !important;
    background: rgba(var(--v-theme-error), 0.08) !important;
}

.transaction-edit-dialog__footer .v-btn.v-btn--disabled {
    border-color: rgb(var(--v-theme-muted-border)) !important;
    color: rgba(var(--v-theme-on-surface), 0.46) !important;
    background: rgb(var(--v-theme-background)) !important;
    opacity: 1 !important;
}

.transaction-edit-dialog__footer .v-btn .v-btn__overlay,
.transaction-edit-dialog__footer .v-btn .v-btn__underlay {
    opacity: 0 !important;
}

/* Paste dialog */

.transaction-paste-dialog__card {
    overflow: hidden;

    border: 1px solid rgb(var(--v-theme-muted-border)) !important;
    border-radius: 9px !important;

    background: rgb(var(--v-theme-surface)) !important;

    box-shadow: none !important;
}

.transaction-edit-timezone.v-input input::placeholder {
    color: rgba(
        var(--v-theme-on-background),
        var(--v-high-emphasis-opacity)
    ) !important;
    opacity: unset;
}

.transaction-time-picker-menu .dp--menu {
    --dp-background-color: rgb(var(--v-theme-background));
}

/* Responsive */

@media (max-width: 900px) {
    .transaction-edit-dialog .v-overlay__content {
        max-height: calc(100vh - 12px) !important;
    }

    .transaction-edit-dialog__card {
        max-height: calc(100vh - 12px);
        border-radius: 8px !important;
    }

    .transaction-edit-dialog__header {
        padding: 12px 14px;
    }

    .transaction-edit-dialog__ai-note {
        display: none;
    }

    .transaction-edit-dialog__body {
        display: flex !important;
        flex-direction: column;
    }

    .transaction-edit-dialog__sidebar {
        display: flex;
        flex: 0 0 auto;
        gap: 8px;

        padding: 8px 10px;

        overflow-x: auto;
        overflow-y: hidden;

        border-bottom: 1px solid rgb(var(--v-theme-muted-border));
    }

    .transaction-edit-dialog__type-tabs,
    .transaction-edit-dialog__section-tabs {
        width: auto;
        min-width: max-content;
    }

    .transaction-edit-dialog__type-tabs .v-slide-group__content,
    .transaction-edit-dialog__section-tabs .v-slide-group__content {
        flex-direction: row !important;
    }

    .transaction-edit-dialog__type-tabs .v-tab,
    .transaction-edit-dialog__section-tabs .v-tab {
        width: auto;
        min-width: auto !important;
    }

    .transaction-edit-dialog__section-tabs .v-tab__slider {
        top: auto !important;
        right: 7px !important;
        bottom: 0 !important;
        left: 7px !important;
        width: auto !important;
        height: 2px !important;
    }

    .transaction-edit-dialog__sidebar-divider {
        display: none;
    }

    .transaction-edit-dialog__form {
        padding: 14px 12px 16px;
    }

    .transaction-edit-dialog__panel > .v-row,
    .transaction-pictures {
        padding: 14px 12px;
    }

    .transaction-edit-dialog__footer {
        padding: 8px 12px !important;
    }
}

@media (max-width: 600px) {
    .transaction-edit-dialog .v-overlay__content {
        width: calc(100vw - 8px) !important;
        max-width: calc(100vw - 8px) !important;
        max-height: calc(100vh - 8px) !important;
        margin: 4px !important;
    }

    .transaction-edit-dialog__card {
        max-height: calc(100vh - 8px);
        border-radius: 6px !important;
    }

    .transaction-edit-dialog__heading h4 {
        font-size: 1.15rem;
    }

    .transaction-edit-dialog__form > .v-row {
        margin: -5px !important;
    }

    .transaction-edit-dialog__form > .v-row > .v-col {
        padding: 5px !important;
    }

    .transaction-edit-dialog .transaction-edit-amount .v-field__prepend-inner,
    .transaction-edit-dialog .transaction-edit-amount .v-field__append-inner,
    .transaction-edit-dialog .transaction-edit-amount .v-field__field,
    .transaction-edit-dialog .transaction-edit-amount .v-field__input,
    .transaction-edit-dialog .transaction-edit-amount .v-field__input input,
    .transaction-edit-dialog .transaction-edit-amount input {
        font-size: 1.7rem !important;
    }

    .transaction-edit-dialog__footer-actions {
        display: grid;
        grid-template-columns: 1fr;
    }

    .transaction-edit-dialog__footer-actions > *,
    .transaction-edit-dialog__footer-actions .v-btn-group,
    .transaction-edit-dialog__footer-actions .v-btn {
        width: 100%;
    }
}

/* =========================================================
 * DETALHES DE PARCELAMENTO
 * ======================================================= */

.transaction-installments-column {
    padding-top: 6px !important;
    padding-bottom: 6px !important;
}

.transaction-installments {
    overflow: hidden;

    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 8px;

    background: rgb(var(--v-theme-surface));
}

.transaction-installments__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;

    padding: 12px 14px;

    border-bottom: 1px solid rgb(var(--v-theme-muted-border));
}

.transaction-installments__eyebrow {
    display: block;
    margin-bottom: 0px;

    color: rgb(var(--v-theme-tertiary));

    font-size: 0.58rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.transaction-installments__header h3 {
    margin: 0;

    color: rgb(var(--v-theme-on-surface));

    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: -0.02em;
}

.transaction-installments__counter {
    flex: 0 0 auto;

    padding: 4px 7px;

    border-radius: 5px;

    color: rgb(var(--v-theme-tertiary));
    background: rgb(var(--v-theme-secondary));

    font-size: 0.80rem;
    font-weight: 600;
}

.transaction-installments__summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    border-bottom: 1px solid rgb(var(--v-theme-muted-border));
}

.transaction-installments__metric {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 4px;
    padding: 10px 14px;
}

.transaction-installments__metric + .transaction-installments__metric {
    border-left: 1px solid rgb(var(--v-theme-muted-border));
}

.transaction-installments__metric span {
    color: rgb(var(--v-theme-tertiary));
    font-size: 0.80rem;
    font-weight: 500;
    margin-bottom: -4px !important
}

.transaction-installments__metric strong {
    overflow: hidden;
    color: rgb(var(--v-theme-on-surface));
    font-size: 0.90rem;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.transaction-installments__paid {
    color: rgb(var(--v-theme-income)) !important;
}

.transaction-installments__pending {
    color: rgb(var(--v-theme-expense)) !important;
}

.transaction-installments__list {
    max-height: 250px;

    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;

    scrollbar-width: thin;
    scrollbar-color:
        rgb(var(--v-theme-perfect-scrollbar-thumb))
        transparent;
}

.transaction-installments__list::-webkit-scrollbar {
    width: 6px;
}

.transaction-installments__list::-webkit-scrollbar-track {
    background: transparent;
}

.transaction-installments__list::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: rgb(var(--v-theme-perfect-scrollbar-thumb));
}

.transaction-installments__item {
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;

    min-height: 54px;
    padding: 8px 12px;

    border-bottom: 1px solid rgb(var(--v-theme-muted-border));

    background: rgb(var(--v-theme-surface));
}

.transaction-installments__item:last-child {
    border-bottom: 0;
}

.transaction-installments__item:hover {
    background: rgb(var(--v-theme-on-hover-background));
}

.transaction-installments__item--pending {
    background: rgba(var(--v-theme-primary), 0.035);
}

.transaction-installments__number {
    display: grid;
    width: 26px;
    height: 26px;
    place-items: center;

    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 50%;

    color: rgb(var(--v-theme-tertiary));
    background: rgb(var(--v-theme-secondary));

    font-size: 0.80rem;
    font-weight: 600;
}

.transaction-installments__content {
    min-width: 0;
}

.transaction-installments__item-heading {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 7px;
}

.transaction-installments__item-heading strong {
    overflow: hidden;

    color: rgb(var(--v-theme-on-surface));

    font-size: 0.80rem;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.transaction-installments__status {
    flex: 0 0 auto;
    padding: 3px 6px;
    border-radius: 4px;
    font-size: 0.70rem;
    font-weight: 600;
}

.transaction-installments__status--paid {
    color: rgb(var(--v-theme-income));
    background: rgba(var(--v-theme-income), 0.09);
}

.transaction-installments__status--pending {
    color: rgb(var(--v-theme-expense));
    background: rgba(var(--v-theme-expense), 0.09);
}

.transaction-installments__dates {
    display: flex;
    min-width: 0;
    gap: 10px;

    margin-top: 3px;

    color: rgb(var(--v-theme-tertiary));

    font-size: 0.70rem;
    line-height: 1.3;
}

.transaction-installments__dates span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.transaction-installments__amount {
    color: rgb(var(--v-theme-on-surface));

    font-size: 0.80rem;
    font-weight: 600;
    white-space: nowrap;
}


/* =========================================================
 * CORREÇÃO DEFINITIVA DA ROLAGEM DO DIÁLOGO
 *
 * Este bloco precisa permanecer no final do <style>.
 * O elemento rolável passa a ser o painel ativo do v-window.
 * Header, sidebar e footer permanecem fixos.
 * ======================================================= */

.transaction-edit-dialog .v-overlay__content {
    width: min(920px, calc(100vw - 24px)) !important;
    max-width: calc(100vw - 24px) !important;

    height: min(760px, calc(100dvh - 20px)) !important;
    max-height: calc(100dvh - 20px) !important;

    margin: 10px !important;
}

/*
 * O card precisa receber uma altura real.
 * Somente max-height não cria uma área limitada para overflow.
 */
.transaction-edit-dialog__card {
    display: flex !important;

    width: 100% !important;
    height: 100% !important;
    min-height: 0 !important;
    max-height: 100% !important;

    flex-direction: column !important;

    overflow: hidden !important;
}

/* Header não rola nem encolhe. */
.transaction-edit-dialog__card > .v-card-item {
    flex: 0 0 auto !important;
}

/*
 * O body ocupa exatamente o espaço restante entre header e footer.
 * height: 0 + flex: 1 1 0 impede que o conteúdo expanda o card.
 */
.transaction-edit-dialog__body {
    display: grid !important;
    grid-template-columns: 170px minmax(0, 1fr) !important;

    width: 100% !important;
    height: 0 !important;
    min-width: 0 !important;
    min-height: 0 !important;

    flex: 1 1 0 !important;

    padding: 0 !important;

    overflow: hidden !important;
}

/* Sidebar com rolagem própria, caso fique maior que o diálogo. */
.transaction-edit-dialog__sidebar {
    height: 100% !important;
    min-height: 0 !important;

    overflow-x: hidden !important;
    overflow-y: auto !important;

    overscroll-behavior: contain;
}

/*
 * O v-window é somente a moldura da área de conteúdo.
 * Ele não deve crescer nem rolar.
 */
.transaction-edit-dialog__content {
    display: block !important;

    width: 100% !important;
    height: 100% !important;
    min-width: 0 !important;
    min-height: 0 !important;

    flex: none !important;

    margin: 0 !important;

    overflow: hidden !important;
}

/*
 * O Vuetify cria este container intermediário.
 * Sem limitar sua altura, ele cresce junto com o formulário.
 */
.transaction-edit-dialog__content > .v-window__container {
    display: block !important;

    width: 100% !important;
    height: 100% !important;
    min-width: 0 !important;
    min-height: 0 !important;

    overflow: hidden !important;
}

/*
 * Cada painel ocupa a altura disponível.
 * Somente o painel ativo recebe rolagem vertical.
 */
.transaction-edit-dialog__content .v-window-item {
    width: 100% !important;
    height: 100% !important;
    min-width: 0 !important;
    min-height: 0 !important;

    overflow: hidden !important;
}

.transaction-edit-dialog__content .v-window-item.v-window-item--active {
    display: block !important;

    overflow-x: hidden !important;
    overflow-y: auto !important;

    overscroll-behavior: contain;
    scrollbar-gutter: stable;
}

/*
 * O formulário pode crescer dentro do painel rolável,
 * mas não pode alterar a altura estrutural do v-window.
 */
.transaction-edit-dialog__form {
    width: 100% !important;
    min-height: min-content !important;
    height: auto !important;
}

/*
 * Os painéis de mapa e imagens também rolam corretamente.
 */
.transaction-edit-dialog__panel > .v-row,
.transaction-pictures {
    min-height: min-content;
}

/* Footer permanece sempre visível. */
.transaction-edit-dialog__footer {
    position: relative;
    z-index: 3;

    flex: 0 0 auto !important;

    margin: 0 !important;
}

/*
 * Remove a margem superior artificial existente no bloco anterior.
 * Ela aumentava o rodapé e diminuía a área disponível para o formulário.
 */
.transaction-edit-dialog__footer-actions {
    margin-top: 0 !important;
}

/* Scrollbar discreta da área principal e da sidebar. */
.transaction-edit-dialog__content .v-window-item.v-window-item--active,
.transaction-edit-dialog__sidebar {
    scrollbar-width: thin;
    scrollbar-color:
        rgb(var(--v-theme-perfect-scrollbar-thumb))
        transparent;
}

.transaction-edit-dialog__content
    .v-window-item.v-window-item--active::-webkit-scrollbar,
.transaction-edit-dialog__sidebar::-webkit-scrollbar {
    width: 6px;
}

.transaction-edit-dialog__content
    .v-window-item.v-window-item--active::-webkit-scrollbar-track,
.transaction-edit-dialog__sidebar::-webkit-scrollbar-track {
    background: transparent;
}

.transaction-edit-dialog__content
    .v-window-item.v-window-item--active::-webkit-scrollbar-thumb,
.transaction-edit-dialog__sidebar::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: rgb(var(--v-theme-perfect-scrollbar-thumb));
}

/* =========================================================
 * TABLET
 * ======================================================= */

@media (max-width: 900px) {
    .transaction-edit-dialog .v-overlay__content {
        width: min(920px, calc(100vw - 12px)) !important;
        max-width: calc(100vw - 12px) !important;

        height: calc(100dvh - 12px) !important;
        max-height: calc(100dvh - 12px) !important;

        margin: 6px !important;
    }

    .transaction-edit-dialog__body {
        display: flex !important;

        width: 100% !important;
        height: 0 !important;
        min-height: 0 !important;

        flex: 1 1 0 !important;
        flex-direction: column !important;
    }

    .transaction-edit-dialog__sidebar {
        width: 100% !important;
        height: auto !important;
        min-height: auto !important;

        flex: 0 0 auto !important;

        overflow-x: auto !important;
        overflow-y: hidden !important;
    }

    .transaction-edit-dialog__content {
        width: 100% !important;
        height: 0 !important;
        min-height: 0 !important;

        flex: 1 1 0 !important;
    }
}

/* =========================================================
 * MOBILE
 * ======================================================= */

@media (max-width: 600px) {
    .transaction-edit-dialog .v-overlay__content {
        width: calc(100vw - 8px) !important;
        max-width: calc(100vw - 8px) !important;

        height: calc(100dvh - 8px) !important;
        max-height: calc(100dvh - 8px) !important;

        margin: 4px !important;
    }
}


/* =========================================================
 * NOVA ESTRATÉGIA DE ROLAGEM
 *
 * O próprio corpo central do diálogo é a única área rolável.
 * Não há rolagem no v-window nem no v-window-item.
 * ======================================================= */

.transaction-edit-dialog .v-overlay__content {
    width: min(920px, calc(100vw - 24px)) !important;
    max-width: calc(100vw - 24px) !important;

    height: min(760px, calc(100dvh - 20px)) !important;
    max-height: calc(100dvh - 20px) !important;

    margin: 10px !important;
}

.transaction-edit-dialog__card {
    display: flex !important;

    width: 100% !important;
    height: 100% !important;
    min-height: 0 !important;
    max-height: 100% !important;

    flex-direction: column !important;

    overflow: hidden !important;
}

/* Header fixo */
.transaction-edit-dialog__card > .v-card-item {
    flex: 0 0 auto !important;
}

/*
 * ÚNICA ÁREA ROLÁVEL.
 *
 * O body passa a controlar toda a rolagem vertical.
 */
.transaction-edit-dialog__body {
    display: grid !important;
    grid-template-columns: 170px minmax(0, 1fr) !important;
    align-items: start !important;

    width: 100% !important;
    height: auto !important;
    min-width: 0 !important;
    min-height: 0 !important;

    flex: 1 1 auto !important;

    padding: 0 !important;

    overflow-x: hidden !important;
    overflow-y: auto !important;

    overscroll-behavior: contain;
    scrollbar-gutter: stable;

    background: rgb(var(--v-theme-background));
}

/*
 * Sidebar acompanha a rolagem do body, mas permanece visível
 * no desktop enquanto o formulário desce.
 */
.transaction-edit-dialog__sidebar {
    position: sticky !important;
    top: 0 !important;
    align-self: start !important;

    width: 170px !important;
    min-width: 170px !important;
    max-height: 100% !important;

    overflow-x: hidden !important;
    overflow-y: auto !important;

    background: rgb(var(--v-theme-surface));
}

/*
 * O v-window volta ao fluxo natural.
 */
.transaction-edit-dialog__content {
    display: block !important;

    width: 100% !important;
    height: auto !important;
    min-width: 0 !important;
    min-height: 0 !important;

    flex: none !important;

    margin: 0 !important;

    overflow: visible !important;
}

.transaction-edit-dialog__content > .v-window__container {
    display: block !important;

    width: 100% !important;
    height: auto !important;
    min-height: 0 !important;

    overflow: visible !important;
}

.transaction-edit-dialog__content .v-window-item,
.transaction-edit-dialog__content .v-window-item.v-window-item--active {
    width: 100% !important;
    height: auto !important;
    min-height: 0 !important;

    overflow: visible !important;
}

/*
 * Formulário em altura natural.
 */
.transaction-edit-dialog__form {
    width: 100% !important;
    height: auto !important;
    min-height: 0 !important;
}

/* Footer fixo */
.transaction-edit-dialog__footer {
    position: relative;
    z-index: 4;

    flex: 0 0 auto !important;

    margin: 0 !important;
}

.transaction-edit-dialog__footer-actions {
    margin-top: 0 !important;
}

/* Scrollbar do body */
.transaction-edit-dialog__body {
    scrollbar-width: thin;
    scrollbar-color:
        rgb(var(--v-theme-perfect-scrollbar-thumb))
        transparent;
}

.transaction-edit-dialog__body::-webkit-scrollbar {
    width: 7px;
}

.transaction-edit-dialog__body::-webkit-scrollbar-track {
    background: transparent;
}

.transaction-edit-dialog__body::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: rgb(var(--v-theme-perfect-scrollbar-thumb));
}

/* =========================================================
 * TABLET
 * ======================================================= */

@media (max-width: 900px) {
    .transaction-edit-dialog .v-overlay__content {
        width: calc(100vw - 12px) !important;
        max-width: calc(100vw - 12px) !important;

        height: calc(100dvh - 12px) !important;
        max-height: calc(100dvh - 12px) !important;

        margin: 6px !important;
    }

    .transaction-edit-dialog__body {
        display: block !important;
    }

    .transaction-edit-dialog__sidebar {
        position: static !important;

        display: flex !important;
        width: 100% !important;
        min-width: 0 !important;
        max-height: none !important;

        overflow-x: auto !important;
        overflow-y: hidden !important;

        border-bottom: 1px solid rgb(var(--v-theme-muted-border));
    }

    .transaction-edit-dialog__content {
        width: 100% !important;
    }
}

/* =========================================================
 * MOBILE
 * ======================================================= */

@media (max-width: 600px) {
    .transaction-edit-dialog .v-overlay__content {
        width: calc(100vw - 8px) !important;
        max-width: calc(100vw - 8px) !important;

        height: calc(100dvh - 8px) !important;
        max-height: calc(100dvh - 8px) !important;

        margin: 4px !important;
    }
}


/* =========================================================
 * FOOTER FINAL — BOTÕES ALINHADOS E ISOLADOS
 *
 * Este bloco precisa permanecer no final do <style>.
 * Não estiliza v-btn-group globalmente fora deste diálogo.
 * ======================================================= */

.transaction-edit-dialog__footer {
    padding: 16px 16px !important;

    border-top: 1px solid rgb(var(--v-theme-muted-border));

    background: rgb(var(--v-theme-surface));
}

.transaction-edit-dialog__footer-actions {
    display: flex !important;
    width: 100% !important;
    min-height: 38px;
    align-items: center !important;
    justify-content: flex-end !important;
    flex-wrap: wrap !important;
    gap: 8px !important;

    margin-top: 16px !important;
}

/*
 * Wrapper criado pelo tooltip do botão Salvar/Adicionar.
 * Sem isto, o grupo pode ficar desalinhado verticalmente.
 */
.transaction-edit-dialog__footer-actions > .d-inline-block {
    display: inline-flex !important;
    flex: 0 0 auto;
    align-items: center !important;

    height: 38px;
    margin: 0 !important;
}

/* =========================================================
 * BOTÕES INDIVIDUAIS
 * ======================================================= */

.transaction-edit-dialog__footer-actions > .v-btn {
    flex: 0 0 auto;

    height: 38px !important;
    min-height: 38px !important;

    padding-inline: 16px !important;

    border: 1px solid transparent !important;
    border-radius: 6px !important;

    box-shadow: none !important;
    text-transform: none !important;
    letter-spacing: 0 !important;

    font-size: 0.78rem !important;
    font-weight: 600 !important;
    line-height: 1 !important;
}

.transaction-edit-dialog__footer-actions > .v-btn .v-btn__content {
    height: 100%;
    align-items: center;
}

/* Editar */
.transaction-edit-dialog__footer-actions > .v-btn.text-warning {
    border-color: rgba(var(--v-theme-warning), 0.28) !important;

    color: rgb(var(--v-theme-warning)) !important;
    background: rgba(var(--v-theme-warning), 0.10) !important;
}

.transaction-edit-dialog__footer-actions > .v-btn.text-warning:hover {
    border-color: rgb(var(--v-theme-warning)) !important;

    color: rgb(var(--v-theme-on-warning)) !important;
    background: rgb(var(--v-theme-warning)) !important;
}

/* Excluir */
.transaction-edit-dialog__footer-actions > .v-btn.text-error {
    border-color: rgba(var(--v-theme-error), 0.28) !important;

    color: rgb(var(--v-theme-error)) !important;
    background: rgba(var(--v-theme-error), 0.10) !important;
}

.transaction-edit-dialog__footer-actions > .v-btn.text-error:hover {
    border-color: rgb(var(--v-theme-error)) !important;

    color: rgb(var(--v-theme-on-error)) !important;
    background: rgb(var(--v-theme-error)) !important;
}

/* Cancelar / Fechar */
.transaction-edit-dialog__footer-actions > .v-btn.text-secondary {
    border-color: rgb(var(--v-theme-border)) !important;

    color: rgb(var(--v-theme-on-surface)) !important;
    background: rgb(var(--v-theme-surface)) !important;
}

.transaction-edit-dialog__footer-actions > .v-btn.text-secondary:hover {
    border-color: rgb(var(--v-theme-on-hover-border)) !important;

    background: rgb(var(--v-theme-on-hover-background)) !important;
}

/* Remove tonal overlay apenas no footer */
.transaction-edit-dialog__footer-actions .v-btn__overlay,
.transaction-edit-dialog__footer-actions .v-btn__underlay {
    opacity: 0 !important;
}

/* =========================================================
 * GRUPOS NATIVOS — SALVAR / ADICIONAR
 * ======================================================= */

/*
 * O grupo fica dentro do wrapper do tooltip.
 * Estas regras não atingem o botão Duplicar.
 */
.transaction-edit-dialog__footer-actions
    > .d-inline-block
    > .v-btn-group {
    display: inline-flex !important;
    flex: 0 0 auto;
    align-items: stretch !important;

    height: 38px !important;
    min-height: 38px !important;

    margin: 0 !important;
    overflow: hidden !important;

    border: 0 !important;
    border-radius: 6px !important;

    box-shadow: none !important;
}

.transaction-edit-dialog__footer-actions
    > .d-inline-block
    > .v-btn-group
    > .v-btn {
    height: 38px !important;
    min-height: 38px !important;

    margin: 0 !important;

    border-radius: 0 !important;

    box-shadow: none !important;
    text-transform: none !important;
    letter-spacing: 0 !important;

    font-size: 0.78rem !important;
    font-weight: 600 !important;
    line-height: 1 !important;
}

.transaction-edit-dialog__footer-actions
    > .d-inline-block
    > .v-btn-group
    > .v-btn:first-child {
    min-width: 92px !important;
    padding-inline: 16px !important;

    border-radius: 6px 0 0 6px !important;
}

.transaction-edit-dialog__footer-actions
    > .d-inline-block
    > .v-btn-group
    > .v-btn:last-child.v-btn--icon {
    width: 38px !important;
    min-width: 38px !important;

    padding: 0 !important;

    border-left: 1px solid rgba(var(--v-theme-on-primary), 0.18) !important;
    border-radius: 0 6px 6px 0 !important;
}

.transaction-edit-dialog__footer-actions
    > .d-inline-block
    > .v-btn-group
    .v-btn__content {
    height: 100%;
    align-items: center;
    justify-content: center;
}

.transaction-edit-dialog__footer-actions
    > .d-inline-block
    > .v-btn-group
    .v-icon__svg {
    fill: currentColor !important;
}

/* =========================================================
 * SPLIT BUTTON — DUPLICAR
 * ======================================================= */

.duplicate-split-button {
    display: inline-flex !important;
    flex: 0 0 auto;
    align-items: stretch !important;

    height: 38px !important;
    min-height: 38px !important;

    margin: 0 !important;
    overflow: hidden;

    border: 1px solid rgb(var(--v-theme-border));
    border-radius: 6px;

    background: rgb(var(--v-theme-secondary));
}

.duplicate-split-button > .v-btn {
    height: 36px !important;
    min-height: 36px !important;

    margin: 0 !important;
    padding: 0 !important;

    border: 0 !important;
    border-radius: 0 !important;

    color: rgb(var(--v-theme-on-secondary)) !important;
    background: transparent !important;

    box-shadow: none !important;
    text-transform: none !important;
    letter-spacing: 0 !important;

    font-size: 0.78rem !important;
    font-weight: 600 !important;
    line-height: 1 !important;
}

.duplicate-split-button__main {
    min-width: 94px !important;
    padding-inline: 16px !important;
}

.duplicate-split-button__menu {
    width: 36px !important;
    min-width: 36px !important;

    padding: 0 !important;

    border-left: 1px solid rgb(var(--v-theme-border)) !important;
}

.duplicate-split-button > .v-btn .v-btn__content {
    display: inline-flex !important;
    width: 100%;
    height: 100% !important;
    align-items: center !important;
    justify-content: center !important;
}

.duplicate-split-button > .v-btn:hover {
    background: rgb(var(--v-theme-on-hover-background)) !important;
}

.duplicate-split-button:hover {
    border-color: rgb(var(--v-theme-on-hover-border));
}

.duplicate-split-button .v-icon__svg {
    fill: currentColor !important;
}

/* Disabled */
.duplicate-split-button:has(.v-btn--disabled) {
    opacity: var(--v-disabled-opacity);
}

/* Focus */
.transaction-edit-dialog__footer-actions .v-btn:focus-visible {
    outline: 2px solid rgba(var(--v-theme-on-hover-background), 0.42);
    outline-offset: 2px;
}

/* =========================================================
 * MOBILE FOOTER
 * ======================================================= */

@media (max-width: 600px) {
    .transaction-edit-dialog__footer-actions {
        margin-top: -25px !important;
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 8px !important;
    }

    .transaction-edit-dialog__footer-actions > .d-inline-block,
    .transaction-edit-dialog__footer-actions > .v-btn,
    .transaction-edit-dialog__footer-actions > .duplicate-split-button {
        width: 100% !important;
    }

    .transaction-edit-dialog__footer-actions
        > .d-inline-block
        > .v-btn-group {
        width: 100% !important;
    }

    .transaction-edit-dialog__footer-actions
        > .d-inline-block
        > .v-btn-group
        > .v-btn:first-child {
        flex: 1 1 auto !important;
    }

    .duplicate-split-button__main {
        flex: 1 1 auto !important;
    }

    /* =========================================================
 * MOBILE - SIDEBAR DO DIÁLOGO
 * ======================================================= */

@media (max-width: 900px) {
    .transaction-edit-dialog__sidebar {
        display: flex !important;
        flex-direction: column !important;

        width: 100% !important;
        max-width: none !important;

        gap: 10px;
        padding: 10px 12px !important;

        overflow: visible !important;

        border-right: 0 !important;
        border-bottom: 1px solid rgb(var(--v-theme-muted-border));
    }

    .transaction-edit-dialog__sidebar > * {
        width: 100% !important;
        min-width: 0 !important;
    }

    /* Primeiro bloco: tipo da transação */
    .transaction-edit-dialog__type-tabs {
        width: 100% !important;
        margin: 0 !important;
        padding: 4px !important;

        border: 1px solid rgb(var(--v-theme-muted-border));
        border-radius: 7px;

        background: rgb(var(--v-theme-verticalbutton));
    }

    .transaction-edit-dialog__type-tabs
        .v-slide-group__content {
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 3px !important;

        width: 100% !important;
    }

    .transaction-edit-dialog__type-tabs .v-tab {
        width: 100% !important;
        min-width: 0 !important;
        min-height: 34px !important;

        justify-content: center !important;

        padding: 0 8px !important;

        border-radius: 5px !important;

        font-size: 0.7rem !important;
        text-align: center;
    }

    /* Segundo bloco: abas horizontais */
    .transaction-edit-dialog__section-tabs {
        width: 100% !important;
        margin: 0 !important;

        overflow-x: auto !important;
        overflow-y: hidden !important;

        border-bottom: 1px solid rgb(var(--v-theme-muted-border));
        background: transparent !important;

        scrollbar-width: none;
    }

    .transaction-edit-dialog__section-tabs::-webkit-scrollbar {
        display: none;
    }

    .transaction-edit-dialog__section-tabs
        .v-slide-group__container {
        overflow: visible !important;
    }

    .transaction-edit-dialog__section-tabs
        .v-slide-group__content {
        display: flex !important;
        flex-direction: row !important;

        width: max-content !important;
        min-width: 100% !important;
        gap: 18px !important;
    }

    .transaction-edit-dialog__section-tabs .v-tab {
        position: relative;

        width: auto !important;
        min-width: auto !important;
        min-height: 38px !important;

        justify-content: center !important;

        padding: 0 2px !important;

        border-radius: 0 !important;

        background: transparent !important;

        font-size: 0.7rem !important;
        white-space: nowrap;
    }

    .transaction-edit-dialog__section-tabs
        .v-tab.v-tab--selected {
        background: transparent !important;
    }

    .transaction-edit-dialog__section-tabs
        .v-tab__slider {
        position: absolute !important;

        top: auto !important;
        right: 0 !important;
        bottom: -1px !important;
        left: 0 !important;

        width: auto !important;
        height: 2px !important;

        border-radius: 999px;

        background: rgb(var(--v-theme-primary)) !important;
    }

    .transaction-edit-dialog__sidebar-divider {
        display: none !important;
    }
}
}

/* =========================================================
 * TABLET — 601px até 900px
 * Dois grupos em linhas separadas
 * ======================================================= */

@media (min-width: 601px) and (max-width: 900px) {
    .transaction-edit-dialog__sidebar {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) !important;
        grid-auto-flow: row !important;
        align-items: stretch !important;
        gap: 8px !important;

        width: 100% !important;
        min-width: 0 !important;
        max-width: none !important;

        padding: 8px 14px 10px !important;

        overflow: visible !important;

        border-right: 0 !important;
        border-bottom: 1px solid rgb(var(--v-theme-muted-border));
    }

    .transaction-edit-dialog__sidebar-divider {
        display: none !important;
    }

    /*
     * Cada conjunto ocupa uma linha inteira.
     */
    .transaction-edit-dialog__type-tabs,
    .transaction-edit-dialog__section-tabs {
        display: block !important;

        width: 100% !important;
        min-width: 0 !important;
        max-width: none !important;

        margin: 0 !important;
    }

    /*
     * Primeiro grupo:
     * Despesa / Receita / Transferência.
     */
    .transaction-edit-dialog__type-tabs {
        padding: 4px !important;

        border: 1px solid rgb(var(--v-theme-muted-border)) !important;
        border-radius: 7px !important;

        background: rgb(var(--v-theme-verticalbutton)) !important;
    }

    .transaction-edit-dialog__type-tabs
        .v-slide-group__container {
        width: 100% !important;
    }

    .transaction-edit-dialog__type-tabs
        .v-slide-group__content {
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        flex-direction: initial !important;
        gap: 3px !important;

        width: 100% !important;
        min-width: 0 !important;
    }

    .transaction-edit-dialog__type-tabs .v-tab {
        width: 100% !important;
        min-width: 0 !important;
        min-height: 34px !important;

        justify-content: center !important;

        padding: 0 8px !important;

        font-size: 0.7rem !important;
        white-space: nowrap;
    }

    /*
     * Segundo grupo:
     * Informações Básicas / Localização / Imagens.
     */
    .transaction-edit-dialog__section-tabs {
        overflow-x: auto !important;
        overflow-y: hidden !important;

        border: 0 !important;
        border-bottom: 1px solid rgb(var(--v-theme-muted-border)) !important;

        background: transparent !important;

        scrollbar-width: none;
    }

    .transaction-edit-dialog__section-tabs::-webkit-scrollbar {
        display: none;
    }

    .transaction-edit-dialog__section-tabs
        .v-slide-group__container {
        width: 100% !important;
        overflow: visible !important;
    }

    .transaction-edit-dialog__section-tabs
        .v-slide-group__content {
        display: flex !important;
        width: 100% !important;
        min-width: max-content !important;
        flex-direction: row !important;
        align-items: center !important;
        gap: 24px !important;
    }

    .transaction-edit-dialog__section-tabs .v-tab {
        width: auto !important;
        min-width: auto !important;
        min-height: 38px !important;

        flex: 0 0 auto !important;
        justify-content: center !important;

        padding: 0 2px !important;

        border-radius: 0 !important;

        background: transparent !important;

        font-size: 0.7rem !important;
        white-space: nowrap;
    }

    .transaction-edit-dialog__section-tabs
        .v-tab.v-tab--selected {
        background: transparent !important;
    }

    .transaction-edit-dialog__section-tabs
        .v-tab__slider {
        position: absolute !important;

        top: auto !important;
        right: 0 !important;
        bottom: 0 !important;
        left: 0 !important;

        width: auto !important;
        height: 2px !important;

        background: rgb(var(--v-theme-primary)) !important;
    }
}

/* =========================================================
 * TABS HORIZONTAIS — PADRÃO HOMEPAGE / RAMP
 * ======================================================= */

@media (max-width: 900px) {
    .transaction-edit-dialog__section-tabs {
        width: 100% !important;
        min-width: 0 !important;

        margin: 0 !important;
        padding: 0 !important;

        overflow-x: auto !important;
        overflow-y: hidden !important;

        border: 0 !important;
        border-bottom: 1px solid
            rgb(var(--v-theme-muted-border)) !important;

        background: rgb(var(--v-theme-surface)) !important;

        scrollbar-width: none;
    }

    .transaction-edit-dialog__section-tabs::-webkit-scrollbar {
        display: none;
    }

    .transaction-edit-dialog__section-tabs
        .v-slide-group__container {
        width: 100% !important;
        overflow: visible !important;
    }

    .transaction-edit-dialog__section-tabs
        .v-slide-group__content {
        display: flex !important;
        width: max-content !important;
        min-width: 100% !important;
        align-items: stretch !important;
        gap: 28px !important;
    }

    .transaction-edit-dialog__section-tabs .v-tab {
        position: relative;

        width: auto !important;
        min-width: auto !important;
        min-height: 44px !important;

        flex: 0 0 auto !important;
        justify-content: center !important;

        padding: 0 1px !important;

        border: 0 !important;
        border-radius: 0 !important;

        color: rgb(var(--v-theme-tertiary)) !important;
        background: transparent !important;

        box-shadow: none !important;
        text-transform: none !important;

        font-size: 0.74rem !important;
        font-weight: 500 !important;
        letter-spacing: 0 !important;
        white-space: nowrap;
    }

    .transaction-edit-dialog__section-tabs
        .v-tab
        .v-btn__overlay,
    .transaction-edit-dialog__section-tabs
        .v-tab
        .v-btn__underlay {
        opacity: 0 !important;
    }

    .transaction-edit-dialog__section-tabs
        .v-tab:hover {
        color: rgb(var(--v-theme-on-surface)) !important;
        background: transparent !important;
    }

    .transaction-edit-dialog__section-tabs
        .v-tab.v-tab--selected,
    .transaction-edit-dialog__section-tabs
        .v-tab.v-tab-item--selected {
        color: rgb(var(--v-theme-on-surface)) !important;
        background: transparent !important;

        font-weight: 600 !important;
    }

    .transaction-edit-dialog__section-tabs
        .v-tab__slider {
        position: absolute !important;

        top: auto !important;
        right: 0 !important;
        bottom: -1px !important;
        left: 0 !important;

        width: auto !important;
        height: 2px !important;

        border-radius: 999px;

        background:
            rgb(var(--v-theme-on-surface)) !important;
    }
}

.transaction-subscription-info {
    display: flex;
    align-items: center;
    gap: 12px;

    width: calc(100% - 12px);
    margin-inline: 6px;
    padding: 12px 14px;

    background: rgba(var(--v-theme-primary), 0.08);

    border: 1px solid rgba(var(--v-theme-primary), 0.18);
    border-radius: 10px;

    box-sizing: border-box;
}

.transaction-subscription-info__icon {
    display: grid;
    flex: 0 0 32px;

    width: 32px;
    height: 32px;

    place-items: center;

    color: rgb(var(--v-theme-on-primary));

    background: rgba(var(--v-theme-primary), 0.12);

    border-radius: 8px;
}

.transaction-subscription-info__content {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
}

.transaction-subscription-info__title {
    color: rgb(var(--v-theme-on-surface));

    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.35;
}

.transaction-subscription-info__description {
    margin-top: 3px;

    color: rgb(var(--v-theme-tertiary));

    font-size: 0.78rem;
    font-weight: 400;
    line-height: 1.45;
}

</style>