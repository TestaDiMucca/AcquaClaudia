import dateFormat from 'dateformat';
import { defaultTimeMask, ExtraData, RenameTemplates } from './common.constants';
import { AttributeType } from './rules.types';
import { BranchingModule, ProcessingModule, ProcessingModuleType } from './common.types';

/** Just gets a default date time stamp */
export function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth() returns a zero-based index
    const day = date.getDate();

    // Pad the month and day with leading zeros if needed
    const paddedMonth = month.toString().padStart(2, '0');
    const paddedDay = day.toString().padStart(2, '0');

    return `${year}-${paddedMonth}-${paddedDay}`;
}

export const formatDateString = (date: Date, mask = defaultTimeMask) => {
    try {
        return dateFormat(date, mask);
    } catch (e: any) {
        console.error(`Error formatting dates: ${e.message}`);
    }
};

export function slugify(text: string): string {
    return (
        text
            // Convert to lowercase
            .toLowerCase()
            // Replace spaces with -
            .replace(/\s+/g, '-')
            // Remove all non-word chars except for - and _
            .replace(/[^a-z0-9\-_]+/g, '')
            // Replace multiple - or _ with a single -
            .replace(/-+/g, '-')
            // Trim - from start and end of text
            .trim()
    );
}

export const getAttributeDataType = (attribute: RenameTemplates | ExtraData) => {
    switch (attribute) {
        case RenameTemplates.DateCreated:
        case RenameTemplates.DateModified:
        case RenameTemplates.ExifTaken:
            return AttributeType.date;
        case RenameTemplates.MetaTrackNo:
        case ExtraData.FileSize:
            return AttributeType.number;
        case ExtraData.ocr:
            return AttributeType.boolean;
        default:
            return AttributeType.string;
    }
};

export const isBranchingModule = (processingModule: ProcessingModule): processingModule is BranchingModule => {
    return processingModule.type === ProcessingModuleType.branch;
};
