import { ref, Ref } from 'vue';

export function useToggle(initialValue = false): [Ref<boolean>, () => void, (value: boolean) => void] {
    const state = ref<boolean>(initialValue);
    const toggle = () => {
        state.value = !state.value;
    };

    const set = (value: boolean) => {
        state.value = value;
    };

    return [state, toggle, set];
}
