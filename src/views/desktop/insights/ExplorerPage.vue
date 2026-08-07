<template>
    <v-row class="insights-page match-height">
        <v-col class="insights-page__column" cols="12">
            <v-card class="insights-shell" variant="flat">
                <v-layout class="insights-layout">
                    <v-navigation-drawer class="insights-sidebar" :permanent="alwaysShowNav" v-model="showNav">
                        <div class="insights-sidebar__section insights-sidebar__section--modes">
                            <btn-vertical-group :disabled="loading || updating || isCurrentDataTableEditable" :buttons="allTabs" v-model="activeTab" />
                        </div>
                        <v-divider class="insights-sidebar__divider" />
                        <v-tabs show-arrows
                                class="insights-sidebar__tabs scrollable-vertical-tabs"
                                style="max-height: calc(100% - 150px)"
                                direction="vertical"
                                :prev-icon="mdiMenuUp" :next-icon="mdiMenuDown"
                                :key="currentExploration.id" :disabled="loading || updating || isCurrentDataTableEditable"
                                :model-value="currentExploration.id">
                            <v-tab class="tab-text-truncate" key="new" value="" @click="createNewExploration">
                                <span class="text-truncate">{{ tt('New Exploration') }}</span>
                            </v-tab>
                            <v-tab class="tab-text-truncate" :key="exploration.id" :value="exploration.id"
                                   :disabled="loading || updating || isCurrentDataTableEditable"
                                   v-for="exploration in allVisibleExplorations"
                                   @click="loadExploration(exploration.id)">
                                <span class="text-truncate">{{ exploration.name || tt('Untitled Exploration') }}</span>
                            </v-tab>
                            <template v-if="loading && (!allVisibleExplorations || allVisibleExplorations.length < 1)">
                                <v-skeleton-loader class="skeleton-no-margin mx-5 mt-4 mb-3" type="text"
                                                   :key="itemIdx" :loading="true" v-for="itemIdx in [ 1, 2, 3, 4, 5 ]"></v-skeleton-loader>
                            </template>
                        </v-tabs>
                    </v-navigation-drawer>
                    <v-main class="insights-main">
                        <v-card class="insights-content-card" variant="flat" min-height="800">
                            <template #title>
                                <div class="insights-page-header">
                                    <div class="insights-page-header__top">
                                        <div class="insights-page-header__identity">
                                            <v-btn
                                                class="d-md-none insights-sidebar-trigger"
                                                density="compact"
                                                color="default"
                                                variant="plain"
                                                :ripple="false"
                                                :icon="true"
                                                @click="showNav = !showNav"
                                            >
                                                <v-icon :icon="mdiMenu" size="22" />
                                            </v-btn>

                                            <div class="insights-page-header__titles">
                                                <h1>{{ tt('Insights Explorer') }}</h1>

                                                <span>
                                                    {{
                                                        currentExploration.name ||
                                                        tt('Untitled Exploration')
                                                    }}
                                                </span>
                                            </div>
                                        </div>

                                        <div class="insights-page-header__actions">
                                            <div class="insights-page-header__desktop-actions">
                                                <v-btn-group
                                                    class="insights-date-range-group"
                                                    color="default"
                                                    density="comfortable"
                                                    variant="outlined"
                                                    divided
                                                >
                                                    <v-btn
                                                        class="button-icon-with-direction"
                                                        :icon="mdiArrowLeft"
                                                        :disabled="
                                                            loading ||
                                                            updating ||
                                                            !canShiftDateRange ||
                                                            isCurrentDataTableEditable
                                                        "
                                                        @click="shiftDateRange(-1)"
                                                    />

                                                    <v-menu location="bottom" max-height="500">
                                                        <template #activator="{ props }">
                                                            <v-btn
                                                                class="insights-date-range-button"
                                                                :disabled="
                                                                    loading ||
                                                                    updating ||
                                                                    isCurrentDataTableEditable
                                                                "
                                                                v-bind="props"
                                                            >
                                                                {{ displayQueryDateRangeName }}
                                                            </v-btn>
                                                        </template>

                                                        <v-list :selected="[currentFilter.dateRangeType]">
                                                            <v-list-item
                                                                :key="dateRange.type"
                                                                :value="dateRange.type"
                                                                :append-icon="
                                                                    currentFilter.dateRangeType === dateRange.type
                                                                        ? mdiCheck
                                                                        : undefined
                                                                "
                                                                v-for="dateRange in allDateRanges"
                                                            >
                                                                <v-list-item-title
                                                                    class="cursor-pointer"
                                                                    @click="setDateFilter(dateRange.type)"
                                                                >
                                                                    <div class="d-flex align-center">
                                                                        <span>{{ dateRange.displayName }}</span>
                                                                    </div>

                                                                    <div
                                                                        class="statistics-custom-datetime-range smaller"
                                                                        v-if="
                                                                            dateRange.isUserCustomRange &&
                                                                            currentFilter.dateRangeType === dateRange.type &&
                                                                            !!currentFilter.startTime &&
                                                                            !!currentFilter.endTime
                                                                        "
                                                                    >
                                                                        <span>{{ displayQueryStartTime }}</span>
                                                                        <span>&nbsp;-&nbsp;</span>
                                                                        <br />
                                                                        <span>{{ displayQueryEndTime }}</span>
                                                                    </div>
                                                                </v-list-item-title>
                                                            </v-list-item>
                                                        </v-list>
                                                    </v-menu>

                                                    <v-btn
                                                        class="button-icon-with-direction"
                                                        :icon="mdiArrowRight"
                                                        :disabled="
                                                            loading ||
                                                            updating ||
                                                            !canShiftDateRange ||
                                                            isCurrentDataTableEditable
                                                        "
                                                        @click="shiftDateRange(1)"
                                                    />
                                                </v-btn-group>

                                                <v-btn
                                                    density="comfortable"
                                                    color="default"
                                                    variant="text"
                                                    :icon="true"
                                                    :loading="loading"
                                                    :disabled="updating"
                                                    @click="reload(true)"
                                                >
                                                    <template #loader>
                                                        <v-progress-circular
                                                            indeterminate
                                                            size="19"
                                                        />
                                                    </template>

                                                    <v-icon :icon="mdiRefresh" size="21" />

                                                    <v-tooltip activator="parent">
                                                        {{ tt('Refresh') }}
                                                    </v-tooltip>
                                                </v-btn>

                                                <v-btn
                                                    class="insights-save-button"
                                                    :color="
                                                        isCurrentExplorationModified
                                                            ? 'primary'
                                                            : 'default'
                                                    "
                                                    :variant="
                                                        isCurrentExplorationModified
                                                            ? 'flat'
                                                            : 'outlined'
                                                    "
                                                    :disabled="
                                                        loading ||
                                                        updating ||
                                                        isCurrentDataTableEditable
                                                    "
                                                    @click="saveExploration(false)"
                                                >
                                                    {{ tt('Save Exploration') }}

                                                    <v-progress-circular
                                                        class="ms-2"
                                                        indeterminate
                                                        size="18"
                                                        v-if="updating"
                                                    />

                                                    <v-menu activator="parent" :open-on-hover="true">
                                                        <v-list>
                                                            <v-list-item
                                                                :title="tt('Save As New Exploration')"
                                                                @click="saveExploration(true)"
                                                            />

                                                            <v-list-item
                                                                :title="tt('Restore to Last Saved')"
                                                                @click="restoreExploration()"
                                                                v-if="currentExploration.id"
                                                            />
                                                        </v-list>
                                                    </v-menu>
                                                </v-btn>

                                                <v-btn
                                                    density="comfortable"
                                                    color="default"
                                                    variant="text"
                                                    :disabled="loading || updating"
                                                    :icon="true"
                                                >
                                                    <v-icon :icon="mdiDotsVertical" />

                                                    <v-menu activator="parent">
                                                        <v-list>
                                                            <v-list-subheader
                                                                :title="tt('Timezone Used for Date Range')"
                                                                v-if="activeTab === 'query'"
                                                            />

                                                            <template v-if="activeTab === 'query'">
                                                                <v-list-item
                                                                    :key="timezoneType.type"
                                                                    :value="timezoneType.type"
                                                                    :prepend-icon="
                                                                        timezoneTypeIconMap[timezoneType.type]
                                                                    "
                                                                    :append-icon="
                                                                        currentExploration.timezoneUsedForDateRange ===
                                                                        timezoneType.type
                                                                            ? mdiCheck
                                                                            : undefined
                                                                    "
                                                                    :title="timezoneType.displayName"
                                                                    v-for="timezoneType in allTimezoneTypesUsedForDateRange"
                                                                    @click="
                                                                        currentExploration.timezoneUsedForDateRange =
                                                                            timezoneType.type
                                                                    "
                                                                />
                                                            </template>

                                                            <v-divider
                                                                class="my-2"
                                                                v-if="activeTab === 'query'"
                                                            />

                                                            <v-list-item
                                                                :prepend-icon="mdiApplicationImport"
                                                                :title="tt('Import Queries')"
                                                                :disabled="loading || updating"
                                                                @click="importQueries"
                                                                v-if="activeTab === 'query'"
                                                            />

                                                            <v-list-item
                                                                :prepend-icon="mdiApplicationExport"
                                                                :title="tt('Export Queries')"
                                                                :disabled="loading || updating"
                                                                @click="exportQueries"
                                                                v-if="activeTab === 'query'"
                                                            />

                                                            <v-list-item
                                                                :prepend-icon="mdiTableEdit"
                                                                :title="tt('Enter Edit Mode')"
                                                                :disabled="
                                                                    loading ||
                                                                    updating ||
                                                                    filteredTransactionsInDataTable.length < 1
                                                                "
                                                                @click="isCurrentDataTableEditable = true"
                                                                v-if="
                                                                    activeTab === 'table' &&
                                                                    !isCurrentDataTableEditable
                                                                "
                                                            />

                                                            <v-list-item
                                                                :prepend-icon="mdiTableCheck"
                                                                :title="tt('Exit Edit Mode')"
                                                                :disabled="loading || updating"
                                                                @click="isCurrentDataTableEditable = false"
                                                                v-if="
                                                                    activeTab === 'table' &&
                                                                    isCurrentDataTableEditable
                                                                "
                                                            />

                                                            <v-divider
                                                                class="my-2"
                                                                v-if="
                                                                    activeTab === 'table' &&
                                                                    !isCurrentDataTableEditable
                                                                "
                                                            />

                                                            <v-list-item
                                                                :prepend-icon="mdiExport"
                                                                :title="tt('Export Results')"
                                                                :disabled="
                                                                    loading ||
                                                                    updating ||
                                                                    (
                                                                        activeTab === 'table' &&
                                                                        (
                                                                            !filteredTransactionsInDataTable ||
                                                                            filteredTransactionsInDataTable.length < 1
                                                                        )
                                                                    )
                                                                "
                                                                @click="exportResults"
                                                                v-if="
                                                                    (
                                                                        activeTab === 'table' ||
                                                                        activeTab === 'chart'
                                                                    ) &&
                                                                    !isCurrentDataTableEditable
                                                                "
                                                            />

                                                            <v-divider
                                                                class="my-2"
                                                                v-if="
                                                                    currentExploration.id &&
                                                                    !isCurrentDataTableEditable
                                                                "
                                                            />

                                                            <v-list-item
                                                                :prepend-icon="mdiPencilOutline"
                                                                :title="tt('Rename Exploration')"
                                                                @click="setExplorationName"
                                                                v-if="
                                                                    currentExploration.id &&
                                                                    !isCurrentDataTableEditable
                                                                "
                                                            />

                                                            <v-list-item
                                                                :prepend-icon="mdiEyeOffOutline"
                                                                :title="tt('Hide Exploration')"
                                                                @click="hideExploration(true)"
                                                                v-if="
                                                                    currentExploration.id &&
                                                                    !currentExploration.hidden &&
                                                                    !isCurrentDataTableEditable
                                                                "
                                                            />

                                                            <v-list-item
                                                                :prepend-icon="mdiEyeOutline"
                                                                :title="tt('Unhide Exploration')"
                                                                @click="hideExploration(false)"
                                                                v-if="
                                                                    currentExploration.id &&
                                                                    currentExploration.hidden &&
                                                                    !isCurrentDataTableEditable
                                                                "
                                                            />

                                                            <v-list-item
                                                                :prepend-icon="mdiDeleteOutline"
                                                                :title="tt('Delete Exploration')"
                                                                @click="removeExploration"
                                                                v-if="
                                                                    currentExploration.id &&
                                                                    !isCurrentDataTableEditable
                                                                "
                                                            />

                                                            <v-divider
                                                                class="my-2"
                                                                v-if="!isCurrentDataTableEditable"
                                                            />

                                                            <v-list-item
                                                                :prepend-icon="mdiSort"
                                                                :disabled="
                                                                    !allExplorations ||
                                                                    allExplorations.length < 2
                                                                "
                                                                :title="tt('Change Exploration Display Order')"
                                                                @click="
                                                                    showChangeExplorerDisplayOrderDialog
                                                                "
                                                                v-if="!isCurrentDataTableEditable"
                                                            />
                                                        </v-list>
                                                    </v-menu>
                                                </v-btn>
                                            </div>

                                            <v-btn
                                                class="insights-mobile-actions-trigger"
                                                density="comfortable"
                                                color="default"
                                                variant="text"
                                                :icon="true"
                                            >
                                                <v-icon :icon="mdiDotsVertical" size="22" />

                                                <v-menu activator="parent" location="bottom end">
                                                    <v-list>
                                                        <v-list-item
                                                            :prepend-icon="mdiRefresh"
                                                            :title="tt('Refresh')"
                                                            :disabled="loading || updating"
                                                            @click="reload(true)"
                                                        />

                                                        <v-list-item
                                                            :title="displayQueryDateRangeName"
                                                            :disabled="
                                                                loading ||
                                                                updating ||
                                                                isCurrentDataTableEditable
                                                            "
                                                        >
                                                            <v-menu
                                                                activator="parent"
                                                                location="start"
                                                                max-height="500"
                                                            >
                                                                <v-list
                                                                    :selected="[
                                                                        currentFilter.dateRangeType
                                                                    ]"
                                                                >
                                                                    <v-list-item
                                                                        :key="dateRange.type"
                                                                        :value="dateRange.type"
                                                                        :append-icon="
                                                                            currentFilter.dateRangeType ===
                                                                            dateRange.type
                                                                                ? mdiCheck
                                                                                : undefined
                                                                        "
                                                                        :title="dateRange.displayName"
                                                                        v-for="dateRange in allDateRanges"
                                                                        @click="
                                                                            setDateFilter(dateRange.type)
                                                                        "
                                                                    />
                                                                </v-list>
                                                            </v-menu>
                                                        </v-list-item>

                                                        <v-divider class="my-2" />

                                                        <v-list-item
                                                            :title="tt('Save Exploration')"
                                                            :disabled="
                                                                loading ||
                                                                updating ||
                                                                isCurrentDataTableEditable
                                                            "
                                                            @click="saveExploration(false)"
                                                        />

                                                        <v-list-item
                                                            :title="tt('Save As New Exploration')"
                                                            :disabled="
                                                                loading ||
                                                                updating ||
                                                                isCurrentDataTableEditable
                                                            "
                                                            @click="saveExploration(true)"
                                                        />

                                                        <v-list-item
                                                            :title="tt('Restore to Last Saved')"
                                                            :disabled="loading || updating"
                                                            @click="restoreExploration()"
                                                            v-if="currentExploration.id"
                                                        />

                                                        <v-divider class="my-2" />

                                                        <v-list-item
                                                            :prepend-icon="mdiApplicationImport"
                                                            :title="tt('Import Queries')"
                                                            :disabled="loading || updating"
                                                            @click="importQueries"
                                                            v-if="activeTab === 'query'"
                                                        />

                                                        <v-list-item
                                                            :prepend-icon="mdiApplicationExport"
                                                            :title="tt('Export Queries')"
                                                            :disabled="loading || updating"
                                                            @click="exportQueries"
                                                            v-if="activeTab === 'query'"
                                                        />

                                                        <v-list-item
                                                            :prepend-icon="mdiExport"
                                                            :title="tt('Export Results')"
                                                            :disabled="
                                                                loading ||
                                                                updating ||
                                                                (
                                                                    activeTab === 'table' &&
                                                                    filteredTransactionsInDataTable.length < 1
                                                                )
                                                            "
                                                            @click="exportResults"
                                                            v-if="
                                                                (
                                                                    activeTab === 'table' ||
                                                                    activeTab === 'chart'
                                                                ) &&
                                                                !isCurrentDataTableEditable
                                                            "
                                                        />

                                                        <v-list-item
                                                            :prepend-icon="
                                                                isCurrentDataTableEditable
                                                                    ? mdiTableCheck
                                                                    : mdiTableEdit
                                                            "
                                                            :title="
                                                                isCurrentDataTableEditable
                                                                    ? tt('Exit Edit Mode')
                                                                    : tt('Enter Edit Mode')
                                                            "
                                                            :disabled="
                                                                loading ||
                                                                updating ||
                                                                (
                                                                    !isCurrentDataTableEditable &&
                                                                    filteredTransactionsInDataTable.length < 1
                                                                )
                                                            "
                                                            @click="
                                                                isCurrentDataTableEditable =
                                                                    !isCurrentDataTableEditable
                                                            "
                                                            v-if="activeTab === 'table'"
                                                        />

                                                        <v-divider class="my-2" />

                                                        <v-list-item
                                                            :prepend-icon="mdiPencilOutline"
                                                            :title="tt('Rename Exploration')"
                                                            @click="setExplorationName"
                                                            v-if="currentExploration.id"
                                                        />

                                                        <v-list-item
                                                            :prepend-icon="mdiDeleteOutline"
                                                            :title="tt('Delete Exploration')"
                                                            @click="removeExploration"
                                                            v-if="currentExploration.id"
                                                        />
                                                    </v-list>
                                                </v-menu>
                                            </v-btn>
                                        </div>
                                    </div>
                                </div>
                            </template>

                            <v-window class="d-flex flex-grow-1 disable-tab-transition w-100-window-container" v-model="activeTab">
                                <v-window-item value="query">
                                    <explorer-query-tab :loading="loading" :disabled="loading || updating" />
                                </v-window-item>
                                <v-window-item value="table">
                                    <explorer-data-table-tab ref="explorerDataTableTab"
                                                             :loading="loading" :disabled="loading || updating"
                                                             @click:transaction="onShowTransaction"
                                                             v-if="!isCurrentDataTableEditable" />
                                    <explorer-editable-data-table-tab ref="explorerEditableDataTableTab"
                                                                      :loading="loading" :disabled="loading || updating"
                                                                      @click:transaction="onShowTransaction"
                                                                      @update:transactions="onUpdateTransactions"
                                                                      v-if="isCurrentDataTableEditable" />
                                </v-window-item>
                                <v-window-item value="chart">
                                    <explorer-chart-tab ref="explorerChartTab"
                                                        :loading="loading" :disabled="loading || updating"
                                                        @click:transaction="onShowTransaction" />
                                </v-window-item>
                            </v-window>
                        </v-card>
                    </v-main>
                </v-layout>
            </v-card>
        </v-col>
    </v-row>

    <date-range-selection-dialog :title="tt('Custom Date Range')"
                                 :min-time="currentFilter.startTime"
                                 :max-time="currentFilter.endTime"
                                 v-model:show="showCustomDateRangeDialog"
                                 @dateRange:change="setCustomDateFilter"
                                 @error="onShowDateRangeError" />

    <explorer-change-display-order-dialog ref="explorerChangeDisplayOrderDialog" />
    <edit-dialog ref="editDialog" :type="TransactionEditPageType.Transaction" />
    <query-import-dialog ref="queryImportDialog" />
    <query-export-dialog ref="queryExportDialog" />
    <export-dialog ref="exportDialog" />

    <rename-dialog ref="renameDialog"
                   :default-title="tt('Rename Exploration')"
                   :label="tt('Exploration Name')" :placeholder="tt('Exploration Name')" />
    <confirm-dialog ref="confirmDialog"/>
    <snack-bar ref="snackbar" />
