import { useToggleStates } from './useToggleStates';

describe('useToggleStates', () => {
    it('should create toggle states for the given keys', () => {
        const { toggleState1, toggleState2 } = useToggleStates(['toggleState1', 'toggleState2']);

        expect(toggleState1).toBeDefined();
        expect(toggleState2).toBeDefined();

        expect(toggleState1.value).toBeDefined();
        expect(toggleState2.value).toBeDefined();
    });

    it('should toggle the state value', () => {
        const { toggleState1, toggleState2 } = useToggleStates(['toggleState1', 'toggleState2']);
        toggleState1.toggle();
        expect(toggleState1.get()).toBe(true);
        expect(toggleState2.get()).toBe(false);
    });
});
