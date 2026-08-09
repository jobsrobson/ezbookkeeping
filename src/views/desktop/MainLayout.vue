<template>
    <div
        class="layout-wrapper layout-nav-type-vertical layout-navbar-static layout-footer-static layout-content-width-fluid"
        :class="{ 'layout-overlay-nav': mdAndDown }"
    >
        <aside
            class="layout-vertical-nav"
            :class="{
                visible: showVerticalOverlayMenu,
                scrolled: isVerticalNavScrolled,
                'overlay-nav': mdAndDown
            }"
        >
            <div class="nav-header">
                <router-link
                    to="/"
                    class="app-logo app-title-wrapper"
                    aria-label="Bookkeeping"
                    @click="closeOverlayMenu"
                >
                    <img
                        alt="Bookkeeping"
                        class="sidebar-brand-logo sidebar-brand-logo--light"
                        src="/img/bookkeeping-logo-light-sm.svg"
                    />
                    <img
                        alt="Bookkeeping"
                        class="sidebar-brand-logo sidebar-brand-logo--dark"
                        src="/img/bookkeeping-logo-dark-sm.svg"
                    />
                </router-link>
            </div>

            <perfect-scrollbar
                tag="ul"
                class="nav-items"
                :options="{ wheelPropagation: false }"
                @ps-scroll-y="handleNavScroll"
            >
                <li
                    v-for="item in primaryNavigationItems"
                    :key="item.to"
                    class="nav-link"
                    :class="{
                        'home-link': item.exact,
                        'nav-link--with-action': item.showAction
                    }"
                >
                    <router-link
                        :to="item.to"
                        :class="{ 'is-active': isNavigationItemActive(item) }"
                        @click="closeOverlayMenu"
                    >
                        <v-icon
                            class="nav-item-icon"
                            :icon="item.icon"
                        />

                        <span class="nav-item-title">
                            {{ item.label }}
                        </span>
                    </router-link>

                    <v-btn
                        v-if="item.showAction"
                        class="nav-add-button"
                        density="compact"
                        variant="text"
                        :icon="true"
                        :aria-label="tt('Add Transaction')"
                        @click.stop="showAddDialogInTransactionListPage"
                    >
                        <v-icon
                            :icon="mdiPlusCircle"
                            size="20"
                        />

                        <v-tooltip activator="parent">
                            {{ tt('Add Transaction') }}
                        </v-tooltip>
                    </v-btn>
                </li>

                <template
                    v-for="section in navigationSections"
                    :key="section.id"
                >
                    <li class="nav-section-title">
                        <div class="title-wrapper">
                            <span class="title-text">
                                {{ section.title }}
                            </span>
                        </div>
                    </li>

                    <li
                        v-for="item in section.items"
                        :key="item.to"
                        class="nav-link"
                    >
                        <router-link
                            :to="item.to"
                            :class="{ 'is-active': isNavigationItemActive(item) }"
                            @click="closeOverlayMenu"
                        >
                            <v-icon
                                class="nav-item-icon"
                                :icon="item.icon"
                            />

                            <span class="nav-item-title">
                                {{ item.label }}
                            </span>
                        </router-link>
                    </li>
                </template>

                <li class="nav-section-title">
                    <div class="title-wrapper">
                        <span class="title-text">
                            {{ tt('Miscellaneous') }}
                        </span>
                    </div>
                </li>

                <li class="nav-link">
                    <router-link
                        to="/exchange_rates"
                        :class="{ 'is-active': isPathActive('/exchange_rates') }"
                        @click="closeOverlayMenu"
                    >
                        <v-icon
                            class="nav-item-icon"
                            :icon="mdiSwapHorizontal"
                        />

                        <span class="nav-item-title">
                            {{ tt('Exchange Rates Data') }}
                        </span>
                    </router-link>
                </li>

                <li class="nav-link" v-if="DEDICATED_MOBILE_VERSION_ENABLED">
                    <button
                        type="button"
                        class="nav-action"
                        @click="showMobileQrCode = true"
                    >
                        <v-icon
                            class="nav-item-icon"
                            :icon="mdiCellphone"
                        />

                        <span class="nav-item-title">
                            {{ tt('Use on Mobile Device') }}
                        </span>
                    </button>
                </li>

                <li class="nav-link" v-if="isPwaInstallAvailable">
                    <button
                        type="button"
                        class="nav-action"
                        @click="installApplication"
                    >
                        <v-icon
                            class="nav-item-icon"
                            :icon="mdiDownloadOutline"
                        />

                        <span class="nav-item-title">
                            {{ tt('Install Application') }}
                        </span>
                    </button>
                </li>

                <li class="nav-link">
                    <router-link
                        to="/about"
                        :class="{ 'is-active': isPathActive('/about') }"
                        @click="closeOverlayMenu"
                    >
                        <v-icon
                            class="nav-item-icon"
                            :icon="mdiInformationOutline"
                        />

                        <span class="nav-item-title">
                            {{ tt('About') }}
                        </span>
                    </router-link>
                </li>
            </perfect-scrollbar>

            <div class="sidebar-footer">
                <v-avatar
                    class="sidebar-user-avatar cursor-pointer"
                    variant="tonal"
                    :color="currentUserAvatar ? 'rgba(0,0,0,0)' : 'on-primary'"
                >
                    <v-img
                        v-if="currentUserAvatar"
                        :src="currentUserAvatar"
                    >
                        <template #placeholder>
                            <div class="d-flex align-center justify-center fill-height bg-light-primary">
                                <v-icon
                                    color="on-sidebar-selected"
                                    :icon="mdiAccount"
                                />
                            </div>
                        </template>
                    </v-img>

                    <v-icon
                        v-else
                        :icon="mdiAccount"
                    />

                    <v-menu
                        activator="parent"
                        width="280"
                        location="top start"
                        offset="14px"
                    >
                        <v-list>
                            <v-list-item>
                                <template #prepend>
                                    <v-list-item-action>
                                        <v-avatar
                                            variant="tonal"
                                            :color="currentUserAvatar ? 'rgba(0,0,0,0)' : 'on-primary'"
                                        >
                                            <v-img
                                                v-if="currentUserAvatar"
                                                :src="currentUserAvatar"
                                            >
                                                <template #placeholder>
                                                    <div class="d-flex align-center justify-center fill-height bg-light-primary">
                                                        <v-icon
                                                            color="on-primary"
                                                            :icon="mdiAccount"
                                                        />
                                                    </div>
                                                </template>
                                            </v-img>

                                            <v-icon
                                                v-else
                                                :icon="mdiAccount"
                                            />
                                        </v-avatar>
                                    </v-list-item-action>
                                </template>

                                <v-list-item-title class="ms-2">
                                    {{ currentNickName }}
                                </v-list-item-title>
                            </v-list-item>

                            <v-divider class="my-2" />

                            <v-list-item
                                :prepend-icon="mdiAccountCogOutline"
                                :title="tt('User Settings')"
                                to="/user/settings"
                            />

                            <v-list-item
                                :prepend-icon="mdiCogOutline"
                                :title="tt('Application Settings')"
                                to="/app/settings"
                            />

                            <v-divider class="my-2" />

                            <v-list-item
                                v-if="isEnableApplicationLock"
                                :prepend-icon="mdiLockOutline"
                                :title="tt('Lock Application')"
                                @click="lock"
                            />

                            <v-list-item
                                :disabled="logouting"
                                :prepend-icon="mdiLogout"
                                :title="tt('Log Out')"
                                @click="logout"
                            />
                        </v-list>
                    </v-menu>
                </v-avatar>

                <v-btn
                    class="sidebar-theme-button"
                    color="on-primary"
                    variant="text"
                    :icon="true"
                    :aria-label="tt('Switch Theme')"
                    @click="cycleTheme"
                >
                    <v-icon
                        :icon="currentThemeIcon"
                        size="24"
                    />
                </v-btn>
            </div>
        </aside>

        <main class="layout-content-wrapper">
            <div class="layout-navbar navbar-blur">
                <div class="navbar-content-container">
                    <div class="d-flex h-100 align-center">
                        <v-btn
                            class="ms-n3 me-2 d-lg-none"
                            color="default"
                            variant="text"
                            :icon="true"
                            :aria-label="tt('Menu')"
                            @click="showVerticalOverlayMenu = true"
                        >
                            <v-icon
                                :icon="mdiMenu"
                                size="24"
                            />
                        </v-btn>

                        <div
                            v-if="mdAndDown"
                            class="app-logo d-flex align-center gap-x-3 app-title-wrapper"
                        >
                            <h1 class="font-weight-medium text-xl">
                                {{ tt('global.app.title') }}
                            </h1>
                        </div>

                        <v-spacer />
                    </div>
                </div>
            </div>

            <div class="layout-page-content">
                <div class="page-content-container">
                    <router-view :key="currentRoutePath" />
                </div>
            </div>
        </main>

        <switch-to-mobile-dialog v-if="DEDICATED_MOBILE_VERSION_ENABLED" v-model:show="showMobileQrCode" />

        <v-btn
            v-if="showGlobalAddTransactionButton"
            class="global-add-transaction-button"
            :class="{
                'global-add-transaction-button--dragging': isDraggingGlobalAddTransactionButton,
                'global-add-transaction-button--jelly': isGlobalAddTransactionButtonJelly
            }"
            :style="globalAddTransactionButtonStyle"
            color="primary"
            :icon="true"
            :aria-label="tt('Add Transaction')"
            @click="showGlobalAddTransactionDialog"
            @pointerdown="startDraggingGlobalAddTransactionButton"
            @pointermove="dragGlobalAddTransactionButton"
            @pointerup="stopDraggingGlobalAddTransactionButton"
            @pointercancel="stopDraggingGlobalAddTransactionButton"
        >
            <v-icon :icon="mdiPlus" size="30" />

            <v-tooltip activator="parent" location="start">
                {{ tt('Add Transaction') }}
            </v-tooltip>
        </v-btn>

        <transaction-edit-dialog
            ref="globalTransactionEditDialog"
            :type="TransactionEditPageType.Transaction"
        />

        <div
            class="layout-overlay"
            :class="{ visible: showVerticalOverlayMenu }"
            @click="closeOverlayMenu"
        />

        <v-overlay
            v-model="showLoading"
            class="justify-center align-center"
            :persistent="true"
        >
            <v-progress-circular indeterminate />
        </v-overlay>

        <snack-bar ref="snackbar" />
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import { useDisplay, useTheme } from 'vuetify';
import { useRoute, useRouter } from 'vue-router';

