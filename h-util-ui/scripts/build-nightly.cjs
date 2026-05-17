const { spawnSync } = require('child_process');
const path = require('path');

const { buildChildEnv } = require('./runtime-config.cjs');

const projectDir = path.resolve(__dirname, '..');
const childEnv = buildChildEnv({
    APP_IS_DEV: 'no',
    APP_IS_NIGHTLY: 'yes',
});

const result = spawnSync('npm', ['run', 'app:build'], {
    cwd: projectDir,
    env: childEnv,
    shell: process.platform === 'win32',
    stdio: 'inherit',
});

if (result.status !== 0) {
    process.exit(result.status ?? 1);
}
