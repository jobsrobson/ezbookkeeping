<template>
    <v-row class="exchange-rates-page match-height">
        <v-col class="exchange-rates-page__column" cols="12">
            <v-card class="exchange-rates-shell" variant="flat">
                <v-layout class="exchange-rates-layout">
                    <v-navigation-drawer class="exchange-rates-sidebar" :permanent="alwaysShowNav"
                                         :temporary="!alwaysShowNav" width="256" v-model="showNav">
                        <div class="exchange-rates-sidebar__section">
                            <span class="exchange-rates-label">{{ tt('Data source') }}</span>
                            <p class="text-body-1 mt-1 mb-3">
                                <a tabindex="-1" target="_blank" :href="exchangeRatesData.referenceUrl" v-if="!loading && exchangeRatesData && !isUserCustomExchangeRates && exchangeRatesData.referenceUrl">{{ exchangeRatesData.dataSource }}</a>
                                <span v-else-if="!loading && exchangeRatesData && !isUserCustomExchangeRates && !exchangeRatesData.referenceUrl">{{ exchangeRatesData.dataSource }}</span>
                                <span v-else-if="!loading && exchangeRatesData && isUserCustomExchangeRates">{{ tt('User Custom') }}</span>
                                <span v-else-if="!loading && !exchangeRatesData">{{ tt('None') }}</span>
                                <span v-else-if="loading">
                                    <v-skeleton-loader class="skeleton-no-margin mt-3 mb-4" type="text" :loading="true"></v-skeleton-loader>
                                </span>
                            </p>
                            <span class="exchange-rates-label" v-if="exchangeRatesDataUpdateTime || loading">{{ tt('Last Updated') }}</span>
                            <p class="text-body-1 mt-1" v-if="exchangeRatesDataUpdateTime || loading">
                                <span v-if="!loading">{{ exchangeRatesDataUpdateTime }}</span>
                                <span v-if="loading">
                                    <v-skeleton-loader class="skeleton-no-margin mt-3 mb-4" type="text" :loading="true"></v-skeleton-loader>
                                </span>
                            </p>
                        </div>
                        <v-divider class="exchange-rates-sidebar__divider" />
                        <div class="exchange-rates-sidebar__section">
                            <span class="exchange-rates-label">{{ tt('Base Amount') }}</span>
                            <amount-input class="mt-2" density="compact"
                                          :currency="baseCurrency"
                                          :disabled="loading || !exchangeRatesData || !exchangeRatesData.exchangeRates || !exchangeRatesData.exchangeRates.length"
                                          v-model="baseAmount"/>
                        </div>
                        <div class="exchange-rates-sidebar__section exchange-rates-sidebar__section--currency">
                            <span class="exchange-rates-label">{{ tt('Base Currency') }}</span>
                        </div>
                        <v-tabs show-arrows class="exchange-rates-sidebar__tabs" direction="vertical"
                                :disabled="loading" v-model="baseCurrency"
                                v-if="exchangeRatesData && exchangeRatesData.exchangeRates && exchangeRatesData.exchangeRates.length">
                            <v-tab class="tab-text-truncate" :key="exchangeRate.currencyCode" :value="exchangeRate.currencyCode"
                                   v-for="exchangeRate in availableExchangeRates">
                                <div class="d-flex w-100">
                                    <span class="d-block text-truncate">{{ exchangeRate.currencyDisplayName }}</span>
                                    <small class="smaller ms-1">{{ exchangeRate.currencyCode }}</small>
                                </div>
                            </v-tab>
                        </v-tabs>
                        <div class="mx-6 mt-2 mb-4"
                             v-else-if="!exchangeRatesData || !exchangeRatesData.exchangeRates || !exchangeRatesData.exchangeRates.length">
                            <span v-if="!loading">{{ tt('None') }}</span>
                            <span v-else-if="loading">
                                <v-skeleton-loader class="skeleton-no-margin pt-2 pb-5" type="text"
                                                   :key="itemIdx" :loading="loading"
                                                   v-for="itemIdx in [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]"></v-skeleton-loader>
                            </span>
                        </div>
                    </v-navigation-drawer>
                    <v-main class="exchange-rates-main">
                        <v-window class="d-flex flex-grow-1 disable-tab-transition w-100-window-container" v-model="activeTab">
                            <v-window-item value="exchangeRatesPage">
                                <v-card class="exchange-rates-content" variant="flat" min-height="680">
                                    <template #title>
                                        <div class="exchange-rates-header">
                                            <div class="exchange-rates-header__top">
                                                <div class="exchange-rates-header__identity">
                                                    <v-btn class="d-md-none" density="compact" color="default" variant="plain"
                                                           :ripple="false" :icon="true" @click="showNav = !showNav">
                                                        <v-icon :icon="mdiMenu" size="22" />
                                                    </v-btn>
                                                    <div class="exchange-rates-header__titles">
                                                        <h1>{{ tt('Exchange Rates Data') }}</h1>
                                                        <span>{{ tt('Base Currency') }}: {{ baseCurrency }}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="exchange-rates-header__actions">
                                                <v-btn color="default" variant="outlined"
                                                       :disabled="loading" @click="update"
                                                       v-if="isUserCustomExchangeRates">{{ tt('Update') }}</v-btn>
                                                <v-btn density="compact" color="default" variant="text" size="24"
                                                       :icon="true" :loading="loading" @click="reload(true)">
                                                    <template #loader>
                                                        <v-progress-circular indeterminate size="20"/>
                                                    </template>
                                                    <v-icon :icon="mdiRefresh" size="24" />
                                                    <v-tooltip activator="parent">{{ tt('Refresh') }}</v-tooltip>
                                                </v-btn>
                                            </div>
                                        </div>
                                    </template>

                                    <v-table class="exchange-rates-table" :hover="!loading">
                                        <thead>
                                        <tr>
                                            <th>
                                                <div class="d-flex align-center">
                                                    <span>{{ tt('Currency') }}</span>
                                                    <v-spacer/>
                                                    <span>{{ tt('Amount') }}</span>
                                                </div>
                                            </th>
                                        </tr>
                                        </thead>

                                        <tbody>
                                        <tr :key="itemIdx"
                                            v-for="itemIdx in (loading && (!exchangeRatesData || !exchangeRatesData.exchangeRates || exchangeRatesData.exchangeRates.length < 1) ? [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ] : [])">
                                            <td class="px-0">
                                                <v-skeleton-loader type="text" :loading="true"></v-skeleton-loader>
                                            </td>
                                        </tr>

                                        <tr v-if="!loading && (!exchangeRatesData || !exchangeRatesData.exchangeRates || !exchangeRatesData.exchangeRates.length)">
                                            <td>{{ tt('No exchange rates data') }}</td>
                                        </tr>

                                        <tr class="exchange-rates-table-row-data" :key="exchangeRate.currencyCode"
                                            v-for="exchangeRate in availableExchangeRates"
                                            @mouseenter="hoveredCurrency = exchangeRate.currencyCode" @mouseleave="hoveredCurrency = ''">
                                            <td>
                                                <div class="d-flex align-center">
                                                    <span>{{ exchangeRate.currencyDisplayName }}</span>
                                                    <span class="text-caption ms-1">{{ exchangeRate.currencyCode }}</span>

                                                    <v-spacer/>

                                                    <template v-if="(!mdAndUp || hoveredCurrency === exchangeRate.currencyCode) && !loading">
                                                        <v-btn class="px-2 ms-2" color="default"
                                                               density="comfortable" variant="text"
                                                               v-if="exchangeRate.currencyCode !== baseCurrency"
                                                               @click="setAsBaseline(exchangeRate.currencyCode, getFinalConvertedAmount(exchangeRate, false))">
                                                            {{ tt('Set as Base') }}
                                                        </v-btn>
                                                        <v-btn class="px-2" color="default"
                                                               density="comfortable" variant="text"
                                                               :prepend-icon="mdiDeleteOutline"
                                                               :loading="customExchangeRateRemoving[exchangeRate.currencyCode]"
                                                               :disabled="loading || updating"
                                                               v-if="exchangeRate.currencyCode !== defaultCurrency && isUserCustomExchangeRates"
                                                               @click="remove(exchangeRate.currencyCode)">
                                                            <template #loader>
                                                                <v-progress-circular indeterminate size="20" width="2"/>
                                                            </template>
                                                            {{ tt('Delete') }}
                                                        </v-btn>
                                                    </template>

                                                    <span class="text-subtitle-1 ms-3">{{ getFinalConvertedAmount(exchangeRate, true) }}</span>
                                                </div>
                                            </td>
                                        </tr>
                                        </tbody>
                                    </v-table>
                                </v-card>
                            </v-window-item>
                        </v-window>
                    </v-main>
                </v-layout>
            </v-card>
        </v-col>
    </v-row>

    <update-dialog ref="updateDialog" />

    <confirm-dialog ref="confirmDialog"/>
    <snack-bar ref="snackbar" />