</template>

<script setup lang="ts">
import RenameDialog from '@/components/desktop/RenameDialog.vue';
import ConfirmDialog from '@/components/desktop/ConfirmDialog.vue';
import SnackBar from '@/components/desktop/SnackBar.vue';
import ExplorerQueryTab from '@/views/desktop/insights/tabs/ExplorerQueryTab.vue';
import ExplorerDataTableTab from '@/views/desktop/insights/tabs/ExplorerDataTableTab.vue';
import ExplorerEditableDataTableTab from '@/views/desktop/insights/tabs/ExplorerEditableDataTableTab.vue';
import ExplorerChartTab from '@/views/desktop/insights/tabs/ExplorerChartTab.vue';
import ExplorerChangeDisplayOrderDialog from '@/views/desktop/insights/dialogs/ExplorerChangeDisplayOrderDialog.vue';
import EditDialog from '@/views/desktop/transactions/list/dialogs/EditDialog.vue';
import QueryImportDialog from '@/views/desktop/insights/dialogs/QueryImportDialog.vue';
import QueryExportDialog from '@/views/desktop/insights/dialogs/QueryExportDialog.vue';
import ExportDialog from '@/views/desktop/statistics/transaction/dialogs/ExportDialog.vue';

import { ref, computed, useTemplateRef, watch, nextTick } from 'vue';
import { useRouter, onBeforeRouteUpdate } from 'vue-router';
import { useDisplay } from 'vuetify';

