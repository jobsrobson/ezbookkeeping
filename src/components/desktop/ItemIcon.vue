<template>
    <span class="item-icon item-icon-svg" :style="svgStyle" v-if="!hiddenStatus && accountIconInfo?.assetUrl">
        <slot></slot>
    </span>
    <i class="item-icon" :class="classes" :style="style" v-else-if="!hiddenStatus">
        <slot></slot>
    </i>
    <v-badge class="right-bottom-icon" color="secondary" offset-y="4"
             :location="`bottom ${textDirection === TextDirection.LTR ? 'right' : 'left'}`"
             :icon="mdiEyeOffOutline" v-if="hiddenStatus">
        <span class="item-icon item-icon-svg" :style="svgStyle" v-if="accountIconInfo?.assetUrl">
            <slot></slot>
        </span>
        <i class="item-icon" :class="classes" :style="style" v-else>
            <slot></slot>
        </i>
    </v-badge>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { type CommonIconProps, useItemIconBase } from '@/components/base/ItemIconBase.ts';

import { useI18n } from '@/locales/helpers.ts';

import { TextDirection } from '@/core/text.ts';

import {
    mdiEyeOffOutline
} from '@mdi/js';

interface DesktopItemIconProps extends CommonIconProps {
    class?: string;
    hiddenStatus?: boolean;
}

const props = defineProps<DesktopItemIconProps>();

const { getCurrentLanguageTextDirection } = useI18n();
const { style, getAccountIcon, getAccountIconInfo, getCategoryIcon } = useItemIconBase(props);

const textDirection = computed<TextDirection>(() => getCurrentLanguageTextDirection());
const accountIconInfo = computed(() => props.iconType === 'account' ? getAccountIconInfo(props.iconId) : undefined);
const svgStyle = computed<Record<string, string | number | undefined>>(() => ({
    ...style.value,
    '--ebk-item-icon-svg': accountIconInfo.value?.assetUrl ? `url("${accountIconInfo.value.assetUrl}")` : undefined,
    backgroundColor: accountIconInfo.value?.brandColor || style.value['color']
}));

const classes = computed<string>(() => {
    let allClasses = props.class ? (props.class + ' ') : '';

    if (props.iconType === 'account') {
        allClasses += getAccountIcon(props.iconId);
    } else if (props.iconType === 'category') {
        allClasses += getCategoryIcon(props.iconId);
    } else if (props.iconType === 'fixed') {
        allClasses += props.iconId;
    }

    return allClasses;
});
</script>

<style>
.item-icon {
    font-size: var(--ebk-icon-font-size);
    display: inline-block;
    vertical-align: middle;
    background-size: 100% auto;
    background-position: center;
    background-repeat: no-repeat;
    font-style: normal;
    position: relative;
}

.item-icon-svg {
    width: 1em;
    height: 1em;
    background-color: currentColor;
    mask: var(--ebk-item-icon-svg) center / contain no-repeat;
    -webkit-mask: var(--ebk-item-icon-svg) center / contain no-repeat;
}
</style>
