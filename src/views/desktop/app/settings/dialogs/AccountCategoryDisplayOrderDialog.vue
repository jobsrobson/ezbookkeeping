<template>
    <v-dialog width="600" :persistent="isDisplayOrderModified()" v-model="showState">
        <v-card class="settings-dialog-card">
            <template #title>
                <div class="settings-dialog-header">
                    <h4>{{ tt('Account Category Order') }}</h4>
                    <v-spacer/>
                    <v-btn density="comfortable" color="default" variant="text" class="ms-2" :icon="true">
                        <v-icon :icon="mdiDotsVertical" />
                        <v-menu activator="parent">
                            <v-list>
                                <v-list-item :prepend-icon="mdiRestore"
                                             :title="tt('Reset to Default')"
                                             @click="resetDisplayOrderToDefault"></v-list-item>
                            </v-list>
                        </v-menu>
                    </v-btn>
                </div>
            </template>

            <v-card-text class="settings-dialog-body">
                <v-table hover density="comfortable" class="settings-dialog-table w-100">
                    <draggable-list tag="tbody"
                                    item-key="id"
                                    handle=".drag-handle"
                                    ghost-class="dragging-item"
                                    v-model="accountCategories">
                        <template #item="{ element }">
                            <tr>
                                <td>
                                    <div class="d-flex align-center">
                                        <div class="d-flex align-center">
                                            <span>{{ tt(element.name) }}</span>
                                        </div>

                                        <v-spacer/>

                                        <span class="ms-2">
                                            <v-icon class="drag-handle" :icon="mdiDrag"/>
                                            <v-tooltip activator="parent">{{ tt('Drag to Reorder') }}</v-tooltip>
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        </template>
                    </draggable-list>
                </v-table>
            </v-card-text>

            <v-card-text class="settings-dialog-footer">
                <div class="settings-dialog-footer__actions">
                    <v-btn :disabled="!isDisplayOrderModified()" @click="saveDisplayOrder">{{ tt('Save') }}</v-btn>
                    <v-btn color="secondary" variant="tonal" @click="cancel">{{ tt('Cancel') }}</v-btn>
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { useI18n } from '@/locales/helpers.ts';
import { useAccountCategoryDisplayOrderSettingsPageBase } from '@/views/base/settings/AccountCategoryDisplayOrderSettingsPageBase.ts';

import {
    mdiDotsVertical,
    mdiRestore,
    mdiDrag
} from '@mdi/js';

const { tt } = useI18n();

const {
    accountCategories,
    isDisplayOrderModified,
    loadDisplayOrderFromSettings,
    saveDisplayOrderToSettings,
    resetDisplayOrderToDefault
} = useAccountCategoryDisplayOrderSettingsPageBase();

let resolveFunc: (() => void) | null = null;
let rejectFunc: (() => void) | null = null;

const showState = ref<boolean>(false);

function open(): Promise<void> {
    loadDisplayOrderFromSettings();
    showState.value = true;

    return new Promise<void>((resolve, reject) => {
        resolveFunc = resolve;
        rejectFunc = reject;
    });
}

function saveDisplayOrder(): void {
    saveDisplayOrderToSettings();
    resolveFunc?.();
    showState.value = false;
}

function cancel(): void {
    rejectFunc?.();
    showState.value = false;
}

defineExpose({
    open
});
</script>

<style>
.settings-dialog-card {
    overflow: hidden;
    border: 1px solid rgb(var(--v-theme-muted-border)) !important;
    border-radius: 10px !important;
    background: rgb(var(--v-theme-surface)) !important;
    box-shadow: none !important;
}

.settings-dialog-card > .v-card-item {
    padding: 20px 22px !important;
    border-bottom: 1px solid rgb(var(--v-theme-muted-border));
}

.settings-dialog-header {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 12px;
}

.settings-dialog-header h4 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 600;
    letter-spacing: -0.02em;
}

.settings-dialog-body {
    padding: 20px 22px !important;
}

.settings-dialog-table {
    overflow: hidden;
    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 7px;
}

.settings-dialog-footer {
    padding: 16px 22px !important;
    border-top: 1px solid rgb(var(--v-theme-muted-border));
    background: rgb(var(--v-theme-background));
}

.settings-dialog-footer__actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.settings-dialog-footer .v-btn {
    min-height: 40px;
    border-radius: 6px;
    text-transform: none;
}
</style>