import { useI18n } from '@/locales/helpers.ts';
import { TransactionEditPageType } from '@/views/base/transactions/TransactionEditPageBase.ts';

import { useUserStore } from '@/stores/user.ts';
import { useAccountsStore } from '@/stores/account.ts';
import { useTransactionCategoriesStore } from '@/stores/transactionCategory.ts';
import { useTransactionTagsStore } from '@/stores/transactionTag.ts';
import { type TransactionExplorerPartialFilter, type TransactionExplorerFilter, useExplorersStore } from '@/stores/explorer.ts';

import type { TypeAndDisplayName } from '@/core/base.ts';
import { type WeekDayValue, type LocalizedDateRange, DateRangeScene, DateRange } from '@/core/datetime.ts';
import { TimezoneTypeForStatistics } from '@/core/timezone.ts';
import { KnownErrorCode } from '@/consts/api.ts';

import { type TransactionInsightDataItem, Transaction } from '@/models/transaction.ts';
import { InsightsExplorerBasicInfo, InsightsExplorer, TransactionExplorerQuery } from '@/models/explorer.ts';

import {
    parseDateTimeFromUnixTime,
    getShiftedDateRangeAndDateType,
    getDateTypeByDateRange,
    getDateRangeByDateType
} from '@/lib/datetime.ts';

