<template>
    <v-row class="statistics-page match-height">
        <v-col class="statistics-page__column" cols="12">
            <v-card class="statistics-shell" variant="flat">
                <v-layout class="statistics-layout">
                    <v-navigation-drawer class="statistics-sidebar" :permanent="alwaysShowNav" v-model="showNav">
                        <div class="statistics-sidebar__section statistics-sidebar__section--analysis">
                            <btn-vertical-group :disabled="loading" :buttons="[
                                { name: tt('Categorical Analysis'), value: StatisticsAnalysisType.CategoricalAnalysis },
                                { name: tt('Trend Analysis'), value: StatisticsAnalysisType.TrendAnalysis },
                                { name: tt('Asset Trends'), value: StatisticsAnalysisType.AssetTrends }
                            ]" v-model="queryAnalysisType" />
                        </div>
                        <v-divider class="statistics-sidebar__divider" />
                        <div class="statistics-sidebar__section">
                            <span class="statistics-sidebar__label">{{ tt('Chart Type') }}</span>
                            <v-select
                                item-title="displayName"
                                item-value="type"
                                class="statistics-sidebar__select mt-2"
                                density="compact"
                                :disabled="loading"
                                :items="allChartTypes"
                                v-model="queryChartType"
                                v-show="!isQuerySpecialChartType"
                            />
                            <v-select
                                item-title="displayName"
                                item-value="type"
                                class="statistics-sidebar__select mt-2"
                                density="compact"
                                :disabled="true"
                                :items="[{ displayName: tt('Sankey Chart'), type: 0 }]"
                                :model-value="0"
                                v-show="isQuerySpecialChartType && queryChartDataType === ChartDataType.Overview.type"
                            />
                        </div>
                        <div class="statistics-sidebar__section">
                            <span class="statistics-sidebar__label">{{ tt('Sort Order') }}</span>
                            <v-select
                                item-title="displayName"
                                item-value="type"
                                class="statistics-sidebar__select mt-2"
                                density="compact"
                                :disabled="loading"
                                :items="allSortingTypes"
                                v-model="querySortingType"
                            />
                        </div>
                        <v-tabs show-arrows class="statistics-sidebar__tabs" direction="vertical"
                                :disabled="loading" v-model="queryChartDataType">
                            <v-tab class="tab-text-truncate" :key="dataType.type" :value="dataType.type"
                                   v-for="dataType in ChartDataType.values(undefined, true)"
                                   v-show="dataType.isAvailableAnalysisType(queryAnalysisType)">
                                <span class="text-truncate">{{ tt(dataType.name) }}</span>
                                <v-tooltip activator="parent" location="right">{{ tt(dataType.name) }}</v-tooltip>
                            </v-tab>
                        </v-tabs>
                    </v-navigation-drawer>
                    <v-main class="statistics-main">
                        <v-window class="d-flex flex-grow-1 disable-tab-transition w-100-window-container" v-model="activeTab">
                            <v-window-item value="statisticsPage">
                                <v-card class="statistics-content-card" variant="flat" :min-height="queryAnalysisType === StatisticsAnalysisType.TrendAnalysis || queryAnalysisType === StatisticsAnalysisType.AssetTrends ? '900' : '800'">
                                    <template #title>
                                        <div class="statistics-page-header">
    <div class="statistics-page-header__top">
        <div class="statistics-page-header__identity">
            <v-btn
                class="d-md-none statistics-sidebar-trigger"
                density="compact"
                color="default"
                variant="plain"
                :ripple="false"
                :icon="true"
                @click="showNav = !showNav"
            >
                <v-icon :icon="mdiMenu" size="22" />
            </v-btn>

            <div class="statistics-page-header__titles">
                <h1>{{ tt('Statistics & Analysis') }}</h1>

                <span>
                    {{
                        queryAnalysisType === StatisticsAnalysisType.CategoricalAnalysis
                            ? tt('Categorical Analysis')
                            : (
                                queryAnalysisType === StatisticsAnalysisType.TrendAnalysis
                                    ? tt('Trend Analysis')
                                    : tt('Asset Trends')
                            )
                    }}
                </span>
            </div>
        </div>
    </div>

    <div class="statistics-page-toolbar">
        <div class="statistics-page-toolbar__search">
            <div class="statistics-search statistics-search--desktop">
                <v-text-field
                    v-if="canUseKeywordFilter"
                    density="compact"
                    variant="outlined"
                    hide-details
                    :disabled="loading"
                    :prepend-inner-icon="mdiMagnify"
                    :append-inner-icon="filterKeyword !== query.keyword ? mdiCheck : undefined"
                    :placeholder="tt('Filter transaction description')"
                    v-model="filterKeyword"
                    @click:append-inner="setKeywordFilter(filterKeyword)"
                    @keyup.enter="setKeywordFilter(filterKeyword)"
                />
            </div>

            <v-menu
                v-if="canUseKeywordFilter"
                v-model="showCompactSearch"
                location="bottom start"
                :close-on-content-click="false"
                width="320"
                max-width="calc(100vw - 24px)"
            >
                <template #activator="{ props }">
                    <v-btn
                        class="statistics-search-trigger"
                        density="comfortable"
                        color="default"
                        variant="text"
                        :icon="true"
                        v-bind="props"
                    >
                        <v-icon :icon="mdiMagnify" size="21" />

                        <v-tooltip activator="parent">
                            {{ tt('Search') }}
                        </v-tooltip>
                    </v-btn>
                </template>

                <v-card class="statistics-search-popover" elevation="0">
                    <v-card-text>
                        <v-text-field
                            autofocus
                            density="comfortable"
                            variant="outlined"
                            hide-details
                            clearable
                            :disabled="loading"
                            :prepend-inner-icon="mdiMagnify"
                            :append-inner-icon="filterKeyword !== query.keyword ? mdiCheck : undefined"
                            :placeholder="tt('Filter transaction description')"
                            v-model="filterKeyword"
                            @click:append-inner="applyCompactKeywordFilter"
                            @keyup.enter="applyCompactKeywordFilter"
                        />
                    </v-card-text>
                </v-card>
            </v-menu>
        </div>

        <div class="statistics-page-toolbar__actions">
            <div class="statistics-page-header__desktop-actions">
                <v-btn-group
                    class="statistics-date-range-group"
                    color="default"
                    density="comfortable"
                    variant="outlined"
                    divided
                >
                    <v-btn
                        class="button-icon-with-direction"
                        :icon="mdiArrowLeft"
                        :disabled="loading || !canShiftDateRange"
                        @click="shiftDateRange(-1)"
                    />

                    <v-menu location="bottom" max-height="500">
                        <template #activator="{ props }">
                            <v-btn
                                class="statistics-date-range-button"
                                :disabled="loading || !canChangeDateRange"
                                v-bind="props"
                            >
                                {{ queryDateRangeName }}
                            </v-btn>
                        </template>

                        <v-list :selected="[queryDateType]">
                            <v-list-item
                                :key="dateRange.type"
                                :value="dateRange.type"
                                :append-icon="queryDateType === dateRange.type ? mdiCheck : undefined"
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
                                            canShowCustomDateRange(dateRange.type)
                                        "
                                    >
                                        <span>{{ queryStartTime }}</span>
                                        <span>&nbsp;-&nbsp;</span>
                                        <br />
                                        <span>{{ queryEndTime }}</span>
                                    </div>
                                </v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>

                    <v-btn
                        class="button-icon-with-direction"
                        :icon="mdiArrowRight"
                        :disabled="loading || !canShiftDateRange"
                        @click="shiftDateRange(1)"
                    />
                </v-btn-group>

                <v-menu
                    location="bottom"
                    max-height="500"
                    v-if="queryAnalysisType === StatisticsAnalysisType.TrendAnalysis"
                >
                    <template #activator="{ props }">
                        <v-btn
                            class="statistics-aggregation-button"
                            color="default"
                            variant="outlined"
                            :prepend-icon="mdiCalendarRangeOutline"
                            :disabled="loading"
                            v-bind="props"
                        >
                            {{ queryTrendDateAggregationTypeName }}
                        </v-btn>
                    </template>

                    <v-list>
                        <v-list-item
                            class="cursor-pointer"
                            :key="aggregationType.type"
                            :value="aggregationType.type"
                            :append-icon="
                                trendDateAggregationType === aggregationType.type
                                    ? mdiCheck
                                    : undefined
                            "
                            :title="aggregationType.displayName"
                            v-for="aggregationType in allTrendAnalysisDateAggregationTypes"
                            @click="setTrendDateAggregationType(aggregationType.type)"
                        />
                    </v-list>
                </v-menu>

                <v-menu
                    location="bottom"
                    max-height="500"
                    v-if="queryAnalysisType === StatisticsAnalysisType.AssetTrends"
                >
                    <template #activator="{ props }">
                        <v-btn
                            class="statistics-aggregation-button"
                            color="default"
                            variant="outlined"
                            :prepend-icon="mdiCalendarRangeOutline"
                            :disabled="loading"
                            v-bind="props"
                        >
                            {{ queryAssetTrendsDateAggregationTypeName }}
                        </v-btn>
                    </template>

                    <v-list>
                        <v-list-item
                            class="cursor-pointer"
                            :key="aggregationType.type"
                            :value="aggregationType.type"
                            :append-icon="
                                assetTrendsDateAggregationType === aggregationType.type
                                    ? mdiCheck
                                    : undefined
                            "
                            :title="aggregationType.displayName"
                            v-for="aggregationType in allAssetTrendsDateAggregationTypes"
                            @click="setAssetTrendsDateAggregationType(aggregationType.type)"
                        />
                    </v-list>
                </v-menu>

                <v-btn
                    class="statistics-toolbar-icon-button"
                    density="comfortable"
                    color="default"
                    variant="text"
                    :icon="true"
                    :loading="loading"
                    @click="reload(true)"
                >
                    <template #loader>
                        <v-progress-circular indeterminate size="19" />
                    </template>

                    <v-icon :icon="mdiRefresh" size="21" />

                    <v-tooltip activator="parent">
                        {{ tt('Refresh') }}
                    </v-tooltip>
                </v-btn>

                <v-btn
                    class="statistics-toolbar-icon-button"
                    density="comfortable"
                    color="default"
                    variant="text"
                    :disabled="loading"
                    :icon="true"
                >
                    <v-icon :icon="mdiDotsVertical" />

                    <v-menu activator="parent">
                        <v-list>
                            <v-list-item
                                :disabled="loading"
                                :prepend-icon="mdiFilterOutline"
                                :title="tt('Filter Accounts')"
                                @click="showFilterAccountDialog = true"
                            />

                            <v-list-item
                                :disabled="loading"
                                :prepend-icon="mdiFilterOutline"
                                :title="tt('Filter Transaction Categories')"
                                @click="showFilterCategoryDialog = true"
                                v-if="canUseCategoryFilter"
                            />

                            <v-list-item
                                :disabled="loading"
                                :prepend-icon="mdiFilterOutline"
                                :title="tt('Filter Transaction Tags')"
                                @click="showFilterTagDialog = true"
                                v-if="canUseTagFilter"
                            />

                            <v-divider
                                class="my-2"
                                v-if="!isQuerySpecialChartType"
                            />

                            <v-list-item
                                :prepend-icon="mdiExport"
                                :title="tt('Export Results')"
                                :disabled="!statisticsDataHasData"
                                @click="exportResults"
                                v-if="!isQuerySpecialChartType"
                            />

                            <v-divider class="my-2" />

                            <v-list-item
                                to="/app/settings?tab=statisticsSetting"
                                :prepend-icon="mdiFilterCogOutline"
                                :title="tt('Settings')"
                            />
                        </v-list>
                    </v-menu>
                </v-btn>
            </div>

            <v-btn
                class="statistics-mobile-actions-trigger"
                density="comfortable"
                color="default"
                variant="text"
                :icon="true"
            >
                <v-icon :icon="mdiDotsVertical" size="22" />

                <v-menu activator="parent" location="bottom end">
                    <v-list>
                        <v-list-item
                            :disabled="loading"
                            :prepend-icon="mdiCalendarRangeOutline"
                            :title="queryDateRangeName"
                        >
                            <v-menu
                                activator="parent"
                                location="start"
                                max-height="500"
                            >
                                <v-list :selected="[queryDateType]">
                                    <v-list-item
                                        :key="dateRange.type"
                                        :value="dateRange.type"
                                        :append-icon="
                                            queryDateType === dateRange.type
                                                ? mdiCheck
                                                : undefined
                                        "
                                        :title="dateRange.displayName"
                                        v-for="dateRange in allDateRanges"
                                        @click="setDateFilter(dateRange.type)"
                                    />
                                </v-list>
                            </v-menu>
                        </v-list-item>

                        <v-list-item
                            :disabled="loading"
                            :prepend-icon="mdiFilterOutline"
                            :title="tt('Filter Accounts')"
                            @click="showFilterAccountDialog = true"
                        />

                        <v-list-item
                            v-if="canUseCategoryFilter"
                            :disabled="loading"
                            :prepend-icon="mdiFilterOutline"
                            :title="tt('Filter Transaction Categories')"
                            @click="showFilterCategoryDialog = true"
                        />

                        <v-list-item
                            v-if="canUseTagFilter"
                            :disabled="loading"
                            :prepend-icon="mdiFilterOutline"
                            :title="tt('Filter Transaction Tags')"
                            @click="showFilterTagDialog = true"
                        />

                        <v-divider class="my-2" />

                        <v-list-item
                            :disabled="loading"
                            :prepend-icon="mdiRefresh"
                            :title="tt('Refresh')"
                            @click="reload(true)"
                        />

                        <v-list-item
                            v-if="!isQuerySpecialChartType"
                            :disabled="!statisticsDataHasData"
                            :prepend-icon="mdiExport"
                            :title="tt('Export Results')"
                            @click="exportResults"
                        />

                        <v-list-item
                            to="/app/settings?tab=statisticsSetting"
                            :prepend-icon="mdiFilterCogOutline"
                            :title="tt('Settings')"
                        />
                    </v-list>
                </v-menu>
            </v-btn>
        </div>
    </div>
