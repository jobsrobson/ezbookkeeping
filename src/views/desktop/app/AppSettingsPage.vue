<template>
    <div class="user-settings-page">
        <header class="user-settings-header">
            <div class="user-settings-header__top">
                <div class="user-settings-header__identity">
                    <div class="user-settings-header__titles">
                        <h1>{{ tt('Application Settings') }}</h1>
                        <span>{{ activeTabTitle }}</span>
                    </div>
                </div>
            </div>
        </header>

        <nav class="user-settings-tabs" :aria-label="tt('Application Settings')">
            <button type="button" class="user-settings-tab"
                    :class="{ 'user-settings-tab--active': activeTab === 'basicSetting' }"
                    @click="pushRouter('basicSetting')">{{ tt('Basic') }}</button>
            <button type="button" class="user-settings-tab"
                    :class="{ 'user-settings-tab--active': activeTab === 'applicationLockSetting' }"
                    @click="pushRouter('applicationLockSetting')">{{ tt('Application Lock') }}</button>
            <button type="button" class="user-settings-tab"
                    :class="{ 'user-settings-tab--active': activeTab === 'statisticsSetting' }"
                    @click="pushRouter('statisticsSetting')">{{ tt('Statistics') }}</button>
            <button type="button" class="user-settings-tab"
                    :class="{ 'user-settings-tab--active': activeTab === 'cloudSyncSetting' }"
                    @click="pushRouter('cloudSyncSetting')">{{ tt('Settings Sync') }}</button>
            <button type="button" class="user-settings-tab"
                    :class="{ 'user-settings-tab--active': activeTab === 'browserCacheSetting' }"
                    @click="pushRouter('browserCacheSetting')">{{ tt('Browser Cache Management') }}</button>
        </nav>

        <v-window class="user-settings-content disable-tab-transition" v-model="activeTab">
            <v-window-item value="basicSetting">
                <app-basic-setting-tab/>
            </v-window-item>

            <v-window-item value="applicationLockSetting">
                <app-lock-setting-tab/>
            </v-window-item>

            <v-window-item value="statisticsSetting">
                <app-statistics-setting-tab/>
            </v-window-item>

            <v-window-item value="cloudSyncSetting">
                <app-cloud-sync-setting-tab/>
            </v-window-item>

            <v-window-item value="browserCacheSetting">
                <app-browser-cache-setting-tab/>
            </v-window-item>
        </v-window>
    </div>
</template>

<script setup lang="ts">
import AppBasicSettingTab from './settings/tabs/AppBasicSettingTab.vue';
import AppLockSettingTab from './settings/tabs/AppLockSettingTab.vue';
import AppStatisticsSettingTab from './settings/tabs/AppStatisticsSettingTab.vue';
import AppCloudSyncSettingTab from './settings/tabs/AppCloudSyncSettingTab.vue';
import AppBrowserCacheSettingTab from './settings/tabs/AppBrowserCacheSettingTab.vue';

import { computed, ref } from 'vue';
import { useRouter, onBeforeRouteUpdate } from 'vue-router';

import { useI18n } from '@/locales/helpers.ts';

const props = defineProps<{
    initTab?: string;
}>();

const router = useRouter();

const { tt } = useI18n();

const ALL_TABS: string[] = [
    'basicSetting',
    'applicationLockSetting',
    'statisticsSetting',
    'cloudSyncSetting',
    'browserCacheSetting'
];

const activeTab = ref<string>((() => {
    let queryActiveTab = props.initTab || 'basicSetting';

    if (ALL_TABS.indexOf(queryActiveTab) < 0) {
        queryActiveTab = 'basicSetting';
    }

    return queryActiveTab;
})());

const activeTabTitle = computed<string>(() => {
    switch (activeTab.value) {
    case 'applicationLockSetting':
        return tt('Application Lock');
    case 'statisticsSetting':
        return tt('Statistics');
    case 'cloudSyncSetting':
        return tt('Settings Sync');
    case 'browserCacheSetting':
        return tt('Browser Cache Management');
    default:
        return tt('Basic Settings');
    }
});

const pushRouter = (tab: string) => {
    activeTab.value = tab;
    router.push(`/app/settings?tab=${tab}`);
};

onBeforeRouteUpdate((to) => {
    if (to.query && to.query['tab'] && ALL_TABS.indexOf(to.query['tab'] as string) >= 0) {
        activeTab.value = to.query['tab'] as string;
    } else {
        activeTab.value = 'basicSetting';
    }
});
</script>