</template>

<script setup lang="ts">
import ConfirmDialog from '@/components/desktop/ConfirmDialog.vue';
import SnackBar from '@/components/desktop/SnackBar.vue';
import UpdateDialog from './list/dialogs/UpdateDialog.vue';

import { ref, computed, useTemplateRef, watch } from 'vue';
import { useDisplay } from 'vuetify';

import { useI18n } from '@/locales/helpers.ts';
import { useExchangeRatesPageBase } from '@/views/base/ExchangeRatesPageBase.ts';

import { useExchangeRatesStore } from '@/stores/exchangeRates.ts';

import { type BigDecimal, NumeralSystem } from '@/core/numeral.ts';
import { AMOUNT_FACTOR } from '@/consts/numeral.ts';

import type { LocalizedLatestExchangeRate } from '@/models/exchange_rate.ts';

import { BIG_DECIMAL_ZERO, parseBigDecimal } from '@/lib/numeral.ts';
import logger from '@/lib/logger.ts';

import {
    mdiRefresh,
    mdiMenu,
    mdiDeleteOutline
} from '@mdi/js';

type ConfirmDialogType = InstanceType<typeof ConfirmDialog>;
type SnackBarType = InstanceType<typeof SnackBar>;
type UpdateDialogType = InstanceType<typeof UpdateDialog>;

