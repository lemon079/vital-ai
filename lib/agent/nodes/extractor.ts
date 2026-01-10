import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { AgentState } from "../state";

export async function extractPdfData(state: typeof AgentState.State) {
    const { filePath, reportData } = state;

    // If we already have data or no file path, skip extraction
    if (reportData || !filePath) {
        return {};
    }

    try {
        const loader = new PDFLoader(filePath);
        const docs = await loader.load();

        // Join all pages into a single string
        const extractedText = docs.map((doc: any) => doc.pageContent).join("\n\n");

        console.log(`[Extractor] Successfully extracted ${extractedText.length} characters from ${filePath}`);

        return {
            reportData: extractedText
        };
    } catch (error) {
        console.error("[Extractor] Failed to load PDF:", error);
        return {
            reportData: "Error extracting text from PDF file."
        };
    }
}