import { generateRandomUUID } from '@/lib/misc.ts';

import {
    mdiMenu,
    mdiArrowLeft,
    mdiArrowRight,
    mdiMenuUp,
    mdiMenuDown,
    mdiCheck,
    mdiRefresh,
    mdiDotsVertical,
    mdiPencilOutline,
    mdiEyeOutline,
    mdiEyeOffOutline,
    mdiDeleteOutline,
    mdiSort,
    mdiHomeClockOutline,
    mdiInvoiceTextClockOutline,
    mdiApplicationImport,
    mdiApplicationExport,
    mdiExport,
    mdiTableEdit,
    mdiTableCheck
} from '@mdi/js';

interface InsightsExplorerProps {
    initId?: string;
    initActiveTab?: string,
    initDateRangeType?: string,
    initStartTime?: string,
    initEndTime?: string,
}

const props = defineProps<InsightsExplorerProps>();

type ExplorerPageTabType = 'query' | 'table' | 'chart';

type RenameDialogType = InstanceType<typeof RenameDialog>;
type ConfirmDialogType = InstanceType<typeof ConfirmDialog>;
type SnackBarType = InstanceType<typeof SnackBar>;
type ExplorerDataTableTabType = InstanceType<typeof ExplorerDataTableTab>;
type ExplorerChartTabType = InstanceType<typeof ExplorerChartTab>;
type ExplorerChangeDisplayOrderDialogType = InstanceType<typeof ExplorerChangeDisplayOrderDialog>;
type EditDialogType = InstanceType<typeof EditDialog>;
type QueryImportDialogType = InstanceType<typeof QueryImportDialog>;
type QueryExportDialogType = InstanceType<typeof QueryExportDialog>;
type ExportDialogType = InstanceType<typeof ExportDialog>;

const router = useRouter();
const display = useDisplay();

const {
    tt,
    getAllDateRanges,
    getAllTimezoneTypesUsedForStatistics,
    formatDateTimeToLongDateTime,
    formatDateRange
} = useI18n();

const userStore = useUserStore();
const accountsStore = useAccountsStore();
const transactionCategoriesStore = useTransactionCategoriesStore();
const transactionTagsStore = useTransactionTagsStore();
const explorersStore = useExplorersStore();

const timezoneTypeIconMap = {
    [TimezoneTypeForStatistics.ApplicationTimezone.type]: mdiHomeClockOutline,
    [TimezoneTypeForStatistics.TransactionTimezone.type]: mdiInvoiceTextClockOutline
};

