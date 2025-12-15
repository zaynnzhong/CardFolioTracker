import { Card, BundleSuggestion } from '../types';

/**
 * Generate bundle suggestions for a target value
 * Creates 3-5 different bundle combinations:
 * - Pure card bundles: 10-25% over target (for direct trades)
 * - Card+cash bundles: Cards at 50-100% of target, cash fills the gap to 10-25% over
 */
export function generateBundleSuggestions(
  cards: Card[],
  targetValue: number,
  excludeCardIds: string[] = []
): BundleSuggestion[] {
  // Filter out sold cards, excluded cards, and cards marked neverTrade
  const availableCards = cards.filter(c =>
    !c.sold &&
    !excludeCardIds.includes(c.id) &&
    c.currentValue > 0 &&
    !c.neverTrade // Exclude cards marked as never trade
  );

  if (availableCards.length === 0) {
    return [];
  }

  const suggestions: BundleSuggestion[] = [];
  const minTarget = targetValue * 1.10; // 10% over
  const maxTarget = targetValue * 1.25; // 25% over (hard cap)
  const cardOnlyMinTarget = targetValue * 0.50; // For card+cash bundles, allow cards starting at 50% of target

  // Strategy 1: High-value cards (fewer cards, higher individual values)
  const highValueBundle = findBundleByStrategy(
    availableCards.sort((a, b) => b.currentValue - a.currentValue),
    minTarget,
    maxTarget,
    { maxCards: 5, preferHighValue: true }
  );
  if (highValueBundle) suggestions.push(highValueBundle);

  // Strategy 2: Mid-value cards (balanced approach)
  const midValueCards = [...availableCards].sort((a, b) => {
    const aMid = Math.abs(a.currentValue - targetValue / 3);
    const bMid = Math.abs(b.currentValue - targetValue / 3);
    return aMid - bMid;
  });
  const midValueBundle = findBundleByStrategy(
    midValueCards,
    minTarget,
    maxTarget,
    { maxCards: 8, preferHighValue: false }
  );
  if (midValueBundle && !isSimilarBundle(midValueBundle, suggestions)) {
    suggestions.push(midValueBundle);
  }

  // Strategy 3: More cards, lower individual values
  const lowValueBundle = findBundleByStrategy(
    availableCards.sort((a, b) => a.currentValue - b.currentValue),
    minTarget,
    maxTarget,
    { maxCards: 12, preferHighValue: false }
  );
  if (lowValueBundle && !isSimilarBundle(lowValueBundle, suggestions)) {
    suggestions.push(lowValueBundle);
  }

  // Strategy 4: Optimized closest match (greedy algorithm)
  const optimizedBundle = findOptimizedBundle(availableCards, minTarget, maxTarget);
  if (optimizedBundle && !isSimilarBundle(optimizedBundle, suggestions)) {
    suggestions.push(optimizedBundle);
  }

  // Strategy 5: Random variation (for diversity)
  const randomBundle = findRandomBundle(availableCards, minTarget, maxTarget);
  if (randomBundle && !isSimilarBundle(randomBundle, suggestions)) {
    suggestions.push(randomBundle);
  }

  // Strategy 6: Card bundles below target (for card+cash combinations)
  // Find bundles at 50-100% of target value
  const belowTargetBundle = findBundleByStrategy(
    availableCards.sort((a, b) => a.currentValue - b.currentValue),
    cardOnlyMinTarget,
    targetValue, // Max is the target itself (not over)
    { maxCards: 8, preferHighValue: false }
  );
  if (belowTargetBundle && !isSimilarBundle(belowTargetBundle, suggestions)) {
    suggestions.push(belowTargetBundle);
  }

  // Strategy 7: Card + Cash combinations
  const cardPlusCashBundles = generateCardPlusCashSuggestions(
    availableCards,
    targetValue,
    minTarget,
    maxTarget
  );
  for (const bundle of cardPlusCashBundles) {
    if (suggestions.length >= 5) break;
    if (!isSimilarBundle(bundle, suggestions)) {
      suggestions.push(bundle);
    }
  }

  return suggestions.slice(0, 5); // Return max 5 suggestions
}