const { mdAndUp } = useDisplay();

const { tt, getCurrentNumeralSystemType, formatExchangeRateAmountToWesternArabicNumerals } = useI18n();
const {
    baseCurrency,
    baseAmount,
    defaultCurrency,
    exchangeRatesData,
    isUserCustomExchangeRates,
    exchangeRatesDataUpdateTime,
    availableExchangeRates,
    getConvertedAmount,
    setAsBaseline
} = useExchangeRatesPageBase();

const exchangeRatesStore = useExchangeRatesStore();

const confirmDialog = useTemplateRef<ConfirmDialogType>('confirmDialog');
const snackbar = useTemplateRef<SnackBarType>('snackbar');
const updateDialog = useTemplateRef<UpdateDialogType>('updateDialog');

const activeTab = ref<string>('exchangeRatesPage');
const loading = ref<boolean>(true);
const updating = ref<boolean>(false);
const hoveredCurrency = ref<string>('');
const customExchangeRateRemoving = ref<Record<string, boolean>>({});
const alwaysShowNav = ref<boolean>(mdAndUp.value);
const showNav = ref<boolean>(mdAndUp.value);

const numeralSystem = computed<NumeralSystem>(() => getCurrentNumeralSystemType());

function reload(force: boolean): void {
    loading.value = true;

    exchangeRatesStore.getLatestExchangeRates({
        silent: false,
        force: force
    }).then(() => {
        loading.value = false;

        if (exchangeRatesData.value && exchangeRatesData.value.exchangeRates) {
            const exchangeRates = exchangeRatesData.value.exchangeRates;
            let foundDefaultCurrency = false;

            for (const exchangeRate of exchangeRates) {
                if (exchangeRate.currency === baseCurrency.value) {
                    foundDefaultCurrency = true;
                    break;
                }
            }

            if (force) {
                snackbar.value?.showMessage('Exchange rates data has been updated');
            } else if (!foundDefaultCurrency) {
                snackbar.value?.showMessage('There is no exchange rates data for your default currency');
            }
        }
    }).catch(error => {
        loading.value = false;

        if (!error.processed) {
            snackbar.value?.showError(error);
        }
    });
}

function update(): void {
    updateDialog.value?.open().then(result => {
        if (result && result.message) {
            snackbar.value?.showMessage(result.message);
        }
    }).catch(error => {
        if (error) {
            snackbar.value?.showError(error);
        }
    });
}

function remove(currency: string): void {
    confirmDialog.value?.open('Are you sure you want to delete this user custom exchange rate?').then(() => {
        updating.value = true;
        customExchangeRateRemoving.value[currency] = true;

        exchangeRatesStore.deleteUserCustomExchangeRate({
            currency: currency
        }).then(() => {
            if (currency === baseCurrency.value) {
                baseCurrency.value = defaultCurrency.value;
            }

            updating.value = false;
            customExchangeRateRemoving.value[currency] = false;
        }).catch(error => {
            updating.value = false;
            customExchangeRateRemoving.value[currency] = false;

            if (!error.processed) {
                snackbar.value?.showError(error);
            }
        });
    });
}

