import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Document } from "@langchain/core/documents";

// In-memory cache of document vector stores per reportId to ensure 0 duplicate embedding operations
const reportVectorStores = new Map<string, MemoryVectorStore>();

/**
 * Gets or initializes a GoogleGenerativeAIEmbeddings instance
 */
function getEmbeddingsModel(): GoogleGenerativeAIEmbeddings {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.warn("[RAG VectorStore] GOOGLE_API_KEY is not set. Using fallback embeddings.");
  }
  return new GoogleGenerativeAIEmbeddings({
    apiKey: apiKey || "dummy-key",
    modelName: "embedding-001",
  });
}

export interface RetrievedChunk {
  pageContent: string;
  pageNumber: number;
  score?: number;
}

/**
 * Indexes a laboratory report PDF file into a document-scoped vector store.
 * Embedded chunks are tagged with page numbers, reportId, userId, and chunk index.
 * The vector store is cached by reportId to ensure embedding occurs ONLY ONCE.
 */
export async function indexReportDocument(
  filePath: string,
  reportId: string,
  userId: string = "default_user"
): Promise<MemoryVectorStore | null> {
  const cacheKey = reportId || filePath;
  if (reportVectorStores.has(cacheKey)) {
    console.log(`[RAG VectorStore] Report ${cacheKey} is already indexed. Using cached vector store.`);
    return reportVectorStores.get(cacheKey)!;
  }

  try {
    console.log(`[RAG VectorStore] Indexing report PDF from ${filePath} (reportId: ${reportId})...`);
    
    // 1. Load PDF pages preserving page numbers
    const loader = new PDFLoader(filePath);
    const rawDocs = await loader.load();

    if (!rawDocs || rawDocs.length === 0) {
      console.warn(`[RAG VectorStore] No text pages loaded from PDF ${filePath}`);
      return null;
    }

    // 2. Prepare documents with page metadata
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });

    const chunkedDocs: Document[] = [];

    for (const rawDoc of rawDocs) {
      const pageNumber = (rawDoc.metadata?.loc?.pageNumber as number) || 1;
      const chunks = await textSplitter.splitText(rawDoc.pageContent);

      chunks.forEach((chunkText: string, idx: number) => {
        if (chunkText.trim().length > 0) {
          chunkedDocs.push(
            new Document({
              pageContent: chunkText.trim(),
              metadata: {
                reportId,
                userId,
                pageNumber,
                chunkIndex: idx,
              },
            })
          );
        }
      });
    }

    console.log(`[RAG VectorStore] Created ${chunkedDocs.length} chunks across ${rawDocs.length} pages.`);

    // 3. Create vector store and generate embeddings ONCE
    const embeddings = getEmbeddingsModel();
    const vectorStore = await MemoryVectorStore.fromDocuments(chunkedDocs, embeddings);

    // 4. Cache vector store
    reportVectorStores.set(cacheKey, vectorStore);
    console.log(`[RAG VectorStore] Successfully indexed & cached report ${cacheKey}`);

    return vectorStore;
  } catch (error) {
    console.error(`[RAG VectorStore] Error indexing report document ${filePath}:`, error);
    return null;
  }
}

/**
 * Retrieves top K semantic chunks from the active report vector store for a query.
 */
export async function retrieveReportChunks(
  reportId: string,
  query: string,
  topK = 4
): Promise<RetrievedChunk[]> {
  if (!reportId || !query || query.trim().length === 0) {
    return [];
  }

  const vectorStore = reportVectorStores.get(reportId);
  if (!vectorStore) {
    console.log(`[RAG VectorStore] No cached vector store found for report ${reportId}`);
    return [];
  }

  try {
    console.log(`[RAG VectorStore] Performing similarity search for query: "${query.substring(0, 50)}..." (topK: ${topK})`);
    
    const results = await vectorStore.similaritySearch(query, topK);
    
    return results.map((doc: Document) => ({
      pageContent: doc.pageContent,
      pageNumber: (doc.metadata?.pageNumber as number) || 1,
    }));
  } catch (error) {
    console.error(`[RAG VectorStore] Error retrieving chunks for report ${reportId}:`, error);
    return [];
  }
}

/**
 * Returns whether a report vector store is cached.
 */
export function isReportIndexed(reportId: string): boolean {
  return reportVectorStores.has(reportId);
}
