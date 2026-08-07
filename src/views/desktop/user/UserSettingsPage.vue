<template>
    <div class="user-settings-page">
        <header class="user-settings-header">
            <div class="user-settings-header__top">
                <div class="user-settings-header__identity">
                    <div class="user-settings-header__titles">
                        <h1>{{ tt('User Settings') }}</h1>
                        <span>{{ activeTabTitle }}</span>
                    </div>
                </div>
            </div>

        </header>

        <nav class="user-settings-tabs" :aria-label="tt('User Settings')">
            <button type="button" class="user-settings-tab"
                    :class="{ 'user-settings-tab--active': activeTab === 'basicSetting' }"
                    @click="pushRouter('basicSetting')">{{ tt('Basic') }}</button>
            <button type="button" class="user-settings-tab"
                    :class="{ 'user-settings-tab--active': activeTab === 'securitySetting' }"
                    @click="pushRouter('securitySetting')">{{ tt('Security') }}</button>
            <button type="button" class="user-settings-tab"
                    :class="{ 'user-settings-tab--active': activeTab === 'twoFactorSetting' }"
                    @click="pushRouter('twoFactorSetting')">{{ tt('Two-Factor Authentication') }}</button>
            <button type="button" class="user-settings-tab"
                    :class="{ 'user-settings-tab--active': activeTab === 'dataManagementSetting' }"
                    @click="pushRouter('dataManagementSetting')">{{ tt('Data Management') }}</button>
        </nav>

        <v-window class="user-settings-content disable-tab-transition" v-model="activeTab">
            <v-window-item value="basicSetting">
                <user-basic-setting-tab/>
            </v-window-item>

            <v-window-item value="securitySetting">
                <user-security-setting-tab/>
            </v-window-item>

            <v-window-item value="twoFactorSetting">
                <user-two-factor-auth-setting-tab ref="twoFactorSettingTab"/>
            </v-window-item>

            <v-window-item value="dataManagementSetting">
                <user-data-management-setting-tab/>
            </v-window-item>
        </v-window>
    </div>
</template>

<script setup lang="ts">
import UserBasicSettingTab from './settings/tabs/UserBasicSettingTab.vue';
import UserSecuritySettingTab from './settings/tabs/UserSecuritySettingTab.vue';
import UserTwoFactorAuthSettingTab from './settings/tabs/UserTwoFactorAuthSettingTab.vue';
import UserDataManagementSettingTab from './settings/tabs/UserDataManagementSettingTab.vue';

import { computed, ref, useTemplateRef, watch } from 'vue';
import { useRouter, onBeforeRouteUpdate } from 'vue-router';

import { useI18n } from '@/locales/helpers.ts';

type TwoFactorSettingTabType = InstanceType<typeof UserTwoFactorAuthSettingTab>;

const props = defineProps<{
    initTab?: string;
}>();

const router = useRouter();

const { tt } = useI18n();

const ALL_TABS: string[] = [
    'basicSetting',
    'securitySetting',
    'twoFactorSetting',
    'dataManagementSetting'
];

const twoFactorSettingTab = useTemplateRef<TwoFactorSettingTabType>('twoFactorSettingTab');

const activeTab = ref<string>((() => {
    let queryActiveTab = props.initTab || 'basicSetting';

    if (ALL_TABS.indexOf(queryActiveTab) < 0) {
        queryActiveTab = 'basicSetting';
    }

    return queryActiveTab;
})());

const activeTabTitle = computed<string>(() => {
    switch (activeTab.value) {
    case 'securitySetting':
        return tt('Security');
    case 'twoFactorSetting':
        return tt('Two-Factor Authentication');
    case 'dataManagementSetting':
        return tt('Data Management');
    default:
        return tt('Basic Settings');
    }
});

const pushRouter = (tab: string) => {
    activeTab.value = tab;
    router.push(`/user/settings?tab=${tab}`);
};