const renameDialog = useTemplateRef<RenameDialogType>('renameDialog');
const confirmDialog = useTemplateRef<ConfirmDialogType>('confirmDialog');
const snackbar = useTemplateRef<SnackBarType>('snackbar');
const explorerDataTableTab = useTemplateRef<ExplorerDataTableTabType>('explorerDataTableTab');
const explorerChartTab = useTemplateRef<ExplorerChartTabType>('explorerChartTab');
const explorerChangeDisplayOrderDialog = useTemplateRef<ExplorerChangeDisplayOrderDialogType>('explorerChangeDisplayOrderDialog');
const queryImportDialog = useTemplateRef<QueryImportDialogType>('queryImportDialog');
const queryExportDialog = useTemplateRef<QueryExportDialogType>('queryExportDialog');
const exportDialog = useTemplateRef<ExportDialogType>('exportDialog');
const editDialog = useTemplateRef<EditDialogType>('editDialog');

const loading = ref<boolean>(true);
const initing = ref<boolean>(true);
const updating = ref<boolean>(false);
const clientSessionId = ref<string>('');
const isCurrentExplorationModified = ref<boolean>(false);
const isCurrentDataTableEditable = ref<boolean>(false);
const alwaysShowNav = ref<boolean>(display.mdAndUp.value);
const showNav = ref<boolean>(display.mdAndUp.value);
const activeTab = ref<ExplorerPageTabType>('query');
const showCustomDateRangeDialog = ref<boolean>(false);

const firstDayOfWeek = computed<WeekDayValue>(() => userStore.currentUserFirstDayOfWeek);
const fiscalYearStart = computed<number>(() => userStore.currentUserFiscalYearStart);

const allExplorations = computed<InsightsExplorerBasicInfo[]>(() => explorersStore.allExplorationBasicInfos);
const allVisibleExplorations = computed<InsightsExplorerBasicInfo[]>(() => {
    const ret: InsightsExplorerBasicInfo[] = [];
    let hasCurrentExploration = false;

    for (const exploration of explorersStore.allExplorationBasicInfos) {
        if (!exploration.hidden || (exploration.id && exploration.id === currentExploration.value.id)) {
            ret.push(exploration);

            if (exploration.id && exploration.id === currentExploration.value.id) {
                hasCurrentExploration = true;
            }
        }
    }

    if (!hasCurrentExploration && currentExploration.value && currentExploration.value.id) {
        ret.push(InsightsExplorerBasicInfo.of(currentExploration.value));
    }

    return ret;
});
const currentFilter = computed<TransactionExplorerFilter>(() => explorersStore.transactionExplorerFilter);
const currentExploration = computed<InsightsExplorer>(() => explorersStore.currentExploration);
const filteredTransactionsInDataTable = computed<TransactionInsightDataItem[]>(() => explorersStore.filteredTransactionsInDataTable);

const allDateRanges = computed<LocalizedDateRange[]>(() => getAllDateRanges(DateRangeScene.InsightsExplorer, { includeCustom: true }));
const allTimezoneTypesUsedForDateRange = computed<TypeAndDisplayName[]>(() => getAllTimezoneTypesUsedForStatistics());
const canShiftDateRange = computed<boolean>(() => currentFilter.value.dateRangeType !== DateRange.All.type);
const displayQueryDateRangeName = computed<string>(() => formatDateRange(currentFilter.value.dateRangeType, currentFilter.value.startTime, currentFilter.value.endTime));
const displayQueryStartTime = computed<string>(() => formatDateTimeToLongDateTime(parseDateTimeFromUnixTime(currentFilter.value.startTime)));
const displayQueryEndTime = computed<string>(() => formatDateTimeToLongDateTime(parseDateTimeFromUnixTime(currentFilter.value.endTime)));

const allTabs = computed<{ name: string, value: ExplorerPageTabType }[]>(() => {
    return [
        {
            name: tt('Query'),
            value: 'query'
        },
        {
            name: tt('Data Table'),
            value: 'table'
        },
        {
            name: tt('Chart'),
            value: 'chart'
        }
    ];
});

function getFilterLinkUrl(): string {
    return `/insights/explorer?${explorersStore.getTransactionExplorerPageParams(currentExploration.value.id, activeTab.value)}`;
}

function init(initProps: InsightsExplorerProps): void {
    clientSessionId.value = generateRandomUUID();

    const filter: TransactionExplorerPartialFilter = {
        dateRangeType: initProps.initDateRangeType ? parseInt(initProps.initDateRangeType) : undefined,
        startTime: initProps.initStartTime ? parseInt(initProps.initStartTime) : undefined,
        endTime: initProps.initEndTime ? parseInt(initProps.initEndTime) : undefined
    };

    let needReload = false;

    if (filter.dateRangeType !== currentFilter.value.dateRangeType) {
        needReload = true;
    } else if (filter.dateRangeType === DateRange.Custom.type) {
        if (filter.startTime !== currentFilter.value.startTime
            || filter.endTime !== currentFilter.value.endTime) {
            needReload = true;
        }
    }

    if (initProps.initActiveTab === 'query' || initProps.initActiveTab === 'table' || initProps.initActiveTab === 'chart') {
        if (initProps.initActiveTab !== activeTab.value) {
            activeTab.value = initProps.initActiveTab;
        }
    } else {
        activeTab.value = 'query';
    }

    explorersStore.initTransactionExplorerFilter(filter);

    if (initProps.initId) {
        if (explorersStore.currentExploration.id !== initProps.initId) {
            needReload = true;
        }
    } else if (!initProps.initId && !initProps.initActiveTab && !initProps.initDateRangeType && !initProps.initStartTime && !initProps.initEndTime) { // first time open the page
        explorersStore.updateCurrentExploration(InsightsExplorer.createNewExplorer(generateRandomUUID()));
        isCurrentExplorationModified.value = true;
    }

    if (!needReload && !explorersStore.transactionExplorerStateInvalid && !explorersStore.insightsExplorerListStateInvalid) {
        loading.value = false;
        initing.value = false;
        return;
    }

    Promise.all([
        accountsStore.loadAllAccounts({ force: false }),
        transactionCategoriesStore.loadAllCategories({ force: false }),
        transactionTagsStore.loadAllTags({ force: false }),
        explorersStore.loadAllExplorationBasicInfos({ force: false })
    ]).then(() => {
        const promises: Promise<unknown>[] = [
            explorersStore.loadAllTransactions({ force: false })
        ];

        if (initProps.initId && explorersStore.currentExploration.id !== initProps.initId) {
            const loadExplorerPromise = loadExploration(initProps.initId, false, true);

            if (loadExplorerPromise) {
                promises.push(loadExplorerPromise);
            }
        }

        return Promise.all(promises);
    }).then(() => {
        loading.value = false;
        initing.value = false;
    }).catch(error => {
        loading.value = false;
        initing.value = false;

        if (!error.processed) {
            snackbar.value?.showError(error);
        }
    });
}

