import fs from 'fs/promises';

import { splitFileNameFromPath } from '@common/fileops';
import { ModuleHandler } from '@util/types';
import { addEventLogForReport } from '../handler.helpers';
import { ProcessingError } from '@util/errors';

const deleteHandler: ModuleHandler = {
    handler: async (fileWithMeta, opts) => {
        const { fileName } = splitFileNameFromPath(fileWithMeta.filePath);

        try {
            await fs.unlink(fileWithMeta.filePath);
            fileWithMeta.remove = true;
            addEventLogForReport(opts, fileName, 'deleted');
        } catch (err: any) {
            if (err.code === 'ENOENT') {
                console.warn(`File ${fileName} does not exist, skipping deletion.`);
            } else {
                throw new ProcessingError(`Failed to delete file ${fileName}: ${err.message}`);
            }
        }
    },
};

export default deleteHandler;
