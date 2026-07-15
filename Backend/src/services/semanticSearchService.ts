const HF_EMBEDDING_MODEL = process.env.HF_EMBEDDING_MODEL || 'thenlper/gte-large';
const HF_INFERENCE_URL = `https://router.huggingface.co/hf-inference/models/${HF_EMBEDDING_MODEL}`;
const MAX_QUERY_LENGTH = 500;
const queryCache = new Map<string, { embedding: number[]; expiresAt: number }>();

export const isSemanticSearchEnabled = () => Boolean(process.env.HF_TOKEN);

export const buildListingSearchText = (listing: {
  title: string;
  description: string;
  category?: string;
  locationDetails?: string;
  requirementNotes?: string;
  pickupLocation?: string;
  availabilityNotes?: string;
  specs?: { brand?: string; model?: string; condition?: string; includesAccessories?: string[] };
}) => {
  const specs = listing.specs
    ? [listing.specs.brand, listing.specs.model, listing.specs.condition, ...(listing.specs.includesAccessories || [])]
    : [];

  return [
    `Title: ${listing.title}`,
    `Description: ${listing.description}`,
    listing.category && `Category: ${listing.category}`,
    listing.locationDetails && `Location: ${listing.locationDetails}`,
    listing.requirementNotes && `Requirements: ${listing.requirementNotes}`,
    listing.pickupLocation && `Pickup: ${listing.pickupLocation}`,
    listing.availabilityNotes && `Availability: ${listing.availabilityNotes}`,
    specs.filter(Boolean).length && `Details: ${specs.filter(Boolean).join(', ')}`
  ].filter(Boolean).join('\n');
};

export const createEmbedding = async (input: string): Promise<number[]> => {
  const token = process.env.HF_TOKEN;
  if (!token) throw new Error('HF_TOKEN is not configured');

  const response = await fetch(HF_INFERENCE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ inputs: input, normalize: true, truncate: true })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Embedding request failed (${response.status}): ${details.slice(0, 300)}`);
  }

  const payload = await response.json() as unknown;
  const embedding = Array.isArray(payload) && typeof payload[0] === 'number'
    ? payload as number[]
    : Array.isArray(payload) && Array.isArray(payload[0]) && typeof payload[0][0] === 'number'
      ? payload[0] as number[]
      : undefined;
  if (!embedding?.length) throw new Error('Embedding response did not contain a vector');
  return embedding;
};

export const createListingEmbedding = (listing: Parameters<typeof buildListingSearchText>[0]) =>
  createEmbedding(buildListingSearchText(listing));

export const createQueryEmbedding = async (query: string) => {
  const normalizedQuery = query.trim().slice(0, MAX_QUERY_LENGTH).toLowerCase();
  const cached = queryCache.get(normalizedQuery);
  if (cached && cached.expiresAt > Date.now()) return cached.embedding;

  const embedding = await createEmbedding(normalizedQuery);
  queryCache.set(normalizedQuery, { embedding, expiresAt: Date.now() + 15 * 60 * 1000 });
  return embedding;
};

export const cosineSimilarity = (a: number[], b: number[]) => {
  if (a.length !== b.length || !a.length) return 0;
  let dotProduct = 0;
  let aMagnitude = 0;
  let bMagnitude = 0;

  for (let i = 0; i < a.length; i += 1) {
    dotProduct += a[i] * b[i];
    aMagnitude += a[i] * a[i];
    bMagnitude += b[i] * b[i];
  }

  return aMagnitude && bMagnitude ? dotProduct / (Math.sqrt(aMagnitude) * Math.sqrt(bMagnitude)) : 0;
};

export const rankBySemanticSimilarity = <T extends { searchEmbedding?: number[] }>(items: T[], queryEmbedding: number[]) =>
  items
    .filter((item) => Array.isArray(item.searchEmbedding) && item.searchEmbedding.length === queryEmbedding.length)
    .map((item) => ({ item, score: cosineSimilarity(item.searchEmbedding as number[], queryEmbedding) }))
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
