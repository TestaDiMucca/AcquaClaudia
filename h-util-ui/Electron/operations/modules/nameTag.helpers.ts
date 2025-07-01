import { sanitizeStringForFilename } from '../handler.helpers';

const replacementCharacter = '_';

export const fileNameSafeTitleReplace = (filename: string, metadataTitle: string): string => {
    const fileSafeTitle = sanitizeStringForFilename(metadataTitle, replacementCharacter);

    if (fileSafeTitle === metadataTitle || filename === metadataTitle) return filename; // No change needed

    const newFilename = filename.replace(fileSafeTitle, metadataTitle);

    /**
     * Merge the two strings by replacing replacementCharacter in newFilename with corresponding characters from metadata.
     * This is a final check to make sure we don't have lingering replacement characters.
     */
    const minLength = Math.min(newFilename.length, metadataTitle.length);
    let reconstructed = '';
    for (let i = 0; i < minLength; i++) {
        reconstructed +=
            newFilename[i] === replacementCharacter && metadataTitle[i] !== replacementCharacter
                ? metadataTitle[i]
                : newFilename[i];
    }
    // Optionally, append the rest if newFilename is longer
    if (newFilename.length > minLength) {
        reconstructed += newFilename.slice(minLength);
    }
    return reconstructed;
};
