import { getTempName, replaceFile, replaceExtension } from './util';
import * as Tesseract from 'tesseract.js';

const ExifImage = require('exif').ExifImage;
import Jimp = require('jimp');
import { ExifResult } from './types';

export const compressToLevel = async (
    filePath: string,
    quality: number,
    onProgress: (label: string, progress: number) => void,
) => {
    onProgress('reading image', 10);
    const img = await Jimp.read(filePath);

    img.quality(quality);

    onProgress('writing new image', 50);
    const newFile = getTempName(replaceExtension(filePath, 'jpg'));
    await img.writeAsync(newFile);

    onProgress('replacing image', 90);
    await replaceFile(filePath, newFile);

    onProgress('done', 100);
};

/**
 * Turn two colons in a date to dashes. This makes it parseable for Date()
 * @param date A date in format such as "2017:07:14 00:00:00" as returned by EXIF
 */
export const exifToJsDate = (date: string) => {
    let n = 0;
    const N = 1;
    return date.replace(/:/g, (match) => (n++ <= N ? '-' : match)).replace(' ', ':');
};

/** Extract Exif data from an image given a path. */
export const getExif = (image: string): Promise<Date | null> =>
    new Promise((resolve) => {
        new ExifImage({ image }, (err: Error, exif: ExifResult) => {
            if (err) resolve(null);

            const originalDate = exif?.exif?.DateTimeOriginal;
            const converted = originalDate ? exifToJsDate(originalDate) : null;

            resolve(originalDate && converted ? new Date(converted) : null);
        });
    });

export const extractText = async (filePath: string): Promise<Tesseract.RecognizeResult> =>
    Tesseract.recognize(filePath, 'eng');

export const searchForTextInImage = async (filePath: string, matches: string[]) => {
    const extracted = await extractText(filePath);

    const text = extracted.data.text ?? '';

    const escapedTerms = matches.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(escapedTerms.join('|'), 'i');

    return pattern.test(text);
};