import SnackBar from '@/components/desktop/SnackBar.vue';
import TransactionEditDialog from '@/views/desktop/transactions/list/dialogs/EditDialog.vue';
import { TransactionEditPageType } from '@/views/base/transactions/TransactionEditPageBase.ts';

import { ThemeType } from '@/core/theme.ts';
import { DEDICATED_MOBILE_VERSION_ENABLED } from '@/consts/platform.ts';

import { getShareCacheImageBlob } from '@/lib/cache.ts';
import logger from '@/lib/logger.ts';
import { installPwa, isPwaInstallAvailable } from '@/lib/pwa.ts';
import { isUserScheduledTransactionEnabled } from '@/lib/server_settings.ts';
import {
    getSystemTheme,
    setExpenseAndIncomeAmountColor
} from '@/lib/ui/common.ts';

import { useI18n } from '@/locales/helpers.ts';

import { useDesktopPageStore } from '@/stores/desktopPage.ts';
import { useRootStore } from '@/stores/index.ts';
import { useSettingsStore } from '@/stores/setting.ts';
import { useUserStore } from '@/stores/user.ts';

import {
    mdiAccount,
    mdiAccountCogOutline,
    mdiCellphone,
    mdiChartPieOutline,
    mdiClipboardTextClockOutline,
    mdiClipboardTextOutline,
    mdiCogOutline,
    mdiCompassOutline,
    mdiCreditCardClockOutline,
    mdiCreditCardOutline,
    mdiDownloadOutline,
    mdiHomeOutline,
    mdiInformationOutline,
    mdiListBoxOutline,
    mdiLockOutline,
    mdiLogout,
    mdiMenu,
    mdiPlus,
    mdiPlusCircle,
    mdiSwapHorizontal,
    mdiTableLarge,
    mdiTagOutline,
    mdiThemeLightDark,
    mdiViewDashboardOutline,
    mdiWeatherNight,
    mdiWeatherSunny
} from '@mdi/js';

