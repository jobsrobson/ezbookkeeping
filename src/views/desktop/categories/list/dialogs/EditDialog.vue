<template>
    <v-dialog class="management-dialog" width="800" max-width="calc(100vw - 24px)" :persistent="isCategoryModified" v-model="showState">
        <v-card class="management-dialog__card">
            <template #title>
                <div class="management-dialog__header">
                    <h4>{{ tt(title) }}</h4>
                    <v-progress-circular indeterminate size="22" class="ms-2" v-if="loading"></v-progress-circular>
                </div>
            </template>
            <v-card-text class="management-dialog__body">
                <v-form class="management-dialog__form w-100">
                    <v-row>
                        <v-col class="management-dialog__field" :data-field-label="tt('Category Name')" cols="12" md="12">
                            <v-text-field
                                type="text"
                                persistent-placeholder
                                :disabled="loading || submitting"
                                :label="tt('Category Name')"
                                :placeholder="tt('Category Name')"
                                v-model="category.name"
                            />
                        </v-col>
                        <v-col class="management-dialog__field" :data-field-label="tt('Primary Category')" cols="12" md="12" v-if="editCategoryId && category.parentId && category.parentId !== '0'">
                            <v-select
                                item-title="name"
                                item-value="id"
                                persistent-placeholder
                                :disabled="loading || submitting"
                                :label="tt('Primary Category')"
                                :placeholder="tt('Primary Category')"
                                :items="allAvailableCategories"
                                :no-data-text="tt('No available primary category')"
                                v-model="category.parentId"
                            >
                                <template #item="{ props, item }">
                                    <v-list-item v-bind="props">
                                        <template #prepend>
                                            <ItemIcon class="me-2" icon-type="category"
                                                      :icon-id="item.raw.icon" :color="item.raw.color"></ItemIcon>
                                        </template>
                                        <template #title>
                                            <div class="text-truncate">{{ item.raw.name }}</div>
                                        </template>
                                    </v-list-item>
                                </template>
                            </v-select>
                        </v-col>
                        <v-col class="management-dialog__field" :data-field-label="tt('Category Icon')" cols="12" md="6">
                            <icon-select icon-type="category"
                                         :all-icon-infos="ALL_CATEGORY_ICONS"
                                          :label="tt('Category Icon')"
                                          :color="category.color"
                                          :disabled="loading || submitting"
                                          v-model="category.icon" />
                        </v-col>
                        <v-col class="management-dialog__field" :data-field-label="tt('Category Color')" cols="12" md="6">
                            <color-select :all-color-infos="ALL_CATEGORY_COLORS"
                                         :label="tt('Category Color')"
                                         :disabled="loading || submitting"
                                         v-model="category.color" />
                        </v-col>
                        <v-col class="management-dialog__field" :data-field-label="tt('Description')" cols="12" md="12">
                            <v-textarea
                                type="text"
                                persistent-placeholder
                                rows="3"
                                :disabled="loading || submitting"
                                :label="tt('Description')"
                                :placeholder="tt('Your category description (optional)')"
                                v-model="category.comment"
                            />
                        </v-col>
                        <v-col class="management-dialog__field" :data-field-label="tt('Visible')" cols="12" md="12" v-if="editCategoryId">
                            <v-switch :disabled="loading || submitting"
                                      :label="tt('Visible')" v-model="category.visible"/>
                        </v-col>
                    </v-row>
                </v-form>
            </v-card-text>
            <v-card-text class="management-dialog__footer">
                <div class="management-dialog__footer-actions">
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

    <snack-bar ref="snackbar" />
</template>

<script setup lang="ts">
import SnackBar from '@/components/desktop/SnackBar.vue';

import { ref, computed, useTemplateRef } from 'vue';

import { useI18n } from '@/locales/helpers.ts';
import { useCategoryEditPageBase } from '@/views/base/categories/CategoryEditPageBase.ts';

import { useTransactionCategoriesStore } from '@/stores/transactionCategory.ts';

import type { ColorValue } from '@/core/color.ts';
import { CategoryType } from '@/core/category.ts';
import { ALL_CATEGORY_ICONS } from '@/consts/icon.ts';
import { ALL_CATEGORY_COLORS } from '@/consts/color.ts';
import { TransactionCategory } from '@/models/transaction_category.ts';

import { generateRandomUUID } from '@/lib/misc.ts';

interface TransactionCategoryEditResponse {
    message: string;
}

type SnackBarType = InstanceType<typeof SnackBar>;

const { tt } = useI18n();
const {
    editCategoryId,
    clientSessionId,
    loading,
    submitting,
    category,
    allAvailableCategories,
    title,
    saveButtonTitle,
    inputEmptyProblemMessage,
    inputIsEmpty
} = useCategoryEditPageBase();

const transactionCategoriesStore = useTransactionCategoriesStore();

const snackbar = useTemplateRef<SnackBarType>('snackbar');

const showState = ref<boolean>(false);

let resolveFunc: ((value: TransactionCategoryEditResponse) => void) | null = null;
let rejectFunc: ((reason?: unknown) => void) | null = null;

const isCategoryModified = computed<boolean>(() => {
    if (!editCategoryId.value) { // Add
        return !category.value.equals(TransactionCategory.createNewCategory(category.value.type, category.value.parentId));
    } else { // Edit
        return true;
    }
});

function open(options: { id?: string; parentId?: string; type?: CategoryType; currentCategory?: TransactionCategory, color?: ColorValue, icon?: string }): Promise<TransactionCategoryEditResponse> {
    showState.value = true;
    loading.value = true;
    submitting.value = false;

    const newTransactionCategory = TransactionCategory.createNewCategory();
    category.value.fillFrom(newTransactionCategory);

    if (options.id) {
        if (options.currentCategory) {
            category.value.fillFrom(options.currentCategory);
        }

        editCategoryId.value = options.id;
        transactionCategoriesStore.getCategory({
            categoryId: editCategoryId.value
        }).then(response => {
            category.value.fillFrom(response);
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
    } else if (options.parentId) {
        editCategoryId.value = null;

        const categoryType = options.type;

        if (categoryType !== CategoryType.Income &&
            categoryType !== CategoryType.Expense &&
            categoryType !== CategoryType.Transfer) {
            loading.value = false;
            showState.value = false;

            return Promise.reject('Parameter Invalid');
        }

        category.value.type = categoryType;
        category.value.parentId = options.parentId;

        if (options.color) {
            category.value.color = options.color;
        }

        if (options.icon) {
            category.value.icon = options.icon;
        }

        clientSessionId.value = generateRandomUUID();
        loading.value = false;
    }

    return new Promise((resolve, reject) => {
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

    transactionCategoriesStore.saveCategory({
        category: category.value,
        isEdit: !!editCategoryId.value,
        clientSessionId: clientSessionId.value
    }).then(() => {
        submitting.value = false;

        let message = 'You have saved this category';

        if (!editCategoryId.value) {
            message = 'You have added a new category';
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

function cancel(): void {
    rejectFunc?.();
    showState.value = false;
}

defineExpose({
    open
});
</script>

<style scoped>
.management-dialog__footer {
    flex: 0 0 auto;
    padding: 16px 16px !important;
    border-top: 1px solid rgb(var(--v-theme-muted-border));
    background: rgb(var(--v-theme-surface));
}

.management-dialog__footer-actions {
    margin-top: 16px !important;
}


</style>
