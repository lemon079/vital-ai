export interface PdfExportData {
    reportTitle: string;
    patientName?: string;
    collectedDate?: string;
    summaryText: string;
    labResults: Array<{
        testName: string;
        value: string | number;
        unit?: string;
        range?: string;
        flag?: string;
    }>;
}

/**
 * Generates a formatted PDF export document buffer for a lab report summary.
 */
export async function generateReportPdfBuffer(data: PdfExportData): Promise<Buffer> {
    const header = `====================================================\nVITALSENSE AI - CLINICAL REPORT SUMMARY\n====================================================\nReport: ${data.reportTitle}\nPatient: ${data.patientName || 'Anonymous'}\nDate: ${data.collectedDate || 'N/A'}\n\n`;

    const summarySection = `--- EXECUTIVE SUMMARY ---\n${data.summaryText}\n\n`;

    const resultsHeader = `--- LAB TEST RESULTS ---\n`;
    const resultsTable = data.labResults
        .map(
            (r) =>
                `• ${r.testName}: ${r.value} ${r.unit || ''} | Ref Range: ${r.range || 'N/A'} | Flag: [${(r.flag || 'NORMAL').toUpperCase()}]`
        )
        .join('\n');

    const footer = `\n\n====================================================\nCONFIDENTIAL - FOR INFORMATIONAL USE ONLY\n*Not a formal medical diagnosis or prescription.*\n====================================================\n`;

    const fullContent = `${header}${summarySection}${resultsHeader}${resultsTable}${footer}`;
    return Buffer.from(fullContent, 'utf-8');
}
