const { loadSpec } = require('../utils/specLoader');
const { upsertDocuments } = require('../rag/qdrantService');

/**
 * Runs the Embedding Agent to chunk and index the candidate's resume
 * @param {string} candidateId - The ID of the candidate.
 * @param {string} resumeText - Raw text extracted from the PDF.
 * @returns {Promise<boolean>} True if indexing succeeded.
 */
const runEmbeddingAgent = async (candidateId, resumeText) => {
  try {
    const ragSpec = loadSpec('evaluation/rag-retrieval.json');
    const chunkSize = ragSpec.resume_chunk_size || 500;
    
    // Chunking text with basic overlap
    const chunks = [];
    const overlap = 50;
    
    let index = 0;
    while (index < resumeText.length) {
      const chunkText = resumeText.slice(index, index + chunkSize).trim();
      if (chunkText.length > 0) {
        chunks.push({
          id: `chunk-${candidateId}-${chunks.length}`,
          text: chunkText,
          metadata: {
            candidateId,
            chunkIndex: chunks.length
          }
        });
      }
      index += chunkSize - overlap;
    }

    const collectionName = `candidate_${candidateId}`;
    console.log(`[Embedding Agent] Chunked resume into ${chunks.length} chunks. Uploading vectors to collection: ${collectionName}`);
    
    const success = await upsertDocuments(collectionName, chunks);
    if (!success) {
      throw new Error('Failed to upsert resume chunks to vector storage.');
    }
    
    return {
      indexed: true,
      chunks_count: chunks.length,
      collection: collectionName
    };
  } catch (error) {
    console.error('Embedding Agent Error:', error.message);
    throw error;
  }
};

module.exports = {
  runEmbeddingAgent
};
