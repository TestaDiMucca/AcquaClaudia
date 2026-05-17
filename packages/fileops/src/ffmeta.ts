import * as ffmpeg from 'fluent-ffmpeg';
import { getTempName } from '.';
import { detachPromise } from '@common/common';
import { unlink } from 'fs/promises';
import { createModuleBinaryLoader, resolveBinaryPath } from './binaryPathResolver';
const ffmpegCaller = require('fluent-ffmpeg');

const ffprobePath = resolveBinaryPath({
    candidateLoaders: [createModuleBinaryLoader('@ffprobe-installer/ffprobe', (loadedModule) => loadedModule?.path)],
    fallbackCommand: 'ffprobe',
});
ffmpeg.setFfprobePath(ffprobePath);

const ffmpegPath = resolveBinaryPath({
    candidateLoaders: [createModuleBinaryLoader('ffmpeg-static', (loadedModule) => loadedModule)],
    fallbackCommand: 'ffmpeg',
});
ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Get hash of existing metadata in a media obj
 */
export const readTags = async (filePath: string): Promise<null | any> =>
    new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err: Error, meta: any) => (err ? reject(err) : resolve(meta)));
    });

/**
 * Write a record of tags into a file
 */
export const writeTags = async (
    filePath: string,
    tags: Record<string, string | number>,
    onProgress?: (p: number) => void,
    destroyTempOnError = true
): Promise<void> =>
    new Promise((resolve, reject) => {
        const meta: string[] = [];

        const tagNames = Object.keys(tags);

        tagNames.forEach((tagName) => {
            meta.push('-metadata');
            meta.push(`${tagName}=${tags[tagName]}`);
        });

        let totalTime: number;

        ffmpegCaller(filePath)
            .outputOptions(...meta)
            .audioCodec('copy')
            .videoCodec('copy')
            .output(getTempName(filePath))
            .on('codecData', (data: any) => {
                totalTime = parseInt(data.duration.replace(/:/g, ''));
            })
            .on('start', () => onProgress?.(0))
            .on('end', resolve)
            .on('progress', (p: FfmpegProgress) => {
                if (!totalTime || totalTime <= 0) return;

                const time = parseInt(p.timemark.replace(/:/g, ''));
                onProgress?.((time / totalTime) * 100);
            })
            .on('error', (e: Error) => {
                console.error(e);
                if (destroyTempOnError) detachPromise({ cb: () => unlink(getTempName(filePath)) });
                reject(e);
            })
            .run();
    });

export const compressVideo = async (
    filePath: string,
    crf: number,
    onProgress?: (p: number) => void,
    destroyTempOnError = true
) =>
    new Promise((resolve, reject) => {
        if (crf <= 0 || crf >= 51) throw new Error(`${crf} is invalid for CRF`);

        let totalTime: number;

        ffmpegCaller(filePath)
            .fps(30)
            .addOptions([`-crf ${crf}`])
            .output(getTempName(filePath))
            .on('end', resolve)
            .on('codecData', (data: any) => {
                totalTime = parseInt(data.duration.replace(/:/g, ''));
            })
            .on('progress', (p: FfmpegProgress) => {
                if (!totalTime || totalTime <= 0) return;

                const time = parseInt(p.timemark.replace(/:/g, ''));
                onProgress?.((time / totalTime) * 100);
            })
            .on('error', (e: Error) => {
                console.error(e);
                if (destroyTempOnError) detachPromise({ cb: () => unlink(getTempName(filePath)) });
                reject(e);
            })
            .run();
    });

type CallFfmpegArgs = {
    filePath: string;
    outputFilePath: string;
    onProgress?: (p: number) => void;
    destroyTempOnError?: boolean;
    // TODO
    options?: any;
};

/**
 * Meant to be a more generic way to pass to ffmpeg
 * flesh out options in future
 */
export const callFfmpeg = async ({ filePath, outputFilePath, onProgress, destroyTempOnError }: CallFfmpegArgs) =>
    new Promise((resolve, reject) => {
        let totalTime: number;

        ffmpegCaller(filePath)
            .fps(30)
            .output(outputFilePath)
            .on('end', resolve)
            .on('codecData', (data: any) => {
                totalTime = parseInt(data.duration.replace(/:/g, ''));
            })
            .on('progress', (p: FfmpegProgress) => {
                if (!totalTime || totalTime <= 0) return;

                const time = parseInt(p.timemark.replace(/:/g, ''));
                onProgress?.((time / totalTime) * 100);
            })
            .on('error', (e: Error) => {
                console.error(e);
                if (destroyTempOnError) detachPromise({ cb: () => unlink(outputFilePath) });
                reject(e);
            })
            .run();
    });

type FfmpegProgress = {
    frames: number;
    currentFps: number;
    currentKbps: number;
    targetSize: number;
    timemark: string;
    percent?: number;
};
