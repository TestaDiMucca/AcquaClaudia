const { spawnSync } = require('child_process');
const path = require('path');

const { buildChildEnv } = require('./runtime-config.cjs');

const projectDir = path.resolve(__dirname, '..');
const childEnv = buildChildEnv({
    APP_IS_DEV: 'yes',
    APP_IS_NIGHTLY: 'yes',
});

function run(command, args) {
    const result = spawnSync(command, args, {
        cwd: projectDir,
        env: childEnv,
        shell: process.platform === 'win32',
        stdio: 'inherit',
    });

    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

run('npm', ['run', 'build:electron']);
run('npm', ['exec', '--', 'wait-on', 'tcp:3000']);
run('npm', ['exec', '--', 'electron', '--inspect=9229', '.']);
