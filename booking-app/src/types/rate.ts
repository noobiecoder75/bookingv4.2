export type RateSource = 'offline_platform' | 'offline_agent' | 'api_hotelbeds' | 'api_amadeus' | 'api_sabre';
export type RateType = 'hotel' | 'activity' | 'transfer';

/**
 * Base Rate - Common fields for all rate types
 */
interface BaseRate {
  id: string;
  type: RateType;

  // Supplier details
  supplier: string;

  // Date range
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  validFrom?: string; // Rate validity start
  validUntil?: string; // Rate validity end

  // Pricing
  rate: number;
  currency: string;
  commissionPercent: number;

  // Source and metadata
  source: RateSource;
  cancellationPolicy?: string;
  notes?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Hotel Rate - Negotiated or offline hotel rates
 */
export interface HotelRate extends BaseRate {
  type: 'hotel';

  // Hotel-specific
  propertyName: string;
  propertyCode?: string;
  roomType: string;
  bedConfiguration?: string;
  maxOccupancy?: number;
  mealPlan?: string;

  // Occupancy-based pricing
  ratePerPerson?: boolean; // true if rate is per person, false if per room
  singleRate?: number; // Rate for 1 person
  doubleRate?: number; // Rate for 2 people
  tripleRate?: number; // Rate for 3 people
  quadRate?: number; // Rate for 4+ people

  // Use checkIn/checkOut for hotels (more familiar)
  checkIn: string; // YYYY-MM-DD (alias for startDate)
  checkOut: string; // YYYY-MM-DD (alias for endDate)
}

/**
 * Activity Rate - Negotiated or offline activity rates
 */
export interface ActivityRate extends BaseRate {
  type: 'activity';

  // Activity-specific
  activityName: string;
  location: string;
  category?: string;
  duration?: number; // in hours or days
  minParticipants?: number;
  maxParticipants?: number;
  ageRestrictions?: string;
  includesTransport?: boolean;
}

/**
 * Transfer Rate - Negotiated or offline transfer rates
 */
export interface TransferRate extends BaseRate {
  type: 'transfer';

  // Transfer-specific
  transferType: 'airport' | 'hotel' | 'point-to-point' | 'hourly';
  from: string;
  to: string;
  vehicleType: string;
  maxPassengers?: number;
  includeLuggage?: boolean;
  duration?: number; // in minutes
}

/**
 * Union type for all rates
 */
export type Rate = HotelRate | ActivityRate | TransferRate;

/**
 * GPT Extraction Result
 */
export interface GPTRateExtractionResult {
  success: boolean;
  rates: Omit<Rate, 'id' | 'createdAt' | 'updatedAt'>[];
  errors?: string[];
  warnings?: string[];
  metadata?: {
    tokensUsed: number;
    processingTime: number;
    confidence: 'high' | 'medium' | 'low';
  };
}