type SnackBarType = InstanceType<typeof SnackBar>;
type TransactionEditDialogType = InstanceType<typeof TransactionEditDialog>;

interface NavigationItem {
    to: string;
    label: string;
    icon: string;
    exact?: boolean;
    showAction?: boolean;
}

interface NavigationSection {
    id: string;
    title: string;
    items: NavigationItem[];
}

interface GlobalAddTransactionButtonDragState {
    pointerId: number;
    startPointerX: number;
    startPointerY: number;
    startButtonX: number;
    startButtonY: number;
    buttonWidth: number;
    buttonHeight: number;
    moved: boolean;
}

const display = useDisplay();
const theme = useTheme();
const route = useRoute();
const router = useRouter();

const { tt, initLocale } = useI18n();

const rootStore = useRootStore();
const settingsStore = useSettingsStore();
const userStore = useUserStore();
const desktopPageStore = useDesktopPageStore();

const snackbar = useTemplateRef<SnackBarType>('snackbar');
const globalTransactionEditDialog = useTemplateRef<TransactionEditDialogType>('globalTransactionEditDialog');

const logouting = ref(false);
const isVerticalNavScrolled = ref(false);
const showVerticalOverlayMenu = ref(false);
const showLoading = ref(false);
const showMobileQrCode = ref(false);
const globalAddTransactionButtonX = ref<number | null>(null);
const globalAddTransactionButtonY = ref<number | null>(null);
const relativeGlobalAddTransactionButtonX = ref<number | null>(null);
const relativeGlobalAddTransactionButtonY = ref<number | null>(null);
const isDraggingGlobalAddTransactionButton = ref(false);
const isGlobalAddTransactionButtonJelly = ref(false);

