const FORCE_PROD = false;
const TRUE_PATTERN = /^(1|true|yes|on)$/i;

export const isDev = TRUE_PATTERN.test(process.env.APP_IS_DEV ?? '') && !FORCE_PROD;
export const devServerUrl = `http://${process.env.APP_DEV_SERVER_HOST || '127.0.0.1'}:${process.env.APP_DEV_SERVER_PORT || '3000'}`;
