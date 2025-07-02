/** Manually added to prevent ts error */
declare module 'vue-material-design-icons/*.vue' {
    import type { DefineComponent } from 'vue';

    const IconVue: DefineComponent<{
        /** `size` defaults to 24 */
        size?: number;
        /** `fillColor` defaults to 'currentColor' */
        fillColor?: string;
        title?: string;
    }>;
    export default IconVue;
}

type SelectItem = {
    label: string;
    value: string;
};

/**
 * Template types actually have types, we can't import them here.
 */
type IpcRendererExposed = {
    send: <T>(channel: string, data: T[]) => void;
    invoke: <T, R = void>(channel: string, data?: T) => Promise<R>;
    on: <T>(channel: string, cb: (event: unknown, message: T) => void) => void;
    onMainMessage: (cb: (msg: string) => void) => void;
    onTaskProgress: (cb: (task: string) => void) => void;
    onStatUpdate: <T>(cb: (payload: T) => void) => void;
    onRendererMessage: <T>(cb: (payload: T) => void) => void;
    loadData: <T>() => Promise<T>;
    saveFile: (content: string) => Promise<void>;
    saveData: (data: string[]) => Promise<void>;
    selectFolder: () => Promise<string>;
};

interface Window {
    electronIpc?: IpcRendererExposed;
}
