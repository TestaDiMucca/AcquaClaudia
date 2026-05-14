const { getBuildMetadata } = require('./scripts/runtime-config.cjs');

const { appId, productName } = getBuildMetadata();

module.exports = {
    appId,
    productName,
    copyright: 'Copyright © TdM',
    mac: {
        category: 'public.app-category.utilities',
        extendInfo: {
            NSDocumentsFolderUsageDescription:
                'H-Util UI needs access to Documents to read and update files you select.',
            NSDownloadsFolderUsageDescription:
                'H-Util UI needs access to Downloads to read and update files you select.',
            NSDesktopFolderUsageDescription:
                'H-Util UI needs access to Desktop to read and update files you select.',
            NSRemovableVolumesUsageDescription:
                'H-Util UI needs access to external drives to read and update files you select.',
            NSNetworkVolumesUsageDescription:
                'H-Util UI needs access to network volumes to read and update files you select.',
        },
    },
    publish: [
        {
            provider: 'github',
            owner: 'TdM-JunkWare',
        },
    ],
    nsis: {
        oneClick: true,
        allowToChangeInstallationDirectory: false,
        deleteAppDataOnUninstall: true,
    },
    files: ['dist/**/*'],
    asarUnpack: [
        'node_modules/ffmpeg-static/ffmpeg*',
        'node_modules/ffmpeg-static/bin/${os}/${arch}/ffmpeg*',
        'node_modules/@ffprobe-installer/*/ffprobe*',
    ],
    extraResources: ['defaults/**/*'],
    directories: {
        buildResources: 'assets',
        output: 'dist_electron',
    },
};
