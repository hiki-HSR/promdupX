type Vector = Record<string, number>;

interface VectorData {
  vec: Vector;
  mag: number;
}

export function computeSimilarity(
  input: string,
  corpus: string[]
): { text: string; score: number }[] {
  // 1. Tokenize text (lowercase, remove punctuation, split by whitespace)
  const tokenize = (text: string): string[] => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 0);
  };

  const inputTokens = tokenize(input);
  const corpusTokens = corpus.map((text) => tokenize(text));

  // 2. Build Vocabulary & Document Frequency (DF)
  const vocabulary = new Set<string>();
  const docFreq: Record<string, number> = {};

  const updateDf = (tokens: string[]) => {
    const uniqueWords = new Set(tokens);
    uniqueWords.forEach((w) => {
      vocabulary.add(w);
      docFreq[w] = (docFreq[w] || 0) + 1;
    });
  };

  updateDf(inputTokens);
  corpusTokens.forEach((tokens) => updateDf(tokens));

  const N = corpus.length + 1; // Total documents (corpus + input)

  // 3. Compute Inverse Document Frequency (IDF)
  const idf: Record<string, number> = {};
  vocabulary.forEach((w) => {
    idf[w] = Math.log(N / (docFreq[w] || 1));
  });

  // 4. Build TF-IDF Vectors
  const toVector = (tokens: string[]): VectorData => {
    if (tokens.length === 0) return { vec: {}, mag: 0 };

    const tf: Record<string, number> = {};
    tokens.forEach((w) => (tf[w] = (tf[w] || 0) + 1));

    const vec: Vector = {};
    let magSq = 0;

    Object.keys(tf).forEach((w) => {
      const tfVal = tf[w] / tokens.length; // TF = count / length
      const val = tfVal * (idf[w] || 0);
      vec[w] = val;
      magSq += val * val;
    });

    return { vec, mag: Math.sqrt(magSq) };
  };

  const inputVector = toVector(inputTokens);
  const corpusVectors = corpusTokens.map((tokens) => toVector(tokens));

  // 5. Implement Cosine Similarity
  const cosineSimilarity = (v1: VectorData, v2: VectorData): number => {
    if (v1.mag === 0 || v2.mag === 0) return 0;
    let dot = 0;
    Object.keys(v1.vec).forEach((k) => {
      if (v2.vec[k]) dot += v1.vec[k] * v2.vec[k];
    });
    return dot / (v1.mag * v2.mag);
  };

  // 6. Compute scores and sort
  const results = corpus.map((text, i) => ({
    text,
    score: cosineSimilarity(inputVector, corpusVectors[i]),
  }));

  // 7. Sort results by similarity descending
  return results.sort((a, b) => b.score - a.score);
}