</div>
                                    </template>

                                    <v-card-text class="statistics-overview-title pt-0" :class="{ 'disabled': loading }"
                                                 v-if="queryAnalysisType === StatisticsAnalysisType.CategoricalAnalysis && isQuerySpecialChartType && queryChartDataType === ChartDataType.Overview.type && (initing || categoricalOverviewAnalysisData && categoricalOverviewAnalysisData.items && categoricalOverviewAnalysisData.items.length)">
                                        <span class="statistics-subtitle">{{ tt('Total Income') }}</span>
                                        <span class="statistics-overview-amount ms-3 text-income"
                                              v-if="!initing && categoricalOverviewAnalysisData && categoricalOverviewAnalysisData.items && categoricalOverviewAnalysisData.items.length">
                                            {{ getDisplayAmount(categoricalOverviewAnalysisData.totalIncome, defaultCurrency) }}
                                        </span>
                                        <v-skeleton-loader class="skeleton-no-margin ms-3 mb-2"
                                                           width="120px" type="text" :loading="true"
                                                           v-else-if="initing"></v-skeleton-loader>
                                        <span class="statistics-subtitle ms-3">{{ tt('Total Expense') }}</span>
                                        <span class="statistics-overview-amount ms-3 text-expense"
                                              v-if="!initing && categoricalOverviewAnalysisData && categoricalOverviewAnalysisData.items && categoricalOverviewAnalysisData.items.length">
                                            {{ getDisplayAmount(categoricalOverviewAnalysisData.totalExpense, defaultCurrency) }}
                                        </span>
                                        <v-skeleton-loader class="skeleton-no-margin ms-3 mb-2"
                                                           width="120px" type="text" :loading="true"
                                                           v-else-if="initing"></v-skeleton-loader>
                                    </v-card-text>

                                    <v-card-text class="statistics-overview-title pt-0" :class="{ 'disabled': loading }"
                                                 v-else-if="queryAnalysisType === StatisticsAnalysisType.CategoricalAnalysis && !isQuerySpecialChartType && (initing || (categoricalAnalysisData && categoricalAnalysisData.items && categoricalAnalysisData.items.length))">
                                        <span class="statistics-subtitle">{{ totalAmountName }}</span>
                                        <span class="statistics-overview-amount ms-3"
                                              :class="statisticsTextColor"
                                              v-if="!initing && categoricalAnalysisData && categoricalAnalysisData.items && categoricalAnalysisData.items.length">
                                            {{ getDisplayAmount(categoricalAnalysisData.value, defaultCurrency) }}
                                        </span>
                                        <v-skeleton-loader class="skeleton-no-margin ms-3 mb-2"
                                                           width="120px" type="text" :loading="true"
                                                           v-else-if="initing"></v-skeleton-loader>
                                    </v-card-text>

                                    <v-card-text class="statistics-overview-title pt-0"
                                                 v-else-if="!loading && (
                                                     (queryAnalysisType === StatisticsAnalysisType.CategoricalAnalysis && isQuerySpecialChartType && queryChartDataType === ChartDataType.Overview.type && (!categoricalOverviewAnalysisData || !categoricalOverviewAnalysisData.items || !categoricalOverviewAnalysisData.items.length))
                                                  || (queryAnalysisType === StatisticsAnalysisType.CategoricalAnalysis && !isQuerySpecialChartType && (!categoricalAnalysisData || !categoricalAnalysisData.items || !categoricalAnalysisData.items.length))
                                                  || (queryAnalysisType === StatisticsAnalysisType.TrendAnalysis && (!trendsAnalysisData || !trendsAnalysisData.items || !trendsAnalysisData.items.length))
                                                  || (queryAnalysisType === StatisticsAnalysisType.AssetTrends && (!assetTrendsData || !assetTrendsData.items || !assetTrendsData.items.length))
                                                  )">
                                        <span class="statistics-subtitle statistics-overview-empty-tip">{{ tt('No transaction data') }}</span>
                                    </v-card-text>

                                    <v-card-text :class="{ 'readonly': loading }" v-if="queryAnalysisType === StatisticsAnalysisType.CategoricalAnalysis && queryChartDataType === ChartDataType.Overview.type">
                                        <account-and-category-sankey-chart
                                            :items="[]"
                                            :sorting-type="querySortingType"
                                            :skeleton="true"
                                            v-if="initing"
                                        />
                                        <account-and-category-sankey-chart
                                            :items="categoricalOverviewAnalysisData && categoricalOverviewAnalysisData.items && categoricalOverviewAnalysisData.items.length ? categoricalOverviewAnalysisData.items : []"
                                            :enable-click-item="true"
                                            :default-currency="defaultCurrency"
                                            v-else-if="!initing"
                                            @click="onClickSankeyChartItem"
                                        />
                                    </v-card-text>

                                    <v-card-text :class="{ 'readonly': loading }" v-if="queryAnalysisType === StatisticsAnalysisType.CategoricalAnalysis && !isQuerySpecialChartType && query.categoricalChartType === CategoricalChartType.Pie.type">
                                        <pie-chart
                                            :items="[
                                                { id: '1', name: '---', value: parseBigDecimal(60), color: '7c7c7f' },
                                                { id: '2', name: '---', value: parseBigDecimal(20), color: 'a5a5aa' },
                                                { id: '3', name: '---', value: parseBigDecimal(20), color: 'c5c5c9' }
                                            ]"
                                            :value-type="ChartValueType.Amount"
                                            :skeleton="true"
                                            :use-custom-color="true"
                                            v-if="initing"
                                        />
                                        <pie-chart
                                            :items="categoricalAnalysisData && categoricalAnalysisData.items && categoricalAnalysisData.items.length ? categoricalAnalysisData.items : []"
                                            :value-type="ChartValueType.Amount"
                                            :show-value="showAmountInChart"
                                            :show-percent="showPercentInCategoricalChart"
                                            :enable-click-item="true"
                                            :default-currency="defaultCurrency"
                                            v-else-if="!initing"
                                            @click="onClickPieChartItem"
                                        />
                                    </v-card-text>

                                    <v-card-text :class="{ 'readonly': loading }" v-if="queryAnalysisType === StatisticsAnalysisType.CategoricalAnalysis && !isQuerySpecialChartType && query.categoricalChartType === CategoricalChartType.Bar.type">
                                        <v-list rounded lines="two" v-if="initing">
                                            <template :key="itemIdx" v-for="itemIdx in [ 1, 2, 3 ]">
                                                <v-list-item class="ps-0">
                                                    <template #prepend>
                                                        <div>
                                                            <v-icon class="disabled me-0" size="34" :icon="mdiSquareRounded" />
                                                        </div>
                                                    </template>
                                                    <div class="d-flex flex-column ms-2">
                                                        <div class="d-flex">
                                                            <v-skeleton-loader class="skeleton-no-margin my-2"
                                                                               width="120px" type="text" :loading="true"></v-skeleton-loader>
                                                        </div>
                                                        <div>
                                                            <v-progress-linear :model-value="0" :height="4"></v-progress-linear>
                                                        </div>
                                                    </div>
                                                </v-list-item>
                                                <v-divider v-if="itemIdx < 3"/>
                                            </template>
                                        </v-list>
                                        <v-list class="py-0" rounded lines="two" v-else-if="!initing && categoricalAnalysisData && categoricalAnalysisData.items && categoricalAnalysisData.items.length">
                                            <template :key="idx"
                                                      v-for="(item, idx) in categoricalAnalysisData.items">
                                                <v-list-item class="ps-0" v-if="!item.hidden">
                                                    <template #prepend>
                                                        <router-link class="statistics-list-item" :to="getTransactionItemLinkUrl(item.id)">
                                                            <ItemIcon :icon-type="queryChartDataCategory" size="34px"
                                                                      :icon-id="item.icon"
                                                                      :color="item.color"></ItemIcon>
                                                        </router-link>
                                                    </template>
                                                    <router-link class="statistics-list-item" :to="getTransactionItemLinkUrl(item.id)">
                                                        <div class="d-flex flex-column ms-2">
                                                            <div class="d-flex">
                                                                <span>{{ item.name }}</span>
                                                                <small class="statistics-percent" v-if="showPercentInCategoricalChart && item.percent >= 0 && item.value.isPositiveOrZero()">{{ formatPercentToLocalizedNumerals(item.percent, 2, '<0.01') }}</small>
                                                                <v-spacer/>
                                                                <span class="statistics-amount">{{ getDisplayAmount(item.value, defaultCurrency) }}</span>
                                                            </div>
                                                            <div>
                                                                <v-progress-linear :color="item.color ? getTransactionCategoricalAnalysisDataItemDisplayColor(item) : 'primary'"
                                                                                   :bg-color="isDarkMode ? '#444444' : '#f8f8f8'" :bg-opacity="1"
                                                                                   :model-value="item.percent >= 0 ? item.percent : 0"
                                                                                   :height="4"></v-progress-linear>
                                                            </div>
                                                        </div>
                                                    </router-link>
                                                </v-list-item>
                                                <v-divider v-if="!item.hidden && idx !== categoricalAnalysisData.items.length - 1"/>
                                            </template>
                                        </v-list>
                                    </v-card-text>

                                    <v-card-text :class="{ 'readonly': loading }" v-if="queryAnalysisType === StatisticsAnalysisType.CategoricalAnalysis && !isQuerySpecialChartType && query.categoricalChartType === CategoricalChartType.Radar.type">
                                        <radar-chart
                                            :items="[
                                                {name: '---', value: 10},
                                                {name: '---', value: 10},
                                                {name: '---', value: 10},
                                                {name: '---', value: 10},
                                                {name: '---', value: 10},
                                                {name: '---', value: 10}
                                            ]"
                                            :value-type="ChartValueType.Amount"
                                            :skeleton="true"
                                            v-if="initing"
                                        />
                                        <radar-chart
                                            :items="categoricalAnalysisData && categoricalAnalysisData.items && categoricalAnalysisData.items.length ? categoricalAnalysisData.items : []"
                                            :value-type="ChartValueType.Amount"
                                            :show-value="showAmountInChart"
                                            :show-percent="showPercentInCategoricalChart"
                                            :default-currency="defaultCurrency"
                                            v-else-if="!initing"
                                        />
                                    </v-card-text>

                                    <v-card-text :class="{ 'readonly': loading }" v-if="queryAnalysisType === StatisticsAnalysisType.TrendAnalysis">
                                        <trends-chart
                                            chart-mode="monthly"
                                            :type="queryChartType"
                                            :start-time="undefined"
                                            :end-time="undefined"
                                            :start-year-month="query.trendChartStartYearMonth"
                                            :end-year-month="query.trendChartEndYearMonth"
                                            :sorting-type="querySortingType"
                                            :data-aggregation-type="ChartDataAggregationType.Sum"
                                            :date-aggregation-type="trendDateAggregationType"
                                            :fiscal-year-start="fiscalYearStart"
                                            :items="[]"
                                            :value-type="ChartValueType.Amount"
                                            :skeleton="true"
                                            v-if="initing"
                                        />
                                        <trends-chart
                                            chart-mode="monthly"
                                            :type="queryChartType"
                                            :start-time="undefined"
                                            :end-time="undefined"
                                            :start-year-month="query.trendChartStartYearMonth"
                                            :end-year-month="query.trendChartEndYearMonth"
                                            :sorting-type="querySortingType"
                                            :data-aggregation-type="ChartDataAggregationType.Sum"
                                            :date-aggregation-type="trendDateAggregationType"
                                            :fiscal-year-start="fiscalYearStart"
                                            :items="trendsAnalysisData && trendsAnalysisData.items && trendsAnalysisData.items.length ? trendsAnalysisData.items : []"
                                            :value-type="ChartValueType.Amount"
                                            :translate-name="translateNameInTrendsChart"
                                            :show-value="showAmountInChart"
                                            :enable-click-item="true"
                                            :default-currency="defaultCurrency"
                                            :stacked="showStackedInTrendsChart"
                                            :show-total-amount-in-tooltip="showTotalAmountInTrendsChart"
                                            :show-year-over-year="true"
                                            :show-period-over-period="trendDateAggregationType === ChartDateAggregationType.Month.type || trendDateAggregationType === ChartDateAggregationType.Quarter.type"
                                            ref="monthlyTrendsChart"
                                            v-else-if="!initing && trendsAnalysisData && trendsAnalysisData.items && trendsAnalysisData.items.length"
                                            @click="onClickTrendChartItem"
                                        />
                                    </v-card-text>

                                    <v-card-text :class="{ 'readonly': loading }" v-if="queryAnalysisType === StatisticsAnalysisType.AssetTrends">
                                        <trends-chart
                                            chart-mode="daily"
                                            :type="queryChartType"
                                            :start-time="query.assetTrendsChartStartTime"
                                            :end-time="query.assetTrendsChartEndTime"
                                            :start-year-month="undefined"
                                            :end-year-month="undefined"
                                            :sorting-type="querySortingType"
                                            :data-aggregation-type="ChartDataAggregationType.Last"
                                            :date-aggregation-type="assetTrendsDateAggregationType"
                                            :fiscal-year-start="fiscalYearStart"
                                            :items="[]"
                                            :value-type="ChartValueType.Amount"
                                            :skeleton="true"
                                            v-if="initing"
                                        />
                                        <trends-chart
                                            chart-mode="daily"
                                            :type="queryChartType"
                                            :start-time="query.assetTrendsChartStartTime"
                                            :end-time="query.assetTrendsChartEndTime"
                                            :start-year-month="undefined"
                                            :end-year-month="undefined"
                                            :sorting-type="querySortingType"
                                            :data-aggregation-type="ChartDataAggregationType.Last"
                                            :date-aggregation-type="assetTrendsDateAggregationType"
                                            :fiscal-year-start="fiscalYearStart"
                                            :items="assetTrendsData && assetTrendsData.items && assetTrendsData.items.length ? assetTrendsData.items : []"
                                            :value-type="ChartValueType.Amount"
                                            :translate-name="translateNameInTrendsChart"
                                            :show-value="showAmountInChart"
                                            :enable-click-item="true"
                                            :default-currency="defaultCurrency"
                                            :stacked="showStackedInTrendsChart"
                                            :show-total-amount-in-tooltip="showTotalAmountInTrendsChart"
                                            :show-year-over-year="true"
                                            :show-period-over-period="assetTrendsDateAggregationType === ChartDateAggregationType.Day.type || assetTrendsDateAggregationType === ChartDateAggregationType.Month.type || assetTrendsDateAggregationType === ChartDateAggregationType.Quarter.type"
                                            ref="dailyTrendsChart"
                                            v-else-if="!initing && assetTrendsData && assetTrendsData.items && assetTrendsData.items.length"
                                            @click="onClickTrendChartItem"
                                        />
                                    </v-card-text>
                                </v-card>
                            </v-window-item>
                        </v-window>
                    </v-main>
                </v-layout>
            </v-card>
        </v-col>
    </v-row>

    <date-range-selection-dialog :title="tt('Custom Date Range')"
                                  :min-time="query.categoricalChartStartTime"
                                  :max-time="query.categoricalChartEndTime"
                                  v-model:show="showCustomDateRangeDialog"
                                  @dateRange:change="setCustomDateFilter"
                                  @error="onShowDateRangeError" />

    <month-range-selection-dialog :title="tt('Custom Date Range')"
                                  :min-time="query.trendChartStartYearMonth"
                                  :max-time="query.trendChartEndYearMonth"
                                  v-model:show="showCustomMonthRangeDialog"
                                  @dateRange:change="setCustomDateFilter"
                                  @error="onShowDateRangeError" />

    <v-dialog width="800" v-model="showFilterAccountDialog">
        <account-filter-settings-card type="statisticsCurrent" :dialog-mode="true"
            @settings:change="setAccountFilter" />
    </v-dialog>

    <v-dialog width="800" v-model="showFilterCategoryDialog">
        <category-filter-settings-card type="statisticsCurrent" :dialog-mode="true"
            @settings:change="setCategoryFilter" />
    </v-dialog>

    <v-dialog width="800" v-model="showFilterTagDialog">
        <transaction-tag-filter-settings-card type="statisticsCurrent" :dialog-mode="true"
                                              @settings:change="setTagFilter" />
    </v-dialog>

    <export-dialog ref="exportDialog" />

    <snack-bar ref="snackbar" />
