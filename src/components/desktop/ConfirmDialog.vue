<template>
    <v-dialog
        v-model="showState"
        class="confirm-dialog"
        persistent
        min-width="320"
        max-width="460"
        width="auto"
    >
        <v-card class="confirm-dialog__card">


            <div
                v-if="textContent"
                class="confirm-dialog__content"
            >
                <p>
                    {{ textContent }}
                </p>
            </div>

            <footer class="confirm-dialog__actions">
                <v-btn
                    class="confirm-dialog__cancel"
                    color="secondary"
                    variant="flat"
                    @click="cancel"
                >
                    {{ tt('Cancel') }}
                </v-btn>

                <v-btn
                    class="confirm-dialog__confirm"
                    :color="finalColor"
                    variant="flat"
                    @click="confirm"
                >
                    {{ tt('OK') }}
                </v-btn>
            </footer>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';


import { useI18n } from '@/locales/helpers.ts';

import {
    isString,
    isObject
} from '@/lib/common.ts';

const props = defineProps<{
    show?: boolean;
    color?: string;
    title?: string;
    text?: string;
}>();

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void;
}>();

const { tt } = useI18n();

const showState = ref<boolean>(false);

const titleContent = ref<string>(
    props.title || tt('global.app.title')
);

const textContent = ref<string>(
    props.text || ''
);

const finalColor = ref<string>(
    props.color || 'primary'
);

let resolveFunc:
    | ((value?: unknown) => void)
    | null = null;

let rejectFunc:
    | ((reason?: unknown) => void)
    | null = null;

function open(
    titleOrText: string,
    textOrOptions?:
        | string
        | Record<string, unknown>,
    options?: Record<string, unknown>
): Promise<unknown> {
    showState.value = true;

    /*
     * Reinicia a cor em cada abertura.
     *
     * Sem isso, um diálogo aberto anteriormente com color="error"
     * poderia fazer o próximo diálogo continuar vermelho.
     */
    finalColor.value = props.color || 'primary';

    if (
        !textOrOptions ||
        isObject(textOrOptions)
    ) {
        titleContent.value = tt('global.app.title');

        if (!textOrOptions) {
            textContent.value = tt(titleOrText);
        } else {
            const actualOptions =
                textOrOptions as Record<string, unknown>;

            textContent.value = tt(
                titleOrText,
                actualOptions
            );
        }
    } else if (isString(textOrOptions)) {
        if (!options) {
            titleContent.value = tt(titleOrText);
            textContent.value = tt(textOrOptions);
        } else {
            titleContent.value = tt(
                titleOrText,
                options
            );

            textContent.value = tt(
                textOrOptions,
                options
            );
        }
    }

    if (
        textOrOptions &&
        isObject(textOrOptions) &&
        isString(textOrOptions['color'])
    ) {
        finalColor.value =
            (textOrOptions['color'] as string) ||
            'primary';
    } else if (
        options &&
        isString(options['color'])
    ) {
        finalColor.value =
            (options['color'] as string) ||
            'primary';
    }

    return new Promise((resolve, reject) => {
        resolveFunc = resolve;
        rejectFunc = reject;
    });
}

function confirm(): void {
    resolveFunc?.();

    resolveFunc = null;
    rejectFunc = null;

    showState.value = false;

    emit('update:show', false);
}

function cancel(): void {
    rejectFunc?.();

    resolveFunc = null;
    rejectFunc = null;

    showState.value = false;

    emit('update:show', false);
}

watch(
    () => props.show,
    newValue => {
        if (typeof newValue === 'boolean') {
            showState.value = newValue;
        }
    },
    {
        immediate: true
    }
);

watch(showState, newValue => {
    emit('update:show', newValue);
});

defineExpose({
    open
});
</script>

<style>
.confirm-dialog .v-overlay__content {
    margin: 12px !important;
}