let globalAddTransactionButtonDragState: GlobalAddTransactionButtonDragState | null = null;
let suppressGlobalAddTransactionButtonClick = false;
let globalAddTransactionButtonJellyTimeout: ReturnType<typeof setTimeout> | undefined;

const mdAndDown = computed(() => display.mdAndDown.value);
const currentRoutePath = computed(() => route.path);
const showGlobalAddTransactionButton = computed(() => route.path !== '/');
const globalAddTransactionButtonStyle = computed(() => {
    if (globalAddTransactionButtonX.value === null || globalAddTransactionButtonY.value === null) {
        return {};
    }

    return {
        left: `${globalAddTransactionButtonX.value}px`,
        top: `${globalAddTransactionButtonY.value}px`,
        right: 'auto',
        bottom: 'auto'
    };
});

const currentNickName = computed(
    () => userStore.currentUserNickname || tt('User')
);

const currentUserAvatar = computed(() =>
    userStore.getUserAvatarUrl(userStore.currentUserBasicInfo, true)
);

const currentTheme = computed<string>({
    get: () => settingsStore.appSettings.theme,
    set: value => {
        if (value === settingsStore.appSettings.theme) {
            return;
        }

        settingsStore.setTheme(value);

        if (value === ThemeType.Light || value === ThemeType.Dark) {
            theme.change(value);
            return;
        }

        theme.change(getSystemTheme());
    }
});

const currentThemeIcon = computed(() => {
    if (currentTheme.value === ThemeType.Light) {
        return mdiWeatherSunny;
    }

    if (currentTheme.value === ThemeType.Dark) {
        return mdiWeatherNight;
    }

    return mdiThemeLightDark;
});

const showAddTransactionButtonInDesktopNavbar = computed(
    () => settingsStore.appSettings.showAddTransactionButtonInDesktopNavbar
);

const isEnableApplicationLock = computed(
    () => settingsStore.appSettings.applicationLock
);

const primaryNavigationItems = computed<NavigationItem[]>(() => [
    {
        to: '/',
        label: tt('Overview'),
        icon: mdiHomeOutline,
        exact: true
    }
]);

const navigationSections = computed<NavigationSection[]>(() => [
    {
        id: 'transactions',
        title: tt('Transaction Data'),
        items: [
            {
                to: '/transaction/list?pageType=0&dateType=7',
                label: tt('Transaction Details'),
                icon: mdiListBoxOutline,
                showAction: showAddTransactionButtonInDesktopNavbar.value
            },
            {
                to: '/account/invoices',
                label: tt('Invoices'),
                icon: mdiCreditCardClockOutline
            },
            {
                to: '/planning/annual',
                label: tt('Annual Planning'),
                icon: mdiTableLarge
            },
            {
                to: '/statistics/transaction',
                label: tt('Statistics & Analysis'),
                icon: mdiChartPieOutline
            },
            {
                to: '/insights/explorer',
                label: tt('Insights Explorer'),
                icon: mdiCompassOutline
            }
        ]
    },
    {
        id: 'basis-data',
        title: tt('Basis Data'),
        items: [
            {
                to: '/account/list',
                label: tt('Accounts'),
                icon: mdiCreditCardOutline
            },
            {
                to: '/category/list',
                label: tt('Transaction Categories'),
                icon: mdiViewDashboardOutline
            },
            {
                to: '/tag/list',
                label: tt('Transaction Tags'),
                icon: mdiTagOutline
            },
            {
                to: '/template/list',
                label: tt('Transaction Templates'),
                icon: mdiClipboardTextOutline
            },
            ...(isUserScheduledTransactionEnabled()
                ? [
                    {
                        to: '/schedule/list',
                        label: tt('Scheduled Transactions'),
                        icon: mdiClipboardTextClockOutline
                    }
                ]
                : [])
        ]
    }
]);

function normalizeNavigationPath(to: string): string {
    return to.split('?')[0] || '/';
}

function isPathActive(path: string, exact = false): boolean {
    if (exact) {
        return route.path === path;
    }

    return route.path === path || route.path.startsWith(`${path}/`);
}

function isNavigationItemActive(item: NavigationItem): boolean {
    return isPathActive(normalizeNavigationPath(item.to), item.exact);
}

function handleNavScroll(event: Event): void {
    isVerticalNavScrolled.value =
        (event.target as HTMLElement).scrollTop > 0;
}

function closeOverlayMenu(): void {
    showVerticalOverlayMenu.value = false;
}

function cycleTheme(): void {
    if (currentTheme.value === ThemeType.Light) {
        currentTheme.value = ThemeType.Dark;
        return;
    }

    if (currentTheme.value === ThemeType.Dark) {
        currentTheme.value = 'auto';
        return;
    }

    currentTheme.value = ThemeType.Light;
}