interface BundleStrategy {
  maxCards: number;
  preferHighValue: boolean;
}

function findBundleByStrategy(
  sortedCards: Card[],
  minTarget: number,
  maxTarget: number,
  strategy: BundleStrategy
): BundleSuggestion | null {
  const selectedCards: Card[] = [];
  let currentTotal = 0;

  for (const card of sortedCards) {
    if (selectedCards.length >= strategy.maxCards) break;

    const newTotal = currentTotal + card.currentValue;

    // Add card ONLY if it stays within maxTarget (25% hard cap)
    if (newTotal <= maxTarget) {
      selectedCards.push(card);
      currentTotal = newTotal;

      // Stop if we're in the sweet spot
      if (currentTotal >= minTarget && currentTotal <= maxTarget) {
        break;
      }
    }
    // If this card would exceed maxTarget and we haven't reached minTarget,
    // there's no valid bundle - stop trying
  }

  // Only return if we have cards and reached at least minTarget (10% over)
  // Never return bundles that don't meet the minimum threshold
  if (selectedCards.length === 0 || currentTotal < minTarget) {
    return null;
  }

  return createSuggestion(selectedCards, currentTotal, minTarget / 1.10);
}

function findOptimizedBundle(
  cards: Card[],
  minTarget: number,
  maxTarget: number
): BundleSuggestion | null {
  // Use dynamic programming-like approach to find best combination
  const sorted = [...cards].sort((a, b) => b.currentValue - a.currentValue);
  let bestBundle: Card[] | null = null;
  let bestTotal = 0;
  let bestDiff = Infinity;
  let iterations = 0;
  const MAX_ITERATIONS = 5000; // Prevent infinite loops

  function backtrack(index: number, current: Card[], total: number) {
    iterations++;

    // Safety check: limit iterations to prevent freezing
    if (iterations > MAX_ITERATIONS) {
      return;
    }

    // Check if current bundle is better than best
    if (total >= minTarget && total <= maxTarget) {
      const diff = Math.abs(total - (minTarget + maxTarget) / 2);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestBundle = [...current];
        bestTotal = total;
      }
      // Early exit if we found a very good match
      if (diff < (maxTarget - minTarget) * 0.1) {
        return;
      }
    }

    // Pruning: stop if we have enough cards or exceeded max (25% hard cap)
    if (index >= sorted.length || current.length >= 10 || total > maxTarget) {
      return;
    }

    // Limit depth for large card sets
    if (index > Math.min(sorted.length, 30)) {
      return;
    }

    // Try including current card (respect 25% hard cap)
    if (total + sorted[index].currentValue <= maxTarget) {
      backtrack(index + 1, [...current, sorted[index]], total + sorted[index].currentValue);
    }

    // Only try excluding if we haven't found a good solution yet
    if (!bestBundle || bestDiff > (maxTarget - minTarget) * 0.2) {
      backtrack(index + 1, current, total);
    }
  }

  backtrack(0, [], 0);

  if (bestBundle && bestBundle.length > 0) {
    return createSuggestion(bestBundle, bestTotal, minTarget / 1.10);
  }

  return null;
}

function findRandomBundle(
  cards: Card[],
  minTarget: number,
  maxTarget: number
): BundleSuggestion | null {
  // Shuffle cards for randomness
  const shuffled = [...cards].sort(() => Math.random() - 0.5);

  const selectedCards: Card[] = [];
  let currentTotal = 0;

  for (const card of shuffled) {
    if (selectedCards.length >= 10) break;

    const newTotal = currentTotal + card.currentValue;
    if (newTotal <= maxTarget) {
      selectedCards.push(card);
      currentTotal = newTotal;

      if (currentTotal >= minTarget && currentTotal <= maxTarget) {
        break;
      }
    }
  }

  // Only return if we have cards and reached at least minTarget (10% over)
  // Never return bundles that don't meet the minimum threshold
  if (selectedCards.length === 0 || currentTotal < minTarget) {
    return null;
  }

  return createSuggestion(selectedCards, currentTotal, minTarget / 1.10);
}

