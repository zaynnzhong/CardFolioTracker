import { CardSightAI, getHighestConfidenceDetection, hasDetections } from 'cardsightai';

// Initialize CardSight AI client
const CARDSIGHT_API_KEY = '9d04a598cdf64fa7a949dd4ed99f67e5';

let client: CardSightAI | null = null;

function getClient(): CardSightAI {
  if (!client) {
    client = new CardSightAI({ apiKey: CARDSIGHT_API_KEY });
  }
  return client;
}

export interface CardScanResult {
  success: boolean;
  confidence: 'High' | 'Medium' | 'Low' | null;
  card: {
    name: string;
    year: string;
    manufacturer: string;
    setName: string;
    releaseName: string;
    number: string;
    parallel?: {
      name: string;
      numberedTo?: number;
    };
  } | null;
  allDetections: Array<{
    confidence: 'High' | 'Medium' | 'Low';
    card: {
      name: string;
      year: string;
      manufacturer: string;
      setName: string;
      releaseName: string;
      number: string;
      parallel?: {
        name: string;
        numberedTo?: number;
      };
    } | null;
  }>;
  processingTime?: number;
  error?: string;
}

/**
 * Scan a card image and identify the card using CardSight AI
 * @param imageFile - File, Blob, Buffer, or ArrayBuffer of the card image
 * @returns CardScanResult with identified card information
 */
export async function scanCard(imageFile: File | Blob | ArrayBuffer): Promise<CardScanResult> {
  try {
    const cardSightClient = getClient();
    const result = await cardSightClient.identify.card(imageFile);

    if (!result.data?.success) {
      return {
        success: false,
        confidence: null,
        card: null,
        allDetections: [],
        error: 'Card identification failed'
      };
    }

    if (!hasDetections(result.data) || result.data.detections.length === 0) {
      return {
        success: true,
        confidence: null,
        card: null,
        allDetections: [],
        processingTime: result.data.processingTime,
        error: 'No cards detected in image'
      };
    }

    // Get the best match
    const bestMatch = getHighestConfidenceDetection(result.data);

    // Map all detections
    const allDetections = result.data.detections.map(detection => ({
      confidence: detection.confidence as 'High' | 'Medium' | 'Low',
      card: detection.card ? {
        name: detection.card.name || '',
        year: detection.card.year || '',
        manufacturer: detection.card.manufacturer || '',
        setName: detection.card.setName || '',
        releaseName: detection.card.releaseName || '',
        number: detection.card.number || '',
        parallel: detection.card.parallel ? {
          name: detection.card.parallel.name,
          numberedTo: detection.card.parallel.numberedTo
        } : undefined
      } : null
    }));

    return {
      success: true,
      confidence: bestMatch?.confidence as 'High' | 'Medium' | 'Low' || null,
      card: bestMatch?.card ? {
        name: bestMatch.card.name || '',
        year: bestMatch.card.year || '',
        manufacturer: bestMatch.card.manufacturer || '',
        setName: bestMatch.card.setName || '',
        releaseName: bestMatch.card.releaseName || '',
        number: bestMatch.card.number || '',
        parallel: bestMatch.card.parallel ? {
          name: bestMatch.card.parallel.name,
          numberedTo: bestMatch.card.parallel.numberedTo
        } : undefined
      } : null,
      allDetections,
      processingTime: result.data.processingTime
    };
  } catch (error: any) {
    console.error('[CardSight] Scan error:', error);
    return {
      success: false,
      confidence: null,
      card: null,
      allDetections: [],
      error: error.message || 'Failed to scan card'
    };
  }
}

/**
 * Search the CardSight catalog for cards
 * @param params - Search parameters
 */
export async function searchCatalog(params: {
  year?: number;
  manufacturer?: string;
  player?: string;
  take?: number;
}) {
  try {
    const cardSightClient = getClient();
    const result = await cardSightClient.catalog.cards.list({
      year: params.year,
      manufacturer: params.manufacturer,
      player: params.player,
      take: params.take || 10
    });
    return result.data;
  } catch (error: any) {
    console.error('[CardSight] Search error:', error);
    throw error;
  }
}

/**
 * Get autocomplete suggestions for card names
 * @param query - Search query
 */
export async function autocompleteCards(query: string) {
  try {
    const cardSightClient = getClient();
    const result = await cardSightClient.autocomplete.cards({
      query,
      take: 10
    });
    return result.data;
  } catch (error: any) {
    console.error('[CardSight] Autocomplete error:', error);
    throw error;
  }
}