function getFinalConvertedAmount(toExchangeRate: LocalizedLatestExchangeRate, displayLocalizedDigits: boolean): string {
    if (!baseCurrency.value) {
        if (displayLocalizedDigits) {
            return numeralSystem.value.digitZero;
        } else {
            return NumeralSystem.WesternArabicNumerals.digitZero;
        }
    }

    const fromExchangeRate = exchangeRatesStore.latestExchangeRateMap[baseCurrency.value];
    let exchangeRateAmount: BigDecimal | '' | null = BIG_DECIMAL_ZERO;

    try {
        exchangeRateAmount = getConvertedAmount(parseBigDecimal(baseAmount.value).divide(AMOUNT_FACTOR), fromExchangeRate, toExchangeRate);
    } catch (ex) {
        exchangeRateAmount = BIG_DECIMAL_ZERO;
        logger.warn('failed to convert amount by exchange rates, original base amount is ' + baseAmount.value, ex)
    }

    if (!exchangeRateAmount) {
        if (displayLocalizedDigits) {
            return numeralSystem.value.digitZero;
        } else {
            return NumeralSystem.WesternArabicNumerals.digitZero;
        }
    }

    let ret = formatExchangeRateAmountToWesternArabicNumerals(exchangeRateAmount);

    if (displayLocalizedDigits) {
        ret = numeralSystem.value.replaceWesternArabicDigitsToLocalizedDigits(ret);
    }

    return ret;
}

watch(mdAndUp, (newValue) => {
    alwaysShowNav.value = newValue;

    if (!showNav.value) {
        showNav.value = newValue;
    }
});

reload(false);
</script>

<style>
.exchange-rates-page {
    width: calc(100% + 48px);
    max-width: none;
    min-width: 0;
    min-height: 100vh;
    margin: -24px !important;
    background: rgb(var(--v-theme-background));
}

.exchange-rates-page,
.exchange-rates-page *,
.exchange-rates-page *::before,
.exchange-rates-page *::after {
    box-sizing: border-box;
}

.exchange-rates-page__column {
    min-width: 0;
    padding: 0 !important;
}

.exchange-rates-shell,
.exchange-rates-layout,
.exchange-rates-main,
.exchange-rates-content {
    min-width: 0;
    min-height: 100vh;
    border: 0 !important;
    border-radius: 0 !important;
    background: rgb(var(--v-theme-background)) !important;
    box-shadow: none !important;
}

.exchange-rates-sidebar.v-navigation-drawer {
    border-right: 1px solid rgb(var(--v-theme-muted-border)) !important;
    background: rgb(var(--v-theme-surface)) !important;
    box-shadow: none !important;
}

.exchange-rates-sidebar .v-navigation-drawer__content {
    padding: 10px;
}

.exchange-rates-sidebar__section {
    padding: 14px;
}

.exchange-rates-sidebar__section p {
    margin-top: 6px !important;
    color: rgb(var(--v-theme-on-surface));
    font-size: 0.8rem !important;
}

.exchange-rates-label {
    display: block;
    margin-bottom: 8px;
    color: rgb(var(--v-theme-tertiary));
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.025em;
}

.exchange-rates-sidebar__divider {
    margin: 4px 14px !important;
    border-color: rgb(var(--v-theme-muted-border)) !important;
    opacity: 0 !important;
}

.exchange-rates-sidebar__section--currency {
    padding-bottom: 0;
}

.exchange-rates-sidebar .v-field {
    border-radius: 6px;
    background: rgb(var(--v-theme-background));
    box-shadow: none;
}

.exchange-rates-sidebar .v-field-label,
.exchange-rates-sidebar .v-input .v-label {
    color: rgb(var(--v-theme-highlight)) !important;
    font-weight: 600;
    opacity: 1;
}

.exchange-rates-sidebar__tabs {
    width: 100%;
    min-width: 0;
    margin: 12px 0 0 !important;
    padding: 0 14px 14px;
    background: transparent !important;
}

.exchange-rates-sidebar__tabs .v-slide-group__container,
.exchange-rates-sidebar__tabs .v-slide-group__content {
    width: 100%;
    min-width: 0;
}

.exchange-rates-sidebar__tabs .v-slide-group__content {
    gap: 3px;
}

.exchange-rates-sidebar__tabs .v-tab {
    position: relative;
    width: 100%;
    min-width: 0 !important;
    min-height: 40px !important;
    justify-content: flex-start !important;
    padding: 0 12px 0 14px !important;
    border: 0 !important;
    border-radius: 6px !important;
    color: rgb(var(--v-theme-tertiary)) !important;
    background: transparent !important;
    box-shadow: none !important;
    font-family: "Lausanne", "Helvetica Neue", Arial, sans-serif;
    font-size: 0.79rem !important;
    font-weight: 500 !important;
    letter-spacing: -0.01em;
    text-transform: none !important;
}

