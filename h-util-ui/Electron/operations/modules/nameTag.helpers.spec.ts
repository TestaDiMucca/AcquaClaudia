import { fileNameSafeTitleReplace } from './nameTag.helpers';
import { parseStringToTags } from '@common/fileops';

describe('fileNameSafeTitleReplace', () => {
    const cases = [
        {
            desc: 'returns original filename if fileSafeTitle equals metadataTitle',
            filename: 'my_file.txt',
            metadataTitle: 'my_file.txt',
            expected: 'my_file.txt',
        },
        {
            desc: 'returns original filename if fileSafeFilename does not include fileSafeTitle',
            filename: 'abc_def.txt',
            metadataTitle: 'xyz',
            expected: 'abc_def.txt',
        },
        {
            desc: 'replaces fileSafeTitle in filename with metadataTitle',
            filename: 'my_title_file.txt',
            metadataTitle: 'title',
            expected: 'my_title_file.txt'.replace('title', 'title'),
        },
        {
            desc: 'replaces fileSafeTitle in filename with metadataTitle (with spaces)',
            filename: 'my_title_file.txt',
            metadataTitle: 'title',
            expected: 'my_title_file.txt'.replace('title', 'title'),
        },
        {
            desc: 'returns original filename if fileSafeTitle not found in fileSafeFilename',
            filename: 'my_file.txt',
            metadataTitle: 'notfound',
            expected: 'my_file.txt',
        },
        {
            desc: 'handles empty filename and metadataTitle',
            filename: '',
            metadataTitle: '',
            expected: '',
        },
    ];

    it.each(cases)('normal case: $desc', ({ filename, metadataTitle, expected }) => {
        const result = fileNameSafeTitleReplace(filename, metadataTitle);
        expect(result).toBe(expected);
    });

    // Bug cases from real world usage
    const bugCases = [
        {
            filename: 'How Short Is Japan’s Shortest Railway_ - 2026.txt',
            metadataTitle: 'How Short Is Japan’s Shortest Railway?',
            expected: 'How Short Is Japan’s Shortest Railway? - 2026.txt',
        },
        {
            filename: 'What’s Life Like in Hong Kong in 2024_ _ Street Interview - 2024.txt',
            metadataTitle: 'What’s Life Like in Hong Kong in 2024? | Street Interview',
            expected: 'What’s Life Like in Hong Kong in 2024? | Street Interview - 2024.txt',
        },
        {
            filename: 'China’s Strangest Mountain_ 3m Wide Like a Wall, Cliff Edge Thrill! - 2025-04-12.txt',
            metadataTitle: 'China’s Strangest Mountain? 3m Wide Like a Wall, Cliff Edge Thrill!',
            expected: 'China’s Strangest Mountain? 3m Wide Like a Wall, Cliff Edge Thrill! - 2025-04-12.txt',
        },
        {
            filename: '___________ — ____ ___ - 2017-10-03.txt',
            metadataTitle: '【笑谈广州话】粤语拼音 — 九声六调 第二集',
            expected: '【笑谈广州话】粤语拼音 — 九声六调 第二集 - 2017-10-03.txt',
        },
    ];

    it.each(bugCases)('bug case: $expected', ({ filename, metadataTitle, expected }) => {
        const result = fileNameSafeTitleReplace(filename, metadataTitle);
        expect(result).toBe(expected);
    });
});

describe('parseStringToTags', () => {
    const pattern = '%artist% - %title%';

    const cases = [
        {
            input: 'Insomnium - While We Sleep',
            expected: { artist: 'Insomnium', title: 'While We Sleep' },
        },
        {
            input: "Insomnium - Winter's Gate - pt. 2 - 2022-09-11",
            expected: {
                artist: 'Insomnium',
                title: "Winter's Gate - pt. 2 - 2022-09-11",
            },
        },
    ];

    it.each(cases)('should parse %input to tags correctly', ({ input, expected }) => {
        const result = parseStringToTags(pattern, input);
        expect(result).toEqual(expected);
    });
});
