import path from 'path';
import { writeFile } from 'fs/promises';
import { app, dialog } from 'electron';
import { IpcMessageType } from '@shared/common.constants';
import { ProcessingModuleType, ProcessingRequest, RendererMessage, RunTestRequest } from '@shared/common.types';
import { getMainWindow, handleErrorMessage } from '@util/ipc';
import output from '@util/output';

import { filterTest } from './operations/filterTest';
import { renameTest } from './operations/renameTest';
import { handleClientMessage, runPipelineForFiles } from './operations/handler';
import { handleAqueductMessage } from './operations/aqueduct';
import eventEmitter from '@util/events';

const DATA_FILE = 'hUtil-fe.sqlite3';
const dbFilePath = path.join(app.getPath('userData'), DATA_FILE);

export const addListenersToIpc = (ipcMain: Electron.IpcMain) => {
    ipcMain.handle(IpcMessageType.aqueducts, (_e, msg) => handleAqueductMessage(msg));

    ipcMain.handle(IpcMessageType.selectDirectory, async () => {
        const mainWindow = getMainWindow();
        if (!mainWindow) throw new Error('No main window registered');

        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory'],
        });

        return canceled ? null : filePaths[0];
    });

    ipcMain.handle(IpcMessageType.getDbPath, () => {
        return dbFilePath;
    });

    ipcMain.handle('versions', () => {
        return {
            node: process.versions.chrome,
            chrome: process.versions.chrome,
            electron: process.versions.electron,
            version: app.getVersion(),
            name: app.getName(),
        };
    });

    ipcMain.handle(IpcMessageType.errorReport, async (_e, content: string) => {
        handleErrorMessage(content);
    });

    ipcMain.handle(IpcMessageType.saveFile, async (_e, content) => {
        const { filePath } = await dialog.showSaveDialog({
            title: 'Save pipeline data',
            defaultPath: path.join(app.getPath('downloads'), `h-util-pipelines_${Date.now()}.json`),
            buttonLabel: 'Save',
            filters: [
                { name: 'Json files', extensions: ['json'] },
                { name: 'All files', extensions: ['*'] },
            ],
        });

        if (filePath) {
            writeFile(filePath, content, 'utf-8');
        }
    });

    ipcMain.handle(IpcMessageType.runTest, async (_e, testRequest: RunTestRequest) => {
        switch (testRequest.type) {
            case ProcessingModuleType.dynamicRename:
                return await renameTest(testRequest);
            case ProcessingModuleType.ruleFilter:
            case ProcessingModuleType.filter:
                return await filterTest(testRequest);
            default:
                return [];
        }
    });

    ipcMain.handle(IpcMessageType.rendererMessage, async (_e, payload: RendererMessage) => {
        if (!payload.messageId) return;

        eventEmitter.emit('rendererMessage', payload);
    });

    /** @deprecated use runTest */
    ipcMain.handle(IpcMessageType.testFilter, async (_e, filterTestRequest) => {
        const filtered = await filterTest(filterTestRequest);

        return filtered;
    });

    /** @deprecated use runTest */
    ipcMain.handle(IpcMessageType.testRename, async (_e, renameTestRequest) => {
        const renamed = await renameTest(renameTestRequest);

        return renamed;
    });

    ipcMain.on(IpcMessageType.runPipeline, (_e, d: string[]) => {
        if (d.length === 0) {
            output.error('Bad format');
            return;
        }

        const request: object = JSON.parse(d[0]);

        if (!isValidPipelineMessage(request)) {
            output.error('Invalid pipeline message');
            return;
        }

        runPipelineForFiles(request);
        output.log(`Run pipeline ${request.pipeline.name} w/ ${request.filePaths.length} files`);
    });

    ipcMain.on(IpcMessageType.clientMessage, (_e, d: string[]) => handleClientMessage(d[0]));
};

const isValidPipelineMessage = (msg: object): msg is ProcessingRequest => {
    if (!msg) return false;

    try {
        const parsed = msg as ProcessingRequest;

        if (!parsed.pipeline || !parsed.filePaths) return false;
        if (parsed.filePaths.length === 0) return false;
        if (typeof parsed.pipeline.name !== 'string') return false;
        if (!Array.isArray(parsed.pipeline.processingModules)) return false;

        return true;
    } catch {
        return false;
    }
};
