const APP_ID = 'com.official-h-util-ui.app';
const DEFAULT_DEV_SERVER_HOST = '127.0.0.1';
const DEFAULT_DEV_SERVER_PORT = '3000';
const TRUE_PATTERN = /^(1|true|yes|on)$/i;

function isEnabled(value) {
    return typeof value === 'string' && TRUE_PATTERN.test(value.trim());
}

function getBuildMetadata(env = process.env) {
    return {
        appId: APP_ID,
        productName: isEnabled(env.APP_IS_NIGHTLY) ? 'H-Util UI Nightly' : 'H-Util UI',
    };
}

function getDevServerUrl(env = process.env) {
    const host = env.APP_DEV_SERVER_HOST || DEFAULT_DEV_SERVER_HOST;
    const port = env.APP_DEV_SERVER_PORT || DEFAULT_DEV_SERVER_PORT;

    return `http://${host}:${port}`;
}

function buildChildEnv(overrides = {}, env = process.env) {
    return {
        ...env,
        APP_DEV_SERVER_HOST: overrides.APP_DEV_SERVER_HOST || env.APP_DEV_SERVER_HOST || DEFAULT_DEV_SERVER_HOST,
        APP_DEV_SERVER_PORT: overrides.APP_DEV_SERVER_PORT || env.APP_DEV_SERVER_PORT || DEFAULT_DEV_SERVER_PORT,
        ...overrides,
    };
}

module.exports = {
    APP_ID,
    DEFAULT_DEV_SERVER_HOST,
    DEFAULT_DEV_SERVER_PORT,
    buildChildEnv,
    getBuildMetadata,
    getDevServerUrl,
    isEnabled,
};
