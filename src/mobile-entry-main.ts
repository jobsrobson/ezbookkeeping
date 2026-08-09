import { DEDICATED_MOBILE_VERSION_ENABLED } from '@/consts/platform.ts';
import { getDesktopVersionPath } from '@/lib/version.ts';

if (DEDICATED_MOBILE_VERSION_ENABLED) {
    import('./mobile-main.ts');
} else {
    window.location.replace(getDesktopVersionPath());
}