onBeforeRouteUpdate((to) => {
    if (to.query && to.query['tab'] && ALL_TABS.indexOf(to.query['tab'] as string) >= 0) {
        activeTab.value = to.query['tab'] as string;
    } else {
        activeTab.value = 'basicSetting';
    }
});

watch(activeTab, (newValue, oldValue) => {
    if (oldValue === 'twoFactorSetting' && newValue !== 'twoFactorSetting') {
        twoFactorSettingTab.value?.reset();
    }
});
</script>

<style>
.user-settings-page {
    --settings-text: rgb(var(--v-theme-on-surface));
    --settings-muted: rgb(var(--v-theme-tertiary));
    --settings-surface: rgb(var(--v-theme-surface));
    --settings-surface-soft: rgb(var(--v-theme-background));
    --settings-border: rgb(var(--v-theme-muted-border));
    --settings-radius: 10px;

    width: calc(100% + 48px);
    min-width: 0;
    min-height: 100vh;
    margin: -24px;
    color: var(--settings-text);
    background: rgb(var(--v-theme-background));
    font-family: "Lausanne", "Helvetica Neue", Arial, sans-serif;
}

.user-settings-header {
    width: 100%;
    padding: 36px 40px 28px;
    background: rgb(var(--v-theme-surface));
}

.user-settings-header__top {
    display: flex;
    width: 100%;
    min-width: 0;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
}

.user-settings-header__identity {
    display: flex;
    min-width: 0;
    flex: 1 1 100%;
    align-items: center;
    gap: 12px;
}

.user-settings-header__titles h1 {
    margin: 0;
    color: rgb(var(--v-theme-on-surface));
    font-size: clamp(1.8rem, 3vw, 2.65rem);
    font-weight: 500;
    letter-spacing: -0.05em;
    line-height: 1;
}

.user-settings-header__titles > span {
    display: block;
    margin-top: 10px;
    color: rgb(var(--v-theme-tertiary));
    font-size: 0.76rem;
    font-weight: 500;
}

.user-settings-tabs {
    display: flex;
    width: 100%;
    min-width: 0;
    min-height: 49px;
    align-items: stretch;
    gap: 30px;
    margin: 0;
    padding-inline: 40px;
    border-bottom: 1px solid var(--settings-border);
    background: var(--settings-surface);
    overflow-x: auto;
    scrollbar-width: none;
}

.user-settings-tabs::-webkit-scrollbar {
    display: none;
}

.user-settings-tab {
    position: relative;
    min-height: 48px;
    padding: 0 1px;
    border: 0;
    color: var(--settings-muted);
    background: transparent;
    cursor: pointer;
    font: inherit;
    font-size: 0.8rem;
    font-weight: 500;
    white-space: nowrap;
}

.user-settings-tab::after {
    position: absolute;
    right: 0;
    bottom: -1px;
    left: 0;
    height: 2px;
    background: transparent;
    content: "";
}

.user-settings-tab:hover,
.user-settings-tab--active {
    color: var(--settings-text);
}

.user-settings-tab--active {
    font-weight: 600;
}

.user-settings-tab--active::after {
    background: var(--settings-text);
}

.user-settings-content,
.user-settings-content .v-window__container,
.user-settings-content .v-window-item {
    overflow: visible;
}

.user-settings-content {
    margin: 24px 24px 0;
    padding-bottom: 56px;
}

.user-settings-content .v-row {
    margin: -7px;
}

.user-settings-content .v-col {
    padding: 7px;
}

.user-settings-content .v-card {
    min-width: 0;
    border: 1px solid var(--settings-border);
    border-radius: var(--settings-radius);
    background: var(--settings-surface);
    box-shadow: none !important;
}

.user-settings-content .v-card-item {
    min-height: 62px;
    align-items: center;
    padding: 18px 22px;
    border-bottom: 1px solid var(--settings-border);
}

.user-settings-content .v-card-item__append {
    align-self: center;
    padding-inline-start: 12px;
}

.user-settings-content .v-card-title {
    color: rgb(var(--v-theme-on-surface));
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: -0.015em;
}

