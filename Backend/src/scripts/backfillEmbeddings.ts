import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/db';
import { Gig } from '../models/Gig';
import { Rental } from '../models/Rental';
import { createListingEmbedding, isSemanticSearchEnabled } from '../services/semanticSearchService';

const backfill = async () => {
  if (!isSemanticSearchEnabled()) {
    throw new Error('Set HF_TOKEN before running the embedding backfill.');
  }

  await connectDB();
  const [gigs, rentals] = await Promise.all([
    Gig.find({ searchEmbedding: { $exists: false } }),
    Rental.find({ searchEmbedding: { $exists: false } })
  ]);

  for (const gig of gigs) {
    gig.searchEmbedding = await createListingEmbedding(gig);
    await gig.save();
  }

  for (const rental of rentals) {
    rental.searchEmbedding = await createListingEmbedding(rental);
    await rental.save();
  }

  console.log(`Created semantic embeddings for ${gigs.length} gigs and ${rentals.length} rentals.`);
};

backfill()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Embedding backfill failed:', error);
    process.exit(1);
  });