function reload(force: boolean): Promise<unknown> | null {
    loading.value = true;

    return explorersStore.loadAllTransactions({
        force: force
    }).then(() => {
        loading.value = false;

        if (force) {
            snackbar.value?.showMessage('Data has been updated');
        }
    }).catch(error => {
        loading.value = false;

        if (!error.processed) {
            snackbar.value?.showError(error);
        }
    });
}

function createNewExploration(): void {
    if (!currentExploration.value.id) {
        return;
    }

    explorersStore.updateCurrentExploration(InsightsExplorer.createNewExplorer(generateRandomUUID()));
    isCurrentExplorationModified.value = true;
    router.push(getFilterLinkUrl());
}

function loadExploration(explorationId: string, force?: boolean, init?: boolean): Promise<unknown> | null {
    if (!force && currentExploration.value && currentExploration.value.id === explorationId) {
        return null;
    }

    if (!init) {
        loading.value = true;
    }

    return explorersStore.getExploration({
        explorationId: explorationId
    }).then(exploration => {
        explorersStore.updateCurrentExploration(exploration);

        nextTick(() => {
            isCurrentExplorationModified.value = false;
        });

        if (!init) {
            loading.value = false;
        }

        router.push(getFilterLinkUrl());
    }).catch(error => {
        if (!init) {
            loading.value = false;
        }

        if (!error.processed) {
            snackbar.value?.showError(error);
        }
    });
}

function showChangeExplorerDisplayOrderDialog(): void {
    explorerChangeDisplayOrderDialog.value?.open().then(() => {
        if (explorersStore.insightsExplorerListStateInvalid) {
            loading.value = true;

            explorersStore.loadAllExplorationBasicInfos({
                force: false
            }).then(() => {
                loading.value = false;
            }).catch(() => {
                loading.value = false;
            });
        }
    });
}

function saveExploration(saveAs?: boolean): void {
    if (saveAs || !currentExploration.value.name) {
        renameDialog.value?.open(currentExploration.value.name || '', tt('Set Exploration Name')).then((newName: string) => {
            currentExploration.value.name = newName;
            doSaveExploration(saveAs);
        })
    } else {
        doSaveExploration(saveAs);
    }
}

function doSaveExploration(saveAs?: boolean): Promise<unknown> {
    const oldExplorationId = currentExploration.value.id;

    updating.value = true;

    return explorersStore.saveExploration({
        exploration: currentExploration.value,
        saveAs: saveAs,
        clientSessionId: clientSessionId.value
    }).then(newExploration => {
        updating.value = false;
        clientSessionId.value = generateRandomUUID();
        explorersStore.updateCurrentExploration(newExploration);

        nextTick(() => {
            isCurrentExplorationModified.value = false;
        });

        if (oldExplorationId !== newExploration.id) {
            router.push(getFilterLinkUrl());
        }
    }).catch(error => {
        updating.value = false;

        if (!error.processed) {
            snackbar.value?.showError(error);

            if (error.error && error.error.errorCode === KnownErrorCode.NothingWillBeUpdated) {
                nextTick(() => {
                    isCurrentExplorationModified.value = false;
                });
            }
        }
    });
}

function restoreExploration(): void {
    if (!currentExploration.value.id) {
        return;
    }

    confirmDialog.value?.open('Are you sure you want to restore to last saved state? All unsaved changes will be lost.').then(() => {
        loadExploration(currentExploration.value.id, true);
    });
}

function setExplorationName(): void {
    renameDialog.value?.open(currentExploration.value.name || '').then((newName: string) => {
        currentExploration.value.name = newName;
    });
}

function hideExploration(hidden: boolean): void {
    updating.value = true;

    explorersStore.hideExploration({
        exploration: currentExploration.value,
        hidden: hidden
    }).then(() => {
        updating.value = false;
        currentExploration.value.hidden = hidden;

        nextTick(() => {
            isCurrentExplorationModified.value = false;
        });
    }).catch(error => {
        updating.value = false;

        if (!error.processed) {
            snackbar.value?.showError(error);
        }
    });
}

function removeExploration(): void {
    if (!currentExploration.value.id) {
        return;
    }

    confirmDialog.value?.open('Are you sure you want to delete this exploration?').then(() => {
        updating.value = true;

        explorersStore.deleteExploration({
            exploration: currentExploration.value
        }).then(() => {
            updating.value = false;
            createNewExploration();
        }).catch(error => {
            updating.value = false;

            if (!error.processed) {
                snackbar.value?.showError(error);
            }
        });
    });
}

function importQueries(): void {
    if (activeTab.value === 'query') {
        queryImportDialog.value?.open().then((queries: TransactionExplorerQuery[]) => {
            if (!queries || queries.length < 1) {
                return;
            }

            explorersStore.currentExploration.queries.length = 0;
            explorersStore.currentExploration.queries.push(...queries);
            isCurrentExplorationModified.value = true;
        });
    }
}

function exportQueries(): void {
    if (activeTab.value === 'query') {
        queryExportDialog.value?.open({
            queriesJson: explorersStore.currentExploration.getQueryiesPrettyJson()
        });
    }
}

function exportResults(): void {
    if (activeTab.value === 'table' && filteredTransactionsInDataTable.value) {
        const results = explorerDataTableTab.value?.buildExportResults();

        if (results) {
            exportDialog.value?.open(results);
        }
    } else if (activeTab.value === 'chart') {
        const results = explorerChartTab.value?.buildExportResults();

        if (results) {
            exportDialog.value?.open(results);
        }
    }
}

function setDateFilter(dateType: number): void {
    if (dateType === DateRange.Custom.type) { // Custom
        showCustomDateRangeDialog.value = true;
        return;
    } else if (currentFilter.value.dateRangeType === dateType) {
        return;
    }

    const dateRange = getDateRangeByDateType(dateType, firstDayOfWeek.value, fiscalYearStart.value);

    if (!dateRange) {
        return;
    }

    const changed = explorersStore.updateTransactionExplorerFilter({
        dateRangeType: dateRange.dateType,
        startTime: dateRange.minTime,
        endTime: dateRange.maxTime
    });

    if (changed) {
        loading.value = true;
        explorersStore.updateTransactionExplorerInvalidState(true);
        router.push(getFilterLinkUrl());
    }
}