.confirm-dialog__card {
    overflow: hidden;

    border: 1px solid
        rgb(var(--v-theme-muted-border)) !important;
    border-radius: 10px !important;

    color: rgb(var(--v-theme-on-surface));
    background:
        rgb(var(--v-theme-surface)) !important;

    box-shadow: none !important;

    font-family:
        "Lausanne",
        "Helvetica Neue",
        Arial,
        sans-serif;
}

/* Header */

.confirm-dialog__header {
    display: flex;
    align-items: flex-start;
    gap: 12px;

    padding: 20px 22px 16px;

    border-bottom: 1px solid
        rgb(var(--v-theme-muted-border));

    background:
        rgb(var(--v-theme-surface));
}

.confirm-dialog__icon {
    display: grid;
    width: 34px;
    min-width: 34px;
    height: 34px;
    place-items: center;

    border: 1px solid
        rgb(var(--v-theme-muted-border));
    border-radius: 50%;

    color: rgb(var(--v-theme-on-surface));
    background:
        rgb(var(--v-theme-secondary));
}

.confirm-dialog__heading {
    min-width: 0;
}

.confirm-dialog__eyebrow {
    display: block;

    margin-bottom: 5px;

    color: rgb(var(--v-theme-tertiary));

    font-size: 0.62rem;
    font-weight: 600;
    letter-spacing: 0.07em;
    line-height: 1;
    text-transform: uppercase;
}

.confirm-dialog__heading h2 {
    margin: 0;

    color: rgb(var(--v-theme-on-surface));

    font-size: 1.15rem;
    font-weight: 500;
    letter-spacing: -0.035em;
    line-height: 1.2;
}

/* Content */

.confirm-dialog__content {
    padding: 22px 22px 22px;

    background:
        rgb(var(--v-theme-background));
}

.confirm-dialog__content p {
    margin: 0;

    color: rgb(var(--v-theme-tertiary));

    font-size: 1rem;
    line-height: 1.55;
}

/* Actions */

.confirm-dialog__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;

    padding: 12px 12px;

    border-top: 0px solid
        rgb(var(--v-theme-muted-border));

    background:
        rgb(var(--v-theme-background));
}

.confirm-dialog__actions .v-btn {
    font-size: 0.82rem !important;
    font-weight: 600 !important;
    letter-spacing: 0 !important;
}

.confirm-dialog__cancel {
    border: 0px solid
        rgb(var(--v-theme-border)) !important;

    color:
        rgb(var(--v-theme-on-secondary)) !important;
    background:
        rgb(var(--v-theme-secondary)) !important;
}

.confirm-dialog__cancel:hover {
    border-color:
        rgb(var(--v-theme-on-hover-border)) !important;

    background:
        rgb(
            var(--v-theme-secondary-darken-1)
        ) !important;
}

.confirm-dialog__confirm {
    color:
        rgb(var(--v-theme-on-primary)) !important;

    box-shadow: none !important;
}

.confirm-dialog__confirm:hover {
    background:
        rgb(
            var(--v-theme-primary-darken-1)
        ) !important;
}

.confirm-dialog__actions
    .v-btn
    .v-btn__overlay,
.confirm-dialog__actions
    .v-btn
    .v-btn__underlay {
    opacity: 0 !important;
}

/* Scrim local */

.confirm-dialog
    .v-overlay__scrim {
    background:
        rgb(
            var(--v-theme-on-background)
        ) !important;

    opacity: 0.38 !important;
}

/* Mobile */

@media (max-width: 600px) {
    .confirm-dialog .v-overlay__content {
        width: calc(100vw - 24px) !important;
        max-width: calc(100vw - 24px) !important;
    }

    .confirm-dialog__header {
        padding: 17px 18px 14px;
    }

    .confirm-dialog__content {
        padding: 16px 18px 18px;
    }

    .confirm-dialog__actions {
        display: grid;
        grid-template-columns:
            repeat(2, minmax(0, 1fr));

        padding: 11px 18px;
    }

    .confirm-dialog__actions .v-btn {
        width: 100%;
    }
}
</style>