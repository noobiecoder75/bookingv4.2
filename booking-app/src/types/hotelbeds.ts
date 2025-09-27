// HotelBeds API Types
export interface HotelBedsCredentials {
  apiKey: string;
  secret: string;
}

export interface HotelBedsSearchRequest {
  stay: {
    checkIn: string; // YYYY-MM-DD format
    checkOut: string; // YYYY-MM-DD format
  };
  occupancies: Array<{
    rooms: number;
    adults: number;
    children: number;
    paxes?: Array<{
      type: 'AD' | 'CH';
      age?: number;
    }>;
  }>;
  hotels?: {
    hotel: number[];
  };
  destination?: {
    code: string;
    zone?: number;
  };
  geolocation?: {
    latitude: number;
    longitude: number;
    radius: number;
    unit: 'km' | 'mi';
  };
  filter?: {
    maxHotels?: number;
    maxRooms?: number;
    minRate?: number;
    maxRate?: number;
    packaging?: boolean;
    hotelPackage?: 'YES' | 'NO';
  };
  dailyRate?: boolean;
  sourceMarket?: string;
  platform?: number;
}

export interface HotelBedsRoom {
  code: string;
  name: string;
  rates: Array<{
    rateKey: string;
    rateClass: string;
    rateType: 'BOOKABLE' | 'RECHECK';
    net: number;
    discount?: number;
    discountPCT?: number;
    sellingRate: number;
    hotelSellingRate?: number;
    amount?: number;
    hotelCurrency?: string;
    hotelMandatory?: boolean;
    allotment?: number;
    commission?: number;
    commissionVAT?: number;
    commissionPCT?: number;
    cost?: {
      amount: number;
      currency: string;
    };
    rateCommentsId?: string;
    rateComments?: string;
    paymentType: 'AT_HOTEL' | 'AT_WEB';
    packaging?: boolean;
    boardCode?: string;
    boardName?: string;
    rateBreakDown?: {
      rateDiscounts?: Array<{
        code: string;
        name: string;
        amount: number;
      }>;
      rateSupplement?: Array<{
        code: string;
        name: string;
        from: string;
        to: string;
        amount: number;
        nights: number;
        paxNumber: number;
      }>;
    };
    rooms: number;
    adults: number;
    children: number;
  }>;
}

export interface HotelBedsHotel {
  code: number;
  name: string;
  description?: string;
  countryCode: string;
  stateCode?: string;
  destinationCode: string;
  zoneCode?: number;
  zoneName?: string;
  latitude?: number;
  longitude?: number;
  categoryCode?: string;
  categoryName?: string;
  accommodationTypeCode?: string;
  accommodationTypeName?: string;
  boardCodes?: string[];
  segmentCodes?: number[];
  address?: {
    content: string;
    street?: string;
    number?: string;
    city?: string;
    postalCode?: string;
  };
  postalCode?: string;
  city?: string;
  email?: string;
  license?: string;
  phones?: Array<{
    phoneNumber: string;
    phoneType: string;
  }>;
  rooms?: HotelBedsRoom[];
  totalNet?: number;
  totalSellingRate?: number;
  currency?: string;
  supplier?: {
    name: string;
    vatNumber: string;
  };
  clientComments?: string;
  cancellationAmount?: number;
  upselling?: {
    room: Array<{
      code: string;
      description: string;
    }>;
  };
  keywords?: Array<{
    code: number;
    rating: number;
  }>;
  reviews?: Array<{
    rate: number;
    reviewCount: number;
    type: string;
  }>;
  rank?: number;
  minRate?: number;
  maxRate?: number;
  paymentDataRequired?: boolean;
  modificationPolicies?: {
    cancellation: boolean;
    modification: boolean;
  };
}

export interface HotelBedsSearchResponse {
  auditData: {
    processTime: string;
    timestamp: string;
    requestHost: string;
    serverId: string;
    environment: string;
    release: string;
    token: string;
    internal: string;
  };
  hotels?: {
    hotels: HotelBedsHotel[];
    checkIn: string;
    checkOut: string;
    total: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface HotelBedsDestination {
  code: string;
  name: {
    content: string;
  };
  countryCode: string;
  isoCode: string;
  groupZones?: Array<{
    groupZoneCode: number;
    name: string;
    description: string;
  }>;
}

export interface HotelBedsDestinationsResponse {
  destinations: HotelBedsDestination[];
  from?: number;
  to?: number;
  total?: number;
}

// For our internal use - simplified hotel data structure
export interface SimplifiedHotel {
  id: string;
  name: string;
  description?: string;
  location: string;
  rating?: number;
  price: number;
  currency: string;
  imageUrl?: string;
  amenities?: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  checkIn: string;
  checkOut: string;
  roomType?: string;
  availability: 'available' | 'limited' | 'unavailable';
  rateKey?: string; // For booking reference
}

// Error types
export interface HotelBedsError {
  code: string;
  message: string;
  path?: string;
}

export interface HotelBedsApiError extends Error {
  code: string;
  status?: number;
  errors?: HotelBedsError[];
}