function setCustomDateFilter(startTime: number, endTime: number): void {
    if (!startTime || !endTime) {
        return;
    }

    const chartDateType = getDateTypeByDateRange(startTime, endTime, firstDayOfWeek.value, fiscalYearStart.value, DateRangeScene.InsightsExplorer);

    const changed = explorersStore.updateTransactionExplorerFilter({
        dateRangeType: chartDateType,
        startTime: startTime,
        endTime: endTime
    });

    showCustomDateRangeDialog.value = false;

    if (changed) {
        loading.value = true;
        explorersStore.updateTransactionExplorerInvalidState(true);
        router.push(getFilterLinkUrl());
    }
}

function shiftDateRange(scale: number): void {
    if (currentFilter.value.dateRangeType === DateRange.All.type) {
        return;
    }

    const newDateRange = getShiftedDateRangeAndDateType(currentFilter.value.startTime, currentFilter.value.endTime, scale, firstDayOfWeek.value, fiscalYearStart.value, DateRangeScene.Normal);

    const changed = explorersStore.updateTransactionExplorerFilter({
        dateRangeType: newDateRange.dateType,
        startTime: newDateRange.minTime,
        endTime: newDateRange.maxTime
    });

    if (changed) {
        loading.value = true;
        explorersStore.updateTransactionExplorerInvalidState(true);
        router.push(getFilterLinkUrl());
    }
}

function onShowTransaction(transaction: TransactionInsightDataItem): void {
    editDialog.value?.open({
        id: transaction.id,
        currentTransaction: Transaction.of(transaction)
    }).then(result => {
        if (result && result.message) {
            snackbar.value?.showMessage(result.message);
        }

        reload(false);
    }).catch(error => {
        if (error) {
            snackbar.value?.showError(error);
        }
    });
}

function onUpdateTransactions(): void {
    reload(false);
}

function onShowDateRangeError(message: string): void {
    snackbar.value?.showError(message);
}

onBeforeRouteUpdate((to) => {
    if (to.query) {
        init({
            initId: (to.query['id'] as string | null) || undefined,
            initActiveTab: (to.query['activeTab'] as string | null) || undefined,
            initDateRangeType: (to.query['dateRangeType'] as string | null) || undefined,
            initStartTime: (to.query['startTime'] as string | null) || undefined,
            initEndTime: (to.query['endTime'] as string | null) || undefined,
        });
    } else {
        init({});
    }
});

watch(() => display.mdAndUp.value, (newValue) => {
    alwaysShowNav.value = newValue;

    if (!showNav.value) {
        showNav.value = newValue;
    }
});

watch(activeTab, () => {
    if (initing.value || loading.value) {
        return;
    }

    router.push(getFilterLinkUrl());
});

watch(currentExploration, () => {
    if (initing.value || loading.value) {
        return;
    }

    isCurrentExplorationModified.value = true;
}, {
    deep: true
});

init(props);
</script>


<style scoped>
/* =========================================================
 * EXPLORADOR DE INSIGHTS
 * Layout limpo, consistente e sem regras duplicadas
 * ======================================================= */

.insights-page {
    width: calc(100% + 48px);
    min-width: 0;
    min-height: 100vh;
    margin: -24px;

    background: rgb(var(--v-theme-background));

    font-family:
        "Lausanne",
        "Helvetica Neue",
        Arial,
        sans-serif;
}

.insights-page,
.insights-page *,
.insights-page *::before,
.insights-page *::after {
    box-sizing: border-box;
}

.insights-page__column {
    min-width: 0;
    padding: 0 !important;
}

.insights-shell,
.insights-layout,
.insights-main,
.insights-content-card {
    min-width: 0;
    min-height: 100vh;

    background: rgb(var(--v-theme-background)) !important;
}

.insights-shell,
.insights-content-card {
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
}

/* =========================================================
 * SIDEBAR
 * ======================================================= */

.insights-sidebar {
    border-right: 1px solid rgb(var(--v-theme-muted-border)) !important;

    background: rgb(var(--v-theme-surface)) !important;
    box-shadow: none !important;
}

.insights-sidebar :deep(.v-navigation-drawer__content) {
    display: flex;
    min-height: 0;
    flex-direction: column;

    overflow: hidden;
}

.insights-sidebar__section {
    padding: 24px 16px;
}

.insights-sidebar__section--modes {
    padding-top: 24px;
    padding-bottom: 18px;
}

.insights-sidebar__divider {
    border-color: rgb(var(--v-theme-muted-border)) !important;
    opacity: 1 !important;
}

.insights-sidebar__tabs {
    min-height: 0;
    flex: 1 1 auto;

    margin: 14px 0 0 !important;
    padding: 0 12px 18px;

    overflow: hidden;
}

.insights-sidebar__tabs :deep(.v-slide-group__container),
.insights-sidebar__tabs :deep(.v-slide-group__content) {
    width: 100%;
}

.insights-sidebar__tabs :deep(.v-slide-group__content) {
    gap: 2px;
}

.insights-sidebar__tabs :deep(.v-tab) {
    width: 100%;
    min-height: 40px;

    justify-content: flex-start;

    padding-inline: 12px;

    border-radius: 6px !important;

    color: rgb(var(--v-theme-tertiary));

    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0 !important;
    text-transform: none !important;
}

.insights-sidebar__tabs :deep(.v-tab:hover) {
    color: rgb(var(--v-theme-on-surface));
    background: rgb(var(--v-theme-on-hover-background));
}

.insights-sidebar__tabs :deep(.v-tab--selected),
.insights-sidebar__tabs :deep(.v-tab-item--selected) {
    color: rgb(var(--v-theme-on-surface)) !important;
    background: rgb(var(--v-theme-verticalbutton-selected)) !important;

    font-weight: 600;
}

.insights-sidebar__tabs :deep(.v-tab__slider) {
    top: 8px !important;
    bottom: 8px !important;
    left: 8px !important;

    width: 2px !important;
    height: auto !important;

    background: rgb(var(--v-theme-highlight)) !important;
}

/* =========================================================
 * HEADER
 * ======================================================= */

.insights-content-card > :deep(.v-card-item) {
    padding: 0 !important;

    border-bottom: 1px solid rgb(var(--v-theme-muted-border));

    background: rgb(var(--v-theme-surface));
}

.insights-content-card > :deep(.v-card-item .v-card-title) {
    overflow: visible;

    white-space: normal;
}

.insights-page-header {
    width: 100%;

    background: rgb(var(--v-theme-surface));
}

