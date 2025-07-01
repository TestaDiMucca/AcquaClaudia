import path from 'path';
import fs from 'fs/promises';

import { parseNumber } from '@common/common';
import { checkSupportedExt, extractText, splitFileNameFromPath, formatDateString } from '@common/fileops';
import { addStat } from '@util/ipc';
import { ModuleHandler } from '@util/types';
import { addEventLogForReport } from '../handler.helpers';

const DEFAULT_THRESHOLD = 20;
const DEFAULT_OUTPUT_FILETYPE = 'md';
const CONFIDENCE_THRESHOLD = 0.7;

const imageToTextHandler: ModuleHandler = {
    handler: async (fileWithMeta, opts) => {
        const result = await extractText(fileWithMeta.filePath);
        const wordsWithHighConfidence = result?.data.words.filter((w) => w.confidence > CONFIDENCE_THRESHOLD) ?? [];

        const wordsParsed = wordsWithHighConfidence.length;
        const { fileName } = splitFileNameFromPath(fileWithMeta.filePath);

        if (opts.context?.pipelineId) {
            addStat({
                pipelineUuid: opts.context.pipelineId,
                stats: [
                    {
                        stat: 'words_parsed',
                        amount: wordsParsed,
                    },
                ],
            });
        }

        const threshold = parseNumber(String(opts.clientOptions?.value ?? 'null')) ?? DEFAULT_THRESHOLD;

        if (wordsParsed === 0 || wordsParsed < threshold) {
            addEventLogForReport(opts, fileName, 'ocr skipped on threshold');
            return;
        }

        const outputName = String(opts.clientOptions?.output || 'I2TOutput_%date%').replace(
            '%date%',
            formatDateString(new Date(), 'yy-mm-dd') ?? String(Date.now()),
        );

        addEventLogForReport(opts, fileName, 'ocr parsed');

        const outputPath = path.join(path.dirname(fileWithMeta.filePath), outputName + '.' + DEFAULT_OUTPUT_FILETYPE);

        const header = `## File: ${fileName}\n\n`;
        const content = header + wordsWithHighConfidence.map((w) => w.text).join(' ') + '\n';

        try {
            await fs.appendFile(outputPath, content, { flag: 'a' });
        } catch (err) {
            const parsedFileHeader = `# ${outputName}\n\n`;
            await fs.writeFile(outputPath, parsedFileHeader + content);
        }
    },
    filter: (fileName) => checkSupportedExt(fileName, ['img'], true),
};

export default imageToTextHandler;
