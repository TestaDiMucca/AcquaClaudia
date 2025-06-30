import path from 'path';
import { readdir, stat } from 'fs/promises';
import { promises } from '@common/common';
import { AqueductMessage } from '@shared/common.types';
import { runPipelineForFiles } from './handler';
import { sendRendererMessage } from '@util/ipc';

const IGNORE_FILES = new Set(['.DS_Store', 'Thumbs.db', 'desktop.ini']);

export const handleAqueductMessage = async (message: AqueductMessage) => {
    switch (message.type) {
        case 'load':
            /** @deprecated */
            return;
        case 'run':
            const { aqueduct } = message;

            const response = await sendRendererMessage({
                type: 'requestPipeline',
                pipelineUuid: aqueduct.pipelineId,
            });

            const pipeline = response.type === 'pipelineData' ? response.pipeline : null;

            if (!pipeline) return;
            const directories: string[] = aqueduct.directories;

            await promises.each(directories, async (directory) => {
                try {
                    const dirContents = await readdir(directory);
                    const filePaths = await Promise.all(
                        dirContents.map(async (file) => {
                            // Ignore files that are in the ignore list or AppleDouble files
                            if (IGNORE_FILES.has(file) || file.startsWith('._')) {
                                return null;
                            }

                            const fullPath = path.join(directory, file);
                            const stats = await stat(fullPath);
                            return stats.isFile() ? fullPath : null;
                        }),
                    );

                    await runPipelineForFiles({
                        pipeline,
                        filePaths: filePaths.filter((path): path is string => path !== null),
                    });
                } catch (e) {
                    console.error(e);
                }
            });
            break;
        case 'delete':
            /** @deprecated */
            break;
        case 'save':
            /** @deprecated */
            break;
        default:
    }
};