.exchange-rates-sidebar__tabs .v-tab:hover {
    color: rgb(var(--v-theme-on-verticalbutton-background)) !important;
    background: rgb(var(--v-theme-verticalbutton-hover)) !important;
}

.exchange-rates-sidebar__tabs .v-tab--selected {
    color: rgb(var(--v-theme-on-verticalbutton-background)) !important;
    background: rgb(var(--v-theme-verticalbutton-selected)) !important;
    font-weight: 600 !important;
}

.exchange-rates-sidebar__tabs .v-tab__slider {
    position: absolute !important;
    top: 9px !important;
    bottom: 9px !important;
    left: 4px !important;
    right: auto !important;
    width: 2px !important;
    height: auto !important;
    border-radius: 999px;
    background: rgb(var(--v-theme-highlight)) !important;
}

.exchange-rates-content > .v-card-item {
    min-height: auto;
    padding: 0 !important;
    background: rgb(var(--v-theme-surface));
}

.exchange-rates-content > .v-card-item .v-card-title {
    width: 100%;
    overflow: visible;
    white-space: normal;
}

.exchange-rates-header {
    width: 100%;
    padding: 36px 40px 0;
    border-bottom: 1px solid rgb(var(--v-theme-muted-border));
    background: rgb(var(--v-theme-surface));
}

.exchange-rates-header__top {
    display: flex;
    width: 100%;
    min-width: 0;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
}

.exchange-rates-header__identity {
    display: flex;
    min-width: 0;
    flex: 1 1 100%;
    align-items: center;
    gap: 12px;
}

.exchange-rates-header__titles h1 {
    margin: 0;
    color: rgb(var(--v-theme-on-surface));
    font-size: clamp(1.8rem, 3vw, 2.65rem);
    font-weight: 500;
    letter-spacing: -0.05em;
    line-height: 1;
}

.exchange-rates-header__titles > span {
    display: block;
    margin-top: 10px;
    color: rgb(var(--v-theme-tertiary));
    font-size: 0.76rem;
    font-weight: 500;
}

.exchange-rates-header__actions {
    display: flex;
    width: 100%;
    min-width: 0;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    padding: 22px 0 20px;
}

.exchange-rates-header__actions .v-btn {
    letter-spacing: 0;
    text-transform: none;
}

.exchange-rates-table {
    margin: 28px 40px 48px;
    width: calc(100% - 80px);
    overflow: hidden;
    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 8px;
    background: rgb(var(--v-theme-surface));
}

.exchange-rates-table thead th {
    height: 46px !important;
    color: rgb(var(--v-theme-tertiary)) !important;
    background: rgb(var(--v-theme-background));
    font-size: 0.68rem !important;
    font-weight: 700 !important;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

.exchange-rates-table tbody td {
    height: 54px !important;
    border-color: rgb(var(--v-theme-muted-border)) !important;
    color: rgb(var(--v-theme-on-surface));
    font-size: 0.82rem;
}

.exchange-rates-table-row-data:hover td {
    background: rgb(var(--v-theme-on-hover-background));
}

@media (max-width: 959.98px) {
    .exchange-rates-page {
        width: calc(100% + 48px);
        max-width: none;
        margin: -24px !important;
    }

    .exchange-rates-layout {
        --v-layout-left: 0px !important;
        --v-layout-right: 0px !important;
    }

    .exchange-rates-main {
        width: 100% !important;
        max-width: 100% !important;
        margin-left: 0 !important;
        padding-left: 0 !important;
        padding-inline-start: 0 !important;
    }

    .exchange-rates-sidebar.v-navigation-drawer {
        width: 256px !important;
        border-right: 0 !important;
    }

    .exchange-rates-header {
        padding: 24px 20px 0;
    }

    .exchange-rates-table {
        width: calc(100% - 48px);
        margin: 24px 24px 40px;
    }

    .exchange-rates-table-row-data .v-btn {
        display: inline-flex !important;
    }
}

@media (max-width: 599.98px) {
    .exchange-rates-header {
        padding: 20px 14px 0;
    }

    .exchange-rates-header__titles h1 {
        font-size: 1.35rem;
    }

    .exchange-rates-header__titles > span {
        display: none;
    }

    .exchange-rates-table {
        width: calc(100% - 32px);
        margin: 16px 16px 32px;
    }

    .exchange-rates-table tbody td {
        padding-inline: 12px !important;
    }

    .exchange-rates-table-row-data .text-caption,
    .exchange-rates-table-row-data .v-btn {
        font-size: 0.68rem !important;
    }
}
</style>
