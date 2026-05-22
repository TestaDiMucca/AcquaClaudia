describe('binaryPathResolver', () => {
    const loadResolver = () => require('./binaryPathResolver') as typeof import('./binaryPathResolver');

    test('repairs execute permissions on an existing binary', () => {
        const chmodSync = jest.fn();
        const binaryPath = '/tmp/node_modules/@ffprobe-installer/darwin-arm64/ffprobe';
        const { resolveBinaryPath } = loadResolver();

        const result = resolveBinaryPath(
            {
                candidateLoaders: [() => binaryPath],
                fallbackCommand: 'ffprobe',
            },
            {
                existsSync: (candidate: string) => candidate === binaryPath,
                statSync: () => ({ mode: 0o644 }),
                chmodSync,
            },
        );

        expect(result).toBe(binaryPath);
        expect(chmodSync).toHaveBeenCalledWith(binaryPath, 0o755);
    });

    test('falls back to a later candidate when the first binary is missing', () => {
        const localBinary = '/app/node_modules/ffmpeg-static/ffmpeg';
        const workspaceBinary = '/repo/node_modules/ffmpeg-static/ffmpeg';
        const { resolveBinaryPath } = loadResolver();

        const result = resolveBinaryPath(
            {
                candidateLoaders: [() => localBinary, () => workspaceBinary],
                fallbackCommand: 'ffmpeg',
            },
            {
                existsSync: (candidate: string) => candidate === workspaceBinary,
                statSync: () => ({ mode: 0o755 }),
                chmodSync: jest.fn(),
            },
        );

        expect(result).toBe(workspaceBinary);
    });

    test('rewrites packaged app paths to app.asar.unpacked', () => {
        const packagedBinary = '/Applications/H-Util UI.app/Contents/Resources/app.asar/node_modules/ffmpeg-static/ffmpeg';
        const unpackedBinary = '/Applications/H-Util UI.app/Contents/Resources/app.asar.unpacked/node_modules/ffmpeg-static/ffmpeg';
        const { resolveBinaryPath } = loadResolver();

        const result = resolveBinaryPath(
            {
                candidateLoaders: [() => packagedBinary],
                fallbackCommand: 'ffmpeg',
            },
            {
                existsSync: (candidate: string) => candidate === unpackedBinary,
                statSync: () => ({ mode: 0o755 }),
                chmodSync: jest.fn(),
            },
        );

        expect(result).toBe(unpackedBinary);
    });

    test('returns the command name when no managed binary exists', () => {
        const { resolveBinaryPath } = loadResolver();

        const result = resolveBinaryPath(
            {
                candidateLoaders: [() => undefined],
                fallbackCommand: 'ffprobe',
            },
            {
                existsSync: () => false,
                statSync: () => ({ mode: 0o755 }),
                chmodSync: jest.fn(),
            },
        );

        expect(result).toBe('ffprobe');
    });

    test('searches ancestor directories so workspace binaries can be found deterministically', () => {
        const { getModuleSearchRoots } = loadResolver();

        const result = getModuleSearchRoots('/repo/h-util-ui/dist/Electron/packages/fileops');

        expect(result).toEqual(
            expect.arrayContaining([
                '/repo/h-util-ui/dist/Electron/packages/fileops',
                '/repo/h-util-ui/dist/Electron/packages',
                '/repo/h-util-ui/dist/Electron',
                '/repo/h-util-ui/dist',
                '/repo/h-util-ui',
                '/repo',
            ]),
        );
    });
});
