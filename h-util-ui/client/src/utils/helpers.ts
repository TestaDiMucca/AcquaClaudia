import { IpcMessageType } from '@shared/common.constants';
import { VueStore } from './store';
import { PageViews } from './types';
import { models } from 'src/data/models';

export { PageViews } from './types';

export const navigateTo = (path: PageViews) => {
    window.location.href = `#${path}`;
};

/**
 * Sometimes structuredClone throws an error, catch and retry with caveman method
 */
export const cloneObject = <T extends object>(obj: T) => {
    try {
        return structuredClone(obj);
    } catch (e) {
        return JSON.parse(JSON.stringify(obj));
    }
};

/** Returns Electron communication channel if available */
export const getIpcRenderer = () => {
    const ipcRenderer = window.electronIpc;

    if (!ipcRenderer) throw new Error('No IPC handler');

    return ipcRenderer;
};

/** Send a string message to Electron main channel for whatever reason */
export const sendMessageToMain = (message: string) => {
    const ipcRenderer = getIpcRenderer();

    if (!ipcRenderer) return;

    ipcRenderer.send(IpcMessageType.clientMessage, [message]);
};

/** Strip Vue stuff to be able to send objects */
export const removeVueRefs = <T>(source: T): T => JSON.parse(JSON.stringify(source));

export const saveUserData = (pipelines: VueStore['pipelines']) => {
    // todo: no need to "bulk" upsert
    Object.values(removeVueRefs(pipelines)).forEach((pipeline) => {
        models.pipeline.upsert(pipeline);
    });
};

export const sortObjects = <T extends Record<string, any>>(list: T[], key: keyof T, ascending: boolean = true): T[] => {
    return [
        ...list.sort((a, b) => {
            if (a[key] < b[key]) {
                return ascending ? -1 : 1;
            }
            if (a[key] > b[key]) {
                return ascending ? 1 : -1;
            }
            return 0;
        }),
    ];
};

export const formatMilliseconds = (ms: number): string => {
    // Calculate hours, minutes, seconds, and milliseconds
    const hours = Math.floor(ms / (1000 * 60 * 60));
    ms %= 1000 * 60 * 60;
    const minutes = Math.floor(ms / (1000 * 60));
    ms %= 1000 * 60;
    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;

    // Format each component to ensure correct number of digits
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');
    const formattedMilliseconds = String(milliseconds).padStart(3, '0');

    // Combine into desired format
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds}`;
};

export const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0B';

    const sizes = ['b', 'kb', 'mb', 'gb', 'tb'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    const value = bytes / Math.pow(1024, i);
    const formattedValue = value.toFixed(i === 0 ? 0 : 1); // No decimals for bytes

    return `${formattedValue} ${sizes[i]}`;
};

export const readTextFileAndParseJson = <T>(file: File): Promise<T> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.readAsText(file);

        reader.onload = (e) => {
            const content = e.target?.result as string;
            const parsed = JSON.parse(content) as T;
            // Needs validation.
            resolve(parsed);
        };

        reader.onerror = (e) => {
            // Error catch/report here
            reject(e);
        };
    });

export const addErrorListeners = () => {
    const ipcRenderer = getIpcRenderer();

    window.onerror = (message, _source, lineno) => {
        ipcRenderer?.invoke(IpcMessageType.errorReport, message);
        console.error('An error occurred:', message, 'at line:', lineno);
    };

    window.onunhandledrejection = (event) => {
        ipcRenderer?.invoke(IpcMessageType.errorReport, event.reason);
        console.error('Unhandled Promise Rejection:', event.reason);
    };
};
