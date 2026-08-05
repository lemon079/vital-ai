import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { chatModel } from '@/lib/ai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

export interface ExtractedLabItem {
    testCode: string;
    testName: string;
    extractedValueRaw: string;
    value: number | null;
    unit: string | null;
    reportStatedRangeLow: number | null;
    reportStatedRangeHigh: number | null;
    confidenceScore: number; // 0.00 - 1.00
    reasoning?: string;
}

export interface ExtractionResult {
    reportId: string;
    items: ExtractedLabItem[];
    rawText: string;
    extractedAt: Date;
}

/**
 * Calculates a field confidence score based on clarity, numeric parseability, and range presence.
 */
export function calculateFieldConfidence(item: Partial<ExtractedLabItem>): number {
    let score = 1.0;

    // Deduct if raw value is missing or ambiguous
    if (!item.extractedValueRaw || item.extractedValueRaw.trim() === '') {
        return 0.0;
    }

    // Deduct if numeric parsing failed when raw value looks numeric
    if (item.value === null || item.value === undefined) {
        if (/\d/.test(item.extractedValueRaw)) {
            score -= 0.3; // Had numbers but failed to parse into numeric value
        } else {
            score -= 0.15; // Non-numeric text result (e.g. "Negative", "Normal")
        }
    }

    // Deduct if test name is generic or missing
    if (!item.testName || item.testName.toLowerCase().includes('unknown')) {
        score -= 0.4;
    }

    // Deduct if unit is missing for a numeric value
    if (item.value !== null && (!item.unit || item.unit.trim() === '')) {
        score -= 0.1;
    }

    // Clamp score between 0.0 and 1.0
    return Math.max(0.0, Math.min(1.0, Math.round(score * 100) / 100));
}

/**
 * Fallback regex/heuristic parser for structured extraction when LLM is unavailable.
 */
export function parseRawTextHeuristically(rawText: string): ExtractedLabItem[] {
    const lines = rawText.split('\n');
    const items: ExtractedLabItem[] = [];

    // Match lines like: "Hemoglobin 14.2 g/dL (12.0 - 16.0)" or "WBC 7.5 x10^3/uL"
    const lineRegex = /([A-Za-z0-9\s-]+?)\s+([<>~=]?\s*[\d.]+)\s*([A-Za-z\/%\^0-9]*)(?:\s+[\(\[]?([\d.]+)\s*[-–—:]\s*([\d.]+)[\)\]]?)?/i;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.length < 5) continue;
        if (/^(patient|doctor|date|page|lab|report|test\s+name)/i.test(trimmed)) continue;

        const match = trimmed.match(lineRegex);
        if (match) {
            const name = match[1].trim();
            const rawVal = match[2].trim();
            const unit = match[3] ? match[3].trim() : null;
            const lowStr = match[4];
            const highStr = match[5];

            const numVal = parseFloat(rawVal);
            const lowVal = lowStr ? parseFloat(lowStr) : null;
            const highVal = highStr ? parseFloat(highStr) : null;

            if (name.length > 2 && !isNaN(numVal)) {
                const itemPartial: Partial<ExtractedLabItem> = {
                    testCode: name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                    testName: name,
                    extractedValueRaw: rawVal,
                    value: isNaN(numVal) ? null : numVal,
                    unit: unit || null,
                    reportStatedRangeLow: lowVal && !isNaN(lowVal) ? lowVal : null,
                    reportStatedRangeHigh: highVal && !isNaN(highVal) ? highVal : null,
                };

                const confidence = calculateFieldConfidence(itemPartial);

                items.push({
                    testCode: itemPartial.testCode!,
                    testName: itemPartial.testName!,
                    extractedValueRaw: itemPartial.extractedValueRaw!,
                    value: itemPartial.value!,
                    unit: itemPartial.unit!,
                    reportStatedRangeLow: itemPartial.reportStatedRangeLow!,
                    reportStatedRangeHigh: itemPartial.reportStatedRangeHigh!,
                    confidenceScore: confidence,
                    reasoning: `Heuristic parsing matched test pattern. Confidence: ${confidence}`,
                });
            }
        }
    }

    return items;
}

/**
 * Extracts structured lab results from a PDF report file using LLM structured generation,
 * falling back to heuristic parsing if LLM invocation fails or returns invalid JSON.
 */
export async function extractLabResultsFromPdf(filePath: string, reportId: string): Promise<ExtractionResult> {
    let rawText = '';
    try {
        const loader = new PDFLoader(filePath);
        const docs = await loader.load();
        rawText = docs.map((doc) => doc.pageContent).join('\n\n');
    } catch (err) {
        console.warn(`[Extraction] Could not read PDF file at ${filePath}, using text fallback:`, err);
        rawText = `[PDF File: ${filePath}]`;
    }

    let items: ExtractedLabItem[] = [];

    // Try LLM Extraction
    try {
        const systemPrompt = `You are a medical laboratory extraction agent. 
Extract all lab test result entries from the provided report text.
Return ONLY a JSON array of objects with the following schema for each test found:
[
  {
    "testCode": "canonical_code_slug",
    "testName": "Exact Display Name",
    "extractedValueRaw": "raw text value",
    "value": 14.2 (number or null),
    "unit": "g/dL",
    "reportStatedRangeLow": 12.0 (number or null),
    "reportStatedRangeHigh": 16.0 (number or null),
    "confidenceScore": 0.95 (number between 0.00 and 1.00),
    "reasoning": "Brief extraction rationale"
  }
]`;

        const response = await chatModel.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(`LAB REPORT RAW TEXT:\n${rawText}`),
        ]);

        const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed) && parsed.length > 0) {
                items = parsed.map((rawItem: any) => {
                    const item: ExtractedLabItem = {
                        testCode: String(rawItem.testCode || rawItem.testName || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, '_'),
                        testName: String(rawItem.testName || 'Unknown Test'),
                        extractedValueRaw: String(rawItem.extractedValueRaw || rawItem.value || ''),
                        value: typeof rawItem.value === 'number' ? rawItem.value : (parseFloat(rawItem.value) || null),
                        unit: rawItem.unit ? String(rawItem.unit) : null,
                        reportStatedRangeLow: typeof rawItem.reportStatedRangeLow === 'number' ? rawItem.reportStatedRangeLow : (parseFloat(rawItem.reportStatedRangeLow) || null),
                        reportStatedRangeHigh: typeof rawItem.reportStatedRangeHigh === 'number' ? rawItem.reportStatedRangeHigh : (parseFloat(rawItem.reportStatedRangeHigh) || null),
                        confidenceScore: typeof rawItem.confidenceScore === 'number' ? Math.max(0, Math.min(1, rawItem.confidenceScore)) : calculateFieldConfidence(rawItem),
                        reasoning: rawItem.reasoning ? String(rawItem.reasoning) : undefined,
                    };
                    return item;
                });
            }
        }
    } catch (llmErr) {
        console.warn(`[Extraction] LLM invocation skipped or failed, falling back to heuristic parser:`, llmErr);
    }

    // Fall back to heuristic parsing if LLM didn't return items
    if (items.length === 0) {
        items = parseRawTextHeuristically(rawText);
    }

    return {
        reportId,
        items,
        rawText,
        extractedAt: new Date(),
    };
}