function clearShareImageCache(): void {
    getShareCacheImageBlob().then(blob => {
        if (blob) {
            logger.warn(
                'desktop version does not support receiving shared image; the shared image cache has been cleared'
            );
        }
    });
}

function lock(): void {
    rootStore.lock();
    router.replace('/unlock');
}

function logout(): void {
    logouting.value = true;
    showLoading.value = true;

    rootStore.logout()
        .then(() => {
            logouting.value = false;
            showLoading.value = false;

            settingsStore.clearAppSettings();

            const localeDefaultSettings = initLocale(
                userStore.currentUserLanguage,
                settingsStore.appSettings.timeZone
            );

            settingsStore.updateLocalizedDefaultSettings(
                localeDefaultSettings
            );

            setExpenseAndIncomeAmountColor(
                userStore.currentUserExpenseAmountColor,
                userStore.currentUserIncomeAmountColor
            );

            router.replace('/login');
        })
        .catch(error => {
            logouting.value = false;
            showLoading.value = false;

            if (!error.processed) {
                snackbar.value?.showError(error);
            }
        });
}

function showAddDialogInTransactionListPage(): void {
    desktopPageStore.setShowAddTransactionDialogInTransactionList();
}

function installApplication(): void {
    installPwa().catch(error => {
        snackbar.value?.showError(error);
    });
}

function startDraggingGlobalAddTransactionButton(event: PointerEvent): void {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) {
        return;
    }

    const button = event.currentTarget as HTMLElement;
    const buttonRect = button.getBoundingClientRect();

    button.setPointerCapture(event.pointerId);
    suppressGlobalAddTransactionButtonClick = false;
    globalAddTransactionButtonDragState = {
        pointerId: event.pointerId,
        startPointerX: event.clientX,
        startPointerY: event.clientY,
        startButtonX: buttonRect.left,
        startButtonY: buttonRect.top,
        buttonWidth: buttonRect.width,
        buttonHeight: buttonRect.height,
        moved: false
    };
}

function dragGlobalAddTransactionButton(event: PointerEvent): void {
    const dragState = globalAddTransactionButtonDragState;

    if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
    }

    const deltaX = event.clientX - dragState.startPointerX;
    const deltaY = event.clientY - dragState.startPointerY;

    if (!dragState.moved && Math.hypot(deltaX, deltaY) < 4) {
        return;
    }

    dragState.moved = true;
    isDraggingGlobalAddTransactionButton.value = true;

    const viewportMargin = 8;
    const maxX = Math.max(viewportMargin, window.innerWidth - dragState.buttonWidth - viewportMargin);
    const maxY = Math.max(viewportMargin, window.innerHeight - dragState.buttonHeight - viewportMargin);

    const buttonX = Math.min(Math.max(dragState.startButtonX + deltaX, viewportMargin), maxX);
    const buttonY = Math.min(Math.max(dragState.startButtonY + deltaY, viewportMargin), maxY);

    globalAddTransactionButtonX.value = buttonX;
    globalAddTransactionButtonY.value = buttonY;
    relativeGlobalAddTransactionButtonX.value = maxX > viewportMargin
        ? (buttonX - viewportMargin) / (maxX - viewportMargin)
        : 0;
    relativeGlobalAddTransactionButtonY.value = maxY > viewportMargin
        ? (buttonY - viewportMargin) / (maxY - viewportMargin)
        : 0;

    event.preventDefault();
}

function stopDraggingGlobalAddTransactionButton(event: PointerEvent): void {
    const dragState = globalAddTransactionButtonDragState;

    if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
    }

    suppressGlobalAddTransactionButtonClick = dragState.moved;
    isDraggingGlobalAddTransactionButton.value = false;
    globalAddTransactionButtonDragState = null;

    if (dragState.moved) {
        isGlobalAddTransactionButtonJelly.value = false;
        clearTimeout(globalAddTransactionButtonJellyTimeout);

        requestAnimationFrame(() => {
            isGlobalAddTransactionButtonJelly.value = true;
            globalAddTransactionButtonJellyTimeout = setTimeout(() => {
                isGlobalAddTransactionButtonJelly.value = false;
            }, 500);
        });
    }
}

function keepGlobalAddTransactionButtonInViewport(): void {
    if (relativeGlobalAddTransactionButtonX.value === null || relativeGlobalAddTransactionButtonY.value === null) {
        return;
    }

    const viewportMargin = 8;
    const buttonSize = 64;
    const maxX = Math.max(viewportMargin, window.innerWidth - buttonSize - viewportMargin);
    const maxY = Math.max(viewportMargin, window.innerHeight - buttonSize - viewportMargin);

    globalAddTransactionButtonX.value = viewportMargin
        + relativeGlobalAddTransactionButtonX.value * (maxX - viewportMargin);
    globalAddTransactionButtonY.value = viewportMargin
        + relativeGlobalAddTransactionButtonY.value * (maxY - viewportMargin);
}

