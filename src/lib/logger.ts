import { isEnableDebug } from './settings.ts';

function logDebug(msg: string, obj?: unknown): void {
    if (isEnableDebug()) {
        if (obj) {
            console.debug('[Bookkeeping Debug] ' + msg, obj);
        } else {
            console.debug('[Bookkeeping Debug] ' + msg);
        }
    }
}

function logInfo(msg: string, obj?: unknown): void {
    if (obj) {
        console.info('[Bookkeeping Info] ' + msg, obj);
    } else {
        console.info('[Bookkeeping Info] ' + msg);
    }
}

function logWarn(msg: string, obj?: unknown): void {
    if (obj) {
        console.warn('[Bookkeeping Warn] ' + msg, obj);
    } else {
        console.warn('[Bookkeeping Warn] ' + msg);
    }
}

function logError(msg: string, obj?: unknown): void {
    if (obj) {
        console.error('[Bookkeeping Error] ' + msg, obj);
    } else {
        console.error('[Bookkeeping Error] ' + msg);
    }
}

export default {
    debug: logDebug,
    info: logInfo,
    warn: logWarn,
    error: logError
};