.user-settings-content .settings-card-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.user-settings-content .settings-card-refresh {
    width: 36px !important;
    min-width: 36px !important;
    height: 36px !important;
    margin: 0 !important;
    padding: 0 !important;
    border-radius: 6px !important;
}

.user-settings-content .settings-card-action-button {
    min-height: 36px !important;
    margin: 0 !important;
    border-radius: 6px !important;
}

.user-settings-content .v-card-text {
    padding: 22px;
}

.user-settings-content .v-form > .v-card-text:last-child,
.user-settings-content .v-card > .v-card-text:last-child:has(.v-btn) {
    border-top: 1px solid rgb(var(--v-theme-muted-border));
    background: rgb(var(--v-theme-background));
}

.user-settings-content .settings-card-footer {
    display: flex;
    min-height: 72px;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    padding: 16px 22px !important;
}

.user-settings-content .v-form > .v-card-text:last-child {
    padding-top: 22px !important;
}

.user-settings-content .settings-card-footer .v-btn {
    min-height: 40px;
    padding-inline: 18px;
    border-radius: 6px;
    font-size: 0.78rem;
    font-weight: 600;
}

.user-settings-content .settings-export-card > .v-card-text:not(.settings-card-footer) {
    padding-bottom: 18px;
}

.user-settings-content .settings-danger-card {
    border-color: rgba(var(--v-theme-error), 0.42);
}

.user-settings-content .settings-danger-card__body {
    padding: 22px !important;
}

.user-settings-content .settings-danger-card__warning {
    display: flex;
    max-width: 980px;
    align-items: flex-start;
    gap: 10px;
    font-size: 0.84rem;
    line-height: 1.55;
}

.user-settings-content .settings-danger-card__warning .v-icon {
    flex: 0 0 auto;
    margin-top: 1px;
}

.user-settings-content .settings-danger-card__form {
    margin: 18px -7px -7px !important;
}

.user-settings-content .settings-danger-card__form .v-field {
    min-height: 44px;
    border-radius: 6px;
}

.user-settings-content .settings-danger-card__footer {
    border-top-color: rgba(var(--v-theme-error), 0.2) !important;
}

.user-settings-content .v-divider {
    border-color: rgb(var(--v-theme-muted-border));
    opacity: 1;
}

.user-settings-content .v-field {
    border-radius: 6px;
    background: var(--settings-surface-soft);
    box-shadow: none;
}

.user-settings-content .settings-field-label {
    display: block;
    margin-bottom: 8px;
    color: var(--settings-muted);
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.025em;
    line-height: 1.25;
}

.user-settings-content .settings-field-label--error {
    color: rgb(var(--v-theme-error));
}

.user-settings-content .v-btn {
    letter-spacing: 0;
    text-transform: none;
}

.user-settings-content .v-table {
    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 6px;
}

.user-settings-content .v-table th {
    color: rgb(var(--v-theme-tertiary));
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

@media (max-width: 959.98px) {
    .user-settings-header {
        padding: 24px 20px;
    }

    .user-settings-tabs {
        padding-inline: 20px;
    }

    .user-settings-content {
        margin-inline: 28px;
    }
}

@media (max-width: 599.98px) {
    .user-settings-header {
        padding: 20px 14px;
    }

    .user-settings-header__titles h1 {
        font-size: 1.35rem;
    }

    .user-settings-header__titles > span {
        display: none;
    }

    .user-settings-tabs {
        gap: 22px;
        padding-inline: 14px;
    }

    .user-settings-content {
        margin: 16px 14px 0;
        padding-bottom: 32px;
    }

    .user-settings-content .v-card-item,
    .user-settings-content .v-card-text {
        padding: 18px;
    }

    .user-settings-content .settings-card-actions {
        flex-wrap: wrap;
        justify-content: flex-start;
    }

    .user-settings-content .settings-danger-card__body {
        padding: 18px !important;
    }
}
</style>