</template>

<script setup lang="ts">
import SnackBar from '@/components/desktop/SnackBar.vue';
import TrendsChart from '@/components/desktop/TrendsChart.vue';
import AccountFilterSettingsCard from '@/views/desktop/common/cards/AccountFilterSettingsCard.vue';
import CategoryFilterSettingsCard from '@/views/desktop/common/cards/CategoryFilterSettingsCard.vue';
import TransactionTagFilterSettingsCard from '@/views/desktop/common/cards/TransactionTagFilterSettingsCard.vue';
import ExportDialog from '@/views/desktop/statistics/transaction/dialogs/ExportDialog.vue';

import { ref, computed, useTemplateRef, watch } from 'vue';
import { useRouter, onBeforeRouteUpdate } from 'vue-router';
import { useDisplay, useTheme } from 'vuetify';

import { useI18n } from '@/locales/helpers.ts';
import { useStatisticsTransactionPageBase } from '@/views/base/statistics/StatisticsTransactionPageBase.ts';

import { useAccountsStore } from '@/stores/account.ts';
import { useTransactionCategoriesStore } from '@/stores/transactionCategory.ts';
import { type TransactionStatisticsPartialFilter, useStatisticsStore } from '@/stores/statistics.ts';

import type { TypeAndDisplayName } from '@/core/base.ts';
import { type TextualYearMonth, type TimeRangeAndDateType, DateRangeScene, DateRange } from '@/core/datetime.ts';
import { ThemeType } from '@/core/theme.ts';
import { ChartValueType } from '@/core/chart.ts';
import {
    ChartDataAggregationType,
    StatisticsAnalysisType,
    CategoricalChartType,
    TrendChartType,
    ChartDataType,
    ChartSortingType,
    ChartDateAggregationType,
    ExportMermaidChartType
} from '@/core/statistics.ts';

