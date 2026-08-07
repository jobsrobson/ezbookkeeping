<template>
    <span class="item-icon item-icon-svg" :style="svgStyle" v-if="accountIconInfo?.assetUrl">
        <slot></slot>
    </span>
    <f7-icon :f7="f7IconValue" :icon="icon" :style="style" v-else>
        <slot></slot>
    </f7-icon>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { type CommonIconProps, useItemIconBase } from '@/components/base/ItemIconBase.ts';

const props = defineProps<CommonIconProps>();
const { style, getAccountIcon, getAccountIconInfo, getCategoryIcon } = useItemIconBase(props);

const accountIconInfo = computed(() => props.iconType === 'account' ? getAccountIconInfo(props.iconId) : undefined);
const svgStyle = computed<Record<string, string | number | undefined>>(() => ({
    ...style.value,
    '--ebk-item-icon-svg': accountIconInfo.value?.assetUrl ? `url("${accountIconInfo.value.assetUrl}")` : undefined,
    backgroundColor: accountIconInfo.value?.brandColor || style.value['color']
}));

const f7IconValue = computed<string>(() => {
    if (props.iconType === 'fixed-f7') {
        return props.iconId.toString();
    } else {
        return '';
    }
});

const icon = computed<string>(() => {
    if (props.iconType === 'account') {
        return getAccountIcon(props.iconId);
    } else if (props.iconType === 'category') {
        return getCategoryIcon(props.iconId);
    } else if (props.iconType === 'fixed') {
        return props.iconId.toString();
    } else {
        return '';
    }
});
</script>

<style>
.item-icon-svg {
    display: inline-block;
    width: 1em;
    height: 1em;
    vertical-align: middle;
    background-color: currentColor;
    mask: var(--ebk-item-icon-svg) center / contain no-repeat;
    -webkit-mask: var(--ebk-item-icon-svg) center / contain no-repeat;
}
</style>
