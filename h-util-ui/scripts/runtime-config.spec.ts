const runtimeConfig = require('./runtime-config.cjs');

describe('runtime-config', () => {
    describe('isEnabled', () => {
        test('treats common truthy values as enabled', () => {
            expect(runtimeConfig.isEnabled('1')).toBe(true);
            expect(runtimeConfig.isEnabled('true')).toBe(true);
            expect(runtimeConfig.isEnabled('YES')).toBe(true);
            expect(runtimeConfig.isEnabled('on')).toBe(true);
        });

        test('treats unset and other values as disabled', () => {
            expect(runtimeConfig.isEnabled(undefined)).toBe(false);
            expect(runtimeConfig.isEnabled('0')).toBe(false);
            expect(runtimeConfig.isEnabled('false')).toBe(false);
            expect(runtimeConfig.isEnabled('nightly')).toBe(false);
        });
    });

    describe('getBuildMetadata', () => {
        test('uses the stable production identity by default', () => {
            expect(runtimeConfig.getBuildMetadata({})).toEqual({
                appId: 'com.official-h-util-ui.app',
                productName: 'H-Util UI',
            });
        });

        test('switches product name for nightly builds without changing app id', () => {
            expect(runtimeConfig.getBuildMetadata({ APP_IS_NIGHTLY: 'yes' })).toEqual({
                appId: 'com.official-h-util-ui.app',
                productName: 'H-Util UI Nightly',
            });
        });
    });

    describe('getDevServerUrl', () => {
        test('defaults to an explicit IPv4 localhost url', () => {
            expect(runtimeConfig.getDevServerUrl({})).toBe('http://127.0.0.1:3000');
        });

        test('uses overridden host and port values when provided', () => {
            expect(
                runtimeConfig.getDevServerUrl({
                    APP_DEV_SERVER_HOST: '0.0.0.0',
                    APP_DEV_SERVER_PORT: '4173',
                }),
            ).toBe('http://0.0.0.0:4173');
        });
    });
});