.insights-page-header__top {
    display: flex;
    width: 100%;
    min-width: 0;
    align-items: center;
    justify-content: space-between;
    gap: 32px;

    padding: 38px 40px 32px;
}

.insights-page-header__identity {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 12px;
}

.insights-sidebar-trigger {
    flex: 0 0 auto;
}

.insights-page-header__titles {
    min-width: 0;
}

.insights-page-header__titles h1 {
    margin: 0;

    color: rgb(var(--v-theme-on-surface));

    font-size: clamp(2rem, 3.5vw, 3.2rem);
    font-weight: 500;
    letter-spacing: -0.055em;
    line-height: 1;
}

.insights-page-header__titles > span {
    display: block;
    max-width: 560px;

    overflow: hidden;

    margin-top: 12px;

    color: rgb(var(--v-theme-tertiary));

    font-size: 0.86rem;
    font-weight: 500;
    line-height: 1.4;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.insights-page-header__actions {
    display: flex;
    min-width: 0;
    flex: 0 0 auto;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
}

.insights-page-header__desktop-actions {
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
}

.insights-date-range-group {
    flex: 0 1 auto;

    box-shadow: none !important;
}

.insights-date-range-button {
    min-width: 138px;
    max-width: 220px;
}

.insights-date-range-button :deep(.v-btn__content) {
    overflow: hidden;

    text-overflow: ellipsis;
    white-space: nowrap;
}

.insights-save-button {
    min-width: 142px;

    letter-spacing: 0 !important;
    text-transform: none !important;
}

/*
 * O botão de ações móveis fica realmente oculto no desktop.
 * A duplicação dos dois menus "..." vinha da exibição simultânea
 * deste botão e do menu de ações do desktop.
 */
.insights-mobile-actions-trigger,
.insights-page-header__actions :deep(.insights-mobile-actions-trigger) {
    display: none !important;
}

/* =========================================================
 * CONTEÚDO DAS SUBPÁGINAS
 * ======================================================= */

/*
 * O v-window é filho direto do card e não fica dentro de .v-card-text.
 * Por isso, o espaçamento deve ser aplicado nele.
 *
 * Isso cria:
 * - margem superior para "Adicionar Consulta";
 * - espaçamento lateral para a tabela;
 * - alinhamento igual entre Consulta, Tabela de Dados e Gráfico.
 */
.insights-content-card > :deep(.v-window) {
    width: 100%;
    min-width: 0;

    padding: 28px 18px 28px;

    background: rgb(var(--v-theme-background));
}

.insights-content-card :deep(.v-window__container),
.insights-content-card :deep(.v-window-item) {
    min-width: 0;
}

.insights-content-card :deep(.v-window-item) {
    width: 100%;
}

/*
 * Remove margens externas conflitantes dos componentes internos,
 * mantendo todo o espaçamento sob controle do container principal.
 */
.insights-content-card :deep(.v-window-item > *) {
    max-width: 100%;
}

/*
 * Garante espaço abaixo da barra de ações inicial da aba Consulta.
 * O seletor cobre o primeiro bloco renderizado pelo componente filho,
 * sem depender de classes internas específicas.
 */
.insights-content-card :deep(.v-window-item[value="query"] > :first-child),
.insights-content-card :deep(.v-window-item:first-child > :first-child) {
    margin-top: 0;
}

/* Cards e tabelas internas */

.insights-content-card :deep(.v-card:not(.insights-content-card)) {
    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 10px;

    background: rgb(var(--v-theme-surface));

    box-shadow: none !important;
}

.insights-content-card :deep(.v-table),
.insights-content-card :deep(.v-data-table) {
    width: 100%;

    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 10px;

    background: rgb(var(--v-theme-surface));

    box-shadow: none;
}

.insights-content-card :deep(.v-table__wrapper),
.insights-content-card :deep(.v-data-table__wrapper) {
    width: 100%;
}

.insights-content-card :deep(.v-table th),
.insights-content-card :deep(.v-data-table th) {
    color: rgb(var(--v-theme-tertiary)) !important;
    background: rgb(var(--v-theme-secondary)) !important;

    font-size: 0.65rem !important;
    font-weight: 600 !important;
    letter-spacing: 0.035em;
    text-transform: uppercase;
}

.insights-content-card :deep(.v-table td),
.insights-content-card :deep(.v-data-table td) {
    border-color: rgb(var(--v-theme-muted-border)) !important;

    color: rgb(var(--v-theme-on-surface));

    font-size: 0.73rem;
}

.insights-content-card :deep(.v-table tbody tr:hover),
.insights-content-card :deep(.v-data-table tbody tr:hover) {
    background: rgb(var(--v-theme-on-hover-background));
}

/* =========================================================
 * RESPONSIVIDADE
 * ======================================================= */

@media (max-width: 1450px) {
    .insights-page-header__top {
        padding-inline: 36px;
    }

    .insights-content-card > :deep(.v-window) {
        padding-inline: 12px;
    }
}

@media (max-width: 1260px) {
    .insights-page-header__top {
        gap: 24px;

        padding-inline: 32px;
    }

    .insights-content-card > :deep(.v-window) {
        padding-inline: 12px;
    }
}

@media (max-width: 1180px) {
    .insights-page-header__desktop-actions {
        display: none !important;
    }

    .insights-mobile-actions-trigger,
    .insights-page-header__actions :deep(.insights-mobile-actions-trigger) {
        display: inline-grid !important;
    }
}

@media (max-width: 960px) {
    .insights-page-header__top {
        padding: 28px 22px 24px;
    }

    .insights-content-card > :deep(.v-window) {
        padding: 22px 12px 22px;
    }
}

@media (max-width: 700px) {
    .insights-page-header__top {
        gap: 18px;
    }

    .insights-page-header__titles h1 {
        font-size: 1.75rem;
    }

    .insights-page-header__titles > span {
        max-width: calc(100vw - 150px);

        margin-top: 7px;

        font-size: 0.72rem;
    }
}

@media (max-width: 600px) {
    .insights-page {
        width: calc(100% + 48px);
        margin: -24px;
    }

    .insights-page-header__top {
        padding: 22px 14px 18px;
    }

    .insights-page-header__titles h1 {
        font-size: 1.55rem;
    }

    .insights-page-header__titles > span {
        display: none;
    }

    .insights-content-card > :deep(.v-window) {
        padding: 18px 14px 28px;
    }

    .insights-content-card :deep(.v-card:not(.insights-content-card)),
    .insights-content-card :deep(.v-table),
    .insights-content-card :deep(.v-data-table) {
        border-radius: 8px;
    }
}
</style>