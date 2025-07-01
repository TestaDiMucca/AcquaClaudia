import {
    checkSupportedExt,
    ffMeta,
    getTempName,
    parseStringToTags,
    removeExt,
    replaceFile,
    splitFileNameFromPath,
    withUTimes,
} from '@common/fileops';
import { ModuleHandler } from '@util/types';
import { addEventLogForReport } from '../handler.helpers';
import { fileNameSafeTitleReplace } from './nameTag.helpers';

type TagReturnType = {
    streams: unknown[];
    format: {
        tags: {
            title?: string;
            artist?: string;
            album?: string;
        };
    };
};

const nameTagHandler: ModuleHandler = {
    handler: async ({ filePath }, opts) => {
        const pattern = '%artist% - %title%';

        const { fileName } = splitFileNameFromPath(filePath);

        if (!fileName) return;

        /** Parsed from filename */
        const parsedTags = parseStringToTags(pattern, removeExt(fileName));

        if (!parsedTags) return;

        await withUTimes(async () => {
            const readTags = (await ffMeta.readTags(filePath)) as TagReturnType;
            const existingTitle = readTags.format?.tags?.title || '';
            const unSafeTitleForTag = fileNameSafeTitleReplace(parsedTags.title, existingTitle);
            parsedTags.title = unSafeTitleForTag;

            await ffMeta.writeTags(filePath, { ...parsedTags });
            await replaceFile(filePath, getTempName(filePath));
        }, filePath);

        addEventLogForReport(opts, fileName, 'tagged', JSON.stringify(parsedTags));
    },
    filter: (filePath) => checkSupportedExt(filePath, ['mov'], true),
};

export default nameTagHandler;