function showGlobalAddTransactionDialog(event: MouseEvent): void {
    if (suppressGlobalAddTransactionButtonClick) {
        suppressGlobalAddTransactionButtonClick = false;
        event.preventDefault();
        return;
    }

    globalTransactionEditDialog.value?.open({}).then(result => {
        if (result?.message) {
            snackbar.value?.showMessage(result.message);
        }
    }).catch(error => {
        if (error) {
            snackbar.value?.showError(error);
        }
    });
}

clearShareImageCache();

onMounted(() => {
    window.addEventListener('resize', keepGlobalAddTransactionButtonInViewport);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', keepGlobalAddTransactionButtonInViewport);
    clearTimeout(globalAddTransactionButtonJellyTimeout);
});
</script>

<style>
/* =========================================================
   Variáveis locais
   ========================================================= */

.layout-wrapper {
    --sidebar-width: 246px;
    --sidebar-mobile-width: min(84vw, 224px);
    --sidebar-horizontal-padding: 10px;
    --sidebar-item-height: 31px;
    --sidebar-item-radius: 10px;
    --sidebar-item-gap: 8px;
    --sidebar-hover-bg: rgba(var(--v-theme-on-background), 0.06);
    --sidebar-active-bg: rgb(var(--v-theme-sidebar-selected));
    --sidebar-border: rgba(var(--v-border-color), 0.2);
}

.global-add-transaction-button {
    position: fixed !important;
    right: 24px;
    bottom: 24px;
    z-index: 1000;
    width: 64px !important;
    height: 64px !important;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.18) !important;
    cursor: grab;
    touch-action: none;
    user-select: none;
}

.global-add-transaction-button--dragging {
    cursor: grabbing;
    animation: global-add-transaction-button-drag 350ms ease-in-out infinite alternate;
}

.global-add-transaction-button--jelly {
    animation: global-add-transaction-button-jelly 500ms ease-out;
}

@keyframes global-add-transaction-button-drag {
    from {
        transform: scale(1.03, 0.97) rotate(-1deg);
    }

    to {
        transform: scale(0.97, 1.03) rotate(1deg);
    }
}

@keyframes global-add-transaction-button-jelly {
    0%, 100% {
        transform: scale(1, 1);
    }

    30% {
        transform: scale(1.12, 0.88);
    }

    55% {
        transform: scale(0.94, 1.06);
    }

    75% {
        transform: scale(1.03, 0.97);
    }
}

/* =========================================================
   Estrutura
   ========================================================= */

.layout-wrapper .layout-vertical-nav {
    width: var(--sidebar-width) !important;
    min-width: var(--sidebar-width) !important;
    max-width: var(--sidebar-width) !important;

    background: rgb(var(--v-sidebar-bg)) !important;
    background-image: none !important;

    border: 0 !important;
    border-inline-end: 1px solid var(--sidebar-border) !important;

    box-shadow: none !important;
}

.layout-wrapper:not(.layout-overlay-nav) .layout-content-wrapper {
    padding-inline-start: var(--sidebar-width) !important;
}

/* =========================================================
   Cabeçalho
   ========================================================= */

.layout-vertical-nav .nav-header {
    display: flex;
    align-items: center;

    width: 100%;
    height: 50px;
    min-height: 50px;

    margin: 0 !important;
    padding: 0 14px !important;

    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
}

.layout-vertical-nav .nav-header .app-logo {
    display: flex;
    align-items: center;

    width: 100%;
    min-width: 0;
    gap: 8px;

    margin: 0 !important;
    padding: 0 !important;

    color: rgba(var(--v-theme-on-background), 0.88) !important;
    text-decoration: none !important;

    background: transparent !important;
    box-shadow: none !important;
}

.layout-vertical-nav .nav-header .sidebar-brand-logo {
    display: block;
    width: auto;
    max-width: 100%;
    height: 28px;
}

.layout-vertical-nav .nav-header .sidebar-brand-logo--dark {
    display: none;
}

.v-theme--dark .layout-vertical-nav .nav-header .sidebar-brand-logo--light {
    display: none;
}

.v-theme--dark .layout-vertical-nav .nav-header .sidebar-brand-logo--dark {
    display: block;
}

/* =========================================================
   Lista rolável
   ========================================================= */

.layout-vertical-nav .nav-items {
    width: 100% !important;
    height: auto;
    min-height: 0;
    flex: 1 1 auto;

    margin: 0 !important;
    padding: 7px var(--sidebar-horizontal-padding) 14px !important;

    list-style: none;
    background: transparent !important;
}