function createSuggestion(cards: Card[], totalValue: number, originalTarget: number, cashAmount?: number): BundleSuggestion {
  const percentOverTarget = ((totalValue - originalTarget) / originalTarget) * 100;

  return {
    cards,
    cashAmount,
    totalValue,
    cardCount: cards.length,
    percentOverTarget
  };
}

function isSimilarBundle(newBundle: BundleSuggestion, existing: BundleSuggestion[]): boolean {
  // Check if bundle is too similar to existing ones
  for (const existingBundle of existing) {
    const newIds = new Set(newBundle.cards.map(c => c.id));
    const existingIds = new Set(existingBundle.cards.map(c => c.id));

    // Count overlapping cards
    let overlap = 0;
    for (const id of newIds) {
      if (existingIds.has(id)) overlap++;
    }

    // If more than 60% overlap, consider it similar
    const overlapPercent = overlap / Math.max(newIds.size, existingIds.size);
    if (overlapPercent > 0.6) {
      return true;
    }
  }

  return false;
}

/**
 * Generate Card + Cash bundle suggestions
 * This creates bundles where cards alone don't reach the target, but adding cash can
 * Tries multiple strategies to find diverse card+cash combinations
 */
function generateCardPlusCashSuggestions(
  cards: Card[],
  targetValue: number,
  minTarget: number,
  maxTarget: number
): BundleSuggestion[] {
  const suggestions: BundleSuggestion[] = [];

  // Strategy 1: Single high-value card + cash
  const sortedHigh = [...cards].sort((a, b) => b.currentValue - a.currentValue);
  for (let i = 0; i < Math.min(3, sortedHigh.length); i++) {
    const card = sortedHigh[i];
    const cardsTotal = card.currentValue;

    // Skip if card alone exceeds minTarget (pure card bundle is better)
    if (cardsTotal >= minTarget) continue;

    const neededCash = minTarget - cardsTotal;

    // Only suggest if cash needed is reasonable (not more than 50% of target)
    if (neededCash > targetValue * 0.5) continue;

    // Round cash to reasonable increments
    const roundedCash = Math.ceil(neededCash / 100) * 100;
    const totalWithCash = cardsTotal + roundedCash;

    // Check if total is within acceptable range
    if (totalWithCash >= minTarget && totalWithCash <= maxTarget) {
      suggestions.push(createSuggestion(
        [card],
        totalWithCash,
        targetValue,
        roundedCash
      ));
    }
  }

  // Strategy 2: Multiple mid-value cards + cash
  // Find bundles at 70-90% of target, add cash to reach 110%
  const selectedCards: Card[] = [];
  let currentTotal = 0;
  const targetCardTotal = targetValue * 0.80; // Aim for 80% of target with cards

  for (const card of sortedHigh) {
    if (selectedCards.length >= 5) break;

    const newTotal = currentTotal + card.currentValue;

    // Add cards until we're close to 80% of target
    if (newTotal <= targetCardTotal) {
      selectedCards.push(card);
      currentTotal = newTotal;
    } else if (selectedCards.length > 0 && currentTotal >= targetValue * 0.50) {
      // We have enough cards, calculate cash needed
      break;
    }
  }

  // If we found a good card bundle, add cash to reach minTarget
  if (selectedCards.length > 0 && currentTotal < minTarget && currentTotal >= targetValue * 0.50) {
    const neededCash = minTarget - currentTotal;

    if (neededCash <= targetValue * 0.5) {
      const roundedCash = Math.ceil(neededCash / 100) * 100;
      const totalWithCash = currentTotal + roundedCash;

      if (totalWithCash >= minTarget && totalWithCash <= maxTarget) {
        suggestions.push(createSuggestion(
          selectedCards,
          totalWithCash,
          targetValue,
          roundedCash
        ));
      }
    }
  }

  return suggestions;
}
