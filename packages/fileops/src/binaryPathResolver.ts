import fs from 'fs';

type CandidateLoader = () => string | null | undefined;

type ResolveBinaryPathArgs = {
    candidateLoaders: CandidateLoader[];
    fallbackCommand: string;
};

type FileSystemDeps = {
    existsSync: (filePath: string) => boolean;
    statSync: (filePath: string) => { mode: number };
    chmodSync: (filePath: string, mode: number) => void;
};

const defaultFileSystemDeps: FileSystemDeps = {
    existsSync: fs.existsSync,
    statSync: fs.statSync,
    chmodSync: fs.chmodSync,
};

export const normalizeBinaryPath = (binaryPath: string) => binaryPath.replace('app.asar', 'app.asar.unpacked');

const ensureExecutable = (binaryPath: string, deps: FileSystemDeps) => {
    const mode = deps.statSync(binaryPath).mode;

    if ((mode & 0o111) !== 0) return true;

    deps.chmodSync(binaryPath, mode | 0o111);
    return true;
};

export const resolveBinaryPath = (
    { candidateLoaders, fallbackCommand }: ResolveBinaryPathArgs,
    deps: FileSystemDeps = defaultFileSystemDeps,
) => {
    for (const loadCandidate of candidateLoaders) {
        try {
            const candidate = loadCandidate();
            if (!candidate) continue;

            const normalizedCandidate = normalizeBinaryPath(candidate);
            if (!deps.existsSync(normalizedCandidate)) continue;
            if (!ensureExecutable(normalizedCandidate, deps)) continue;

            return normalizedCandidate;
        } catch {
            continue;
        }
    }

    return fallbackCommand;
};

const getModuleSearchRoots = () => {
    const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;

    return [__dirname, process.cwd(), resourcesPath].filter((value): value is string => Boolean(value));
};

export const createModuleBinaryLoader = (
    request: string,
    selectBinaryPath: (loadedModule: any) => string | undefined,
): CandidateLoader => {
    const searchRoots = getModuleSearchRoots();

    return () => {
        for (const searchRoot of searchRoots) {
            try {
                const resolvedModulePath = require.resolve(request, { paths: [searchRoot] });
                const loadedModule = require(resolvedModulePath);
                const binaryPath = selectBinaryPath(loadedModule);

                if (binaryPath) return binaryPath;
            } catch {
                continue;
            }
        }

        return undefined;
    };
};
