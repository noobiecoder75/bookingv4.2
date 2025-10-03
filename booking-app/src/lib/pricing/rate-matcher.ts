import { Rate, HotelRate, ActivityRate, TransferRate } from '@/types/rate';
import { TravelItem } from '@/types';

/**
 * Rate Matcher - Automatically matches travel items to uploaded rates
 * to calculate supplier costs and enable accurate profit tracking
 */

interface RateMatchResult {
  matched: boolean;
  rate?: Rate;
  supplierCost?: number;
  confidence: 'high' | 'medium' | 'low';
  reason?: string;
}

/**
 * Check if two date ranges overlap
 */
function datesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);

  return s1 <= e2 && e1 >= s2;
}

/**
 * Calculate number of nights between two dates
 */
function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Match hotel item to hotel rates
 */
function matchHotelRate(
  item: TravelItem,
  rates: Rate[]
): RateMatchResult {
  if (item.type !== 'hotel' || !item.details) {
    return { matched: false, confidence: 'low', reason: 'Not a hotel item' };
  }

  const hotelRates = rates.filter((r): r is HotelRate => r.type === 'hotel');

  const hotelName = item.name?.toLowerCase() || '';
  const roomType = (item.details as any).roomType?.toLowerCase() || '';
  const checkIn = item.startDate;
  const checkOut = item.endDate;
  const guests = (item.details as any).guests || { adults: 2, children: 0 };

  // Find matching rates
  const matches = hotelRates.filter((rate) => {
    // Match property name (fuzzy)
    const propertyMatch = rate.propertyName.toLowerCase().includes(hotelName) ||
                         hotelName.includes(rate.propertyName.toLowerCase());

    // Match room type (fuzzy)
    const roomMatch = rate.roomType.toLowerCase().includes(roomType) ||
                     roomType.includes(rate.roomType.toLowerCase());

    // Match dates (overlap or within range)
    const dateMatch = datesOverlap(rate.checkIn, rate.checkOut, checkIn, checkOut);

    return propertyMatch && roomMatch && dateMatch;
  });

  if (matches.length === 0) {
    return {
      matched: false,
      confidence: 'low',
      reason: `No matching rates found for ${hotelName}`
    };
  }

  // Prefer exact matches, then API sources, then offline
  const sortedMatches = matches.sort((a, b) => {
    // Exact name match
    const aExact = a.propertyName.toLowerCase() === hotelName;
    const bExact = b.propertyName.toLowerCase() === hotelName;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    // Prefer API sources
    if (a.source === 'api_hotelbeds' && b.source !== 'api_hotelbeds') return -1;
    if (a.source !== 'api_hotelbeds' && b.source === 'api_hotelbeds') return 1;

    // Most recent
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const bestMatch = sortedMatches[0];

  // Calculate supplier cost based on occupancy
  let supplierCost = bestMatch.rate;
  const totalGuests = guests.adults + (guests.children || 0);

  if (bestMatch.ratePerPerson) {
    // Per-person pricing
    if (totalGuests === 1 && bestMatch.singleRate) {
      supplierCost = bestMatch.singleRate;
    } else if (totalGuests === 2 && bestMatch.doubleRate) {
      supplierCost = bestMatch.doubleRate;
    } else if (totalGuests === 3 && bestMatch.tripleRate) {
      supplierCost = bestMatch.tripleRate;
    } else if (totalGuests >= 4 && bestMatch.quadRate) {
      supplierCost = bestMatch.quadRate;
    }
  }

  // Calculate total cost for all nights
  const nights = calculateNights(checkIn, checkOut);
  const totalCost = supplierCost * nights;

  const confidence = bestMatch.propertyName.toLowerCase() === hotelName ? 'high' : 'medium';

  return {
    matched: true,
    rate: bestMatch,
    supplierCost: totalCost,
    confidence,
    reason: `Matched to ${bestMatch.propertyName} - ${bestMatch.roomType}`
  };
}

/**
 * Match activity item to activity rates
 */
function matchActivityRate(
  item: TravelItem,
  rates: Rate[]
): RateMatchResult {
  if (item.type !== 'activity' || !item.details) {
    return { matched: false, confidence: 'low', reason: 'Not an activity item' };
  }

  const activityRates = rates.filter((r): r is ActivityRate => r.type === 'activity');

  const activityName = item.name?.toLowerCase() || '';
  const location = (item.details as any).location?.toLowerCase() || '';
  const date = item.startDate;

  // Find matching rates
  const matches = activityRates.filter((rate) => {
    // Match activity name (fuzzy)
    const nameMatch = rate.activityName.toLowerCase().includes(activityName) ||
                     activityName.includes(rate.activityName.toLowerCase());

    // Match location (fuzzy)
    const locationMatch = rate.location.toLowerCase().includes(location) ||
                         location.includes(rate.location.toLowerCase());

    // Check if date falls within rate validity
    const dateMatch = datesOverlap(rate.startDate, rate.endDate, date, date);

    return nameMatch && locationMatch && dateMatch;
  });

  if (matches.length === 0) {
    return {
      matched: false,
      confidence: 'low',
      reason: `No matching rates found for ${activityName}`
    };
  }

  // Pick most recent or best match
  const sortedMatches = matches.sort((a, b) => {
    const aExact = a.activityName.toLowerCase() === activityName;
    const bExact = b.activityName.toLowerCase() === activityName;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const bestMatch = sortedMatches[0];
  const participants = (item.details as any).participants || { adults: 1, children: 0 };
  const totalParticipants = participants.adults + (participants.children || 0);

  // Use rate as per-person cost
  const totalCost = bestMatch.rate * totalParticipants;

  const confidence = bestMatch.activityName.toLowerCase() === activityName ? 'high' : 'medium';

  return {
    matched: true,
    rate: bestMatch,
    supplierCost: totalCost,
    confidence,
    reason: `Matched to ${bestMatch.activityName} in ${bestMatch.location}`
  };
}

/**
 * Match transfer item to transfer rates
 */
function matchTransferRate(
  item: TravelItem,
  rates: Rate[]
): RateMatchResult {
  if (item.type !== 'transfer' || !item.details) {
    return { matched: false, confidence: 'low', reason: 'Not a transfer item' };
  }

  const transferRates = rates.filter((r): r is TransferRate => r.type === 'transfer');

  const vehicleType = (item.details as any).vehicleType?.toLowerCase() || '';
  const from = (item.details as any).pickup?.location?.toLowerCase() || '';
  const to = (item.details as any).dropoff?.location?.toLowerCase() || '';
  const date = item.startDate;

  // Find matching rates
  const matches = transferRates.filter((rate) => {
    // Match vehicle type
    const vehicleMatch = rate.vehicleType.toLowerCase().includes(vehicleType) ||
                        vehicleType.includes(rate.vehicleType.toLowerCase());

    // Match route (from/to)
    const fromMatch = rate.from.toLowerCase().includes(from) ||
                     from.includes(rate.from.toLowerCase());
    const toMatch = rate.to.toLowerCase().includes(to) ||
                   to.includes(rate.to.toLowerCase());

    // Check if date falls within rate validity
    const dateMatch = datesOverlap(rate.startDate, rate.endDate, date, date);

    return vehicleMatch && fromMatch && toMatch && dateMatch;
  });

  if (matches.length === 0) {
    return {
      matched: false,
      confidence: 'low',
      reason: `No matching transfer rates found for ${from} to ${to}`
    };
  }

  // Pick most recent or best match
  const sortedMatches = matches.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const bestMatch = sortedMatches[0];

  const confidence = 'medium'; // Transfers are harder to match exactly

  return {
    matched: true,
    rate: bestMatch,
    supplierCost: bestMatch.rate,
    confidence,
    reason: `Matched to ${bestMatch.from} → ${bestMatch.to} (${bestMatch.vehicleType})`
  };
}

/**
 * Main rate matching function
 * Attempts to find a matching rate for a travel item
 */
export function findMatchingRate(
  item: TravelItem,
  rates: Rate[]
): RateMatchResult {
  switch (item.type) {
    case 'hotel':
      return matchHotelRate(item, rates);
    case 'activity':
      return matchActivityRate(item, rates);
    case 'transfer':
      return matchTransferRate(item, rates);
    case 'flight':
      // Flights typically use API pricing only
      return {
        matched: false,
        confidence: 'low',
        reason: 'Flight pricing handled by API'
      };
    default:
      return {
        matched: false,
        confidence: 'low',
        reason: 'Unknown item type'
      };
  }
}

/**
 * Batch match multiple items to rates
 */
export function batchMatchRates(
  items: TravelItem[],
  rates: Rate[]
): Map<string, RateMatchResult> {
  const results = new Map<string, RateMatchResult>();

  items.forEach((item) => {
    const match = findMatchingRate(item, rates);
    results.set(item.id, match);
  });

  return results;
}

/**
 * Get supplier name from rate match
 */
export function getSupplierFromMatch(match: RateMatchResult): string | null {
  return match.matched && match.rate ? match.rate.supplier : null;
}

/**
 * Get supplier source from rate match
 */
export function getSupplierSourceFromMatch(match: RateMatchResult): string | null {
  return match.matched && match.rate ? match.rate.source : null;
}