import {
    isDefined,
    isString,
    isNumber,
    arrayItemToObjectField
} from '@/lib/common.ts';
import {
    parseBigDecimal
} from '@/lib/numeral.ts';
import {
    getGregorianCalendarYearAndMonthFromUnixTime,
    getYearMonthFirstUnixTime,
    getYearMonthLastUnixTime,
    getShiftedDateRangeAndDateType,
    getDateTypeByDateRange,
    getDateRangeByDateType
} from '@/lib/datetime.ts';

import {
    mdiCheck,
    mdiArrowLeft,
    mdiArrowRight,
    mdiCalendarRangeOutline,
    mdiRefresh,
    mdiSquareRounded,
    mdiMagnify,
    mdiMenu,
    mdiFilterOutline,
    mdiFilterCogOutline,
    mdiExport,
    mdiDotsVertical
} from '@mdi/js';

type SnackBarType = InstanceType<typeof SnackBar>;
type TrendsChartType = InstanceType<typeof TrendsChart>;
type ExportDialogType = InstanceType<typeof ExportDialog>;

interface TransactionStatisticsProps {
    initAnalysisType?: string,
    initChartDataType?: string,
    initChartType?: string,
    initChartDateType?: string,
    initStartTime?: TextualYearMonth | '',
    initEndTime?: TextualYearMonth | '',
    initFilterAccountIds?: string,
    initFilterCategoryIds?: string,
    initTagFilter?: string,
    initKeyword?: string;
    initMatchMode?: string;
    initSortingType?: string,
    initTrendDateAggregationType?: string
    initAssetTrendsDateAggregationType?: string
}

const props = defineProps<TransactionStatisticsProps>();

const router = useRouter();
const display = useDisplay();
const theme = useTheme();

const {
    tt,
    getAllCategoricalChartTypes,
    getAllTrendChartTypes,
    formatAmountToWesternArabicNumeralsWithoutDigitGrouping,
    formatPercentToLocalizedNumerals
} = useI18n();

const {
    loading,
    analysisType,
    trendDateAggregationType,
    assetTrendsDateAggregationType,
    defaultCurrency,
    firstDayOfWeek,
    fiscalYearStart,
    allDateRanges,
    allSortingTypes,
    allTrendAnalysisDateAggregationTypes,
    allAssetTrendsDateAggregationTypes,
    query,
    queryChartDataCategory,
    queryDateType,
    queryStartTime,
    queryEndTime,
    queryDateRangeName,
    queryTrendDateAggregationTypeName,
    queryAssetTrendsDateAggregationTypeName,
    canChangeDateRange,
    canShiftDateRange,
    canUseCategoryFilter,
    canUseTagFilter,
    canUseKeywordFilter,
    showAmountInChart,
    totalAmountName,
    showPercentInCategoricalChart,
    showTotalAmountInTrendsChart,
    showStackedInTrendsChart,
    translateNameInTrendsChart,
    categoricalOverviewAnalysisData,
    categoricalAnalysisData,
    trendsAnalysisData,
    assetTrendsData,
    canShowCustomDateRange,
    getTransactionCategoricalAnalysisDataItemDisplayColor,
    getDisplayAmount
} = useStatisticsTransactionPageBase();

const accountsStore = useAccountsStore();
const transactionCategoriesStore = useTransactionCategoriesStore();
const statisticsStore = useStatisticsStore();

const snackbar = useTemplateRef<SnackBarType>('snackbar');
const monthlyTrendsChart = useTemplateRef<TrendsChartType>('monthlyTrendsChart');
const dailyTrendsChart = useTemplateRef<TrendsChartType>('dailyTrendsChart');
const exportDialog = useTemplateRef<ExportDialogType>('exportDialog');

const activeTab = ref<string>('statisticsPage');
const initing = ref<boolean>(true);
const filterKeyword = ref<string>('');
const showCompactSearch = ref<boolean>(false);
const alwaysShowNav = ref<boolean>(display.mdAndUp.value);
const showNav = ref<boolean>(display.mdAndUp.value);
const showCustomDateRangeDialog = ref<boolean>(false);
const showCustomMonthRangeDialog = ref<boolean>(false);
const showFilterAccountDialog = ref<boolean>(false);
const showFilterCategoryDialog = ref<boolean>(false);
const showFilterTagDialog = ref<boolean>(false);

const isDarkMode = computed<boolean>(() => theme.global.name.value === ThemeType.Dark);

const statisticsDataHasData = computed<boolean>(() => {
    if (analysisType.value === StatisticsAnalysisType.CategoricalAnalysis) {
        return !!categoricalAnalysisData.value && !!categoricalAnalysisData.value.items && categoricalAnalysisData.value.items.length > 0;
    } else if (analysisType.value === StatisticsAnalysisType.TrendAnalysis) {
        return !!trendsAnalysisData.value && !!trendsAnalysisData.value.items && trendsAnalysisData.value.items.length > 0 && !!monthlyTrendsChart.value;
    } else if (analysisType.value === StatisticsAnalysisType.AssetTrends) {
        return !!assetTrendsData.value && !!assetTrendsData.value.items && assetTrendsData.value.items.length > 0 && !!dailyTrendsChart.value;
    }

    return false;
});

const allChartTypes = computed<TypeAndDisplayName[]>(() => {
    if (analysisType.value === StatisticsAnalysisType.CategoricalAnalysis) {
        return getAllCategoricalChartTypes(true);
    } else if (analysisType.value === StatisticsAnalysisType.TrendAnalysis) {
        return getAllTrendChartTypes();
    } else if (analysisType.value === StatisticsAnalysisType.AssetTrends) {
        return getAllTrendChartTypes();
    } else {
        return [];
    }
});

const queryAnalysisType = computed<StatisticsAnalysisType>({
    get: () => analysisType.value,
    set: (value: number) => {
        setAnalysisType(value);
    }
});

const queryChartType = computed<number | undefined>({
    get: () => {
        if (analysisType.value === StatisticsAnalysisType.CategoricalAnalysis) {
            return query.value.categoricalChartType;
        } else if (analysisType.value === StatisticsAnalysisType.TrendAnalysis) {
            return query.value.trendChartType;
        } else if (analysisType.value === StatisticsAnalysisType.AssetTrends) {
            return query.value.assetTrendsChartType;
        } else {
            return undefined;
        }
    },
    set: (value: number | undefined) => {
        setChartType(value);
    }
});

const queryChartDataType = computed<number>({
    get: () => query.value.chartDataType,
    set: (value: number) => {
        setChartDataType(value);
    }
});

const querySortingType = computed<number>({
    get: () => query.value.sortingType,
    set: (value: number) => {
        setSortingType(value);
    }
});

const isQuerySpecialChartType = computed<boolean>(() => {
    return ChartDataType.valueOf(queryChartDataType.value)?.specialChart ?? false;
});

const statisticsTextColor = computed<string>(() => {
    if (query.value.chartDataType === ChartDataType.OutflowsByAccount.type ||
        query.value.chartDataType === ChartDataType.ExpenseByAccount.type ||
        query.value.chartDataType === ChartDataType.ExpenseByPrimaryCategory.type ||
        query.value.chartDataType === ChartDataType.ExpenseBySecondaryCategory.type) {
        return 'text-expense';
    } else if (query.value.chartDataType === ChartDataType.InflowsByAccount.type ||
        query.value.chartDataType === ChartDataType.IncomeByAccount.type ||
        query.value.chartDataType === ChartDataType.IncomeByPrimaryCategory.type ||
        query.value.chartDataType === ChartDataType.IncomeBySecondaryCategory.type) {
        return 'text-income';
    } else {
        return 'text-default';
    }
});

