import * as xlsx from 'xlsx';

export interface Question {
    id: any;
    question: any;
    answer: any;
}

export function parseExcelBuffer(buffer: Buffer): any[] {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    // raw: true helps preserve values exactly as they are
    return xlsx.utils.sheet_to_json(worksheet);
}

/**
 * Finds a value in an object regardless of key case or leading/trailing spaces
 */
function getFlexibleValue(row: any, targetKey: string): any {
    const keys = Object.keys(row);
    const lowerTarget = targetKey.toLowerCase();

    // 1. Try exact match (case insensitive)
    const exactMatch = keys.find(k => k.trim().toLowerCase() === lowerTarget);
    if (exactMatch) return row[exactMatch];

    // 2. Try matching the start of the key (useful for things like "Question (with Options)")
    const startsWithMatch = keys.find(k => k.trim().toLowerCase().startsWith(lowerTarget));
    if (startsWithMatch) return row[startsWithMatch];

    return undefined;
}

export function mergeData(questionsRaw: any[], answersRaw: any[]): Question[] {
    if (questionsRaw.length > 0) {
        console.log('Detected columns in Questions file:', Object.keys(questionsRaw[0]));
    }
    if (answersRaw.length > 0) {
        console.log('Detected columns in Answers file:', Object.keys(answersRaw[0]));
    }

    const merged = questionsRaw.map(q => {
        const qId = getFlexibleValue(q, 'id');
        const qText = getFlexibleValue(q, 'question');

        // Find match in answers
        const match = answersRaw.find(a => {
            const aId = getFlexibleValue(a, 'id');
            // Ensure ID comparison is robust
            if (qId === undefined || aId === undefined) return false;
            return String(aId).trim() === String(qId).trim();
        });

        const aText = match ? getFlexibleValue(match, 'answer') : undefined;

        return {
            id: qId,
            question: qText,
            answer: aText
        };
    });

    // Debugging info if no results
    if (merged.length > 0) {
        const sample = merged[0];
        if (!sample.question || !sample.answer) {
            console.log('Sample row check:', {
                id: sample.id,
                hasQuestion: !!sample.question,
                hasAnswer: !!sample.answer
            });
        }
    }

    // Only keep rows that actually have a question and an answer
    const filtered = merged.filter(item => item.id !== undefined && item.question && item.answer);

    if (merged.length > 0 && filtered.length === 0) {
        console.error('CRITICAL: Found rows but they were filtered out. Check if your column headers are exactly "id", "question", and "answer".');
        console.log('First raw question row:', JSON.stringify(questionsRaw[0]));
        console.log('First raw answer row:', JSON.stringify(answersRaw[0]));
    }

    return filtered;
}