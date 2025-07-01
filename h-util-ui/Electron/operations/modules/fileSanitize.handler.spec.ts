import fileSanitize from './fileSanitize.handler';

const moduleHandler = fileSanitize.handler!;

jest.mock('@common/fileops', () => ({
    getExt: jest.fn((filename: string) => filename.split('.').pop()),
    splitFileNameFromPath: jest.fn((filePath: string) => {
        const split = filePath.split('/');

        if (split.length < 1) throw new Error('Invalid name');

        const fileName = split.pop()!;
        return {
            fileName,
            rootPath: split.join('/'),
        };
    }),
}));
jest.mock('fs/promises', () => ({
    rename: jest.fn(),
    access: jest.fn(),
}));

import * as handlerHelpers from '../handler.helpers';

jest.mock('../handler.helpers', () => {
    const originalModule = jest.requireActual('../handler.helpers');
    return {
        ...originalModule,
        addEventLogForReport: jest.fn(),
    };
});

describe('fileNameSafeTitleReplace', () => {
    const cases = [
        {
            originalFileName: 'Video_笑谈广州话.mp4',
            expectedFileName: 'Video______.mp4',
        },
        {
            originalFileName: "Test's Invalid Junk!.doc",
            expectedFileName: 'Test_s Invalid Junk_.doc',
        },
        {
            originalFileName: 'hello世界.cpp',
            expectedFileName: 'hello__.cpp',
        },
    ];

    it.each(cases)(
        'should rename file with sanitized title: $originalFileName -> $expectedFileName',
        async ({ originalFileName, expectedFileName }) => {
            const result = moduleHandler(
                { filePath: `/path/to/${originalFileName}` },
                {
                    clientOptions: { value: '_' },
                    filePath: `/path/to/${originalFileName}`,
                } as any,
                {},
            );

            await result;

            expect(handlerHelpers.addEventLogForReport).toHaveBeenCalledWith(
                expect.anything(),
                originalFileName,
                'renamed',
                expectedFileName,
            );
        },
    );

    it('should handle name collisions by appending a counter', async () => {
        const { access } = require('fs/promises');

        (handlerHelpers.addEventLogForReport as jest.Mock).mockClear();

        let times = 0;
        // Simulate that the first sanitized name already exists, but the second does not
        access.mockImplementation(
            () =>
                new Promise<boolean>((resolve, reject) => {
                    if (times > 0) return reject(); // File does not exist
                    times++;
                    resolve(true);
                }),
        );

        const originalFileName = 'Test:________File?.txt';
        const expectedFinalName = 'Test_________File_._1.txt';

        await moduleHandler(
            { filePath: `/path/to/${originalFileName}` },
            {
                clientOptions: { value: '_' },
                filePath: `/path/to/${originalFileName}`,
            } as any,
            {},
        );

        expect(handlerHelpers.addEventLogForReport).toHaveBeenCalledWith(
            expect.anything(),
            originalFileName,
            'renamed',
            expectedFinalName,
        );
    });
});
