import { hotelAPI } from './api-client';
import {
  EnhancedHotelDetails,
  APISearchRequest,
  APISearchResponse,
} from '@/types/booking';

// Mock hotel data for development
const mockHotels: EnhancedHotelDetails[] = [
  {
    hotelName: 'The Plaza Hotel',
    hotelChain: 'Fairmont',
    hotelRating: 5,
    location: {
      address: 'Fifth Avenue at Central Park South',
      city: 'New York',
      country: 'United States',
      coordinates: {
        latitude: 40.7644,
        longitude: -73.9744,
      },
    },
    checkIn: {
      date: '2024-03-15',
      time: '15:00',
    },
    checkOut: {
      date: '2024-03-18',
      time: '11:00',
    },
    nights: 3,
    roomType: 'Deluxe King Room',
    roomDescription: 'Elegant room with king bed and city views',
    bedConfiguration: '1 King Bed',
    maxOccupancy: 2,
    guests: {
      adults: 2,
      children: 0,
    },
    mealPlan: 'breakfast',
    amenities: [
      'Free WiFi',
      'Air Conditioning',
      'Mini Bar',
      'Room Service',
      'Spa',
      'Fitness Center',
      'Concierge',
    ],
    cancellationPolicy: 'Free cancellation until 24 hours before check-in',
    totalPrice: 1500,
    priceBreakdown: {
      roomRate: 1350,
      taxes: 120,
      fees: 30,
    },
  },
  {
    hotelName: 'Marriott Downtown',
    hotelChain: 'Marriott',
    hotelRating: 4,
    location: {
      address: '123 Business District',
      city: 'Los Angeles',
      country: 'United States',
      coordinates: {
        latitude: 34.0522,
        longitude: -118.2437,
      },
    },
    checkIn: {
      date: '2024-03-20',
      time: '16:00',
    },
    checkOut: {
      date: '2024-03-22',
      time: '12:00',
    },
    nights: 2,
    roomType: 'Executive Suite',
    roomDescription: 'Spacious suite with separate living area',
    bedConfiguration: '1 King Bed',
    maxOccupancy: 4,
    guests: {
      adults: 2,
      children: 1,
      childrenAges: [8],
    },
    mealPlan: 'room-only',
    amenities: [
      'Free WiFi',
      'Pool',
      'Business Center',
      'Parking',
      'Restaurant',
      'Bar',
    ],
    cancellationPolicy: 'Free cancellation until 48 hours before check-in',
    totalPrice: 650,
    priceBreakdown: {
      roomRate: 580,
      taxes: 50,
      fees: 20,
    },
  },
];

export class HotelService {
  async searchHotels(request: APISearchRequest): Promise<APISearchResponse<EnhancedHotelDetails>> {
    // Simulate API call with mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        let filteredHotels = [...mockHotels];

        // Apply filters
        if (request.filters?.priceRange) {
          filteredHotels = filteredHotels.filter(
            hotel =>
              hotel.totalPrice >= (request.filters?.priceRange?.min || 0) &&
              hotel.totalPrice <= (request.filters?.priceRange?.max || Infinity)
          );
        }

        if (request.filters?.hotelRating) {
          filteredHotels = filteredHotels.filter(
            hotel => hotel.hotelRating >= (request.filters?.hotelRating || 0)
          );
        }

        resolve({
          success: true,
          data: filteredHotels,
          metadata: {
            totalResults: filteredHotels.length,
            searchId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
          },
        });
      }, 1000);
    });
  }

  async getHotelDetails(hotelId: string): Promise<EnhancedHotelDetails | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockHotels[0]);
      }, 500);
    });
  }

  async checkRoomAvailability(
    _hotelId: string,
    _checkIn: string,
    _checkOut: string,
    _guests: { adults: number; children: number }
  ): Promise<{ available: boolean; rooms: number; price?: number }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          available: true,
          rooms: Math.floor(Math.random() * 10) + 1,
          price: Math.floor(Math.random() * 500) + 100,
        });
      }, 500);
    });
  }

  async bookHotel(
    _hotelDetails: EnhancedHotelDetails,
    _guestDetails: { name: string; email: string; phone: string }
  ): Promise<{ confirmationNumber: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          confirmationNumber: `HTL${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        });
      }, 2000);
    });
  }

  async getHotelChains(): Promise<Array<{ code: string; name: string }>> {
    return [
      { code: 'MAR', name: 'Marriott' },
      { code: 'HIL', name: 'Hilton' },
      { code: 'HYA', name: 'Hyatt' },
      { code: 'IHG', name: 'InterContinental' },
      { code: 'ACC', name: 'Accor' },
      { code: 'WHG', name: 'Wyndham' },
      { code: 'CHO', name: 'Choice Hotels' },
      { code: 'BW', name: 'Best Western' },
    ];
  }

  async getAmenities(): Promise<string[]> {
    return [
      'Free WiFi',
      'Pool',
      'Spa',
      'Fitness Center',
      'Restaurant',
      'Bar',
      'Business Center',
      'Parking',
      'Pet Friendly',
      'Airport Shuttle',
      'Room Service',
      'Concierge',
      'Laundry Service',
      'Air Conditioning',
      'Kitchen/Kitchenette',
    ];
  }

  calculateNights(checkIn: string, checkOut: string): number {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getRoomTypes(): string[] {
    return [
      'Standard Room',
      'Deluxe Room',
      'Superior Room',
      'Executive Room',
      'Junior Suite',
      'Suite',
      'Presidential Suite',
      'Family Room',
      'Connecting Rooms',
    ];
  }

  getMealPlans(): Array<{ value: string; label: string }> {
    return [
      { value: 'room-only', label: 'Room Only' },
      { value: 'breakfast', label: 'Breakfast Included' },
      { value: 'half-board', label: 'Half Board (Breakfast & Dinner)' },
      { value: 'full-board', label: 'Full Board (All Meals)' },
      { value: 'all-inclusive', label: 'All Inclusive' },
    ];
  }
}

export const hotelService = new HotelService();