.layout-vertical-nav .sidebar-footer {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex: 0 0 auto;
    gap: 8px;

    width: 100%;
    min-height: 62px;

    padding: 10px 14px;

    border-block-start: 1px solid var(--sidebar-border);
    background: rgb(var(--v-sidebar-bg));
}

.v-theme--dark .layout-vertical-nav .sidebar-user-avatar,
.v-theme--dark .layout-vertical-nav .sidebar-theme-button {
    color: #fff !important;
}

.v-theme--dark .layout-vertical-nav .sidebar-user-avatar .v-icon__svg,
.v-theme--dark .layout-vertical-nav .sidebar-theme-button .v-icon__svg {
    fill: #fff !important;
}

/* =========================================================
   Títulos das seções
   ========================================================= */

.layout-vertical-nav .nav-section-title {
    display: flex;
    align-items: center;

    width: 100%;
    min-height: 18px;

    margin: 9px 0 2px !important;
    padding: 0 8px !important;

    color: rgba(var(--v-theme-on-background), 0.34) !important;
}

.layout-vertical-nav .nav-section-title:first-of-type {
    margin-top: 5px !important;
}

.layout-vertical-nav .nav-section-title .title-wrapper {
    display: flex;
    align-items: center;

    width: 100%;
    min-width: 0;

    margin: 0 !important;
    padding: 0 !important;
}

.layout-vertical-nav .nav-section-title .title-text {
    overflow: hidden;

    color: inherit !important;
    font-size: 0.6rem !important;
    font-weight: 800 !important;
    letter-spacing: 0.055em !important;
    line-height: 1 !important;

    text-overflow: ellipsis;
    text-transform: uppercase;
    white-space: nowrap;
}

.layout-nav-type-vertical
.layout-vertical-nav
.nav-section-title
.title-text::before,
.layout-nav-type-vertical
.layout-vertical-nav
.nav-section-title
.title-text::after {
    display: none !important;
    content: none !important;
}

/* =========================================================
   Links e ações
   ========================================================= */

.layout-vertical-nav .nav-items .nav-link {
    position: relative;
    display: block;

    width: 100% !important;

    margin: 1px 0 !important;
    padding: 0 !important;

    border: 0 !important;
    background: transparent !important;
    transform: none !important;
}

.layout-vertical-nav .nav-items .nav-link > a,
.layout-vertical-nav .nav-items .nav-link > .nav-action {
    position: relative !important;

    display: flex !important;
    align-items: center !important;

    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    min-height: var(--sidebar-item-height) !important;

    gap: var(--sidebar-item-gap) !important;

    margin: 0 !important;
    padding: 4px 8px !important;

    color: rgb(var(--v-theme-on-background)) !important;
    font: inherit;
    text-align: start;
    text-decoration: none !important;

    border: 0 !important;
    border-radius: var(--sidebar-item-radius) !important;

    background: transparent !important;
    background-image: none !important;

    box-shadow: none !important;
    outline: none;

    transform: none !important;
    translate: none !important;

    overflow: hidden !important;
    cursor: pointer;

    -webkit-tap-highlight-color: transparent;

    /*
     * Não se anima border-radius, padding, transform ou background.
     * Isso elimina a interpolação visual durante a troca de rota.
     */
    transition: none !important;
}

.layout-vertical-nav .nav-items .nav-link--with-action > a {
    padding-inline-end: 36px !important;
}

.layout-vertical-nav .nav-items .nav-link > a::before,
.layout-vertical-nav .nav-items .nav-link > a::after,
.layout-vertical-nav .nav-items .nav-link > .nav-action::before,
.layout-vertical-nav .nav-items .nav-link > .nav-action::after {
    display: none !important;

    width: 0 !important;
    height: 0 !important;

    margin: 0 !important;

    opacity: 0 !important;
    content: none !important;

    background: none !important;
    box-shadow: none !important;
}

.layout-vertical-nav .nav-items .nav-link > a:hover,
.layout-vertical-nav .nav-items .nav-link > .nav-action:hover {
    color: rgba(var(--v-theme-on-background), 0.9) !important;
    background: var(--sidebar-hover-bg) !important;
    border-radius: var(--sidebar-item-radius) !important;
}

.layout-vertical-nav .nav-items .nav-link > a:focus-visible,
.layout-vertical-nav .nav-items .nav-link > .nav-action:focus-visible {
    outline: 2px solid rgba(var(--v-theme-primary), 0.52) !important;
    outline-offset: -2px;
}

/* Impede o flash nativo de clique/foco do navegador. */
.layout-vertical-nav .nav-items .nav-link > a:active,
.layout-vertical-nav .nav-items .nav-link > .nav-action:active {
    transform: none !important;
    filter: none !important;
}

/* =========================================================
   Ícones e textos
   ========================================================= */

