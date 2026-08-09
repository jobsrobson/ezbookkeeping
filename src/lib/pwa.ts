import { readonly, ref } from 'vue';

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const installPrompt = ref<BeforeInstallPromptEvent | null>(null);
const installAvailable = ref(false);

if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', event => {
        event.preventDefault();
        installPrompt.value = event as BeforeInstallPromptEvent;
        installAvailable.value = true;
    });

    window.addEventListener('appinstalled', () => {
        installPrompt.value = null;
        installAvailable.value = false;
    });
}

export const isPwaInstallAvailable = readonly(installAvailable);

export async function installPwa(): Promise<boolean> {
    const prompt = installPrompt.value;

    if (!prompt) {
        return false;
    }

    await prompt.prompt();
    const choice = await prompt.userChoice;

    installPrompt.value = null;
    installAvailable.value = false;

    return choice.outcome === 'accepted';
}
