import { ref, Ref } from 'vue';

type ToggleState = {
    get: () => boolean;
    value: Ref<boolean>;
    set: (value: boolean) => void;
    toggle: () => void;
};

export function useToggleStates<T extends string>(keys: T[]) {
    const states = keys.reduce<Record<T, Ref<boolean>>>(
        (acc, key) => {
            acc[key] = ref(false);
            return acc;
        },
        {} as Record<T, Ref<boolean>>,
    );

    const toggles = keys.reduce<Record<T, ToggleState>>(
        (acc, key) => {
            acc[key] = {
                value: states[key],
                get: () => states[key].value ?? false,
                set: (value: boolean) => {
                    states[key].value = value;
                },
                toggle: () => {
                    states[key].value = !states[key].value;
                },
            };
            return acc;
        },
        {} as Record<T, ToggleState>,
    );

    return toggles;
}
