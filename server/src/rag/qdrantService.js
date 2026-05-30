const env = require('../config/env');
const { loadSpec } = require('../utils/specLoader');

// In-memory fallback vector storage
const inMemoryStore = [];

/**
 * Simple hash function to seed random number generation
 */
const cyrb128 = (str) => {
  let h1 = 1779033703, h2 = 3024733165, h3 = 336245363, h4 = 50249321;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
};

const sfc32 = (a, b, c, d) => {
  return function() {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    var t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  }
};

/**
 * Generates a mock but deterministic 384-dimensional vector for a string
 * aligning with BAAI/bge-small-en-v1.5 dimensions
 */
const getMockEmbedding = (text) => {
  const seed = cyrb128(text);
  const rand = sfc32(seed[0], seed[1], seed[2], seed[3]);
  const vector = [];
  
  // Create a 384-dimensional vector
  for (let i = 0; i < 384; i++) {
    vector.push(rand() * 2 - 1); // values between -1 and 1
  }

  // Boost dimensions based on known key terms to make search realistic
  const keyTerms = [
    'react', 'javascript', 'css', 'next.js', 'tailwind', 'typescript', 
    'node', 'express', 'mongodb', 'qdrant', 'langgraph', 'redux'
  ];
  
  keyTerms.forEach((term, index) => {
    if (text.toLowerCase().includes(term)) {
      // Map terms to specific indices
      const dimIndex = (index * 25) % 384;
      vector[dimIndex] += 1.5;
    }
  });

  // Normalize vector to unit length
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(val => val / magnitude);
};

/**
 * Cosine similarity helper
 */
const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Verify Qdrant connection
 */
const checkQdrantStatus = async () => {
  try {
    const res = await fetch(`${env.QDRANT_URL}/health`, { signal: AbortSignal.timeout(1000) });
    return res.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Upsert points to Qdrant or fall back to in-memory store
 */
const upsertDocuments = async (collectionName, documents) => {
  const isOnline = await checkQdrantStatus();
  
  const points = documents.map((doc, index) => {
    const vector = getMockEmbedding(doc.text);
    return {
      id: doc.id || `${collectionName}-${Date.now()}-${index}`,
      text: doc.text,
      vector,
      metadata: doc.metadata || {}
    };
  });

  if (!isOnline) {
    console.log(`[Qdrant Fallback] Storing ${points.length} documents in memory for collection: ${collectionName}`);
    points.forEach(point => {
      // Remove previous duplicates in memory
      const idx = inMemoryStore.findIndex(item => item.id === point.id);
      if (idx !== -1) inMemoryStore[idx] = point;
      else inMemoryStore.push({ ...point, collectionName });
    });
    return true;
  }

  try {
    // 1. Create collection if not exists
    await fetch(`${env.QDRANT_URL}/collections/${collectionName}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vectors: {
          size: 384,
          distance: 'Cosine'
        }
      })
    });

    // 2. Put points
    const qdrantPoints = points.map(p => ({
      id: p.id,
      vector: p.vector,
      payload: {
        text: p.text,
        ...p.metadata
      }
    }));

    const response = await fetch(`${env.QDRANT_URL}/collections/${collectionName}/points`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points: qdrantPoints })
    });

    return response.ok;
  } catch (error) {
    console.warn(`Failed to upsert to Qdrant directly: ${error.message}. Storing in memory fallback instead.`);
    points.forEach(point => {
      inMemoryStore.push({ ...point, collectionName });
    });
    return true;
  }
};

/**
 * Vector search documents
 */
const searchDocuments = async (collectionName, queryText, customTopK = null) => {
  const spec = loadSpec('evaluation/rag-retrieval.json');
  const topK = customTopK || spec.top_k || 5;
  const minSimilarity = spec.minimum_similarity || 0.75;
  const queryVector = getMockEmbedding(queryText);

  const isOnline = await checkQdrantStatus();

  if (!isOnline) {
    console.log(`[Qdrant Fallback] Searching ${collectionName} in memory for: "${queryText}"`);
    // Filter collection
    const filtered = inMemoryStore.filter(item => item.collectionName === collectionName);
    
    // Score
    const scored = filtered.map(item => {
      const similarity = cosineSimilarity(queryVector, item.vector);
      return {
        id: item.id,
        text: item.text,
        score: similarity,
        metadata: item.metadata
      };
    });

    // Sort, filter by threshold, and slice
    return scored
      .filter(item => item.score >= minSimilarity)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  try {
    const response = await fetch(`${env.QDRANT_URL}/collections/${collectionName}/points/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vector: queryVector,
        limit: topK,
        with_payload: true,
        score_threshold: minSimilarity
      })
    });

    if (!response.ok) {
      throw new Error(`Qdrant search error status: ${response.status}`);
    }

    const data = await response.json();
    return (data.result || []).map(r => ({
      id: r.id,
      text: r.payload.text,
      score: r.score,
      metadata: r.payload
    }));
  } catch (error) {
    console.warn(`Qdrant search failed: ${error.message}. Falling back to memory search.`);
    const filtered = inMemoryStore.filter(item => item.collectionName === collectionName);
    const scored = filtered.map(item => ({
      id: item.id,
      text: item.text,
      score: cosineSimilarity(queryVector, item.vector),
      metadata: item.metadata
    }));
    return scored
      .filter(item => item.score >= minSimilarity)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
};

module.exports = {
  upsertDocuments,
  searchDocuments,
  getMockEmbedding
};
