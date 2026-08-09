<template>
    <v-menu
        location="bottom"
        :close-on-content-click="column !== 'amount'"
        max-height="420"
    >
        <template #activator="{ props: menuProps }">
            <button
                type="button"
                class="invoice-column-menu"
                :class="{ 'text-primary': active }"
                v-bind="menuProps"
            >
                <span>{{ label }}</span>
                <v-icon :icon="mdiMenuDown" size="18" />
            </button>
        </template>

        <v-list density="compact" min-width="220">
            <v-list-item
                :title="ascendingLabel"
                :prepend-icon="mdiSortAscending"
                :append-icon="isCurrentSort('asc') ? mdiCheck : undefined"
                @click="setSort('asc')"
            />
            <v-list-item
                :title="descendingLabel"
                :prepend-icon="mdiSortDescending"
                :append-icon="isCurrentSort('desc') ? mdiCheck : undefined"
                @click="setSort('desc')"
            />

            <template v-if="column === 'category'">
                <v-divider />
                <v-list-item
                    :title="tt('All Categories')"
                    :append-icon="!category ? mdiCheck : undefined"
                    @click="emit('update:category', '')"
                />
                <v-list-item
                    v-for="item in categories"
                    :key="item"
                    :title="item"
                    :append-icon="category === item ? mdiCheck : undefined"
                    @click="emit('update:category', item)"
                />
            </template>

            <template v-if="column === 'type'">
                <v-divider />
                <v-list-item
                    v-for="item in typeOptions"
                    :key="item.value"
                    :title="item.label"
                    :append-icon="typeFilter === item.value ? mdiCheck : undefined"
                    @click="emit('update:typeFilter', item.value)"
                />
            </template>

            <template v-if="column === 'amount'">
                <v-divider />
                <div class="invoice-amount-filter" @click.stop>
                    <v-text-field
                        :model-value="minAmount"
                        type="number"
                        density="compact"
                        variant="outlined"
                        hide-details
                        :label="tt('Minimum Amount')"
                        @update:model-value="emitAmount('min', $event)"
                    />
                    <v-text-field
                        :model-value="maxAmount"
                        type="number"
                        density="compact"
                        variant="outlined"
                        hide-details
                        :label="tt('Maximum Amount')"
                        @update:model-value="emitAmount('max', $event)"
                    />
                    <v-btn
                        block
                        size="small"
                        variant="text"
                        :disabled="minAmount === null && maxAmount === null"
                        @click="clearAmounts"
                    >
                        {{ tt('Clear') }}
                    </v-btn>
                </div>
            </template>
        </v-list>
    </v-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { mdiCheck, mdiMenuDown, mdiSortAscending, mdiSortDescending } from '@mdi/js';
import { useI18n } from '@/locales/helpers.ts';

export type InvoiceSortColumn = 'date' | 'description' | 'category' | 'type' | 'amount';
export type InvoiceSortDirection = 'asc' | 'desc';
export type InvoiceTypeFilter = 'all' | 'expense' | 'installment' | 'subscription';

const props = defineProps<{
    label: string;
    column: InvoiceSortColumn;
    sortBy: InvoiceSortColumn;
    sortDirection: InvoiceSortDirection;
    categories?: string[];
    category?: string;
    typeFilter?: InvoiceTypeFilter;
    minAmount?: number | null;
    maxAmount?: number | null;
}>();

const emit = defineEmits<{
    'update:sortBy': [value: InvoiceSortColumn];
    'update:sortDirection': [value: InvoiceSortDirection];
    'update:category': [value: string];
    'update:typeFilter': [value: InvoiceTypeFilter];
    'update:minAmount': [value: number | null];
    'update:maxAmount': [value: number | null];
}>();

const { tt } = useI18n();
const active = computed(() =>
    props.sortBy === props.column ||
    (props.column === 'category' && !!props.category) ||
    (props.column === 'type' && props.typeFilter !== 'all') ||
    (props.column === 'amount' && (props.minAmount !== null || props.maxAmount !== null))
);
const ascendingLabel = computed(() => {
    if (props.column === 'date') return tt('Oldest first');
    if (props.column === 'amount') return tt('Lowest first');
    return tt('A to Z');
});
const descendingLabel = computed(() => {
    if (props.column === 'date') return tt('Newest first');
    if (props.column === 'amount') return tt('Highest first');
    return tt('Z to A');
});
const typeOptions = computed(() => [
    { value: 'all' as const, label: tt('All Types') },
    { value: 'expense' as const, label: tt('Expense') },
    { value: 'installment' as const, label: tt('Installment') },
    { value: 'subscription' as const, label: tt('Subscription') }
]);

function isCurrentSort(direction: InvoiceSortDirection): boolean {
    return props.sortBy === props.column && props.sortDirection === direction;
}

function setSort(direction: InvoiceSortDirection): void {
    emit('update:sortBy', props.column);
    emit('update:sortDirection', direction);
}

function emitAmount(target: 'min' | 'max', value: string | number | null): void {
    const parsed = value === '' || value === null ? null : Number(value);
    const normalizedValue = Number.isFinite(parsed) ? parsed : null;
    if (target === 'min') emit('update:minAmount', normalizedValue);
    else emit('update:maxAmount', normalizedValue);
}

function clearAmounts(): void {
    emit('update:minAmount', null);
    emit('update:maxAmount', null);
}
</script>

<style scoped>
.invoice-column-menu {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 0;
    border: 0;
    color: inherit;
    background: transparent;
    font: inherit;
    letter-spacing: inherit;
    text-transform: inherit;
    cursor: pointer;
}

.invoice-amount-filter {
    display: grid;
    gap: 10px;
    width: 260px;
    padding: 14px 12px 8px;
}
</style>