function getFilterLinkUrl(): string {
    return `/statistics/transaction?${statisticsStore.getTransactionStatisticsPageParams(analysisType.value, trendDateAggregationType.value, assetTrendsDateAggregationType.value)}`;
}

function getTransactionItemLinkUrl(itemId: string, dateRange?: TimeRangeAndDateType): string {
    return `/transaction/list?${statisticsStore.getTransactionListPageParams(analysisType.value, itemId, dateRange)}`;
}

function init(initProps: TransactionStatisticsProps): void {
    let needReload = !isDefined(initProps.initAnalysisType);

    const filter: TransactionStatisticsPartialFilter = {
        chartDataType: initProps.initChartDataType ? parseInt(initProps.initChartDataType) : undefined,
        filterAccountIds: initProps.initFilterAccountIds ? arrayItemToObjectField(initProps.initFilterAccountIds.split(','), true) : {},
        filterCategoryIds: initProps.initFilterCategoryIds ? arrayItemToObjectField(initProps.initFilterCategoryIds.split(','), true) : {},
        tagFilter: initProps.initTagFilter,
        keyword: initProps.initKeyword,
        matchMode: initProps.initMatchMode ? parseInt(initProps.initMatchMode) : undefined,
        sortingType: initProps.initSortingType ? parseInt(initProps.initSortingType) : undefined
    };

    filterKeyword.value = filter.keyword || '';

    if (initProps.initAnalysisType === StatisticsAnalysisType.CategoricalAnalysis.toString()) {
        filter.categoricalChartType = initProps.initChartType ? parseInt(initProps.initChartType) : undefined;
        filter.categoricalChartDateType = initProps.initChartDateType ? parseInt(initProps.initChartDateType) : undefined;
        filter.categoricalChartStartTime = initProps.initStartTime ? parseInt(initProps.initStartTime) : undefined;
        filter.categoricalChartEndTime = initProps.initEndTime ? parseInt(initProps.initEndTime) : undefined;

        if (filter.categoricalChartDateType !== query.value.categoricalChartDateType) {
            needReload = true;
        } else if (filter.categoricalChartDateType === DateRange.Custom.type) {
            if (filter.categoricalChartStartTime !== query.value.categoricalChartStartTime
                || filter.categoricalChartEndTime !== query.value.categoricalChartEndTime) {
                needReload = true;
            }
        }

        if (initProps.initAnalysisType !== analysisType.value.toString()) {
            analysisType.value = StatisticsAnalysisType.CategoricalAnalysis;
            needReload = true;
        }
    } else if (initProps.initAnalysisType === StatisticsAnalysisType.TrendAnalysis.toString()) {
        filter.trendChartType = initProps.initChartType ? parseInt(initProps.initChartType) : undefined;
        filter.trendChartDateType = initProps.initChartDateType ? parseInt(initProps.initChartDateType) : undefined;
        filter.trendChartStartYearMonth = initProps.initStartTime;
        filter.trendChartEndYearMonth = initProps.initEndTime;

        if (filter.trendChartDateType !== query.value.trendChartDateType) {
            needReload = true;
        } else if (filter.trendChartDateType === DateRange.Custom.type) {
            if (filter.trendChartStartYearMonth !== query.value.trendChartStartYearMonth
                || filter.trendChartEndYearMonth !== query.value.trendChartEndYearMonth) {
                needReload = true;
            }
        }

        if (initProps.initAnalysisType !== analysisType.value.toString()) {
            analysisType.value = StatisticsAnalysisType.TrendAnalysis;
            needReload = true;
        }

        if (initProps.initTrendDateAggregationType) {
            trendDateAggregationType.value = parseInt(initProps.initTrendDateAggregationType);
        }
    } else if (initProps.initAnalysisType === StatisticsAnalysisType.AssetTrends.toString()) {
        filter.assetTrendsChartType = initProps.initChartType ? parseInt(initProps.initChartType) : undefined;
        filter.assetTrendsChartDateType = initProps.initChartDateType ? parseInt(initProps.initChartDateType) : undefined;
        filter.assetTrendsChartStartTime = initProps.initStartTime ? parseInt(initProps.initStartTime) : undefined;
        filter.assetTrendsChartEndTime = initProps.initEndTime ? parseInt(initProps.initEndTime) : undefined;

        if (filter.assetTrendsChartDateType !== query.value.assetTrendsChartDateType) {
            needReload = true;
        } else if (filter.assetTrendsChartDateType === DateRange.Custom.type) {
            if (filter.assetTrendsChartStartTime !== query.value.assetTrendsChartStartTime
                || filter.assetTrendsChartEndTime !== query.value.assetTrendsChartEndTime) {
                needReload = true;
            }
        }

        if (initProps.initAnalysisType !== analysisType.value.toString()) {
            analysisType.value = StatisticsAnalysisType.AssetTrends;
            needReload = true;
        }

        if (initProps.initAssetTrendsDateAggregationType) {
            assetTrendsDateAggregationType.value = parseInt(initProps.initAssetTrendsDateAggregationType);
        }
    }

    if (!isDefined(initProps.initAnalysisType)) {
        analysisType.value = StatisticsAnalysisType.CategoricalAnalysis;
        statisticsStore.initTransactionStatisticsFilter(analysisType.value);
    } else {
        statisticsStore.initTransactionStatisticsFilter(analysisType.value, filter);
    }

    if (!needReload && !statisticsStore.transactionStatisticsStateInvalid) {
        loading.value = false;
        initing.value = false;
        return;
    }

    Promise.all([
        accountsStore.loadAllAccounts({force: false}),
        transactionCategoriesStore.loadAllCategories({force: false})
    ]).then(() => {
        if (analysisType.value === StatisticsAnalysisType.CategoricalAnalysis) {
            return statisticsStore.loadCategoricalAnalysis({
                force: false
            }) as Promise<unknown>;
        } else if (analysisType.value === StatisticsAnalysisType.TrendAnalysis) {
            return statisticsStore.loadTrendAnalysis({
                force: false
            }) as Promise<unknown>;
        } else if (analysisType.value === StatisticsAnalysisType.AssetTrends) {
            return statisticsStore.loadAssetTrends({
                force: false
            }) as Promise<unknown>;
        } else {
            return Promise.reject('An error occurred');
        }
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
    let dispatchPromise: Promise<unknown> | null = null;

    loading.value = true;

    if (query.value.chartDataType === ChartDataType.Overview.type ||
        query.value.chartDataType === ChartDataType.OutflowsByAccount.type ||
        query.value.chartDataType === ChartDataType.ExpenseByAccount.type ||
        query.value.chartDataType === ChartDataType.ExpenseByPrimaryCategory.type ||
        query.value.chartDataType === ChartDataType.ExpenseBySecondaryCategory.type ||
        query.value.chartDataType === ChartDataType.InflowsByAccount.type ||
        query.value.chartDataType === ChartDataType.IncomeByAccount.type ||
        query.value.chartDataType === ChartDataType.IncomeByPrimaryCategory.type ||
        query.value.chartDataType === ChartDataType.IncomeBySecondaryCategory.type ||
        query.value.chartDataType === ChartDataType.TotalOutflows.type ||
        query.value.chartDataType === ChartDataType.TotalExpense.type ||
        query.value.chartDataType === ChartDataType.TotalInflows.type ||
        query.value.chartDataType === ChartDataType.TotalIncome.type ||
        query.value.chartDataType === ChartDataType.NetCashFlow.type ||
        query.value.chartDataType === ChartDataType.NetIncome.type ||
        query.value.chartDataType === ChartDataType.NetWorth.type) {
        if (analysisType.value === StatisticsAnalysisType.CategoricalAnalysis) {
            dispatchPromise = statisticsStore.loadCategoricalAnalysis({
                force: force
            });
        } else if (analysisType.value === StatisticsAnalysisType.TrendAnalysis) {
            dispatchPromise = statisticsStore.loadTrendAnalysis({
                force: force
            });
        } else if (analysisType.value === StatisticsAnalysisType.AssetTrends) {
            dispatchPromise = statisticsStore.loadAssetTrends({
                force: force
            });
        }
    } else if (query.value.chartDataType === ChartDataType.AccountTotalAssets.type ||
        query.value.chartDataType === ChartDataType.AccountTotalLiabilities.type) {
        if (analysisType.value === StatisticsAnalysisType.CategoricalAnalysis) {
            dispatchPromise = accountsStore.loadAllAccounts({
                force: force
            });
        } else if (analysisType.value === StatisticsAnalysisType.AssetTrends) {
            dispatchPromise = statisticsStore.loadAssetTrends({
                force: force
            });
        }
    }

    if (dispatchPromise) {
        dispatchPromise.then(() => {
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

    return dispatchPromise;
}

function setAnalysisType(type: StatisticsAnalysisType): void {
    if (analysisType.value === type) {
        return;
    }

    if (!ChartDataType.isAvailableForAnalysisType(query.value.chartDataType, type)) {
        let defaultChartDataType: ChartDataType = ChartDataType.Default;

        if (type === StatisticsAnalysisType.AssetTrends) {
            defaultChartDataType = ChartDataType.DefaultForAssetTrends;
        }

        statisticsStore.updateTransactionStatisticsFilter({
            chartDataType: defaultChartDataType.type
        });
    }

    if (analysisType.value !== StatisticsAnalysisType.TrendAnalysis && type === StatisticsAnalysisType.TrendAnalysis) {
        trendDateAggregationType.value = ChartDateAggregationType.Default.type;
    } else if (analysisType.value !== StatisticsAnalysisType.AssetTrends && type === StatisticsAnalysisType.AssetTrends) {
        assetTrendsDateAggregationType.value = ChartDateAggregationType.Default.type;
    }

    analysisType.value = type;
    loading.value = true;
    statisticsStore.updateTransactionStatisticsInvalidState(true);
    router.push(getFilterLinkUrl());
}

function setChartType(type?: number): void {
    let changed = false;

    if (analysisType.value === StatisticsAnalysisType.CategoricalAnalysis) {
        changed = statisticsStore.updateTransactionStatisticsFilter({
            categoricalChartType: type
        });
    } else if (analysisType.value === StatisticsAnalysisType.TrendAnalysis) {
        changed = statisticsStore.updateTransactionStatisticsFilter({
            trendChartType: type
        });
    } else if (analysisType.value === StatisticsAnalysisType.AssetTrends) {
        changed = statisticsStore.updateTransactionStatisticsFilter({
            assetTrendsChartType: type
        });
    }

    if (changed) {
        router.push(getFilterLinkUrl());
    }
}

function setChartDataType(type: number): void {
    const changed = statisticsStore.updateTransactionStatisticsFilter({
        chartDataType: type
    });

    if (changed) {
        router.push(getFilterLinkUrl());
    }
}

function setSortingType(type: number): void {
    if (type < ChartSortingType.Amount.type || type > ChartSortingType.Name.type) {
        return;
    }

    const changed = statisticsStore.updateTransactionStatisticsFilter({
        sortingType: type
    });

    if (changed) {
        router.push(getFilterLinkUrl());
    }
}

function setTrendDateAggregationType(type: number): void {
    const changed = trendDateAggregationType.value !== type;
    trendDateAggregationType.value = type;

    if (changed) {
        router.push(getFilterLinkUrl());
    }
}

function setAssetTrendsDateAggregationType(type: number): void {
    const changed = assetTrendsDateAggregationType.value !== type;
    assetTrendsDateAggregationType.value = type;

    if (changed) {
        router.push(getFilterLinkUrl());
    }
}

function setDateFilter(dateType: number): void {
    if (analysisType.value === StatisticsAnalysisType.CategoricalAnalysis) {
        if (dateType === DateRange.Custom.type) { // Custom
            showCustomDateRangeDialog.value = true;
            return;
        } else if (query.value.categoricalChartDateType === dateType) {
            return;
        }
    } else if (analysisType.value === StatisticsAnalysisType.TrendAnalysis) {
        if (dateType === DateRange.Custom.type) { // Custom
            showCustomMonthRangeDialog.value = true;
            return;
        } else if (query.value.trendChartDateType === dateType) {
            return;
        }
    } else if (analysisType.value === StatisticsAnalysisType.AssetTrends) {
        if (dateType === DateRange.Custom.type) { // Custom
            showCustomDateRangeDialog.value = true;
            return;
        } else if (query.value.assetTrendsChartDateType === dateType) {
            return;
        }
    }

    const dateRange = getDateRangeByDateType(dateType, firstDayOfWeek.value, fiscalYearStart.value);

    if (!dateRange) {
        return;
    }

    let changed = false;

    if (analysisType.value === StatisticsAnalysisType.CategoricalAnalysis) {
        changed = statisticsStore.updateTransactionStatisticsFilter({
            categoricalChartDateType: dateRange.dateType,
            categoricalChartStartTime: dateRange.minTime,
            categoricalChartEndTime: dateRange.maxTime
        });
    } else if (analysisType.value === StatisticsAnalysisType.TrendAnalysis) {
        changed = statisticsStore.updateTransactionStatisticsFilter({
            trendChartDateType: dateRange.dateType,
            trendChartStartYearMonth: getGregorianCalendarYearAndMonthFromUnixTime(dateRange.minTime),
            trendChartEndYearMonth: getGregorianCalendarYearAndMonthFromUnixTime(dateRange.maxTime)
        });
    } else if (analysisType.value === StatisticsAnalysisType.AssetTrends) {
        changed = statisticsStore.updateTransactionStatisticsFilter({
            assetTrendsChartDateType: dateRange.dateType,
            assetTrendsChartStartTime: dateRange.minTime,
            assetTrendsChartEndTime: dateRange.maxTime
        });
    }

    if (changed) {
        loading.value = true;
        statisticsStore.updateTransactionStatisticsInvalidState(true);
        router.push(getFilterLinkUrl());
    }
}

function setCustomDateFilter(startTime: number | TextualYearMonth, endTime: number | TextualYearMonth): void {
    if (!startTime || !endTime) {
        return;
    }

    let changed = false;

    if (analysisType.value === StatisticsAnalysisType.CategoricalAnalysis && isNumber(startTime) && isNumber(endTime)) {
        const chartDateType = getDateTypeByDateRange(startTime, endTime, firstDayOfWeek.value, fiscalYearStart.value, DateRangeScene.Normal);

        changed = statisticsStore.updateTransactionStatisticsFilter({
            categoricalChartDateType: chartDateType,
            categoricalChartStartTime: startTime,
            categoricalChartEndTime: endTime
        });

        showCustomDateRangeDialog.value = false;
    } else if (analysisType.value === StatisticsAnalysisType.TrendAnalysis && isString(startTime) && isString(endTime)) {
        const chartDateType = getDateTypeByDateRange(getYearMonthFirstUnixTime(startTime), getYearMonthLastUnixTime(endTime), firstDayOfWeek.value, fiscalYearStart.value, DateRangeScene.TrendAnalysis);

        changed = statisticsStore.updateTransactionStatisticsFilter({
            trendChartDateType: chartDateType,
            trendChartStartYearMonth: startTime,
            trendChartEndYearMonth: endTime
        });

        showCustomMonthRangeDialog.value = false;
    } else if (analysisType.value === StatisticsAnalysisType.AssetTrends && isNumber(startTime) && isNumber(endTime)) {
        const chartDateType = getDateTypeByDateRange(startTime, endTime, firstDayOfWeek.value, fiscalYearStart.value, DateRangeScene.AssetTrends);

        changed = statisticsStore.updateTransactionStatisticsFilter({
            assetTrendsChartDateType: chartDateType,
            assetTrendsChartStartTime: startTime,
            assetTrendsChartEndTime: endTime
        });

        showCustomDateRangeDialog.value = false;
    }

    if (changed) {
        loading.value = true;
        statisticsStore.updateTransactionStatisticsInvalidState(true);
        router.push(getFilterLinkUrl());
    }
}

function shiftDateRange(scale: number): void {
    let changed = false;

    if (analysisType.value === StatisticsAnalysisType.CategoricalAnalysis) {
        if (query.value.categoricalChartDateType === DateRange.All.type) {
            return;
        }

        const newDateRange = getShiftedDateRangeAndDateType(query.value.categoricalChartStartTime, query.value.categoricalChartEndTime, scale, firstDayOfWeek.value, fiscalYearStart.value, DateRangeScene.Normal);

        changed = statisticsStore.updateTransactionStatisticsFilter({
            categoricalChartDateType: newDateRange.dateType,
            categoricalChartStartTime: newDateRange.minTime,
            categoricalChartEndTime: newDateRange.maxTime
        });
    } else if (analysisType.value === StatisticsAnalysisType.TrendAnalysis) {
        const newDateRange = getShiftedDateRangeAndDateType(getYearMonthFirstUnixTime(query.value.trendChartStartYearMonth), getYearMonthLastUnixTime(query.value.trendChartEndYearMonth), scale, firstDayOfWeek.value, fiscalYearStart.value, DateRangeScene.TrendAnalysis);

        changed = statisticsStore.updateTransactionStatisticsFilter({
            trendChartDateType: newDateRange.dateType,
            trendChartStartYearMonth: getGregorianCalendarYearAndMonthFromUnixTime(newDateRange.minTime),
            trendChartEndYearMonth: getGregorianCalendarYearAndMonthFromUnixTime(newDateRange.maxTime)
        });
    } else if (analysisType.value === StatisticsAnalysisType.AssetTrends) {
        if (query.value.assetTrendsChartDateType === DateRange.All.type) {
            return;
        }

        const newDateRange = getShiftedDateRangeAndDateType(query.value.assetTrendsChartStartTime, query.value.assetTrendsChartEndTime, scale, firstDayOfWeek.value, fiscalYearStart.value, DateRangeScene.AssetTrends);

        changed = statisticsStore.updateTransactionStatisticsFilter({
            assetTrendsChartDateType: newDateRange.dateType,
            assetTrendsChartStartTime: newDateRange.minTime,
            assetTrendsChartEndTime: newDateRange.maxTime
        });
    }

    if (changed) {
        loading.value = true;
        statisticsStore.updateTransactionStatisticsInvalidState(true);
        router.push(getFilterLinkUrl());
    }
}

function setAccountFilter(changed: boolean): void {
    showFilterAccountDialog.value = false;

    if (changed) {
        loading.value = true;
        statisticsStore.updateTransactionStatisticsInvalidState(true);
        router.push(getFilterLinkUrl());
    }
}

function setCategoryFilter(changed: boolean): void {
    showFilterCategoryDialog.value = false;

    if (changed) {
        loading.value = true;
        statisticsStore.updateTransactionStatisticsInvalidState(true);
        router.push(getFilterLinkUrl());
    }
}

function setTagFilter(changed: boolean): void {
    showFilterTagDialog.value = false;

    if (changed) {
        loading.value = true;
        statisticsStore.updateTransactionStatisticsInvalidState(true);
        router.push(getFilterLinkUrl());
    }
}

function applyCompactKeywordFilter(): void {
    setKeywordFilter(filterKeyword.value);
    showCompactSearch.value = false;
}

function setKeywordFilter(keyword: string): void {
    if (analysisType.value === StatisticsAnalysisType.AssetTrends) {
        return;
    }

    if (query.value.keyword === keyword) {
        return;
    }

    let changed = false;

    if (analysisType.value === StatisticsAnalysisType.CategoricalAnalysis) {
        changed = statisticsStore.updateTransactionStatisticsFilter({
            keyword: keyword
        });
    } else if (analysisType.value === StatisticsAnalysisType.TrendAnalysis) {
        changed = statisticsStore.updateTransactionStatisticsFilter({
            keyword: keyword
        });
    }

    if (changed) {
        loading.value = true;
        statisticsStore.updateTransactionStatisticsInvalidState(true);
        router.push(getFilterLinkUrl());
    }
}

function exportResults(): void {
    if (analysisType.value === StatisticsAnalysisType.CategoricalAnalysis && categoricalAnalysisData.value && categoricalAnalysisData.value.items) {
        let supportedMermaidCharts: ExportMermaidChartType[] | undefined = undefined;

        if (query.value.categoricalChartType === CategoricalChartType.Pie.type) {
            supportedMermaidCharts = [ ExportMermaidChartType.PieChart ];
        }

        exportDialog.value?.open({
            headers: [
                tt('Name'),
                tt('Amount') + ` (${defaultCurrency.value})`,
                tt('Proportion (%)')
            ],
            data: categoricalAnalysisData.value.items
                .filter(item => !item.hidden)
                .map(item => [
                    item.name,
                    formatAmountToWesternArabicNumeralsWithoutDigitGrouping(item.value, defaultCurrency.value),
                    item.percent.toFixed(4)
                ]),
            supportedMermaidCharts: supportedMermaidCharts
        });
    } else if (analysisType.value === StatisticsAnalysisType.TrendAnalysis && trendsAnalysisData.value && trendsAnalysisData.value.items && monthlyTrendsChart.value) {
        const exportData = monthlyTrendsChart.value.exportData();
        let supportedMermaidCharts: ExportMermaidChartType[] | undefined = undefined;

        if (exportData.headers.length === 2 && query.value.trendChartType === TrendChartType.Column.type) {
            supportedMermaidCharts = [ ExportMermaidChartType.XYChartBar ];
        } else if (exportData.headers.length === 2 && query.value.trendChartType === TrendChartType.Area.type) {
            supportedMermaidCharts = [ ExportMermaidChartType.XYChartLine ];
        }

        exportDialog.value?.open({
            headers: exportData.headers || [],
            data: exportData.data || [],
            supportedMermaidCharts: supportedMermaidCharts
        });
    } else if (analysisType.value === StatisticsAnalysisType.AssetTrends && assetTrendsData.value && assetTrendsData.value.items && dailyTrendsChart.value) {
        const exportData = dailyTrendsChart.value.exportData();
        let supportedMermaidCharts: ExportMermaidChartType[] | undefined = undefined;

        if (exportData.headers.length === 2 && query.value.assetTrendsChartType === TrendChartType.Column.type) {
            supportedMermaidCharts = [ ExportMermaidChartType.XYChartBar ];
        } else if (exportData.headers.length === 2 && query.value.assetTrendsChartType === TrendChartType.Area.type) {
            supportedMermaidCharts = [ ExportMermaidChartType.XYChartLine ];
        }

        exportDialog.value?.open({
            headers: exportData.headers || [],
            data: exportData.data || [],
            supportedMermaidCharts: supportedMermaidCharts
        });
    }
}

function onClickSankeyChartItem(sourceItemType: 'account' | 'category', sourceItemId: string, targetItemType?: 'account' | 'category', targetItemId?: string): void {
    if (sourceItemType === 'category' && targetItemType === 'category' && sourceItemId && targetItemId) {
        const sourceCategory = transactionCategoriesStore.allTransactionCategoriesMap[sourceItemId];
        const targetCategory = transactionCategoriesStore.allTransactionCategoriesMap[targetItemId];

        if (sourceCategory?.parentId === targetCategory?.id) {
            router.push(getTransactionItemLinkUrl(`${sourceItemType}:${sourceItemId}`));
            return;
        } else if (targetCategory?.parentId === sourceCategory?.id) {
            router.push(getTransactionItemLinkUrl(`${targetItemType}:${targetItemId}`));
            return;
        }
    }

    router.push(getTransactionItemLinkUrl(`${sourceItemType}:${sourceItemId}` + (targetItemType && targetItemId ? `-${targetItemType}:${targetItemId}` : '')));
}

function onClickPieChartItem(item: Record<string, unknown>): void {
    router.push(getTransactionItemLinkUrl(item['id'] as string));
}

function onClickTrendChartItem(item: { itemId: string, dateRange: TimeRangeAndDateType }): void {
    router.push(getTransactionItemLinkUrl(item.itemId, item.dateRange));
}

function onShowDateRangeError(message: string): void {
    snackbar.value?.showError(message);
}

onBeforeRouteUpdate((to) => {
    if (to.query) {
        init({
            initAnalysisType: (to.query['analysisType'] as string | null) || undefined,
            initChartDataType: (to.query['chartDataType'] as string | null) || undefined,
            initChartType: (to.query['chartType'] as string | null) || undefined,
            initChartDateType: (to.query['chartDateType'] as string | null) || undefined,
            initStartTime: (to.query['startTime'] as TextualYearMonth | null) || undefined,
            initEndTime: (to.query['endTime'] as TextualYearMonth | null) || undefined,
            initFilterAccountIds: (to.query['filterAccountIds'] as string | null) || undefined,
            initFilterCategoryIds: (to.query['filterCategoryIds'] as string | null) || undefined,
            initTagFilter: (to.query['tagFilter'] as string | null) || undefined,
            initKeyword: (to.query['keyword'] as string | null) || undefined,
            initMatchMode: (to.query['matchMode'] as string | null) || undefined,
            initSortingType: (to.query['sortingType'] as string | null) || undefined,
            initTrendDateAggregationType: (to.query['trendDateAggregationType'] as string | null) || undefined,
            initAssetTrendsDateAggregationType: (to.query['assetTrendsDateAggregationType'] as string | null) || undefined
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

init(props);
</script>

<style>

/* REMOVE A APP BAR EM DESKTOP, MAS MANTÉM NO TABLET E MOBILE */
@media screen and (min-width: 1250px) {
    .layout-navbar {
        display:none!important;
    }
}

.statistics-page {
    width: calc(100% + 48px);
    min-width: 0;
    min-height: 100vh;
    margin: -24px;
    background: rgb(var(--v-theme-background));
    font-family: "Lausanne", "Helvetica Neue", Arial, sans-serif;
}

.statistics-page,
.statistics-page *,
.statistics-page *::before,
.statistics-page *::after {
    box-sizing: border-box;
}

.statistics-page__column {
    padding: 0 !important;
}

.statistics-shell {
    min-height: 100vh;
    border: 0 !important;
    border-radius: 0 !important;
    background: rgb(var(--v-theme-background)) !important;
    box-shadow: none !important;
}

.statistics-layout {
    min-height: 100vh;
    background: rgb(var(--v-theme-background));
}

/* =========================================================
 * SIDEBAR
 * ======================================================= */

.statistics-sidebar {
    border-right: 1px solid rgb(var(--v-theme-muted-border)) !important;
    background: rgb(var(--v-theme-surface)) !important;
    box-shadow: none !important;
}

.statistics-sidebar .v-navigation-drawer__content {
    padding: 10px 10px 10px;
}

.statistics-sidebar__section {
    padding: 14px 10px;
}

.statistics-sidebar__section--analysis {
    padding-top: 6px;
}

.statistics-sidebar__divider {
    margin: 4px 10px !important;
    border-color: rgb(var(--v-theme-muted-border)) !important;
    opacity: 0 !important;
}

.statistics-sidebar__label {
    display: block;
    margin-bottom: 8px;
    color: rgb(var(--v-theme-tertiary));
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.025em;
}

.statistics-sidebar__select {
    margin-top: 0 !important;
}

.statistics-sidebar__tabs {
    width: 100%;
    margin: 10px 0 0 !important;
    padding: 0 0px;
}

/* =========================================================
 * MAIN CONTENT
 * ======================================================= */

.statistics-main {
    min-width: 0;
    background: rgb(var(--v-theme-background));
}

.statistics-content-card {
    min-width: 0;
    border: 0 !important;
    border-radius: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
}

/* =========================================================
 * HEADER — MESMO SISTEMA DA HOMEPAGE
 * ======================================================= */

.statistics-content-card > .v-card-item {
    min-height: auto;
    padding: 0 !important;
    background: rgb(var(--v-theme-surface));
}

.statistics-content-card > .v-card-item .v-card-title {
    width: 100%;
    white-space: normal;
}

.statistics-page-header {
    width: 100%;
    padding: 36px 25px 0;
    border-bottom: 1px solid rgb(var(--v-theme-muted-border));
    background: rgb(var(--v-theme-surface));
}

.statistics-page-header__top {
    display: flex;
    width: 100%;
    min-width: 0;
    align-items: flex-start;
    justify-content: space-between;
}

.statistics-page-header__identity {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 12px;
}

.statistics-page-header__titles {
    min-width: 0;
}

.statistics-page-header__titles h1 {
    margin: 0;
    color: rgb(var(--v-theme-on-surface));
    font-size: clamp(1.8rem, 3vw, 2.65rem);
    font-weight: 500;
    letter-spacing: -0.05em;
    line-height: 1;
}

.statistics-page-header__titles > span {
    display: block;
    margin-top: 10px;
    color: rgb(var(--v-theme-tertiary));
    font-weight: 500;
}

.statistics-page-toolbar {
    display: flex;
    width: 100%;
    min-width: 0;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    margin-top: 20px;
    padding-bottom: 20px;
}

.statistics-page-toolbar__search {
    min-width: 0;
    flex: 1 1 auto;
}

.statistics-page-toolbar__actions {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
}

.statistics-page-header__desktop-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.statistics-search {
    width: min(100%, 320px);
}

.statistics-date-range-group {
    flex: 0 0 auto;
    overflow: hidden;
    min-height: 42px !important;
    border: 1px solid rgb(var(--v-theme-border)) !important;
    border-radius: 6px !important;
    box-shadow: none !important;
}

.statistics-date-range-group .v-btn {
    min-height: 40px !important;
    border: 0 !important;
    border-radius: 0 !important;
    color: rgb(var(--v-theme-on-background)) !important;
    background: rgb(var(--v-theme-background)) !important;
    box-shadow: none !important;
    text-transform: none !important;
    font-size: 0.76rem !important;
    font-weight: 550 !important;
}

.statistics-date-range-group .v-btn + .v-btn {
    border-left: 1px solid rgb(var(--v-theme-muted-border)) !important;
}

.statistics-date-range-group .v-btn:hover {
    background: rgb(var(--v-theme-on-hover-background)) !important;
}

.statistics-date-range-button {
    min-width: 108px !important;
    max-width: 200px;
}

.statistics-date-range-button .v-btn__content {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.statistics-aggregation-button {
    min-height: 42px !important;
    border-color: rgb(var(--v-theme-border)) !important;
    border-radius: 6px !important;
    background: rgb(var(--v-theme-background)) !important;
    box-shadow: none !important;
    text-transform: none !important;
    font-size: 0.76rem !important;
}

.statistics-toolbar-icon-button,
.statistics-search-trigger,
.statistics-mobile-actions-trigger {
    width: 40px !important;
    min-width: 40px !important;
    height: 40px !important;
    border-radius: 6px !important;
    box-shadow: none !important;
}

.statistics-toolbar-icon-button:hover,
.statistics-search-trigger:hover,
.statistics-mobile-actions-trigger:hover {
    background: rgb(var(--v-theme-on-hover-background)) !important;
}

.statistics-search-trigger,
.statistics-mobile-actions-trigger {
    display: none !important;
}

/* =========================================================
 * SUMMARY STRIP
 * ======================================================= */

.statistics-overview-title {
    display: flex;
    min-height: 64px;
    height: auto;
    align-items: center;
    gap: 10px 14px;
    margin: 25px 25px 0;
    padding: 16px 18px !important;
    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 8px;
    background: rgb(var(--v-theme-surface));
}

.statistics-overview-amount {
    overflow: hidden;
    font-size: 1.15rem;
    font-weight: 650;
    letter-spacing: -0.02em;
    text-overflow: ellipsis;
}

.statistics-subtitle {
    color: rgb(var(--v-theme-tertiary));
    font-size: 0.69rem;
    font-weight: 600;
    letter-spacing: 0.035em;
    line-height: 1.2;
    text-transform: uppercase;
}

.statistics-overview-empty-tip {
    color: rgb(var(--v-theme-tertiary)) !important;
}

/* =========================================================
 * CHART / DATA AREA
 * ======================================================= */

.statistics-content-card > .v-card-text:not(.statistics-overview-title) {
    margin: 25px 25px 25px;
    padding: 24px !important;
    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 10px;
    background: rgb(var(--v-theme-surface));
}

.statistics-content-card > .v-card-text:last-child {
    margin-bottom: 40px;
}

.statistics-content-card .v-list {
    background: transparent !important;
}

.statistics-content-card .v-divider {
    border-color: rgb(var(--v-theme-muted-border)) !important;
    opacity: 1 !important;
}

.statistics-custom-datetime-range {
    line-height: 1rem;
}

.statistics-list-item {
    color: rgb(var(--v-theme-on-background));
    font-size: 0.88rem !important;
    line-height: 1.5rem;
    overflow: hidden;
    text-overflow: ellipsis;
    text-decoration: none;
}

.statistics-list-item .statistics-percent {
    margin-inline-start: 6px;
    color: rgb(var(--v-theme-tertiary));
    font-size: 0.7rem;
}

.statistics-list-item .statistics-amount {
    font-weight: 600;
}

/* =========================================================
 * RESPONSIVE
 * ======================================================= */


@media (max-width: 1260px) {
    .statistics-page {
        width: calc(100% + 48px);
        margin: -24px;
    }

    .statistics-page-header {
        padding-inline: 28px;
    }

    .statistics-overview-title,
    .statistics-content-card > .v-card-text:not(.statistics-overview-title) {
        margin-inline: 28px;
    }
}

@media (max-width: 1180px) {
    /*
     * Em telas menores, os controles compactos ficam na mesma linha
     * visual do título, sem duplicar ou mover elementos no template.
     */
    .statistics-page-header {
        position: relative;
        padding-bottom: 28px;
    }

    .statistics-page-header__top {
        align-items: center;
        padding-right: 92px;
    }

    .statistics-page-header__identity {
        min-width: 0;
        flex: 1 1 auto;
    }

    /*
     * A toolbar existente é reposicionada sobre o header.
     * Apenas busca compacta e menu de ações permanecem visíveis.
     */
    .statistics-page-toolbar {
        position: absolute;
        top: 30px;
        right: 28px;

        display: flex;
        width: auto;
        min-width: 0;
        align-items: center;
        justify-content: flex-end;
        gap: 4px;

        margin: 0;
        padding: 0;
    }

    .statistics-page-toolbar__search,
    .statistics-page-toolbar__actions {
        flex: 0 0 auto;
    }

    .statistics-page-header__desktop-actions,
    .statistics-search--desktop {
        display: none !important;
    }

    .statistics-search-trigger,
    .statistics-mobile-actions-trigger {
        display: inline-grid !important;
    }
}

@media (max-width: 900px) {
    .statistics-page-header {
        padding: 24px 20px;
    }

    .statistics-page-header__top {
        gap: 12px;
        padding-right: 88px;
    }

    .statistics-page-toolbar {
        top: 18px;
        right: 20px;
    }

    .statistics-page-header__titles h1 {
        font-size: 1.55rem;
    }

    .statistics-page-header__titles > span {
        display: none;
    }

    .statistics-overview-title,
    .statistics-content-card > .v-card-text:not(.statistics-overview-title) {
        margin-inline: 18px;
    }

    .statistics-overview-title {
        align-items: flex-start;
        flex-wrap: wrap;
    }

    .statistics-content-card > .v-card-text:not(.statistics-overview-title) {
        padding: 18px !important;
    }
    
}

@media (max-width: 600px) {
    .statistics-page-header {
        padding: 20px 14px;
    }

    .statistics-page-header__top {
        padding-right: 78px;
    }

    .statistics-page-toolbar {
        top: 14px;
        right: 14px;
        gap: 0;
    }

    .statistics-page-header__identity {
        gap: 8px;
    }

    .statistics-page-header__titles h1 {
        font-size: 1.35rem;
    }

    .statistics-page-header__actions {
        gap: 2px;
    }

    .statistics-overview-title,
    .statistics-content-card > .v-card-text:not(.statistics-overview-title) {
        margin-inline: 12px;
    }

    .statistics-overview-title {
        min-height: 56px;
        padding: 12px !important;
        border-radius: 7px;
    }

    .statistics-overview-amount {
        font-size: 1rem;
    }

    .statistics-content-card > .v-card-text:not(.statistics-overview-title) {
        margin-top: 12px;
        padding: 14px !important;
        border-radius: 8px;
    }
}

/* =========================================================
 * TABS VERTICAIS DA SIDEBAR
 * ======================================================= */

.statistics-sidebar__tabs {
    width: 100%;
    min-width: 0;
    margin: 12px 0 0 !important;
    padding: 0 10px 14px;

    background: transparent !important;
}

/* Área rolável */
.statistics-sidebar__tabs .v-slide-group__container {
    width: 100%;
    min-width: 0;
}

/* Lista de opções */
.statistics-sidebar__tabs .v-slide-group__content {
    width: 100%;
    min-width: 0;
    gap: 3px;
}

/* Tab individual */
.statistics-sidebar__tabs .v-tab {
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
    text-transform: none !important;

    font-family:
        "Lausanne",
        "Helvetica Neue",
        Arial,
        sans-serif;
    font-size: 0.79rem !important;
    font-weight: 500 !important;
    letter-spacing: -0.01em;

    transition:
        color 130ms ease,
        background-color 130ms ease;
}

/* Conteúdo alinhado corretamente */
.statistics-sidebar__tabs .v-tab .v-btn__content {
    width: 100%;
    min-width: 0;
    justify-content: flex-start !important;

    overflow: hidden;
    text-align: left;
}

/* Texto */
.statistics-sidebar__tabs .v-tab .text-truncate {
    display: block;
    width: 100%;
    min-width: 0;

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Remove overlay padrão do Vuetify */
.statistics-sidebar__tabs .v-tab .v-btn__overlay,
.statistics-sidebar__tabs .v-tab .v-btn__underlay {
    background: transparent !important;
    opacity: 0 !important;
}

/* Hover */
.statistics-sidebar__tabs .v-tab:hover {
    color: rgb(var(--v-theme-on-verticalbutton-background)) !important;
    background: rgb(var(--v-theme-verticalbutton-hover)) !important;
}

/* Selecionada */
.statistics-sidebar__tabs .v-tab.v-tab--selected,
.statistics-sidebar__tabs .v-tab.v-tab-item--selected {
    color: rgb(var(--v-theme-on-verticalbutton-background)) !important;
    background: rgba(var(--v-theme-verticalbutton-selected), 0.5) !important;

    font-weight: 600 !important;
}

/* Neutraliza text-primary aplicado pelo Vuetify */
.statistics-sidebar__tabs .v-tab.text-primary {
    color: rgb(var(--v-theme-on-verticalbutton-background)) !important;
}

/* Indicador lateral da seleção */
.statistics-sidebar__tabs .v-tab__slider {
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

/* Esconde o indicador nas tabs inativas */
.statistics-sidebar__tabs
    .v-tab:not(.v-tab--selected):not(.v-tab-item--selected)
    .v-tab__slider {
    opacity: 0 !important;
}

/* Foco por teclado */
.statistics-sidebar__tabs .v-tab:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: -2px;
}

/* Desabilitada */
.statistics-sidebar__tabs .v-tab.v-btn--disabled {
    opacity: var(--v-disabled-opacity);
}

</style>