.layout-vertical-nav .v-icon__svg {
    fill: rgb(var(--v-theme-on-sidebar-selected)) !important;
    width: 100%;
    height: 100%;
}

.layout-vertical-nav .nav-items .nav-item-icon {
    width: 16px !important;
    height: 16px !important;
    min-width: 16px !important;
    max-width: 16px !important;

    flex: 0 0 16px !important;

    margin: 0 !important;
    color: rgb(var(--v-theme-on-background)) !important;
    font-size: 16px !important;

    opacity: 1;
}

.layout-vertical-nav .nav-items .nav-item-title {
    display: block;

    overflow: hidden;
    min-width: 0;
    flex: 1 1 auto;

    margin: 0 !important;

    color: inherit !important;
    font-size: 0.85rem !important;

    /*
     * Mesmo peso no estado normal e no ativo.
     * Isso evita troca de glifo e recalculo da largura.
     */
    font-weight: 500 !important;

    letter-spacing: 0 !important;
    line-height: 1.15 !important;

    text-overflow: ellipsis;
    white-space: nowrap;

    transition: none !important;
}
/* =========================================================
   Item ativo
   ========================================================= */

.layout-vertical-nav .nav-items .nav-link > a.is-active {
    color: rgb(var(--v-theme-on-sidebar-selected)) !important;

    background: var(--sidebar-active-bg) !important;
    background-image: none !important;

    border: 0 !important;
    border-radius: var(--sidebar-item-radius) !important;

    box-shadow: none !important;
    transform: none !important;
    translate: none !important;
}

.layout-vertical-nav
.nav-items
.nav-link
> a.is-active
.nav-item-icon {
    color: rgb(var(--v-theme-on-sidebar-selected)) !important;
    opacity: 1;
}

.layout-vertical-nav
.nav-items
.nav-link
> a.is-active
.nav-item-title {
    color: rgb(var(--v-theme-on-sidebar-selected)) !important;
    font-weight: 800 !important;
}

.layout-vertical-nav .nav-items .nav-link > a.is-active:hover {
    color: rgb(var(--v-theme-on-sidebar-selected)) !important;
    background: var(--sidebar-active-bg) !important;
}

/* =========================================================
   Botão adicionar
   ========================================================= */

.layout-vertical-nav .nav-add-button {
    position: absolute !important;
    z-index: 2;
    inset-inline-end: 6px;
    top: 50%;

    width: 22px !important;
    height: 22px !important;
    min-width: 22px !important;
    max-width: 22px !important;

    margin: 0 !important;
    padding: 0 !important;

    color: rgb(var(--v-theme-on-sidebar-selected)) !important;

    border-radius: 7px !important;
    background: transparent !important;

    box-shadow: none !important;
    opacity: 0.72;

    transform: translateY(-50%) !important;
}

.layout-vertical-nav .nav-add-button .v-btn__overlay,
.layout-vertical-nav .nav-add-button .v-btn__underlay {
    display: none !important;
}

.layout-vertical-nav .nav-add-button:hover {
    background: rgba(var(--v-theme-on-background), 0.08) !important;
    opacity: 1;
}

/* =========================================================
   Scrollbar
   ========================================================= */

.layout-vertical-nav .nav-items .ps__rail-y {
    width: 4px !important;

    margin: 0 !important;

    background: transparent !important;
    opacity: 0;
}

.layout-vertical-nav .nav-items:hover .ps__rail-y {
    opacity: 1;
}

.layout-vertical-nav .nav-items .ps__thumb-y {
    right: 1px !important;

    width: 2px !important;

    border-radius: 999px !important;
    background: rgba(var(--v-theme-on-background), 0.14) !important;
}

/* =========================================================
   Mobile
   ========================================================= */

.layout-wrapper .layout-vertical-nav.overlay-nav {
    width: var(--sidebar-mobile-width) !important;
    min-width: var(--sidebar-mobile-width) !important;
    max-width: var(--sidebar-mobile-width) !important;

    background: rgb(var(--v-sidebar-bg)) !important;

    box-shadow: 14px 0 34px rgba(0, 0, 0, 0.16) !important;
}

.layout-overlay-nav .layout-content-wrapper {
    padding-inline-start: 0 !important;
}

@media (max-width: 1279.98px) {
    .layout-content-wrapper {
        padding-inline-start: 0 !important;
    }
}

/* Respeita usuários que desativam animações no sistema. */
@media (prefers-reduced-motion: reduce) {
    .layout-vertical-nav .nav-items .nav-link > a,
    .layout-vertical-nav .nav-items .nav-link > .nav-action {
        transition: none !important;
    }
}

.layout-vertical-nav .nav-item-icon .v-icon__svg {
    color: currentColor !important;
    fill: currentColor !important;
}

</style>
